const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../financial.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database');
    initializeDatabase();
  }
});

function initializeDatabase() {
  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Transactions table
  db.run(`
    CREATE TABLE IF NOT EXISTS transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('income', 'expense')),
      amount REAL NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Budget goals table
  db.run(`
    CREATE TABLE IF NOT EXISTS budget_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL,
      monthly_limit REAL NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      UNIQUE(user_id, category)
    )
  `);

  // Investment opportunities table
  db.run(`
    CREATE TABLE IF NOT EXISTS opportunities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      initial_investment REAL,
      expected_return REAL,
      risk_level TEXT CHECK(risk_level IN ('low', 'medium', 'high')),
      time_horizon TEXT,
      status TEXT DEFAULT 'pending' CHECK(status IN ('pending', 'invested', 'completed', 'declined')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Savings goals table
  db.run(`
    CREATE TABLE IF NOT EXISTS savings_goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      target_amount REAL NOT NULL,
      current_amount REAL DEFAULT 0,
      deadline DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Accounts table (checking, savings, credit cards, loans)
  db.run(`
    CREATE TABLE IF NOT EXISTS accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('checking', 'savings', 'credit_card', 'loan', 'mortgage', 'other_debt')),
      balance REAL NOT NULL DEFAULT 0,
      credit_limit REAL,
      interest_rate REAL,
      due_date TEXT,
      institution TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Retirement accounts (401k, IRA, Roth IRA, etc.)
  db.run(`
    CREATE TABLE IF NOT EXISTS retirement_accounts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('401k', 'roth_401k', 'traditional_ira', 'roth_ira', 'sep_ira', 'pension', 'other')),
      balance REAL NOT NULL DEFAULT 0,
      contribution_amount REAL DEFAULT 0,
      contribution_frequency TEXT CHECK(contribution_frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),
      employer_match REAL,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Assets (real estate, vehicles, valuables)
  db.run(`
    CREATE TABLE IF NOT EXISTS assets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('real_estate', 'vehicle', 'jewelry', 'art', 'collectibles', 'business', 'other')),
      value REAL NOT NULL,
      purchase_price REAL,
      purchase_date DATE,
      notes TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Financial targets
  db.run(`
    CREATE TABLE IF NOT EXISTS financial_targets (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      category TEXT NOT NULL CHECK(category IN ('monthly_income', 'savings_rate', 'net_worth', 'debt_payoff', 'retirement', 'emergency_fund', 'custom')),
      name TEXT NOT NULL,
      target_value REAL NOT NULL,
      current_value REAL DEFAULT 0,
      target_date DATE,
      is_achieved INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Net worth snapshots (historical tracking)
  db.run(`
    CREATE TABLE IF NOT EXISTS net_worth_snapshots (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      total_assets REAL NOT NULL,
      total_liabilities REAL NOT NULL,
      net_worth REAL NOT NULL,
      snapshot_date DATE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Credit score tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS credit_scores (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      score INTEGER NOT NULL,
      bureau TEXT CHECK(bureau IN ('experian', 'equifax', 'transunion', 'vantage', 'other')),
      date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Recurring transactions (subscriptions, bills)
  db.run(`
    CREATE TABLE IF NOT EXISTS recurring_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'annually')),
      category TEXT NOT NULL,
      next_date DATE NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Income sources (multiple jobs and side businesses)
  db.run(`
    CREATE TABLE IF NOT EXISTS income_sources (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      source_name TEXT NOT NULL,
      source_type TEXT NOT NULL CHECK(source_type IN ('primary_job', 'secondary_job', 'side_business', 'freelance', 'rental', 'investments', 'other')),
      amount REAL NOT NULL,
      frequency TEXT NOT NULL CHECK(frequency IN ('weekly', 'biweekly', 'monthly', 'quarterly', 'annually', 'variable')),
      employer_company TEXT,
      is_active INTEGER DEFAULT 1,
      start_date DATE,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Bills tracking (electric, water, gas, HOA, etc.)
  db.run(`
    CREATE TABLE IF NOT EXISTS bills (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      bill_name TEXT NOT NULL,
      bill_type TEXT NOT NULL CHECK(bill_type IN ('electric', 'water', 'gas', 'internet', 'phone', 'hoa', 'insurance', 'subscription', 'other')),
      target_amount REAL NOT NULL,
      due_day INTEGER,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Bill payments tracking (monthly history)
  db.run(`
    CREATE TABLE IF NOT EXISTS bill_payments (
      id TEXT PRIMARY KEY,
      bill_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount_paid REAL NOT NULL,
      payment_date DATE NOT NULL,
      month_year TEXT NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (bill_id) REFERENCES bills(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Investment properties (rental properties, flips, etc.)
  db.run(`
    CREATE TABLE IF NOT EXISTS investment_properties (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      property_name TEXT NOT NULL,
      address TEXT NOT NULL,
      city TEXT,
      state TEXT,
      zip_code TEXT,
      property_type TEXT CHECK(property_type IN ('single_family', 'multi_family', 'condo', 'townhouse', 'land', 'commercial', 'other')),
      purchase_price REAL,
      purchase_date DATE,
      current_value REAL,
      bedrooms INTEGER,
      bathrooms REAL,
      square_feet INTEGER,
      status TEXT DEFAULT 'active' CHECK(status IN ('active', 'pending_sale', 'sold', 'inactive')),
      notes TEXT,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Property loans/mortgages
  db.run(`
    CREATE TABLE IF NOT EXISTS property_loans (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      lender_name TEXT NOT NULL,
      loan_type TEXT CHECK(loan_type IN ('conventional', 'fha', 'va', 'usda', 'commercial', 'hard_money', 'other')),
      original_amount REAL NOT NULL,
      current_balance REAL NOT NULL,
      interest_rate REAL NOT NULL,
      monthly_payment REAL NOT NULL,
      start_date DATE NOT NULL,
      term_months INTEGER,
      notes TEXT,
      is_active INTEGER DEFAULT 1,
      last_updated DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES investment_properties(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Rental income tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS rental_income (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      tenant_name TEXT,
      amount REAL NOT NULL,
      payment_date DATE NOT NULL,
      month_year TEXT NOT NULL,
      payment_method TEXT CHECK(payment_method IN ('cash', 'check', 'bank_transfer', 'venmo', 'paypal', 'other')),
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES investment_properties(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Property expenses (maintenance, taxes, insurance, HOA, utilities, etc.)
  db.run(`
    CREATE TABLE IF NOT EXISTS property_expenses (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      expense_type TEXT NOT NULL CHECK(expense_type IN ('property_tax', 'insurance', 'hoa', 'maintenance', 'repair', 'utilities', 'property_management', 'advertising', 'legal', 'accounting', 'other')),
      amount REAL NOT NULL,
      expense_date DATE NOT NULL,
      vendor TEXT,
      description TEXT,
      is_recurring INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES investment_properties(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  // Property tenants
  db.run(`
    CREATE TABLE IF NOT EXISTS property_tenants (
      id TEXT PRIMARY KEY,
      property_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      tenant_name TEXT NOT NULL,
      tenant_email TEXT,
      tenant_phone TEXT,
      monthly_rent REAL NOT NULL,
      security_deposit REAL,
      lease_start_date DATE NOT NULL,
      lease_end_date DATE,
      is_active INTEGER DEFAULT 1,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (property_id) REFERENCES investment_properties(id),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `);

  console.log('Database tables initialized');
}

module.exports = db;
