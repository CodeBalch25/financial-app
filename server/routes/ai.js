const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Helper function to analyze spending patterns
const analyzeSpendingPatterns = (transactions) => {
  const patterns = {};

  transactions.forEach(t => {
    if (t.type === 'expense') {
      if (!patterns[t.category]) {
        patterns[t.category] = {
          category: t.category,
          total: 0,
          count: 0,
          transactions: []
        };
      }
      patterns[t.category].total += t.amount;
      patterns[t.category].count += 1;
      patterns[t.category].transactions.push(t);
    }
  });

  // Calculate averages and trends
  Object.keys(patterns).forEach(category => {
    patterns[category].average = patterns[category].total / patterns[category].count;
    patterns[category].frequency = patterns[category].count;
  });

  return patterns;
};

// Helper function to predict bill amounts based on historical data
const predictBillAmounts = (billPayments) => {
  const predictions = {};

  billPayments.forEach(payment => {
    if (!predictions[payment.bill_name]) {
      predictions[payment.bill_name] = {
        billName: payment.bill_name,
        amounts: [],
        trend: 'stable'
      };
    }
    predictions[payment.bill_name].amounts.push(payment.actual_amount);
  });

  // Calculate trend and prediction
  Object.keys(predictions).forEach(billName => {
    const amounts = predictions[billName].amounts;
    if (amounts.length < 2) {
      predictions[billName].predicted = amounts[0] || 0;
      predictions[billName].trend = 'insufficient_data';
      return;
    }

    // Simple moving average prediction
    const recentAmounts = amounts.slice(-3); // Last 3 payments
    const prediction = recentAmounts.reduce((sum, amt) => sum + amt, 0) / recentAmounts.length;
    predictions[billName].predicted = prediction;

    // Determine trend (increasing, decreasing, stable)
    const oldAvg = amounts.slice(0, Math.floor(amounts.length / 2)).reduce((sum, amt) => sum + amt, 0) / Math.floor(amounts.length / 2);
    const newAvg = amounts.slice(Math.floor(amounts.length / 2)).reduce((sum, amt) => sum + amt, 0) / (amounts.length - Math.floor(amounts.length / 2));

    if (newAvg > oldAvg * 1.1) {
      predictions[billName].trend = 'increasing';
    } else if (newAvg < oldAvg * 0.9) {
      predictions[billName].trend = 'decreasing';
    } else {
      predictions[billName].trend = 'stable';
    }
  });

  return predictions;
};

