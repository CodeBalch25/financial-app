import React, { useState, useEffect } from 'react';
import { aiAPI } from '../services/api';
import './AIInsights.css';

function AIInsights() {
  const [insights, setInsights] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchInsights();
  }, []);

  const fetchInsights = async () => {
    try {
      const response = await aiAPI.getInsights();
      setInsights(response.data.insights || []);
      setSummary(response.data.summary || {});
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="ai-insights-loading">
        <div className="loading">Loading AI insights...</div>
      </div>
    );
  }

  const getInsightIcon = (type) => {
    switch (type) {
      case 'warning':
        return '⚠️';
      case 'success':
        return '✅';
      case 'info':
        return 'ℹ️';
      default:
        return '💡';
    }
  };

  const getInsightClass = (type) => {
    switch (type) {
      case 'warning':
        return 'ai-insight-warning';
      case 'success':
        return 'ai-insight-success';
      case 'info':
        return 'ai-insight-info';
      default:
        return 'ai-insight-default';
    }
  };

  const displayedInsights = showAll ? insights : insights.slice(0, 3);

  return (
    <div className="ai-insights-container">
      <div className="ai-insights-header">
        <div>
          <h2>
            <span className="ai-badge">AI</span> Financial Insights
          </h2>
          <p className="ai-insights-subtitle">
            Personalized recommendations based on your financial data
          </p>
        </div>
        <button
          className="btn btn-outline btn-sm"
          onClick={fetchInsights}
          title="Refresh insights"
        >
          Refresh
        </button>
      </div>

      {summary && (
        <div className="ai-insights-summary">
          <div className="ai-summary-stat">
            <div className="ai-summary-value">{summary.totalInsights || 0}</div>
            <div className="ai-summary-label">Total Insights</div>
          </div>
          <div className="ai-summary-stat warning">
            <div className="ai-summary-value">{summary.warnings || 0}</div>
            <div className="ai-summary-label">Warnings</div>
          </div>
          <div className="ai-summary-stat success">
            <div className="ai-summary-value">{summary.positive || 0}</div>
            <div className="ai-summary-label">Positive</div>
          </div>
          <div className="ai-summary-stat high">
            <div className="ai-summary-value">{summary.highPriority || 0}</div>
            <div className="ai-summary-label">High Priority</div>
          </div>
        </div>
      )}

      {insights.length === 0 ? (
        <div className="ai-insights-empty">
          <p>No insights available yet.</p>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
            Add more transactions and financial data to get personalized insights.
          </p>
        </div>
      ) : (
        <>
          <div className="ai-insights-list">
            {displayedInsights.map((insight, index) => (
              <div
                key={index}
                className={`ai-insight-card ${getInsightClass(insight.type)}`}
              >
                <div className="ai-insight-header">
                  <div className="ai-insight-icon">{getInsightIcon(insight.type)}</div>
                  <div className="ai-insight-title-section">
                    <h3 className="ai-insight-title">{insight.title}</h3>
                    <span className={`ai-insight-badge ${insight.impact}`}>
                      {insight.impact === 'high' && '🔴 High Priority'}
                      {insight.impact === 'medium' && '🟡 Medium'}
                      {insight.impact === 'positive' && '🟢 Positive'}
                    </span>
                  </div>
                </div>
                <p className="ai-insight-message">{insight.message}</p>
                <div className="ai-insight-recommendation">
                  <strong>💡 Recommendation:</strong> {insight.recommendation}
                </div>
                <div className="ai-insight-category">
                  Category: <span>{insight.category}</span>
                </div>
              </div>
            ))}
          </div>

          {insights.length > 3 && (
            <div style={{ textAlign: 'center', marginTop: '16px' }}>
              <button
                className="btn btn-outline"
                onClick={() => setShowAll(!showAll)}
              >
                {showAll ? 'Show Less' : `Show All (${insights.length - 3} more)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default AIInsights;
