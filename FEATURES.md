# Financial Growth Tracker - Features Guide

## Overview

This application helps you manage your finances, track spending, and identify opportunities to grow your money through better budgeting and investment tracking.

---

## Core Features

### 1. Dashboard

**Overview of Your Financial Health**

The dashboard provides a quick snapshot of your current financial situation:

- **Monthly Summary**: View total income, expenses, and balance for the current month
- **Expense Breakdown**: Visual pie chart showing spending by category
- **Recent Transactions**: Quick access to your latest financial activities
- **Pending Opportunities**: Investment opportunities awaiting your decision

**How to Use:**
- The dashboard automatically updates as you add transactions and opportunities
- Click on any section to navigate to detailed views
- Charts are interactive - hover for detailed information

---

### 2. Transaction Management

**Track Every Dollar In and Out**

Record all your financial transactions in one place:

**Features:**
- Add income and expense transactions
- Categorize transactions (groceries, salary, rent, entertainment, etc.)
- Add descriptions and dates for better organization
- Edit or delete transactions as needed
- View complete transaction history

**How to Add a Transaction:**
1. Go to Transactions page
2. Click "Add Transaction"
3. Select type (Income or Expense)
4. Enter amount, category, and date
5. Add optional description
6. Click "Add Transaction"

**Best Practices:**
- Be consistent with category names (e.g., always use "Groceries" not sometimes "Food")
- Add transactions regularly for accurate tracking
- Use descriptive categories to get better insights

---

### 3. Budget Analysis

**Understand Your Spending Patterns**

Get intelligent insights about where your money goes:

**Features:**
- **Spending Overview**: See total income, expenses, and savings rate
- **Category Breakdown**: Bar chart visualization of spending by category
- **Savings Rate**: Track how much you're saving (goal: 20%)
- **Smart Suggestions**: AI-powered recommendations to save money

**Savings Insights:**

The system automatically identifies:

1. **High Spending Categories**: Alerts when a category exceeds 30% of income
2. **Subscription Bloat**: Detects many small recurring transactions
3. **Savings Goals**: Compares your savings rate to the recommended 20% (50/30/20 rule)

**Example Suggestions:**
- "Entertainment spending is 35% of your income. Consider reducing by 10-15%."
- "You have 15 small transactions in Subscriptions. Review for unused subscriptions."
- "Aim to save 20% of income ($800). Currently saving $500."

**How to Use Budget Analysis:**
1. Add transactions throughout the month
2. Visit the Budget page to see analysis
3. Review suggestions for potential savings
4. Track your savings rate progress

---

### 4. Investment Opportunities

**Track and Evaluate Growth Opportunities**

Monitor potential ways to grow your wealth:

**Features:**
- Add investment opportunities you're considering
- Track investment type (stocks, real estate, crypto, etc.)
- Record expected returns and risk levels
- Monitor status (pending, invested, completed, declined)
- Add notes and time horizons

**Opportunity Details:**
- **Name**: What is this opportunity?
- **Type**: Stocks, bonds, real estate, business, crypto, etc.
- **Initial Investment**: How much money is required?
- **Expected Return**: Anticipated return percentage
- **Risk Level**: Low, medium, or high risk
- **Time Horizon**: Short-term or long-term investment
- **Status**: Track your decision and progress

**How to Add an Opportunity:**
1. Go to Opportunities page
2. Click "Add Opportunity"
3. Fill in the details:
   - Name and type
   - Investment amount and expected return
   - Risk level and time horizon
   - Status and notes
4. Click "Add Opportunity"

**Example Opportunities:**
- **S&P 500 Index Fund**: Type: Stocks, Investment: $5,000, Return: 10%, Risk: Low
- **Rental Property**: Type: Real Estate, Investment: $50,000, Return: 8%, Risk: Medium
- **Side Business**: Type: Business, Investment: $2,000, Return: 50%, Risk: High

**Status Tracking:**
- **Pending**: You're evaluating this opportunity
- **Invested**: You've committed funds
- **Completed**: Investment has concluded
- **Declined**: You decided not to pursue it

---

## How the Features Work Together

### Monthly Financial Workflow

**Week 1-4: Track Transactions**
- Add income when received
- Record expenses as they occur
- Keep categories consistent

**End of Month: Analyze Budget**
- Review spending breakdown
- Check savings rate
- Read savings suggestions
- Identify areas to reduce spending

**Ongoing: Evaluate Opportunities**
- Research investment options
- Add opportunities to track
- Compare risk vs. return
- Make informed decisions

**Result: Financial Growth**
- Better spending habits
- Increased savings
- Smart investment decisions
- Improved financial health

---

## Key Metrics Explained

### Savings Rate
**Formula**: (Income - Expenses) / Income × 100

**Target**: 20% or higher (based on 50/30/20 rule)
- 50% for needs (housing, food, utilities)
- 30% for wants (entertainment, dining out)
- 20% for savings and debt repayment

### Category Percentage
**Formula**: Category Spending / Total Income × 100

**Guidelines**:
- **Green (Good)**: Under 20% of income
- **Yellow (Warning)**: 20-30% of income
- **Red (High)**: Over 30% of income

### Expected Return (ROI)
**Formula**: (Expected Gain / Initial Investment) × 100

Higher returns typically mean higher risk. Diversification is key.

---

## Tips for Maximum Value

1. **Be Consistent**: Add transactions daily or weekly
2. **Use Clear Categories**: Consistent naming helps analysis
3. **Review Monthly**: Check budget analysis at month's end
4. **Set Goals**: Track progress toward savings targets
5. **Research Opportunities**: Use the app to compare and track potential investments
6. **Act on Suggestions**: The budget analysis provides actionable advice

---

## Privacy & Security

- All data is stored locally on your machine in a SQLite database
- Passwords are hashed using bcrypt
- JWT tokens secure API requests
- No data is shared with third parties

---

## Getting the Most Out of Your Financial Tracker

**First Week:**
- Set up your account
- Add all your regular income sources
- Record past month's major expenses
- Add any current investment opportunities

**First Month:**
- Build the habit of daily transaction logging
- Explore all features
- Review your first budget analysis

**Ongoing:**
- Check dashboard weekly
- Review budget monthly
- Update opportunity statuses
- Track your financial progress over time

Your financial growth journey starts now!
