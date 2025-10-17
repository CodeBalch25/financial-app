const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ============ BILLS MANAGEMENT ============

// Get all bills
router.get('/', (req, res) => {
  const { userId } = req.user;
  const { is_active } = req.query;

  let query = 'SELECT * FROM bills WHERE user_id = ?';
  const params = [userId];

  if (is_active !== undefined) {
    query += ' AND is_active = ?';
    params.push(is_active === 'true' ? 1 : 0);
  }

  query += ' ORDER BY bill_name ASC';

  db.all(query, params, (err, bills) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching bills' });
    }
    res.json(bills);
  });
});

// Get bill with payment history
router.get('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.get(
    'SELECT * FROM bills WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, bill) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching bill' });
      }
      if (!bill) {
        return res.status(404).json({ error: 'Bill not found' });
      }

      // Get payment history
      db.all(
        'SELECT * FROM bill_payments WHERE bill_id = ? ORDER BY payment_date DESC LIMIT 12',
        [id],
        (err, payments) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching payment history' });
          }
          res.json({ ...bill, payment_history: payments });
        }
      );
    }
  );
});

// Create bill
router.post('/', (req, res) => {
  const { userId } = req.user;
  const { bill_name, bill_type, target_amount, due_day, is_active, notes } = req.body;

  if (!bill_name || !bill_type || !target_amount) {
    return res.status(400).json({
      error: 'Bill name, type, and target amount are required'
    });
  }

  const id = uuidv4();

  db.run(
    'INSERT INTO bills (id, user_id, bill_name, bill_type, target_amount, due_day, is_active, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, bill_name, bill_type, target_amount, due_day, is_active ? 1 : 0, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating bill' });
      }
      res.status(201).json({
        message: 'Bill created successfully',
        bill: { id, bill_name, bill_type, target_amount, due_day }
      });
    }
  );
});

// Update bill
router.put('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { bill_name, bill_type, target_amount, due_day, is_active, notes } = req.body;

  db.run(
    'UPDATE bills SET bill_name = ?, bill_type = ?, target_amount = ?, due_day = ?, is_active = ?, notes = ? WHERE id = ? AND user_id = ?',
    [bill_name, bill_type, target_amount, due_day, is_active ? 1 : 0, notes, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating bill' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Bill not found' });
      }
      res.json({ message: 'Bill updated successfully' });
    }
  );
});

// Delete bill
router.delete('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  // Delete bill and associated payments
  db.run('DELETE FROM bill_payments WHERE bill_id = ?', [id], (err) => {
    if (err) {
      return res.status(500).json({ error: 'Error deleting bill payments' });
    }

    db.run('DELETE FROM bills WHERE id = ? AND user_id = ?', [id, userId], function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting bill' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Bill not found' });
      }
      res.json({ message: 'Bill deleted successfully' });
    });
  });
});

// ============ BILL PAYMENTS ============

// Add payment for a bill
router.post('/:id/payments', (req, res) => {
  const { userId } = req.user;
  const { id: bill_id } = req.params;
  const { amount_paid, payment_date, notes } = req.body;

  if (!amount_paid || !payment_date) {
    return res.status(400).json({ error: 'Amount and payment date are required' });
  }

  // Extract month-year from payment_date (format: YYYY-MM)
  const month_year = payment_date.substring(0, 7);
  const payment_id = uuidv4();

  db.run(
    'INSERT INTO bill_payments (id, bill_id, user_id, amount_paid, payment_date, month_year, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [payment_id, bill_id, userId, amount_paid, payment_date, month_year, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error recording payment' });
      }
      res.status(201).json({
        message: 'Payment recorded successfully',
        payment: { id: payment_id, bill_id, amount_paid, payment_date, month_year }
      });
    }
  );
});

// Get all payments for a bill
router.get('/:id/payments', (req, res) => {
  const { id: bill_id } = req.params;
  const { limit } = req.query;

  let query = 'SELECT * FROM bill_payments WHERE bill_id = ? ORDER BY payment_date DESC';
  const params = [bill_id];

  if (limit) {
    query += ' LIMIT ?';
    params.push(parseInt(limit));
  }

  db.all(query, params, (err, payments) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching payments' });
    }
    res.json(payments);
  });
});