// Helper function to generate insights
const generateInsights = (userData) => {
  const insights = [];
  const { transactions, bills, income, netWorth, budget } = userData;

  // Insight 1: High spending categories
  if (transactions && transactions.length > 0) {
    const patterns = analyzeSpendingPatterns(transactions);
    const sortedCategories = Object.values(patterns).sort((a, b) => b.total - a.total);

    if (sortedCategories.length > 0 && sortedCategories[0].total > (income?.monthly || 0) * 0.3) {
      insights.push({
        type: 'warning',
        category: 'spending',
        title: `High Spending Alert: ${sortedCategories[0].category}`,
        message: `You've spent $${sortedCategories[0].total.toFixed(2)} on ${sortedCategories[0].category} this month, which is ${((sortedCategories[0].total / (income?.monthly || 1)) * 100).toFixed(1)}% of your income.`,
        recommendation: `Consider setting a budget limit for ${sortedCategories[0].category} to improve savings.`,
        impact: 'high'
      });
    }
  }

  // Insight 2: Bill predictions
  if (bills && bills.length > 0) {
    bills.forEach(bill => {
      if (bill.trend === 'increasing') {
        insights.push({
          type: 'info',
          category: 'bills',
          title: `Rising Bill: ${bill.billName}`,
          message: `Your ${bill.billName} has been increasing. Current prediction: $${bill.predicted?.toFixed(2)}`,
          recommendation: `Look for ways to reduce usage or consider switching providers to save money.`,
          impact: 'medium'
        });
      }
    });
  }

  // Insight 3: Savings rate analysis
  if (budget && income?.monthly) {
    const savingsRate = ((income.monthly - budget.expenses) / income.monthly) * 100;

    if (savingsRate < 10) {
      insights.push({
        type: 'warning',
        category: 'savings',
        title: 'Low Savings Rate',
        message: `Your current savings rate is ${savingsRate.toFixed(1)}%, which is below the recommended 20%.`,
        recommendation: `Try to identify discretionary expenses to cut back. Aim to save at least $${(income.monthly * 0.2).toFixed(2)} per month.`,
        impact: 'high'
      });
    } else if (savingsRate >= 20) {
      insights.push({
        type: 'success',
        category: 'savings',
        title: 'Great Savings Rate!',
        message: `Your savings rate of ${savingsRate.toFixed(1)}% exceeds the recommended 20%. Keep up the excellent work!`,
        recommendation: `Consider investing your surplus savings in retirement accounts or diversified investments.`,
        impact: 'positive'
      });
    }
  }

  // Insight 4: Net worth growth
  if (netWorth && netWorth.history && netWorth.history.length >= 2) {
    const recent = netWorth.history[netWorth.history.length - 1];
    const previous = netWorth.history[netWorth.history.length - 2];
    const growth = recent.net_worth - previous.net_worth;
    const growthPercent = (growth / Math.abs(previous.net_worth || 1)) * 100;

    if (growth > 0) {
      insights.push({
        type: 'success',
        category: 'net_worth',
        title: 'Net Worth Increasing',
        message: `Your net worth has grown by $${growth.toFixed(2)} (${growthPercent.toFixed(1)}%) since last snapshot.`,
        recommendation: `Continue your current financial habits. Consider increasing investments to accelerate growth.`,
        impact: 'positive'
      });
    } else if (growth < 0) {
      insights.push({
        type: 'warning',
        category: 'net_worth',
        title: 'Net Worth Declining',
        message: `Your net worth has decreased by $${Math.abs(growth).toFixed(2)} (${Math.abs(growthPercent).toFixed(1)}%).`,
        recommendation: `Review your expenses and consider creating a debt payoff plan to reverse this trend.`,
        impact: 'high'
      });
    }
  }

  // Insight 5: Income diversification
  if (income && income.sources) {
    if (income.sources.length === 1) {
      insights.push({
        type: 'info',
        category: 'income',
        title: 'Single Income Source',
        message: `You're relying on a single income source. This could be risky if that source is disrupted.`,
        recommendation: `Consider developing a side business, freelancing, or passive income streams to diversify your income.`,
        impact: 'medium'
      });
    } else if (income.sources.length >= 3) {
      insights.push({
        type: 'success',
        category: 'income',
        title: 'Well-Diversified Income',
        message: `You have ${income.sources.length} income sources. This provides excellent financial security.`,
        recommendation: `Continue nurturing your income streams. Consider investing profits from side businesses.`,
        impact: 'positive'
      });
    }
  }

  // Insight 6: Emergency fund status
  if (netWorth && income?.monthly) {
    const liquidAssets = netWorth.checking + netWorth.savings;
    const monthsOfExpenses = liquidAssets / (income.monthly * 0.7); // Assuming 70% of income covers expenses

    if (monthsOfExpenses < 3) {
      insights.push({
        type: 'warning',
        category: 'emergency_fund',
        title: 'Emergency Fund Below Target',
        message: `Your emergency fund covers only ${monthsOfExpenses.toFixed(1)} months of expenses. Target is 3-6 months.`,
        recommendation: `Prioritize building your emergency fund to $${(income.monthly * 0.7 * 6).toFixed(2)} (6 months of expenses).`,
        impact: 'high'
      });
    } else if (monthsOfExpenses >= 6) {
      insights.push({
        type: 'success',
        category: 'emergency_fund',
        title: 'Strong Emergency Fund',
        message: `Your emergency fund covers ${monthsOfExpenses.toFixed(1)} months of expenses. Well done!`,
        recommendation: `Your emergency fund is solid. Consider investing excess cash for better returns.`,
        impact: 'positive'
      });
    }
  }

  return insights;
};

