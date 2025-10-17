const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// Get all income sources
router.get('/', (req, res) => {
  const { userId } = req.user;
  const { is_active } = req.query;

  let query = 'SELECT * FROM income_sources WHERE user_id = ?';
  const params = [userId];

  if (is_active !== undefined) {
    query += ' AND is_active = ?';
    params.push(is_active === 'true' ? 1 : 0);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, sources) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching income sources' });
    }
    res.json(sources);
  });
});

// Get income summary
router.get('/summary', (req, res) => {
  const { userId } = req.user;

  // Get all active income sources
  db.all(
    'SELECT * FROM income_sources WHERE user_id = ? AND is_active = 1',
    [userId],
    (err, sources) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching income summary' });
      }

      // Calculate monthly income for each source
      const calculateMonthlyIncome = (amount, frequency) => {
        switch (frequency) {
          case 'weekly': return amount * 52 / 12;
          case 'biweekly': return amount * 26 / 12;
          case 'monthly': return amount;
          case 'quarterly': return amount / 3;
          case 'annually': return amount / 12;
          case 'variable': return amount; // Assume amount is monthly average
          default: return 0;
        }
      };

      // Calculate totals
      let totalMonthly = 0;
      let totalAnnual = 0;
      const byType = {};
      const bySource = [];

      sources.forEach(source => {
        const monthly = calculateMonthlyIncome(source.amount, source.frequency);
        const annual = monthly * 12;

        totalMonthly += monthly;
        totalAnnual += annual;

        // Group by type
        if (!byType[source.source_type]) {
          byType[source.source_type] = {
            type: source.source_type,
            monthly: 0,
            annual: 0,
            count: 0
          };
        }
        byType[source.source_type].monthly += monthly;
        byType[source.source_type].annual += annual;
        byType[source.source_type].count += 1;

        // Individual sources
        bySource.push({
          id: source.id,
          name: source.source_name,
          type: source.source_type,
          monthly,
          annual,
          frequency: source.frequency,
          original_amount: source.amount
        });
      });

      res.json({
        total_monthly: totalMonthly,
        total_annual: totalAnnual,
        by_type: Object.values(byType),
        by_source: bySource,
        active_sources_count: sources.length
      });
    }
  );
});

// Get single income source
router.get('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.get(
    'SELECT * FROM income_sources WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, source) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching income source' });
      }
      if (!source) {
        return res.status(404).json({ error: 'Income source not found' });
      }
      res.json(source);
    }
  );
});

// Create income source
router.post('/', (req, res) => {
  const { userId } = req.user;
  const {
    source_name,
    source_type,
    amount,
    frequency,
    employer_company,
    is_active,
    start_date,
    notes
  } = req.body;

  if (!source_name || !source_type || !amount || !frequency) {
    return res.status(400).json({
      error: 'Source name, type, amount, and frequency are required'
    });
  }

  const id = uuidv4();

  db.run(
    `INSERT INTO income_sources
    (id, user_id, source_name, source_type, amount, frequency, employer_company, is_active, start_date, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      userId,
      source_name,
      source_type,
      amount,
      frequency,
      employer_company,
      is_active !== undefined ? (is_active ? 1 : 0) : 1,
      start_date,
      notes
    ],
    function(err) {
      if (err) {
        console.error('Error creating income source:', err);
        return res.status(500).json({ error: 'Error creating income source' });
      }

      res.status(201).json({
        message: 'Income source created successfully',
        income_source: {
          id,
          source_name,
          source_type,
          amount,
          frequency,
          employer_company,
          is_active: is_active !== undefined ? is_active : true,
          start_date,
          notes
        }
      });
    }
  );
});

// Update income source
router.put('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const {
    source_name,
    source_type,
    amount,
    frequency,
    employer_company,
    is_active,
    start_date,
    notes
  } = req.body;

  db.run(
    `UPDATE income_sources
    SET source_name = ?, source_type = ?, amount = ?, frequency = ?,
        employer_company = ?, is_active = ?, start_date = ?, notes = ?
    WHERE id = ? AND user_id = ?`,
    [
      source_name,
      source_type,
      amount,
      frequency,
      employer_company,
      is_active ? 1 : 0,
      start_date,
      notes,
      id,
      userId
    ],
    function(err) {
      if (err) {
        console.error('Error updating income source:', err);
        return res.status(500).json({ error: 'Error updating income source' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Income source not found' });
      }
      res.json({ message: 'Income source updated successfully' });
    }
  );
});

// Delete income source
router.delete('/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.run(
    'DELETE FROM income_sources WHERE id = ? AND user_id = ?',
    [id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error deleting income source' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Income source not found' });
      }
      res.json({ message: 'Income source deleted successfully' });
    }
  );
});

module.exports = router;
