const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'financial.db');
const db = new sqlite3.Database(dbPath);

// Get the user
db.get('SELECT id, username FROM users LIMIT 1', [], (err, user) => {
  if (err || !user) {
    console.error('No user found');
    return;
  }

  const userId = user.id;
  console.log(`Testing API calculation for user: ${user.username}\n`);

  // Simulate the net worth API calculation
  const assetsQuery = `
    SELECT SUM(balance) as total FROM (
      SELECT balance FROM accounts WHERE user_id = ? AND type IN ('checking', 'savings')
      UNION ALL
      SELECT balance FROM retirement_accounts WHERE user_id = ?
      UNION ALL
      SELECT value as balance FROM assets WHERE user_id = ?
    )
  `;

  const liabilitiesQuery = `
    SELECT SUM(ABS(balance)) as total FROM accounts
    WHERE user_id = ? AND type IN ('credit_card', 'loan', 'mortgage', 'other_debt')
  `;

  db.get(assetsQuery, [userId, userId, userId], (err, assets) => {
    if (err) {
      console.error('Error:', err);
      return;
    }

    db.get(liabilitiesQuery, [userId], (err, liabilities) => {
      if (err) {
        console.error('Error:', err);
        return;
      }

      const totalAssets = assets?.total || 0;
      const totalLiabilities = liabilities?.total || 0;
      const netWorth = totalAssets - totalLiabilities;

      console.log('📊 Net Worth Calculation:');
      console.log(`   Total Assets: $${totalAssets.toFixed(2)}`);
      console.log(`   Total Liabilities: $${totalLiabilities.toFixed(2)}`);
      console.log(`   Net Worth: $${netWorth.toFixed(2)}\n`);

      // Test income calculation
      db.all('SELECT * FROM income_sources WHERE user_id = ? AND is_active = 1', [userId], (err, incomeSources) => {
        if (err) {
          console.error('Error:', err);
          return;
        }

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

        const totalMonthly = incomeSources.reduce((sum, s) => sum + calculateMonthly(s.amount, s.frequency), 0);

        console.log('💵 Income Calculation:');
        console.log(`   Total Monthly Income: $${totalMonthly.toFixed(2)}`);
        console.log(`   Active Sources: ${incomeSources.length}\n`);

        console.log('✅ These values should appear on the Wealth Growth page!');
        console.log('   If showing $0.00, it\'s likely an authentication issue.');

        db.close();
      });
    });
  });
});
