const cron = require('node-cron');
const db = require('../models/database');
const llmService = require('./llm-service');

/**
 * Automated Scheduler for Financial AI Insights
 * - Daily reports at 8 AM
 * - 5-hour opportunity scans
 */

class AIScheduler {
  constructor() {
    this.dailyTask = null;
    this.fiveHourTask = null;
    this.isInitialized = false;
  }

  /**
   * Initialize scheduler with cron jobs
   */
  init() {
    if (this.isInitialized) {
      console.log('⚠️  Scheduler already initialized');
      return;
    }

    // Daily financial report at 8:00 AM
    this.dailyTask = cron.schedule('0 8 * * *', async () => {
      console.log('🤖 Running daily financial analysis...');
      await this.runDailyAnalysis();
    });

    // Every 5 hours opportunity scan (at 00:00, 05:00, 10:00, 15:00, 20:00)
    this.fiveHourTask = cron.schedule('0 */5 * * *', async () => {
      console.log('🔍 Running 5-hour opportunity scan...');
      await this.runFiveHourScan();
    });

    this.isInitialized = true;
    console.log('✅ AI Scheduler initialized');
    console.log('   📅 Daily reports: 8:00 AM');
    console.log('   🔄 5-hour scans: Every 5 hours');
  }

  /**
   * Run daily financial analysis for all active users
   */
  async runDailyAnalysis() {
    try {
      // Get all users with AI scheduler enabled
      const users = await this.getActiveUsers();

      console.log(`Running daily analysis for ${users.length} users...`);

      for (const user of users) {
        try {
          if (!user.daily_enabled) continue;

          const financialData = await this.getFinancialData(user.user_id);
          const insights = await llmService.generateFinancialInsights(user.user_id, financialData);

          // Save insights to history
          await this.saveInsights(user.user_id, 'daily', insights);

          console.log(`✓ Daily analysis complete for user ${user.user_id}`);

        } catch (error) {
          console.error(`✗ Daily analysis failed for user ${user.user_id}:`, error.message);
        }
      }

    } catch (error) {
      console.error('Daily analysis error:', error);
    }
  }

  /**
   * Run 5-hour opportunity scan for all active users
   */
  async runFiveHourScan() {
    try {
      const users = await this.getActiveUsers();

      console.log(`Running 5-hour scan for ${users.length} users...`);

      for (const user of users) {
        try {
          if (!user.five_hour_enabled) continue;

          const financialData = await this.getFinancialData(user.user_id);

          // Quick scan - focus on opportunities and alerts
          const quickPrompt = this.buildQuickScanPrompt(financialData);
          const result = await llmService.generateCompletion(user.user_id, quickPrompt, {
            systemPrompt: 'You are a financial advisor. Quickly identify any urgent alerts or new opportunities. Be concise.',
            maxTokens: 800,
            temperature: 0.4
          });

          // Save scan results
          await this.saveInsights(user.user_id, '5hour', {
            insights: [{
              type: 'info',
              title: '5-Hour Scan Results',
              message: result.text,
              impact: 'medium'
            }],
            provider: result.provider
          });

          console.log(`✓ 5-hour scan complete for user ${user.user_id}`);

        } catch (error) {
          console.error(`✗ 5-hour scan failed for user ${user.user_id}:`, error.message);
        }
      }

    } catch (error) {
      console.error('5-hour scan error:', error);
    }
  }

  /**
   * Get active users with AI scheduler configured
   * @returns {Promise<Array>}
   */
  getActiveUsers() {
    return new Promise((resolve, reject) => {
      db.all(
        `SELECT DISTINCT u.id as user_id, asc.daily_enabled, asc.five_hour_enabled
         FROM users u
         INNER JOIN ai_tokens at ON u.id = at.user_id AND at.is_active = 1
         LEFT JOIN ai_scheduler_config asc ON u.id = asc.user_id
         WHERE (asc.daily_enabled = 1 OR asc.five_hour_enabled = 1 OR asc.user_id IS NULL)`,
        [],
        (err, rows) => {
          if (err) reject(err);
          else {
            // Default to enabled if no config exists
            const users = rows.map(row => ({
              user_id: row.user_id,
              daily_enabled: row.daily_enabled !== null ? row.daily_enabled : 1,
              five_hour_enabled: row.five_hour_enabled !== null ? row.five_hour_enabled : 1
            }));
            resolve(users);
          }
        }
      );
    });
  }

