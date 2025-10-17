const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Import routes
const authRoutes = require('./routes/auth');
const transactionRoutes = require('./routes/transactions');
const budgetRoutes = require('./routes/budget');
const opportunityRoutes = require('./routes/opportunities');
const wealthRoutes = require('./routes/wealth');
const incomeRoutes = require('./routes/income');
const billsRoutes = require('./routes/bills');
const aiRoutes = require('./routes/ai');
const propertiesRoutes = require('./routes/properties');

// Initialize database
const db = require('./models/database');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/opportunities', opportunityRoutes);
app.use('/api/wealth', wealthRoutes);
app.use('/api/income', incomeRoutes);
app.use('/api/bills', billsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/properties', propertiesRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Timu Financial Growth Tracker API is running' });
});

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!', message: err.message });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
});
