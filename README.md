# Timu Financial Growth Tracker

A full-stack AI-powered application to help you budget your finances and discover opportunities to grow your money.

## Features

- **Budget Tracking**: Track income, expenses, and savings goals
- **Multiple Income Streams**: Track income from multiple jobs and side businesses
- **Bills Management**: Track monthly bills with trending analysis and target vs actual comparison
- **Wealth Management**: Monitor net worth, 401k, savings, credit cards, assets, and credit score
- **Investment Opportunities**: Track and analyze potential investment opportunities
- **Financial Analytics**: Visualize your spending patterns and growth potential with beautiful charts
- **AI Financial Insights**: Get personalized AI-powered recommendations based on your financial data
- **AI Chat Assistant**: Ask questions about your finances in natural language
- **Goal Setting**: Set and monitor financial goals
- **Savings Insights**: Get recommendations on where you can save money

## Tech Stack

- **Frontend**: React with modern hooks
- **Backend**: Node.js with Express
- **Database**: SQLite (easily upgradeable to PostgreSQL)
- **Authentication**: JWT-based auth

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Copy `.env.example` to `.env` and update the values:
   ```bash
   cp .env.example .env
   ```
2. Install all dependencies:
   ```bash
   npm run install-all
   ```

### Running the Application

Start both frontend and backend in development mode:
```bash
npm run dev
```

- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

### Building for Production

```bash
npm run build
```

## Project Structure

```
timu-financial-growth-tracker/
├── client/                 # React frontend
│   ├── public/
│   └── src/
│       ├── components/     # Reusable components
│       ├── pages/          # Page components
│       ├── services/       # API services
│       └── App.js
├── server/                 # Express backend
│   ├── routes/            # API routes
│   ├── models/            # Database models
│   ├── middleware/        # Custom middleware
│   └── index.js
└── package.json
```

## API Endpoints

### Authentication
- POST `/api/auth/register` - Register new user
- POST `/api/auth/login` - Login user

### Transactions
- GET `/api/transactions` - Get all transactions
- POST `/api/transactions` - Create transaction
- PUT `/api/transactions/:id` - Update transaction
- DELETE `/api/transactions/:id` - Delete transaction

### Budget
- GET `/api/budget` - Get budget overview
- POST `/api/budget/goals` - Set budget goals
- GET `/api/budget/analysis` - Get budget analysis

### Opportunities
- GET `/api/opportunities` - Get investment opportunities
- POST `/api/opportunities` - Add opportunity
- PUT `/api/opportunities/:id` - Update opportunity
- DELETE `/api/opportunities/:id` - Delete opportunity

## License

MIT
