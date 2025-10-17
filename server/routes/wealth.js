const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../models/database');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// All routes require authentication
router.use(authenticateToken);

// ============ NET WORTH ============

// Get current net worth
router.get('/networth', (req, res) => {
  const { userId } = req.user;

  // Get all assets
  const assetsQuery = `
    SELECT SUM(balance) as total FROM (
      SELECT balance FROM accounts WHERE user_id = ? AND type IN ('checking', 'savings')
      UNION ALL
      SELECT balance FROM retirement_accounts WHERE user_id = ?
      UNION ALL
      SELECT value as balance FROM assets WHERE user_id = ?
    )
  `;

  // Get all liabilities
  const liabilitiesQuery = `
    SELECT SUM(ABS(balance)) as total FROM accounts
    WHERE user_id = ? AND type IN ('credit_card', 'loan', 'mortgage', 'other_debt')
  `;

  db.get(assetsQuery, [userId, userId, userId], (err, assets) => {
    if (err) {
      return res.status(500).json({ error: 'Error calculating assets' });
    }

    db.get(liabilitiesQuery, [userId], (err, liabilities) => {
      if (err) {
        return res.status(500).json({ error: 'Error calculating liabilities' });
      }

      const totalAssets = assets?.total || 0;
      const totalLiabilities = liabilities?.total || 0;
      const netWorth = totalAssets - totalLiabilities;

      res.json({
        total_assets: totalAssets,
        total_liabilities: totalLiabilities,
        net_worth: netWorth
      });
    });
  });
});

// Save net worth snapshot
router.post('/networth/snapshot', (req, res) => {
  const { userId } = req.user;
  const { total_assets, total_liabilities, snapshot_date } = req.body;

  const id = uuidv4();
  const net_worth = total_assets - total_liabilities;
  const date = snapshot_date || new Date().toISOString().split('T')[0];

  db.run(
    'INSERT INTO net_worth_snapshots (id, user_id, total_assets, total_liabilities, net_worth, snapshot_date) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, total_assets, total_liabilities, net_worth, date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error saving snapshot' });
      }
      res.status(201).json({ message: 'Snapshot saved successfully', id });
    }
  );
});

// Get net worth history
router.get('/networth/history', (req, res) => {
  const { userId } = req.user;

  db.all(
    'SELECT * FROM net_worth_snapshots WHERE user_id = ? ORDER BY snapshot_date DESC LIMIT 12',
    [userId],
    (err, snapshots) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching history' });
      }
      res.json(snapshots);
    }
  );
});

// ============ ACCOUNTS (Savings, Checking, Credit Cards) ============

// Get all accounts
router.get('/accounts', (req, res) => {
  const { userId } = req.user;
  const { type } = req.query;

  let query = 'SELECT * FROM accounts WHERE user_id = ?';
  const params = [userId];

  if (type) {
    query += ' AND type = ?';
    params.push(type);
  }

  query += ' ORDER BY created_at DESC';

  db.all(query, params, (err, accounts) => {
    if (err) {
      return res.status(500).json({ error: 'Error fetching accounts' });
    }
    res.json(accounts);
  });
});

// Create account
router.post('/accounts', (req, res) => {
  const { userId } = req.user;
  const { name, type, balance, credit_limit, interest_rate, due_date, institution } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  const id = uuidv4();

  db.run(
    'INSERT INTO accounts (id, user_id, name, type, balance, credit_limit, interest_rate, due_date, institution) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, name, type, balance || 0, credit_limit, interest_rate, due_date, institution],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating account' });
      }
      res.status(201).json({ message: 'Account created successfully', id });
    }
  );
});

// Update account
router.put('/accounts/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { name, type, balance, credit_limit, interest_rate, due_date, institution } = req.body;

  db.run(
    `UPDATE accounts SET name = ?, type = ?, balance = ?, credit_limit = ?, interest_rate = ?,
     due_date = ?, institution = ?, last_updated = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [name, type, balance, credit_limit, interest_rate, due_date, institution, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating account' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Account not found' });
      }
      res.json({ message: 'Account updated successfully' });
    }
  );
});

// Delete account
router.delete('/accounts/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.run('DELETE FROM accounts WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error deleting account' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Account not found' });
    }
    res.json({ message: 'Account deleted successfully' });
  });
});

// ============ RETIREMENT ACCOUNTS (401k, IRA, etc.) ============

// Get all retirement accounts
router.get('/retirement', (req, res) => {
  const { userId } = req.user;

  db.all(
    'SELECT * FROM retirement_accounts WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, accounts) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching retirement accounts' });
      }
      res.json(accounts);
    }
  );
});

// Create retirement account
router.post('/retirement', (req, res) => {
  const { userId } = req.user;
  const { name, type, balance, contribution_amount, contribution_frequency, employer_match } = req.body;

  if (!name || !type) {
    return res.status(400).json({ error: 'Name and type are required' });
  }

  const id = uuidv4();

  db.run(
    'INSERT INTO retirement_accounts (id, user_id, name, type, balance, contribution_amount, contribution_frequency, employer_match) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, name, type, balance || 0, contribution_amount, contribution_frequency, employer_match],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating retirement account' });
      }
      res.status(201).json({ message: 'Retirement account created successfully', id });
    }
  );
});

// Update retirement account
router.put('/retirement/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { name, type, balance, contribution_amount, contribution_frequency, employer_match } = req.body;

  db.run(
    `UPDATE retirement_accounts SET name = ?, type = ?, balance = ?, contribution_amount = ?,
     contribution_frequency = ?, employer_match = ?, last_updated = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [name, type, balance, contribution_amount, contribution_frequency, employer_match, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating retirement account' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Retirement account not found' });
      }
      res.json({ message: 'Retirement account updated successfully' });
    }
  );
});

