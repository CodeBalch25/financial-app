const express = require('express');
const router = express.Router();
const db = require('../models/database');
const { v4: uuidv4 } = require('uuid');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// ====================
// PROPERTIES ROUTES
// ====================

// Get all investment properties
router.get('/', (req, res) => {
  const userId = req.user.userId;

  db.all(
    'SELECT * FROM investment_properties WHERE user_id = ? ORDER BY created_at DESC',
    [userId],
    (err, properties) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(properties);
    }
  );
});

// Get single property with all related data
router.get('/:id', (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  // Get property details
  db.get(
    'SELECT * FROM investment_properties WHERE id = ? AND user_id = ?',
    [id, userId],
    (err, property) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (!property) {
        return res.status(404).json({ error: 'Property not found' });
      }

      // Get property loans
      db.all(
        'SELECT * FROM property_loans WHERE property_id = ? AND user_id = ?',
        [id, userId],
        (err, loans) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get current tenant
          db.get(
            'SELECT * FROM property_tenants WHERE property_id = ? AND user_id = ? AND is_active = 1',
            [id, userId],
            (err, tenant) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              // Get rental income (last 12 months)
              db.all(
                `SELECT * FROM rental_income
                 WHERE property_id = ? AND user_id = ?
                 ORDER BY payment_date DESC LIMIT 12`,
                [id, userId],
                (err, income) => {
                  if (err) {
                    return res.status(500).json({ error: err.message });
                  }

                  // Get expenses (last 12 months)
                  db.all(
                    `SELECT * FROM property_expenses
                     WHERE property_id = ? AND user_id = ?
                     ORDER BY expense_date DESC LIMIT 50`,
                    [id, userId],
                    (err, expenses) => {
                      if (err) {
                        return res.status(500).json({ error: err.message });
                      }

                      res.json({
                        property,
                        loans,
                        tenant,
                        income,
                        expenses
                      });
                    }
                  );
                }
              );
            }
          );
        }
      );
    }
  );
});

// Create new property
router.post('/', (req, res) => {
  const userId = req.user.userId;
  const {
    property_name,
    address,
    city,
    state,
    zip_code,
    property_type,
    purchase_price,
    purchase_date,
    current_value,
    bedrooms,
    bathrooms,
    square_feet,
    notes
  } = req.body;

  const id = uuidv4();

  db.run(
    `INSERT INTO investment_properties
     (id, user_id, property_name, address, city, state, zip_code, property_type,
      purchase_price, purchase_date, current_value, bedrooms, bathrooms, square_feet, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, userId, property_name, address, city, state, zip_code, property_type,
     purchase_price, purchase_date, current_value, bedrooms, bathrooms, square_feet, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, message: 'Property created successfully' });
    }
  );
});

// Update property
router.put('/:id', (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const {
    property_name,
    address,
    city,
    state,
    zip_code,
    property_type,
    purchase_price,
    purchase_date,
    current_value,
    bedrooms,
    bathrooms,
    square_feet,
    status,
    notes
  } = req.body;

  db.run(
    `UPDATE investment_properties
     SET property_name = ?, address = ?, city = ?, state = ?, zip_code = ?,
         property_type = ?, purchase_price = ?, purchase_date = ?, current_value = ?,
         bedrooms = ?, bathrooms = ?, square_feet = ?, status = ?, notes = ?,
         last_updated = CURRENT_TIMESTAMP
     WHERE id = ? AND user_id = ?`,
    [property_name, address, city, state, zip_code, property_type, purchase_price,
     purchase_date, current_value, bedrooms, bathrooms, square_feet, status, notes, id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }
      res.json({ message: 'Property updated successfully' });
    }
  );
});

// Delete property
router.delete('/:id', (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  db.run(
    'DELETE FROM investment_properties WHERE id = ? AND user_id = ?',
    [id, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Property not found' });
      }
      res.json({ message: 'Property deleted successfully' });
    }
  );
});

// ====================
// PROPERTY LOANS ROUTES
// ====================

// Get loans for a property
router.get('/:propertyId/loans', (req, res) => {
  const userId = req.user.userId;
  const { propertyId } = req.params;

  db.all(
    'SELECT * FROM property_loans WHERE property_id = ? AND user_id = ? ORDER BY created_at DESC',
    [propertyId, userId],
    (err, loans) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(loans);
    }
  );
});

// Add loan to property
router.post('/:propertyId/loans', (req, res) => {
  const userId = req.user.userId;
  const { propertyId } = req.params;
  const {
    lender_name,
    loan_type,
    original_amount,
    current_balance,
    interest_rate,
    monthly_payment,
    start_date,
    term_months,
    notes
  } = req.body;

  const id = uuidv4();

  db.run(
    `INSERT INTO property_loans
     (id, property_id, user_id, lender_name, loan_type, original_amount,
      current_balance, interest_rate, monthly_payment, start_date, term_months, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, propertyId, userId, lender_name, loan_type, original_amount,
     current_balance, interest_rate, monthly_payment, start_date, term_months, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, message: 'Loan added successfully' });
    }
  );
});

