import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { budgetAPI, transactionsAPI, opportunitiesAPI } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { formatDollar, formatCurrency } from '../utils/formatters';
import AIInsights from '../components/AIInsights';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

function Dashboard() {
  const [overview, setOverview] = useState(null);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [overviewRes, transactionsRes, opportunitiesRes] = await Promise.all([
        budgetAPI.getOverview(),
        transactionsAPI.getAll({ limit: 5 }),
        opportunitiesAPI.getAll({ status: 'pending' }),
      ]);

      setOverview(overviewRes.data);
      setRecentTransactions(transactionsRes.data.slice(0, 5));
      setOpportunities(opportunitiesRes.data.slice(0, 5));
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  const chartData = overview?.categoryBreakdown?.map((cat, index) => ({
    name: cat.category,
    value: cat.total,
    color: COLORS[index % COLORS.length],
  })) || [];

  return (
    <div className="container">
      <h1>Dashboard</h1>

      {/* AI Insights Section */}
      <AIInsights />

      <div className="grid grid-3" style={{ marginTop: '24px' }}>
        <div className="stat-card income">
          <div className="stat-label">Total Income</div>
          <div className="stat-value">{formatDollar(overview?.income || 0)}</div>
          <div className="stat-label">This Month</div>
        </div>

        <div className="stat-card expense">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{formatDollar(overview?.expenses || 0)}</div>
          <div className="stat-label">This Month</div>
        </div>

        <div className={`stat-card ${overview?.balance >= 0 ? '' : 'warning'}`}>
          <div className="stat-label">Balance</div>
          <div className="stat-value">{formatDollar(overview?.balance || 0)}</div>
          <div className="stat-label">
            {overview?.balance >= 0 ? 'Surplus' : 'Deficit'}
          </div>
        </div>
      </div>

      <div className="grid grid-2" style={{ marginTop: '24px' }}>
        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Expense Breakdown</h2>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatDollar(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              No expense data for this month
            </p>
          )}
        </div>

        <div className="card">
          <h2 style={{ marginBottom: '20px' }}>Recent Transactions</h2>
          {recentTransactions.length > 0 ? (
            <>
              <table className="table">
                <tbody>
                  {recentTransactions.map((transaction) => (
                    <tr key={transaction.id}>
                      <td>
                        <strong>{transaction.category}</strong>
                        <br />
                        <small style={{ color: 'var(--text-secondary)' }}>
                          {new Date(transaction.date).toLocaleDateString()}
                        </small>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <span
                          style={{
                            color:
                              transaction.type === 'income'
                                ? 'var(--secondary-color)'
                                : 'var(--danger-color)',
                            fontWeight: '600',
                          }}
                        >
                          {transaction.type === 'income' ? '+' : '-'}{formatDollar(transaction.amount)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Link
                to="/transactions"
                style={{ display: 'block', marginTop: '16px', textAlign: 'center' }}
              >
                View all transactions
              </Link>
            </>
          ) : (
            <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
              No transactions yet. <Link to="/transactions">Add your first transaction</Link>
            </p>
          )}
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '20px' }}>Investment Opportunities</h2>
        {opportunities.length > 0 ? (
          <>
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Investment</th>
                  <th>Expected Return</th>
                  <th>Risk</th>
                </tr>
              </thead>
              <tbody>
                {opportunities.map((opp) => (
                  <tr key={opp.id}>
                    <td><strong>{opp.name}</strong></td>
                    <td>{opp.type}</td>
                    <td>{opp.initial_investment ? formatDollar(opp.initial_investment) : 'N/A'}</td>
                    <td>{opp.expected_return ? `${formatCurrency(opp.expected_return, 1)}%` : 'N/A'}</td>
                    <td>
                      <span
                        className={`badge ${
                          opp.risk_level === 'low'
                            ? 'badge-success'
                            : opp.risk_level === 'high'
                            ? 'badge-danger'
                            : 'badge-warning'
                        }`}
                      >
                        {opp.risk_level}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <Link
              to="/opportunities"
              style={{ display: 'block', marginTop: '16px', textAlign: 'center' }}
            >
              View all opportunities
            </Link>
          </>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)' }}>
            No pending opportunities. <Link to="/opportunities">Explore investment options</Link>
          </p>
        )}
      </div>
    </div>
  );
}

export default Dashboard;
