import React, { useState, useEffect } from 'react';
import { opportunitiesAPI } from '../services/api';
import { formatDollar, formatCurrency } from '../utils/formatters';

function Opportunities() {
  const [opportunities, setOpportunities] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingOpportunity, setEditingOpportunity] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    initial_investment: '',
    expected_return: '',
    risk_level: 'medium',
    time_horizon: '',
    status: 'pending',
    notes: '',
  });

  useEffect(() => {
    fetchOpportunities();
    fetchAnalytics();
  }, []);

  const fetchOpportunities = async () => {
    try {
      const response = await opportunitiesAPI.getAll();
      setOpportunities(response.data);
    } catch (error) {
      console.error('Error fetching opportunities:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await opportunitiesAPI.getAnalytics();
      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingOpportunity) {
        await opportunitiesAPI.update(editingOpportunity.id, formData);
      } else {
        await opportunitiesAPI.create(formData);
      }
      setShowModal(false);
      setEditingOpportunity(null);
      resetForm();
      fetchOpportunities();
      fetchAnalytics();
    } catch (error) {
      console.error('Error saving opportunity:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      description: '',
      initial_investment: '',
      expected_return: '',
      risk_level: 'medium',
      time_horizon: '',
      status: 'pending',
      notes: '',
    });
  };

  const handleEdit = (opportunity) => {
    setEditingOpportunity(opportunity);
    setFormData({
      name: opportunity.name,
      type: opportunity.type,
      description: opportunity.description || '',
      initial_investment: opportunity.initial_investment || '',
      expected_return: opportunity.expected_return || '',
      risk_level: opportunity.risk_level || 'medium',
      time_horizon: opportunity.time_horizon || '',
      status: opportunity.status || 'pending',
      notes: opportunity.notes || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this opportunity?')) {
      try {
        await opportunitiesAPI.delete(id);
        fetchOpportunities();
        fetchAnalytics();
      } catch (error) {
        console.error('Error deleting opportunity:', error);
      }
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  const statusCounts = analytics?.by_status?.reduce((acc, item) => {
    acc[item.status] = item.count;
    return acc;
  }, {}) || {};

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Investment Opportunities</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Opportunity
        </button>
      </div>

      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Pending</div>
          <div className="stat-value">{statusCounts.pending || 0}</div>
          <div className="stat-label">Opportunities</div>
        </div>

        <div className="stat-card income">
          <div className="stat-label">Invested</div>
          <div className="stat-value">{statusCounts.invested || 0}</div>
          <div className="stat-label">Active Investments</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Completed</div>
          <div className="stat-value">{statusCounts.completed || 0}</div>
          <div className="stat-label">Total</div>
        </div>
      </div>

      <div className="card">
        {opportunities.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Investment</th>
                <th>Expected Return</th>
                <th>Risk Level</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {opportunities.map((opp) => (
                <tr key={opp.id}>
                  <td>
                    <strong>{opp.name}</strong>
                    {opp.description && (
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {opp.description}
                      </div>
                    )}
                  </td>
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
                      {opp.risk_level || 'N/A'}
                    </span>
                  </td>
                  <td>
                    <span
                      className={`badge ${
                        opp.status === 'invested'
                          ? 'badge-info'
                          : opp.status === 'completed'
                          ? 'badge-success'
                          : opp.status === 'declined'
                          ? 'badge-danger'
                          : 'badge-warning'
                      }`}
                    >
                      {opp.status}
                    </span>
                  </td>
                  <td>
                    <button
                      className="btn btn-outline"
                      style={{ marginRight: '8px', padding: '4px 12px' }}
                      onClick={() => handleEdit(opp)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 12px' }}
                      onClick={() => handleDelete(opp.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No investment opportunities yet. Click "Add Opportunity" to track potential investments.
          </p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingOpportunity ? 'Edit Opportunity' : 'Add Opportunity'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingOpportunity(null);
                  resetForm();
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Name *</label>
                <input
                  type="text"
                  name="name"
                  className="input"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Index Fund Investment"
                />
              </div>

              <div className="form-group">
                <label className="label">Type *</label>
                <input
                  type="text"
                  name="type"
                  className="input"
                  value={formData.type}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Stocks, Real Estate, Crypto"
                />
              </div>

              <div className="form-group">
                <label className="label">Description</label>
                <textarea
                  name="description"
                  className="input"
                  value={formData.description}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Brief description of the opportunity"
                />
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="label">Initial Investment ($)</label>
                  <input
                    type="number"
                    name="initial_investment"
                    className="input"
                    value={formData.initial_investment}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Expected Return (%)</label>
                  <input
                    type="number"
                    name="expected_return"
                    className="input"
                    value={formData.expected_return}
                    onChange={handleChange}
                    step="0.1"
                  />
                </div>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="label">Risk Level</label>
                  <select
                    name="risk_level"
                    className="input"
                    value={formData.risk_level}
                    onChange={handleChange}
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="label">Status</label>
                  <select
                    name="status"
                    className="input"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    <option value="pending">Pending</option>
                    <option value="invested">Invested</option>
                    <option value="completed">Completed</option>
                    <option value="declined">Declined</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Time Horizon</label>
                <input
                  type="text"
                  name="time_horizon"
                  className="input"
                  value={formData.time_horizon}
                  onChange={handleChange}
                  placeholder="e.g., 1 year, 5 years, Long-term"
                />
              </div>

              <div className="form-group">
                <label className="label">Notes</label>
                <textarea
                  name="notes"
                  className="input"
                  value={formData.notes}
                  onChange={handleChange}
                  rows="3"
                  placeholder="Additional notes or considerations"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingOpportunity ? 'Update' : 'Add'} Opportunity
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowModal(false);
                    setEditingOpportunity(null);
                    resetForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Opportunities;
