const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, 'financial.db');
const db = new sqlite3.Database(dbPath);

console.log('Checking database data...\n');

// Check users
db.all('SELECT id, username FROM users', [], (err, users) => {
  if (err) {
    console.error('Error fetching users:', err);
    return;
  }
  console.log('👤 Users:', users.length);
  users.forEach(u => console.log(`   - ${u.username} (${u.id})`));

  if (users.length === 0) {
    console.log('\n⚠️ No users found! You need to register first.');
    db.close();
    return;
  }

  const userId = users[0].id;
  console.log(`\n📊 Checking data for user: ${users[0].username}\n`);

  // Check accounts
  db.all('SELECT * FROM accounts WHERE user_id = ?', [userId], (err, accounts) => {
    console.log('💰 Accounts:', accounts ? accounts.length : 0);
    if (accounts && accounts.length > 0) {
      accounts.forEach(a => console.log(`   - ${a.name} (${a.type}): $${a.balance}`));
    }
  });

  // Check income sources
  db.all('SELECT * FROM income_sources WHERE user_id = ?', [userId], (err, income) => {
    console.log('\n💵 Income Sources:', income ? income.length : 0);
    if (income && income.length > 0) {
      income.forEach(i => console.log(`   - ${i.source_name} (${i.source_type}): $${i.amount} ${i.frequency}`));
    }
  });

  // Check retirement
  db.all('SELECT * FROM retirement_accounts WHERE user_id = ?', [userId], (err, retirement) => {
    console.log('\n🏦 Retirement Accounts:', retirement ? retirement.length : 0);
    if (retirement && retirement.length > 0) {
      retirement.forEach(r => console.log(`   - ${r.name} (${r.type}): $${r.balance}`));
    }
  });

  // Check assets
  db.all('SELECT * FROM assets WHERE user_id = ?', [userId], (err, assets) => {
    console.log('\n🏠 Assets:', assets ? assets.length : 0);
    if (assets && assets.length > 0) {
      assets.forEach(a => console.log(`   - ${a.name} (${a.type}): $${a.value}`));
    }

    // Close after last query
    setTimeout(() => {
      console.log('\n✅ Database check complete!');
      db.close();
    }, 100);
  });
});
