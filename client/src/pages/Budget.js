import React, { useState, useEffect } from 'react';
import { budgetAPI } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatDollar } from '../utils/formatters';

function Budget() {
  const [analysis, setAnalysis] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const fetchBudgetData = async () => {
    try {
      const [analysisRes, overviewRes] = await Promise.all([
        budgetAPI.getAnalysis(),
        budgetAPI.getOverview(),
      ]);
      setAnalysis(analysisRes.data);
      setOverview(overviewRes.data);
    } catch (error) {
      console.error('Error fetching budget data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  const chartData = analysis?.expenses?.map((exp) => ({
    category: exp.category,
    amount: exp.total,
    transactions: exp.transaction_count,
  })) || [];

  return (
    <div className="container">
      <h1>Budget Analysis</h1>

      <div className="grid grid-3" style={{ marginTop: '24px' }}>
        <div className="stat-card income">
          <div className="stat-label">Total Income</div>
          <div className="stat-value">{formatDollar(analysis?.total_income || 0)}</div>
          <div className="stat-label">This Month</div>
        </div>

        <div className="stat-card expense">
          <div className="stat-label">Total Expenses</div>
          <div className="stat-value">{formatDollar(analysis?.total_expenses || 0)}</div>
          <div className="stat-label">This Month</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Savings Rate</div>
          <div className="stat-value">{analysis?.savings_rate || '0'}%</div>
          <div className="stat-label">Target: 20%</div>
        </div>
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '20px' }}>Spending by Category</h2>
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" />
              <YAxis />
              <Tooltip formatter={(value) => formatDollar(value)} />
              <Legend />
              <Bar dataKey="amount" fill="#2563eb" name="Amount ($)" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            No expense data available for this month
          </p>
        )}
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '20px' }}>
          Savings Opportunities
          {analysis?.total_potential_savings > 0 && (
            <span style={{ color: 'var(--secondary-color)', fontSize: '18px', marginLeft: '12px' }}>
              Potential savings: {formatDollar(analysis.total_potential_savings)}
            </span>
          )}
        </h2>

        {analysis?.suggestions?.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {analysis.suggestions.map((suggestion, index) => (
              <div
                key={index}
                className={`alert ${
                  suggestion.type === 'high_spending'
                    ? 'alert-error'
                    : suggestion.type === 'savings_goal'
                    ? 'alert-info'
                    : 'alert-success'
                }`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start' }}>
                  <div>
                    <strong style={{ display: 'block', marginBottom: '4px' }}>
                      {suggestion.category.charAt(0).toUpperCase() + suggestion.category.slice(1)}
                    </strong>
                    <p style={{ margin: 0 }}>{suggestion.message}</p>
                  </div>
                  {suggestion.potential_savings > 0 && (
                    <div
                      style={{
                        background: 'rgba(255, 255, 255, 0.5)',
                        padding: '8px 16px',
                        borderRadius: '6px',
                        marginLeft: '16px',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      <strong>{formatDollar(suggestion.potential_savings)}</strong>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="alert alert-success">
            <p style={{ margin: 0 }}>
              Great job! Your spending patterns look healthy. Keep up the good work!
            </p>
          </div>
        )}
      </div>

      <div className="card" style={{ marginTop: '24px' }}>
        <h2 style={{ marginBottom: '20px' }}>Category Details</h2>
        {analysis?.expenses?.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Category</th>
                <th>Total Spent</th>
                <th>Transactions</th>
                <th>Avg per Transaction</th>
                <th>% of Income</th>
              </tr>
            </thead>
            <tbody>
              {analysis.expenses.map((exp) => {
                const percentage = (exp.total / analysis.total_income) * 100;
                return (
                  <tr key={exp.category}>
                    <td><strong>{exp.category}</strong></td>
                    <td>{formatDollar(exp.total)}</td>
                    <td>{exp.transaction_count}</td>
                    <td>{formatDollar(exp.avg_transaction)}</td>
                    <td>
                      <span
                        className={`badge ${
                          percentage > 30
                            ? 'badge-danger'
                            : percentage > 20
                            ? 'badge-warning'
                            : 'badge-success'
                        }`}
                      >
                        {percentage.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
            No expense data available
          </p>
        )}
      </div>
    </div>
  );
}

export default Budget;