// Delete payment
router.delete('/payments/:payment_id', (req, res) => {
  const { userId } = req.user;
  const { payment_id } = req.params;

  db.run(
    'DELETE FROM bill_payments WHERE id = ? AND user_id = ?',
    [payment_id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting payment' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Payment not found' });
      }
      res.json({ message: 'Payment deleted successfully' });
    }
  );
});

// ============ ANALYTICS & TRENDS ============

// Get bills summary with target vs actual
router.get('/analytics/summary', (req, res) => {
  const { userId } = req.user;
  const { months = 6 } = req.query;

  // Get all active bills
  db.all(
    'SELECT * FROM bills WHERE user_id = ? AND is_active = 1',
    [userId],
    (err, bills) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching bills' });
      }

      if (bills.length === 0) {
        return res.json({
          total_target_monthly: 0,
          bills_with_trends: [],
          overall_variance: 0
        });
      }

      const total_target = bills.reduce((sum, bill) => sum + bill.target_amount, 0);
      const billIds = bills.map(b => b.id);

      // Get payments for last N months
      const monthsAgo = new Date();
      monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));
      const monthsAgoStr = monthsAgo.toISOString().substring(0, 7);

      db.all(
        `SELECT bill_id, month_year, SUM(amount_paid) as total_paid, AVG(amount_paid) as avg_paid
         FROM bill_payments
         WHERE bill_id IN (${billIds.map(() => '?').join(',')}) AND month_year >= ?
         GROUP BY bill_id, month_year
         ORDER BY month_year ASC`,
        [...billIds, monthsAgoStr],
        (err, payments) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching payment data' });
          }

          // Organize data by bill
          const billsWithTrends = bills.map(bill => {
            const billPayments = payments.filter(p => p.bill_id === bill.id);
            const trend = billPayments.map(p => ({
              month: p.month_year,
              amount: p.total_paid,
              target: bill.target_amount,
              variance: p.total_paid - bill.target_amount,
              variance_percent: ((p.total_paid - bill.target_amount) / bill.target_amount * 100).toFixed(1)
            }));

            const avgPaid = billPayments.length > 0
              ? billPayments.reduce((sum, p) => sum + p.total_paid, 0) / billPayments.length
              : 0;

            return {
              ...bill,
              average_paid: avgPaid,
              variance: avgPaid - bill.target_amount,
              variance_percent: bill.target_amount > 0
                ? ((avgPaid - bill.target_amount) / bill.target_amount * 100).toFixed(1)
                : 0,
              trend_data: trend,
              payments_count: billPayments.length
            };
          });

          // Calculate overall variance
          const totalAvgPaid = billsWithTrends.reduce((sum, b) => sum + b.average_paid, 0);
          const overall_variance = totalAvgPaid - total_target;

          res.json({
            total_target_monthly: total_target,
            total_average_paid: totalAvgPaid,
            overall_variance,
            overall_variance_percent: total_target > 0
              ? ((totalAvgPaid - total_target) / total_target * 100).toFixed(1)
              : 0,
            bills_with_trends: billsWithTrends
          });
        }
      );
    }
  );
});

// Get monthly trending data (for charts)
router.get('/analytics/trends', (req, res) => {
  const { userId } = req.user;
  const { months = 12 } = req.query;

  const monthsAgo = new Date();
  monthsAgo.setMonth(monthsAgo.getMonth() - parseInt(months));
  const monthsAgoStr = monthsAgo.toISOString().substring(0, 7);

  // Get all bills and their targets
  db.all(
    'SELECT id, bill_name, target_amount FROM bills WHERE user_id = ? AND is_active = 1',
    [userId],
    (err, bills) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching bills' });
      }

      if (bills.length === 0) {
        return res.json({ monthly_data: [] });
      }

      const totalTarget = bills.reduce((sum, b) => sum + b.target_amount, 0);

      // Get monthly payment totals
      db.all(
        `SELECT month_year, SUM(amount_paid) as total_paid
         FROM bill_payments
         WHERE user_id = ? AND month_year >= ?
         GROUP BY month_year
         ORDER BY month_year ASC`,
        [userId, monthsAgoStr],
        (err, monthlyTotals) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching monthly data' });
          }

          const monthly_data = monthlyTotals.map(m => ({
            month: m.month_year,
            actual: m.total_paid,
            target: totalTarget,
            variance: m.total_paid - totalTarget,
            variance_percent: ((m.total_paid - totalTarget) / totalTarget * 100).toFixed(1)
          }));

          res.json({ monthly_data });
        }
      );
    }
  );
});

module.exports = router;
