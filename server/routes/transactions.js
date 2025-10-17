const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all transactions for user
router.get('/', (req, res) => {
  const { userId } = req.user;
  const { startDate, endDate, type, category } = req.query;

  let query = 'SELECT * FROM transactions WHERE user_id = ?';
  const params = [userId];

  if (startDate) {
    query += ' AND date >= ?';
    params.push(startDate);
  }
  if (endDate) {
    query += ' AND date <= ?';
    params.push(endDate);
  }
  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY date DESC';

  db.all(query, params, (err, transactions) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching transactions' });
    }
    res.json(transactions);
  });
});

// Get single transaction
router.get('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.get(
    'SELECT * FROM transactions WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, transaction) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching transaction' });
      }
      if (!transaction) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json(transaction);
    }
  );
});

// Create transaction
router.post('/', (req, res) => {
  const { userId } = req.user;
  const { type, amount, category, description, date } = req.body;

  if (!type || !amount || !category || !date) {
    return res.status(400).json({ error: 'Type, amount, category, and date are required' });
  }

  if (!['income', 'expense'].includes(type)) {
    return res.status(400).json({ error: 'Type must be either income or expense' });
  }

  const id = uuidv4();

  db.run(
    'INSERT INTO transactions (id, user_id, type, amount, category, description, date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, type, amount, category, description, date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating transaction' });
      }

      res.status(201).json({
        message: 'Transaction created successfully',
        transaction: { id, user_id: userId, type, amount, category, description, date }
      });
    }
  );
});

// Update transaction
router.put('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { type, amount, category, description, date } = req.body;

  db.run(
    'UPDATE transactions SET type = ?, amount = ?, category = ?, description = ?, date = ? WHERE id = ? AND user_id = ?',
    [type, amount, category, description, date, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating transaction' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ message: 'Transaction updated successfully' });
    }
  );
});

// Delete transaction
router.delete('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.run(
    'DELETE FROM transactions WHERE id = ? AND user_id = ?',
    [id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting transaction' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Transaction not found' });
      }
      res.json({ message: 'Transaction deleted successfully' });
    }
  );
});

module.exports = router;