// Update loan
router.put('/:propertyId/loans/:loanId', (req, res) => {
  const userId = req.user.userId;
  const { propertyId, loanId } = req.params;
  const {
    lender_name,
    loan_type,
    original_amount,
    current_balance,
    interest_rate,
    monthly_payment,
    start_date,
    term_months,
    is_active,
    notes
  } = req.body;

  db.run(
    `UPDATE property_loans
     SET lender_name = ?, loan_type = ?, original_amount = ?, current_balance = ?,
         interest_rate = ?, monthly_payment = ?, start_date = ?, term_months = ?,
         is_active = ?, notes = ?, last_updated = CURRENT_TIMESTAMP
     WHERE id = ? AND property_id = ? AND user_id = ?`,
    [lender_name, loan_type, original_amount, current_balance, interest_rate,
     monthly_payment, start_date, term_months, is_active, notes, loanId, propertyId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Loan not found' });
      }
      res.json({ message: 'Loan updated successfully' });
    }
  );
});

// ====================
// RENTAL INCOME ROUTES
// ====================

// Get rental income for a property
router.get('/:propertyId/income', (req, res) => {
  const userId = req.user.userId;
  const { propertyId } = req.params;

  db.all(
    'SELECT * FROM rental_income WHERE property_id = ? AND user_id = ? ORDER BY payment_date DESC',
    [propertyId, userId],
    (err, income) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(income);
    }
  );
});

// Add rental income payment
router.post('/:propertyId/income', (req, res) => {
  const userId = req.user.userId;
  const { propertyId } = req.params;
  const {
    tenant_name,
    amount,
    payment_date,
    month_year,
    payment_method,
    notes
  } = req.body;

  const id = uuidv4();

  db.run(
    `INSERT INTO rental_income
     (id, property_id, user_id, tenant_name, amount, payment_date, month_year, payment_method, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, propertyId, userId, tenant_name, amount, payment_date, month_year, payment_method, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, message: 'Income recorded successfully' });
    }
  );
});

// ====================
// PROPERTY EXPENSES ROUTES
// ====================

// Get expenses for a property
router.get('/:propertyId/expenses', (req, res) => {
  const userId = req.user.userId;
  const { propertyId } = req.params;

  db.all(
    'SELECT * FROM property_expenses WHERE property_id = ? AND user_id = ? ORDER BY expense_date DESC',
    [propertyId, userId],
    (err, expenses) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(expenses);
    }
  );
});

// Add property expense
router.post('/:propertyId/expenses', (req, res) => {
  const userId = req.user.userId;
  const { propertyId } = req.params;
  const {
    expense_type,
    amount,
    expense_date,
    vendor,
    description,
    is_recurring
  } = req.body;

  const id = uuidv4();

  db.run(
    `INSERT INTO property_expenses
     (id, property_id, user_id, expense_type, amount, expense_date, vendor, description, is_recurring)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, propertyId, userId, expense_type, amount, expense_date, vendor, description, is_recurring],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, message: 'Expense recorded successfully' });
    }
  );
});

