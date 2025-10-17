const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get budget overview
router.get('/overview', (req, res) => {
  const { userId } = req.user;
  const currentMonth = new Date().toISOString().slice(0, 7); // YYYY-MM

  // Get total income and expenses for current month
  db.all(
    `SELECT
      type,
      SUM(amount) as total
    FROM transactions
    WHERE user_id = ? AND strftime('%Y-%m', date) = ?
    GROUP BY type`,
    [userId, currentMonth],
    (err, totals) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching budget overview' });
      }

      const income = totals.find(t => t.type === 'income')?.total || 0;
      const expenses = totals.find(t => t.type === 'expense')?.total || 0;
      const balance = income - expenses;

      // Get expense breakdown by category
      db.all(
        `SELECT
          category,
          SUM(amount) as total
        FROM transactions
        WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
        GROUP BY category
        ORDER BY total DESC`,
        [userId, currentMonth],
        (err, categoryBreakdown) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching category breakdown' });
          }

          res.json({
            month: currentMonth,
            income,
            expenses,
            balance,
            categoryBreakdown
          });
        }
      );
    }
  );
});

// Get budget analysis with savings suggestions
router.get('/analysis', (req, res) => {
  const { userId } = req.user;
  const currentMonth = new Date().toISOString().slice(0, 7);

  // Get expense categories with totals
  db.all(
    `SELECT
      category,
      SUM(amount) as total,
      COUNT(*) as transaction_count,
      AVG(amount) as avg_transaction
    FROM transactions
    WHERE user_id = ? AND type = 'expense' AND strftime('%Y-%m', date) = ?
    GROUP BY category
    ORDER BY total DESC`,
    [userId, currentMonth],
    (err, expenses) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching expense analysis' });
      }

      // Get total income
      db.get(
        `SELECT SUM(amount) as total_income
        FROM transactions
        WHERE user_id = ? AND type = 'income' AND strftime('%Y-%m', date) = ?`,
        [userId, currentMonth],
        (err, income) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching income' });
          }

          const totalIncome = income?.total_income || 0;
          const totalExpenses = expenses.reduce((sum, e) => sum + e.total, 0);

          // Generate savings suggestions
          const suggestions = [];

          // Rule 1: Categories over 30% of income
          if (totalIncome > 0) {
            expenses.forEach(exp => {
              const percentage = (exp.total / totalIncome) * 100;
              if (percentage > 30) {
                suggestions.push({
                  type: 'high_spending',
                  category: exp.category,
                  message: `${exp.category} spending is ${percentage.toFixed(1)}% of your income. Consider reducing by 10-15%.`,
                  potential_savings: exp.total * 0.15
                });
              }
            });
          }

          // Rule 2: Many small transactions (possible subscription bloat)
          expenses.forEach(exp => {
            if (exp.transaction_count > 10 && exp.avg_transaction < 50) {
              suggestions.push({
                type: 'subscription_check',
                category: exp.category,
                message: `You have ${exp.transaction_count} small transactions in ${exp.category}. Review for unused subscriptions.`,
                potential_savings: exp.total * 0.20
              });
            }
          });

          // Rule 3: Savings rate recommendation (50/30/20 rule)
          const recommended_savings = totalIncome * 0.20;
          const actual_savings = totalIncome - totalExpenses;

          if (actual_savings < recommended_savings) {
            suggestions.push({
              type: 'savings_goal',
              category: 'general',
              message: `Aim to save 20% of income ($${recommended_savings.toFixed(2)}). Currently saving $${actual_savings.toFixed(2)}.`,
              potential_savings: recommended_savings - actual_savings
            });
          }

          res.json({
            total_income: totalIncome,
            total_expenses: totalExpenses,
            savings_rate: totalIncome > 0 ? ((actual_savings / totalIncome) * 100).toFixed(1) : 0,
            expenses,
            suggestions,
            total_potential_savings: suggestions.reduce((sum, s) => sum + (s.potential_savings || 0), 0)
          });
        }
      );
    }
  );
});

// Get/Set budget goals
router.get('/goals', (req, res) => {
  const { userId } = req.user;

  db.all(
    'SELECT * FROM budget_goals WHERE user_id = ?',
    [userId],
    (err, goals) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching budget goals' });
      }
      res.json(goals);
    }
  );
});

router.post('/goals', (req, res) => {
  const { userId } = req.user;
  const { category, monthly_limit } = req.body;

  if (!category || !monthly_limit) {
    return res.status(400).json({ error: 'Category and monthly limit are required' });
  }

  const id = uuidv4();

  db.run(
    'INSERT INTO budget_goals (id, user_id, category, monthly_limit) VALUES (?, ?, ?, ?) ON CONFLICT(user_id, category) DO UPDATE SET monthly_limit = ?',
    [id, userId, category, monthly_limit, monthly_limit],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error setting budget goal' });
      }
      res.status(201).json({
        message: 'Budget goal set successfully',
        goal: { id, user_id: userId, category, monthly_limit }
      });
    }
  );
});

module.exports = router;