// Delete retirement account
router.delete('/retirement/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.run('DELETE FROM retirement_accounts WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error deleting retirement account' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Retirement account not found' });
    }
    res.json({ message: 'Retirement account deleted successfully' });
  });
});

// ============ ASSETS ============

// Get all assets
router.get('/assets', (req, res) => {
  const { userId } = req.user;

  db.all(
    'SELECT * FROM assets WHERE user_id = ? ORDER BY value DESC',
    [userId],
    (err, assets) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching assets' });
      }
      res.json(assets);
    }
  );
});

// Create asset
router.post('/assets', (req, res) => {
  const { userId } = req.user;
  const { name, type, value, purchase_price, purchase_date, notes } = req.body;

  if (!name || !type || value === undefined) {
    return res.status(400).json({ error: 'Name, type, and value are required' });
  }

  const id = uuidv4();

  db.run(
    'INSERT INTO assets (id, user_id, name, type, value, purchase_price, purchase_date, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [id, userId, name, type, value, purchase_price, purchase_date, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating asset' });
      }
      res.status(201).json({ message: 'Asset created successfully', id });
    }
  );
});

// Update asset
router.put('/assets/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { name, type, value, purchase_price, purchase_date, notes } = req.body;

  db.run(
    `UPDATE assets SET name = ?, type = ?, value = ?, purchase_price = ?, purchase_date = ?,
     notes = ?, last_updated = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?`,
    [name, type, value, purchase_price, purchase_date, notes, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating asset' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Asset not found' });
      }
      res.json({ message: 'Asset updated successfully' });
    }
  );
});

// Delete asset
router.delete('/assets/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.run('DELETE FROM assets WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error deleting asset' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    res.json({ message: 'Asset deleted successfully' });
  });
});

// ============ FINANCIAL TARGETS ============

// Get all targets
router.get('/targets', (req, res) => {
  const { userId } = req.user;

  db.all(
    'SELECT * FROM financial_targets WHERE user_id = ? ORDER BY is_achieved ASC, target_date ASC',
    [userId],
    (err, targets) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching targets' });
      }
      res.json(targets);
    }
  );
});

// Create target
router.post('/targets', (req, res) => {
  const { userId } = req.user;
  const { category, name, target_value, current_value, target_date } = req.body;

  if (!category || !name || !target_value) {
    return res.status(400).json({ error: 'Category, name, and target value are required' });
  }

  const id = uuidv4();

  db.run(
    'INSERT INTO financial_targets (id, user_id, category, name, target_value, current_value, target_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [id, userId, category, name, target_value, current_value || 0, target_date],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error creating target' });
      }
      res.status(201).json({ message: 'Target created successfully', id });
    }
  );
});

// Update target
router.put('/targets/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;
  const { category, name, target_value, current_value, target_date, is_achieved } = req.body;

  db.run(
    'UPDATE financial_targets SET category = ?, name = ?, target_value = ?, current_value = ?, target_date = ?, is_achieved = ? WHERE id = ? AND user_id = ?',
    [category, name, target_value, current_value, target_date, is_achieved ? 1 : 0, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error updating target' });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Target not found' });
      }
      res.json({ message: 'Target updated successfully' });
    }
  );
});

// Delete target
router.delete('/targets/:id', (req, res) => {
  const { userId } = req.user;
  const { id } = req.params;

  db.run('DELETE FROM financial_targets WHERE id = ? AND user_id = ?', [id, userId], function(err) {
    if (err) {
      return res.status(500).json({ error: 'Error deleting target' });
    }
    if (this.changes === 0) {
      return res.status(404).json({ error: 'Target not found' });
    }
    res.json({ message: 'Target deleted successfully' });
  });
});

// ============ CREDIT SCORE ============

// Get credit scores
router.get('/credit', (req, res) => {
  const { userId } = req.user;

  db.all(
    'SELECT * FROM credit_scores WHERE user_id = ? ORDER BY date DESC LIMIT 24',
    [userId],
    (err, scores) => {
      if (err) {
        return res.status(500).json({ error: 'Error fetching credit scores' });
      }
      res.json(scores);
    }
  );
});

// Add credit score
router.post('/credit', (req, res) => {
  const { userId } = req.user;
  const { score, bureau, date, notes } = req.body;

  if (!score || !date) {
    return res.status(400).json({ error: 'Score and date are required' });
  }

  const id = uuidv4();

  db.run(
    'INSERT INTO credit_scores (id, user_id, score, bureau, date, notes) VALUES (?, ?, ?, ?, ?, ?)',
    [id, userId, score, bureau, date, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: 'Error adding credit score' });
      }
      res.status(201).json({ message: 'Credit score added successfully', id });
    }
  );
});

module.exports = router;