  /**
   * Get financial data for a user
   * @param {string} userId
   * @returns {Promise<Object>}
   */
  async getFinancialData(userId) {
    // Get income
    const income = await new Promise((resolve, reject) => {
      db.all(
        'SELECT * FROM income_sources WHERE user_id = ? AND is_active = 1',
        [userId],
        (err, rows) => {
          if (err) reject(err);
          else {
            const totalMonthly = rows.reduce((sum, source) => {
              return sum + this.calculateMonthlyIncome(source.amount, source.frequency);
            }, 0);
            resolve({ sources: rows.length, monthly: totalMonthly });
          }
        }
      );
    });

    // Get expenses (last 30 days)
    const expenses = await new Promise((resolve, reject) => {
      db.get(
        `SELECT SUM(amount) as total FROM transactions
         WHERE user_id = ? AND type = 'expense' AND date >= date('now', '-30 days')`,
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row?.total || 0);
        }
      );
    });

    // Get savings rate
    const savingsRate = income.monthly > 0 ? ((income.monthly - expenses) / income.monthly * 100).toFixed(1) : 0;

    // Get net worth
    const netWorth = await new Promise((resolve, reject) => {
      db.get(
        `SELECT
          (SELECT COALESCE(SUM(balance), 0) FROM accounts WHERE user_id = ? AND type IN ('checking', 'savings')) +
          (SELECT COALESCE(SUM(balance), 0) FROM retirement_accounts WHERE user_id = ?) +
          (SELECT COALESCE(SUM(value), 0) FROM assets WHERE user_id = ?) -
          (SELECT COALESCE(SUM(ABS(balance)), 0) FROM accounts WHERE user_id = ? AND type IN ('credit_card', 'loan', 'mortgage', 'other_debt'))
          as net_worth`,
        [userId, userId, userId, userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row?.net_worth || 0);
        }
      );
    });

    // Get bills total
    const billsTotal = await new Promise((resolve, reject) => {
      db.get(
        'SELECT SUM(target_amount) as total FROM bills WHERE user_id = ? AND is_active = 1',
        [userId],
        (err, row) => {
          if (err) reject(err);
          else resolve(row?.total || 0);
        }
      );
    });

    return {
      income: income.monthly,
      income_sources: income.sources,
      expenses,
      savings_rate: savingsRate,
      net_worth: netWorth,
      total_bills: billsTotal,
      emergency_fund: 0, // Calculate from savings accounts
      months_of_expenses: expenses > 0 ? (income.monthly / expenses).toFixed(1) : 0
    };
  }

  /**
   * Calculate monthly income based on frequency
   */
  calculateMonthlyIncome(amount, frequency) {
    switch (frequency) {
      case 'weekly': return amount * 52 / 12;
      case 'biweekly': return amount * 26 / 12;
      case 'monthly': return amount;
      case 'quarterly': return amount / 3;
      case 'annually': return amount / 12;
      case 'variable': return amount;
      default: return 0;
    }
  }

  /**
   * Build quick scan prompt
   */
  buildQuickScanPrompt(data) {
    return `Quick financial check (last 30 days):
- Monthly Income: $${data.income}
- Monthly Expenses: $${data.expenses}
- Savings Rate: ${data.savings_rate}%
- Net Worth: $${data.net_worth}

Identify any urgent alerts or new opportunities (2-3 sentences max).`;
  }

  /**
   * Save insights to history
   * @param {string} userId
   * @param {string} insightType
   * @param {Object} insights
   */
  saveInsights(userId, insightType, insights) {
    return new Promise((resolve, reject) => {
      const { v4: uuidv4 } = require('uuid');
      const id = uuidv4();

      db.run(
        'INSERT INTO ai_insights_history (id, user_id, insight_type, insights_json) VALUES (?, ?, ?, ?)',
        [id, userId, insightType, JSON.stringify(insights)],
        (err) => {
          if (err) reject(err);
          else resolve();
        }
      );
    });
  }

  /**
   * Stop all scheduled tasks
   */
  stop() {
    if (this.dailyTask) {
      this.dailyTask.stop();
    }
    if (this.fiveHourTask) {
      this.fiveHourTask.stop();
    }
    console.log('🛑 Scheduler stopped');
  }
}

// Create and export singleton
const scheduler = new AIScheduler();
scheduler.init();

module.exports = scheduler;