// GET /api/ai/insights - Get personalized financial insights
router.get('/insights', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch all necessary data
    const transactions = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM transactions
        WHERE user_id = ? AND date >= date('now', '-30 days')
        ORDER BY date DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const bills = await new Promise((resolve, reject) => {
      db.all(`
        SELECT b.bill_name, bp.actual_amount, bp.month
        FROM bills b
        LEFT JOIN bill_payments bp ON b.id = bp.bill_id
        WHERE b.user_id = ? AND bp.month >= date('now', '-6 months')
        ORDER BY bp.month DESC
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const income = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM income_sources WHERE user_id = ? AND is_active = 1`, [userId], (err, rows) => {
        if (err) reject(err);
        else {
          const sources = rows || [];
          const totalMonthly = sources.reduce((sum, source) => {
            const monthly = calculateMonthlyIncome(source.amount, source.frequency);
            return sum + monthly;
          }, 0);
          resolve({ sources, monthly: totalMonthly });
        }
      });
    });

    const netWorth = await new Promise((resolve, reject) => {
      db.all(`
        SELECT * FROM net_worth_snapshots
        WHERE user_id = ?
        ORDER BY snapshot_date DESC
        LIMIT 6
      `, [userId], (err, rows) => {
        if (err) reject(err);
        else {
          const history = rows || [];
          // Also get current balances
          db.all(`
            SELECT type, SUM(balance) as total
            FROM accounts
            WHERE user_id = ?
            GROUP BY type
          `, [userId], (err2, accounts) => {
            if (err2) reject(err2);
            else {
              const checking = accounts.find(a => a.type === 'checking')?.total || 0;
              const savings = accounts.find(a => a.type === 'savings')?.total || 0;
              resolve({ history, checking, savings });
            }
          });
        }
      });
    });

    const budget = await new Promise((resolve, reject) => {
      db.get(`
        SELECT
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income
        FROM transactions
        WHERE user_id = ? AND date >= date('now', '-30 days')
      `, [userId], (err, row) => {
        if (err) reject(err);
        else resolve(row || { expenses: 0, income: 0 });
      });
    });

    // Helper function for income calculation
    const calculateMonthlyIncome = (amount, frequency) => {
      switch (frequency) {
        case 'weekly': return amount * 52 / 12;
        case 'biweekly': return amount * 26 / 12;
        case 'monthly': return amount;
        case 'quarterly': return amount / 3;
        case 'annually': return amount / 12;
        case 'variable': return amount;
        default: return 0;
      }
    };

    // Predict bill amounts
    const billPredictions = predictBillAmounts(bills);

    // Generate AI insights
    const userData = {
      transactions,
      bills: Object.values(billPredictions),
      income,
      netWorth,
      budget
    };

    const insights = generateInsights(userData);

    res.json({
      insights,
      summary: {
        totalInsights: insights.length,
        highPriority: insights.filter(i => i.impact === 'high').length,
        warnings: insights.filter(i => i.type === 'warning').length,
        positive: insights.filter(i => i.type === 'success').length
      },
      billPredictions: Object.values(billPredictions)
    });

  } catch (error) {
    console.error('Error generating insights:', error);
    res.status(500).json({ error: 'Failed to generate insights' });
  }
});

