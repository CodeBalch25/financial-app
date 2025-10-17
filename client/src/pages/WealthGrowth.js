import React, { useState, useEffect } from 'react';
import { aiAPI, wealthAPI, incomeAPI } from '../services/api';
import { formatDollar } from '../utils/formatters';
import './WealthGrowth.css';

function WealthGrowth() {
  const [opportunities, setOpportunities] = useState([]);
  const [netWorth, setNetWorth] = useState(null);
  const [income, setIncome] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [netWorthRes, incomeRes, opportunitiesRes] = await Promise.all([
        wealthAPI.getNetWorth(),
        incomeAPI.getSummary(),
        aiAPI.getWealthGrowthOpportunities()
      ]);

      setNetWorth(netWorthRes.data);
      setIncome(incomeRes.data);
      setOpportunities(opportunitiesRes.data.opportunities || []);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateNewOpportunities = async () => {
    setGenerating(true);
    try {
      const response = await aiAPI.generateWealthGrowthPlan();
      setOpportunities(response.data.opportunities || []);
    } catch (error) {
      console.error('Error generating opportunities:', error);
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Analyzing your wealth growth potential...</div>
      </div>
    );
  }

  const categories = [
    { value: 'all', label: 'All Opportunities', icon: '🎯' },
    { value: 'investment', label: 'Investments', icon: '📈' },
    { value: 'business', label: 'Business', icon: '💼' },
    { value: 'passive', label: 'Passive Income', icon: '💰' },
    { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
    { value: 'skill', label: 'Skill Development', icon: '🎓' }
  ];

  const filteredOpportunities = selectedCategory === 'all'
    ? opportunities
    : opportunities.filter(opp => opp.category === selectedCategory);

  const getRiskColor = (risk) => {
    switch (risk) {
      case 'low': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'high': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getTimelineColor = (timeline) => {
    if (timeline.includes('Short')) return '#3b82f6';
    if (timeline.includes('Medium')) return '#8b5cf6';
    return '#ec4899';
  };

  return (
    <div className="container">
      <div className="wealth-growth-header">
        <div>
          <h1>
            <span className="wealth-growth-icon">💎</span>
            Wealth Growth Opportunities
          </h1>
          <p className="wealth-growth-subtitle">
            AI-powered strategies to multiply your wealth based on your financial profile
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={generateNewOpportunities}
          disabled={generating}
        >
          {generating ? 'Generating...' : '🔄 Generate New Plan'}
        </button>
      </div>

      {/* Financial Summary */}
      <div className="wealth-summary-cards">
        <div className="wealth-summary-card primary">
          <div className="wealth-summary-label">Current Net Worth</div>
          <div className="wealth-summary-value">{formatDollar(netWorth?.net_worth || 0)}</div>
          <div className="wealth-summary-sublabel">Total Assets - Liabilities</div>
        </div>
        <div className="wealth-summary-card">
          <div className="wealth-summary-label">Monthly Income</div>
          <div className="wealth-summary-value">{formatDollar(income?.total_monthly || 0)}</div>
          <div className="wealth-summary-sublabel">From {income?.active_sources_count || 0} sources</div>
        </div>
        <div className="wealth-summary-card success">
          <div className="wealth-summary-label">Growth Opportunities</div>
          <div className="wealth-summary-value">{opportunities.length}</div>
          <div className="wealth-summary-sublabel">Personalized for you</div>
        </div>
        <div className="wealth-summary-card info">
          <div className="wealth-summary-label">Potential Monthly Gain</div>
          <div className="wealth-summary-value">
            {formatDollar(opportunities.reduce((sum, opp) => sum + (opp.potential_monthly_gain || 0), 0))}
          </div>
          <div className="wealth-summary-sublabel">If implemented</div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="category-filter">
        {categories.map(cat => (
          <button
            key={cat.value}
            className={`category-filter-btn ${selectedCategory === cat.value ? 'active' : ''}`}
            onClick={() => setSelectedCategory(cat.value)}
          >
            <span className="category-icon">{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>

      {/* Opportunities Grid */}
      {filteredOpportunities.length === 0 ? (
        <div className="no-opportunities">
          <div className="no-opportunities-icon">🎯</div>
          <h3>No opportunities found</h3>
          <p>Click "Generate New Plan" to get AI-powered wealth growth strategies</p>
        </div>
      ) : (
        <div className="opportunities-grid">
          {filteredOpportunities.map((opp, index) => (
            <div key={index} className="opportunity-card">
              <div className="opportunity-header">
                <div className="opportunity-icon-circle" style={{ background: `linear-gradient(135deg, ${getRiskColor(opp.risk_level)}, ${getTimelineColor(opp.timeline)})` }}>
                  {opp.icon || '💡'}
                </div>
                <div className="opportunity-badges">
                  <span className="opportunity-badge risk" style={{ background: getRiskColor(opp.risk_level) }}>
                    {opp.risk_level} risk
                  </span>
                  <span className="opportunity-badge timeline" style={{ background: getTimelineColor(opp.timeline) }}>
                    {opp.timeline}
                  </span>
                </div>
              </div>

              <h3 className="opportunity-title">{opp.title}</h3>
              <p className="opportunity-description">{opp.description}</p>

              <div className="opportunity-metrics">
                <div className="opportunity-metric">
                  <div className="metric-label">Initial Investment</div>
                  <div className="metric-value">{formatDollar(opp.initial_investment || 0)}</div>
                </div>
                <div className="opportunity-metric">
                  <div className="metric-label">Potential Monthly Gain</div>
                  <div className="metric-value success">{formatDollar(opp.potential_monthly_gain || 0)}</div>
                </div>
                <div className="opportunity-metric">
                  <div className="metric-label">ROI</div>
                  <div className="metric-value">{opp.roi || 'N/A'}%</div>
                </div>
              </div>

              <div className="opportunity-steps">
                <h4>Action Steps:</h4>
                <ol>
                  {opp.action_steps?.map((step, idx) => (
                    <li key={idx}>{step}</li>
                  ))}
                </ol>
              </div>

              <div className="opportunity-why">
                <strong>Why this works for you:</strong>
                <p>{opp.personalization_reason}</p>
              </div>

              <div className="opportunity-footer">
                <button className="btn btn-primary btn-sm">
                  Start Planning
                </button>
                <button className="btn btn-outline btn-sm">
                  Learn More
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Strategy Insights */}
      <div className="strategy-insights">
        <h2>💡 Wealth Multiplication Strategy</h2>
        <div className="strategy-insights-grid">
          <div className="insight-card">
            <div className="insight-icon">🎯</div>
            <h3>Diversification</h3>
            <p>
              High-net-worth individuals diversify across multiple income streams.
              Aim for at least 3-5 different revenue sources to reduce risk and maximize growth.
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">📈</div>
            <h3>Leverage Your Assets</h3>
            <p>
              Use your existing net worth ({formatDollar(netWorth?.net_worth || 0)}) as leverage
              for investments, business opportunities, or passive income streams.
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">⚡</div>
            <h3>Compound Growth</h3>
            <p>
              Focus on opportunities that reinvest profits for exponential growth.
              Even small monthly gains compound significantly over time.
            </p>
          </div>
          <div className="insight-card">
            <div className="insight-icon">🧠</div>
            <h3>Knowledge Premium</h3>
            <p>
              High-value individuals invest in skills and knowledge that command premium prices.
              Specialized expertise can 10x your income potential.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default WealthGrowth;