// ====================
// PROPERTY TENANTS ROUTES
// ====================

// Get tenants for a property
router.get('/:propertyId/tenants', (req, res) => {
  const userId = req.user.userId;
  const { propertyId } = req.params;

  db.all(
    'SELECT * FROM property_tenants WHERE property_id = ? AND user_id = ? ORDER BY is_active DESC, lease_start_date DESC',
    [propertyId, userId],
    (err, tenants) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json(tenants);
    }
  );
});

// Add tenant
router.post('/:propertyId/tenants', (req, res) => {
  const userId = req.user.userId;
  const { propertyId } = req.params;
  const {
    tenant_name,
    tenant_email,
    tenant_phone,
    monthly_rent,
    security_deposit,
    lease_start_date,
    lease_end_date,
    notes
  } = req.body;

  const id = uuidv4();

  db.run(
    `INSERT INTO property_tenants
     (id, property_id, user_id, tenant_name, tenant_email, tenant_phone,
      monthly_rent, security_deposit, lease_start_date, lease_end_date, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [id, propertyId, userId, tenant_name, tenant_email, tenant_phone,
     monthly_rent, security_deposit, lease_start_date, lease_end_date, notes],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.status(201).json({ id, message: 'Tenant added successfully' });
    }
  );
});

// Update tenant
router.put('/:propertyId/tenants/:tenantId', (req, res) => {
  const userId = req.user.userId;
  const { propertyId, tenantId } = req.params;
  const {
    tenant_name,
    tenant_email,
    tenant_phone,
    monthly_rent,
    security_deposit,
    lease_start_date,
    lease_end_date,
    is_active,
    notes
  } = req.body;

  db.run(
    `UPDATE property_tenants
     SET tenant_name = ?, tenant_email = ?, tenant_phone = ?,
         monthly_rent = ?, security_deposit = ?, lease_start_date = ?,
         lease_end_date = ?, is_active = ?, notes = ?
     WHERE id = ? AND property_id = ? AND user_id = ?`,
    [tenant_name, tenant_email, tenant_phone, monthly_rent, security_deposit,
     lease_start_date, lease_end_date, is_active, notes, tenantId, propertyId, userId],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      if (this.changes === 0) {
        return res.status(404).json({ error: 'Tenant not found' });
      }
      res.json({ message: 'Tenant updated successfully' });
    }
  );
});

// ====================
// ANALYTICS ROUTES
// ====================

// Get property financial summary
router.get('/:propertyId/summary', (req, res) => {
  const userId = req.user.userId;
  const { propertyId } = req.params;

  // Get total rental income (all time)
  db.get(
    'SELECT SUM(amount) as total_income FROM rental_income WHERE property_id = ? AND user_id = ?',
    [propertyId, userId],
    (err, incomeResult) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      }

      // Get total expenses (all time)
      db.get(
        'SELECT SUM(amount) as total_expenses FROM property_expenses WHERE property_id = ? AND user_id = ?',
        [propertyId, userId],
        (err, expenseResult) => {
          if (err) {
            return res.status(500).json({ error: err.message });
          }

          // Get current loan balance
          db.get(
            'SELECT SUM(current_balance) as total_loan_balance FROM property_loans WHERE property_id = ? AND user_id = ? AND is_active = 1',
            [propertyId, userId],
            (err, loanResult) => {
              if (err) {
                return res.status(500).json({ error: err.message });
              }

              const totalIncome = incomeResult.total_income || 0;
              const totalExpenses = expenseResult.total_expenses || 0;
              const netCashFlow = totalIncome - totalExpenses;
              const loanBalance = loanResult.total_loan_balance || 0;

              res.json({
                total_income: totalIncome,
                total_expenses: totalExpenses,
                net_cash_flow: netCashFlow,
                loan_balance: loanBalance
              });
            }
          );
        }
      );
    }
  );
});

module.exports = router;
