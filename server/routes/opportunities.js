const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all opportunities
router.get('/', (req, res) => {
  const { userId } = req.user;
  const { status, risk_level } = req.query;

  let query = 'SELECT * FROM opportunities WHERE user_id = ?';
  const params = [userId];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (risk_level) {
    query += ' AND risk_level = ?';
    params.push(risk_level);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, opportunities) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching opportunities' });
    }
    res.json(opportunities);
  });
});

// Get opportunity analytics
router.get('/analytics', (req, res) => {
  const { userId } = req.user;

  db.all(
    `SELECT
      status,
      COUNT(*) as count,
      SUM(initial_investment) as total_investment,
      AVG(expected_return) as avg_return
    FROM opportunities
    WHERE user_id = ?
    GROUP BY status`,
    [userId],
    (err, statusBreakdown) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching analytics' });
      }

      db.all(
        `SELECT
          risk_level,
          COUNT(*) as count,
          AVG(expected_return) as avg_return
        FROM opportunities
        WHERE user_id = ?
        GROUP BY risk_level`,
        [userId],
        (err, riskBreakdown) => {
          if (err) {
            return res.status(500).json({ error: 'Error fetching risk breakdown' });
          }

          res.json({
            by_status: statusBreakdown,
            by_risk: riskBreakdown
          });
        }
      );
    }
  );
});

// Get single opportunity
router.get('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.get(
    'SELECT * FROM opportunities WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, opportunity) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching opportunity' });
      }
      if (!opportunity) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }
      res.json(opportunity);
    }
  );
});

// Create opportunity
router.post('/', (req, res) => {
  const { userId } = req.user;
  const {
    name,
    type,
    description,
    initial_investment,
    expected_return,
    risk_level,
    time_horizon,
    notes
  } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  const id = uuidv4();

  db.run(
    `INSERT INTO opportunities
    (id, user_id, name, type, description, initial_investment, expected_return, risk_level, time_horizon, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, name, type, description, initial_investment, expected_return, risk_level, time_horizon, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating opportunity' });
      }

      res.status(201).json({
        message: 'Opportunity created successfully',
        opportunity: {
          id,
          user_id: userId,
          name,
          type,
          description,
          initial_investment,
          expected_return,
          risk_level,
          time_horizon,
          notes,
          status: 'pending'
        }
      });
    }
  );
});

// Update opportunity
router.put('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const {
    name,
    type,
    description,
    initial_investment,
    expected_return,
    risk_level,
    time_horizon,
    status,
    notes
  } = req.body;

  db.run(
    `UPDATE opportunities
    SET name = ?, type = ?, description = ?, initial_investment = ?,
        expected_return = ?, risk_level = ?, time_horizon = ?, status = ?, notes = ?
    WHERE id = ? AND user_id = ?`,
    [name, type, description, initial_investment, expected_return, risk_level, time_horizon, status, notes, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating opportunity' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }
      res.json({ message: 'Opportunity updated successfully' });
    }
  );
});

// Delete opportunity
router.delete('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.run(
    'DELETE FROM opportunities WHERE id = ? AND user_id = ?',
    [id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting opportunity' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Opportunity not found' });
      }
      res.json({ message: 'Opportunity deleted successfully' });
    }
  );
});

module.exports = router;