// POST /api/ai/chat - AI chat assistant endpoint
router.post('/chat', async (req, res) => {
  try {
    const { message } = req.body;
    const userId = req.user.userId;

    // Simple rule-based chat responses (can be enhanced with actual AI/LLM later)
    const lowerMessage = message.toLowerCase();

    let response = '';

    if (lowerMessage.includes('spend') && lowerMessage.includes('last month')) {
      // Get last month's spending
      const result = await new Promise((resolve, reject) => {
        db.get(`
          SELECT SUM(amount) as total
          FROM transactions
          WHERE user_id = ? AND type = 'expense' AND date >= date('now', '-30 days')
        `, [userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      response = `You spent $${result.total?.toFixed(2) || '0.00'} last month.`;
    }
    else if (lowerMessage.includes('income') || lowerMessage.includes('make')) {
      // Get total income
      const result = await new Promise((resolve, reject) => {
        db.all(`SELECT * FROM income_sources WHERE user_id = ? AND is_active = 1`, [userId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      const calculateMonthly = (amount, frequency) => {
        switch (frequency) {
          case 'weekly': return amount * 52 / 12;
          case 'biweekly': return amount * 26 / 12;
          case 'monthly': return amount;
          case 'quarterly': return amount / 3;
          case 'annually': return amount / 12;
          case 'variable': return amount;
          default: return 0;
        }
      };

      const totalMonthly = result.reduce((sum, s) => sum + calculateMonthly(s.amount, s.frequency), 0);
      response = `Your total monthly income is $${totalMonthly.toFixed(2)} from ${result.length} source${result.length !== 1 ? 's' : ''}.`;
    }
    else if (lowerMessage.includes('net worth')) {
      // Get net worth
      const result = await new Promise((resolve, reject) => {
        db.get(`
          SELECT
            (SELECT COALESCE(SUM(balance), 0) FROM accounts WHERE user_id = ? AND type IN ('checking', 'savings')) +
            (SELECT COALESCE(SUM(balance), 0) FROM retirement_accounts WHERE user_id = ?) +
            (SELECT COALESCE(SUM(value), 0) FROM assets WHERE user_id = ?) -
            (SELECT COALESCE(SUM(ABS(balance)), 0) FROM accounts WHERE user_id = ? AND type IN ('credit_card', 'loan', 'mortgage', 'other_debt')) as net_worth
        `, [userId, userId, userId, userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      response = `Your current net worth is $${result.net_worth?.toFixed(2) || '0.00'}.`;
    }
    else if (lowerMessage.includes('save') || lowerMessage.includes('savings')) {
      const result = await new Promise((resolve, reject) => {
        db.get(`
          SELECT
            SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expenses
          FROM transactions
          WHERE user_id = ? AND date >= date('now', '-30 days')
        `, [userId], (err, row) => {
          if (err) reject(err);
          else resolve(row);
        });
      });
      const savings = (result.income || 0) - (result.expenses || 0);
      const savingsRate = result.income > 0 ? ((savings / result.income) * 100).toFixed(1) : '0';
      response = `You saved $${savings.toFixed(2)} last month, which is a ${savingsRate}% savings rate. The recommended target is 20%.`;
    }
    else if (lowerMessage.includes('bills')) {
      const result = await new Promise((resolve, reject) => {
        db.all(`
          SELECT bill_name, target_amount, due_day
          FROM bills
          WHERE user_id = ? AND is_active = 1
          ORDER BY due_day ASC
        `, [userId], (err, rows) => {
          if (err) reject(err);
          else resolve(rows);
        });
      });

      if (result.length === 0) {
        response = "You don't have any active bills tracked yet.";
      } else {
        const totalBills = result.reduce((sum, b) => sum + b.target_amount, 0);
        response = `You have ${result.length} bills totaling $${totalBills.toFixed(2)} per month. `;
        if (result.length <= 3) {
          response += "Your bills are: " + result.map(b => `${b.bill_name} ($${b.target_amount})`).join(', ');
        }
      }
    }
    else if (lowerMessage.includes('help') || lowerMessage.includes('what can you')) {
      response = `I can help you with:\n- Checking your spending ("How much did I spend last month?")\n- Reviewing your income ("What's my total income?")\n- Tracking net worth ("What's my net worth?")\n- Analyzing savings ("How much am I saving?")\n- Managing bills ("Show me my bills")\n\nJust ask me anything about your finances!`;
    }
    else {
      response = `I'm here to help with your finances! Try asking me about your spending, income, savings, net worth, or bills. For example: "How much did I spend last month?" or "What's my total income?"`;
    }

    res.json({
      response,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in chat:', error);
    res.status(500).json({ error: 'Failed to process chat message' });
  }
});

// GET /api/ai/wealth-growth - Get AI-generated wealth growth opportunities
router.get('/wealth-growth', async (req, res) => {
  try {
    const userId = req.user.userId;

    // Fetch user's financial data
    const netWorth = await new Promise((resolve, reject) => {
      db.get(`
        SELECT
          (SELECT COALESCE(SUM(balance), 0) FROM accounts WHERE user_id = ? AND type IN ('checking', 'savings')) +
          (SELECT COALESCE(SUM(balance), 0) FROM retirement_accounts WHERE user_id = ?) +
          (SELECT COALESCE(SUM(value), 0) FROM assets WHERE user_id = ?) -
          (SELECT COALESCE(SUM(ABS(balance)), 0) FROM accounts WHERE user_id = ? AND type IN ('credit_card', 'loan', 'mortgage', 'other_debt')) as net_worth,
          (SELECT COALESCE(SUM(balance), 0) FROM accounts WHERE user_id = ? AND type IN ('checking', 'savings')) as liquid_assets,
          (SELECT COALESCE(SUM(balance), 0) FROM retirement_accounts WHERE user_id = ?) as retirement
      `, [userId, userId, userId, userId, userId, userId], (err, row) => {
        if (err) reject(err);
        else resolve(row);
      });
    });

    const income = await new Promise((resolve, reject) => {
      db.all(`SELECT * FROM income_sources WHERE user_id = ? AND is_active = 1`, [userId], (err, rows) => {
        if (err) reject(err);
        else resolve(rows || []);
      });
    });

    const calculateMonthlyIncome = (amount, frequency) => {
      switch (frequency) {
        case 'weekly': return amount * 52 / 12;
        case 'biweekly': return amount * 26 / 12;
        case 'monthly': return amount;
        case 'quarterly': return amount / 3;
        case 'annually': return amount / 12;
        case 'variable': return amount;
        default: return 0;
      }
    };

    const totalMonthlyIncome = income.reduce((sum, s) => sum + calculateMonthlyIncome(s.amount, s.frequency), 0);

    // Generate personalized wealth growth opportunities based on financial profile
    const opportunities = [];

    // Opportunity 1: High-Yield Savings/Investment (if liquid assets > $10k)
    if (netWorth.liquid_assets > 10000) {
      opportunities.push({
        title: 'High-Yield Investment Account',
        description: `You have ${formatCurrency(netWorth.liquid_assets)} in liquid assets. Move a portion to high-yield investments earning 4-5% APY instead of standard savings rates.`,
        category: 'investment',
        icon: '💹',
        risk_level: 'low',
        timeline: 'Short-term (1-3 months)',
        initial_investment: Math.min(netWorth.liquid_assets * 0.3, 25000),
        potential_monthly_gain: Math.min(netWorth.liquid_assets * 0.3, 25000) * 0.045 / 12,
        roi: 4.5,
        action_steps: [
          'Research high-yield savings accounts or money market funds (Ally, Marcus, etc.)',
          'Transfer 30% of liquid assets to maximize returns while maintaining emergency fund',
          'Set up automatic monthly contributions from your checking account',
          'Monitor rates quarterly and switch if better options emerge'
        ],
        personalization_reason: `Based on your ${formatCurrency(netWorth.liquid_assets)} in liquid assets, you could earn an extra ${formatCurrency(Math.min(netWorth.liquid_assets * 0.3, 25000) * 0.045 / 12)}/month with minimal risk.`
      });
    }

    // Opportunity 2: Index Fund Investment (if net worth > $20k)
    if (netWorth.net_worth > 20000) {
      opportunities.push({
        title: 'Low-Cost Index Fund Portfolio',
        description: 'Build wealth through diversified index funds (S&P 500, Total Market) with historical 10% average annual returns.',
        category: 'investment',
        icon: '📊',
        risk_level: 'medium',
        timeline: 'Long-term (5+ years)',
        initial_investment: Math.min(netWorth.liquid_assets * 0.2, 10000),
        potential_monthly_gain: Math.min(netWorth.liquid_assets * 0.2, 10000) * 0.10 / 12,
        roi: 10,
        action_steps: [
          'Open a brokerage account (Vanguard, Fidelity, Schwab)',
          'Invest in 3-fund portfolio: 70% Total Stock Market, 20% International, 10% Bonds',
          'Set up automatic monthly contributions of $500-1000',
          'Rebalance annually and stay invested for long-term growth'
        ],
        personalization_reason: `Your net worth of ${formatCurrency(netWorth.net_worth)} positions you well for long-term wealth building through index funds.`
      });
    }

    // Opportunity 3: Side Business/Freelancing (based on income sources)
    if (income.length < 3) {
      opportunities.push({
        title: 'Monetize Your Skills - Consulting/Freelancing',
        description: 'Launch a consulting or freelance business in your area of expertise. High-value individuals average 3-5 income streams.',
        category: 'business',
        icon: '💼',
        risk_level: 'medium',
        timeline: 'Medium-term (3-6 months)',
        initial_investment: 500,
        potential_monthly_gain: 2000,
        roi: 400,
        action_steps: [
          'Identify your most valuable skill or expertise area',
          'Create profiles on Upwork, Fiverr, or LinkedIn for client acquisition',
          'Set competitive rates ($100-200/hour for consulting)',
          'Dedicate 5-10 hours/week initially, scale based on demand',
          'Reinvest first earnings into marketing and tools'
        ],
        personalization_reason: `You currently have ${income.length} income source(s). Adding consulting could increase monthly income by $2,000-5,000.`
      });
    }

    // Opportunity 4: Real Estate Investment (if net worth > $50k)
    if (netWorth.net_worth > 50000) {
      opportunities.push({
        title: 'Real Estate Investment (REIT or Rental)',
        description: 'Invest in Real Estate Investment Trusts (REITs) or consider rental property for passive income and appreciation.',
        category: 'real_estate',
        icon: '🏠',
        risk_level: 'medium',
        timeline: 'Long-term (3-10 years)',
        initial_investment: 20000,
        potential_monthly_gain: 500,
        roi: 8,
        action_steps: [
          'Research REITs with 6-8% dividend yields (start with $5-10k)',
          'Analyze local rental market for properties with 1% monthly rent rule',
          'Save 20-25% down payment for investment property',
          'Partner with property management company to reduce time commitment',
          'Focus on cash flow positive properties in growing areas'
        ],
        personalization_reason: `With ${formatCurrency(netWorth.net_worth)} net worth, you can leverage real estate for $500+ monthly passive income.`
      });
    }

    // Opportunity 5: Automated Online Business (for all)
    opportunities.push({
      title: 'Automated Digital Product Business',
      description: 'Create and sell digital products (courses, templates, ebooks) that generate passive income 24/7.',
      category: 'passive',
      icon: '🤖',
      risk_level: 'low',
      timeline: 'Medium-term (2-4 months)',
      initial_investment: 200,
      potential_monthly_gain: 1500,
      roi: 750,
      action_steps: [
        'Identify a problem you can solve based on your expertise',
        'Create a digital product (course on Teachable, templates on Gumroad)',
        'Set up automated sales funnel with email marketing',
        'Drive traffic through content marketing (YouTube, blog, social media)',
        'Optimize and scale based on customer feedback'
      ],
      personalization_reason: 'Digital products have near-zero marginal costs and can scale infinitely with minimal ongoing effort.'
    });

    // Opportunity 6: Premium Skill Development (for income growth)
    if (totalMonthlyIncome < 15000) {
      opportunities.push({
        title: 'High-Income Skill Development',
        description: 'Invest in learning premium skills (AI/ML, Cloud Architecture, Sales) that command $150-500/hour rates.',
        category: 'skill',
        icon: '🎓',
        risk_level: 'low',
        timeline: 'Medium-term (3-6 months)',
        initial_investment: 1000,
        potential_monthly_gain: 3000,
        roi: 300,
        action_steps: [
          'Choose in-demand skill: AI/ML, Cloud (AWS/Azure), Data Science, or Sales',
          'Invest in premium courses or bootcamps ($500-2000)',
          'Build portfolio with 3-5 real projects',
          'Get certified (AWS, Google Cloud, etc.) to boost credibility',
          'Market yourself as specialist and charge premium rates'
        ],
        personalization_reason: `Your current income of ${formatCurrency(totalMonthlyIncome)}/month can grow 2-3x with specialized skills.`
      });
    }

    // Opportunity 7: Dividend Growth Investing (if retirement > $10k)
    if (netWorth.retirement > 10000) {
      opportunities.push({
        title: 'Dividend Aristocrat Portfolio',
        description: 'Build a portfolio of dividend-paying stocks with 25+ years of consecutive dividend increases for reliable passive income.',
        category: 'investment',
        icon: '💵',
        risk_level: 'medium',
        timeline: 'Long-term (5+ years)',
        initial_investment: 5000,
        potential_monthly_gain: 150,
        roi: 3.6,
        action_steps: [
          'Research Dividend Aristocrats list (companies with 25+ year dividend growth)',
          'Build diversified portfolio of 15-20 dividend stocks',
          'Target average 3-4% dividend yield',
          'Reinvest dividends automatically (DRIP) for compound growth',
          'Add $500/month consistently to maximize compounding'
        ],
        personalization_reason: `Your ${formatCurrency(netWorth.retirement)} retirement funds can generate growing passive income through dividend stocks.`
      });
    }

    // Helper function for formatting
    function formatCurrency(amount) {
      if (!amount) return '$0';
      return `$${amount.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
    }

    res.json({
      opportunities,
      profile: {
        net_worth: netWorth.net_worth,
        liquid_assets: netWorth.liquid_assets,
        monthly_income: totalMonthlyIncome,
        income_sources: income.length,
        risk_tolerance: netWorth.net_worth > 100000 ? 'moderate-aggressive' : netWorth.net_worth > 50000 ? 'moderate' : 'conservative'
      },
      summary: {
        total_opportunities: opportunities.length,
        total_potential_monthly: opportunities.reduce((sum, opp) => sum + (opp.potential_monthly_gain || 0), 0),
        recommended_focus: opportunities.length > 0 ? opportunities[0].category : 'investment'
      }
    });

  } catch (error) {
    console.error('Error generating wealth growth opportunities:', error);
    res.status(500).json({ error: 'Failed to generate opportunities' });
  }
});

module.exports = router;
