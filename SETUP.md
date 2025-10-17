# Financial Growth Tracker - Setup Guide

## Quick Start

Follow these steps to get your financial management application up and running.

### Prerequisites

Make sure you have the following installed:
- **Node.js** (version 14 or higher) - [Download here](https://nodejs.org/)
- **npm** (comes with Node.js)

To verify your installation, run:
```bash
node --version
npm --version
```

### Step 1: Environment Setup

1. Navigate to the project directory:
   ```bash
   cd C:\Users\timud\Documents\financial-app
   ```

2. Copy the example environment file and configure it:
   ```bash
   copy .env.example .env
   ```

3. Open `.env` and update the JWT_SECRET (important for security):
   ```
   PORT=5000
   JWT_SECRET=your_unique_secret_key_here_make_it_long_and_random
   NODE_ENV=development
   ```

### Step 2: Install Dependencies

Install all dependencies for both backend and frontend:

```bash
npm run install-all
```

This will:
- Install backend dependencies in the root folder
- Install frontend dependencies in the `client` folder

### Step 3: Run the Application

Start both the backend server and frontend in development mode:

```bash
npm run dev
```

This command will:
- Start the Express backend server on `http://localhost:5000`
- Start the React frontend development server on `http://localhost:3000`
- Automatically open your browser to the application

### Step 4: Create Your Account

1. Open your browser to `http://localhost:3000`
2. Click "Register here" to create a new account
3. Fill in your username, email, and password
4. Start tracking your finances!

## Alternative: Run Backend and Frontend Separately

If you prefer to run the servers separately:

### Backend Only
```bash
npm run server
```

### Frontend Only
```bash
npm run client
```

## Building for Production

To create a production build of the frontend:

```bash
npm run build
```

This creates an optimized build in the `client/build` folder.

## Troubleshooting

### Port Already in Use

If you see an error about port 5000 or 3000 being in use:

1. Change the PORT in `.env` file for the backend
2. The frontend will automatically proxy to the new backend port

### Database Issues

The application uses SQLite, which creates a `financial.db` file automatically. If you encounter database issues:

1. Stop the application
2. Delete the `financial.db` file
3. Restart the application - it will recreate the database

### Module Not Found Errors

If you see "Module not found" errors:

```bash
# Reinstall dependencies
rm -rf node_modules client/node_modules
npm run install-all
```

## Next Steps

Once the application is running:

1. **Add Transactions**: Track your income and expenses
2. **View Budget Analysis**: See spending patterns and get savings suggestions
3. **Track Opportunities**: Monitor potential investment opportunities
4. **Review Dashboard**: Get an overview of your financial health

## Support

For issues or questions, refer to the main README.md file for API documentation and features.
