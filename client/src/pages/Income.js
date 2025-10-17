import React, { useState, useEffect } from 'react';
import { incomeAPI } from '../services/api';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { formatDollar } from '../utils/formatters';

const COLORS = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

function Income() {
  const [incomeSources, setIncomeSources] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingSource, setEditingSource] = useState(null);

  const [formData, setFormData] = useState({
    source_name: '',
    source_type: 'primary_job',
    amount: '',
    frequency: 'monthly',
    employer_company: '',
    is_active: true,
    start_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchIncomeData();
  }, []);

  const fetchIncomeData = async () => {
    try {
      const [sourcesRes, summaryRes] = await Promise.all([
        incomeAPI.getAll({ is_active: 'true' }),
        incomeAPI.getSummary()
      ]);

      setIncomeSources(sourcesRes.data);
      setSummary(summaryRes.data);
    } catch (error) {
      console.error('Error fetching income data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingSource) {
        await incomeAPI.update(editingSource.id, formData);
      } else {
        await incomeAPI.create(formData);
      }
      setShowModal(false);
      setEditingSource(null);
      resetForm();
      fetchIncomeData();
    } catch (error) {
      console.error('Error saving income source:', error);
      alert('Error saving income source. Please try again.');
    }
  };

  const handleEdit = (source) => {
    setEditingSource(source);
    setFormData({
      source_name: source.source_name,
      source_type: source.source_type,
      amount: source.amount,
      frequency: source.frequency,
      employer_company: source.employer_company || '',
      is_active: source.is_active === 1,
      start_date: source.start_date || '',
      notes: source.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this income source?')) {
      try {
        await incomeAPI.delete(id);
        fetchIncomeData();
      } catch (error) {
        console.error('Error deleting income source:', error);
      }
    }
  };

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({
      ...formData,
      [e.target.name]: value
    });
  };

  const resetForm = () => {
    setFormData({
      source_name: '',
      source_type: 'primary_job',
      amount: '',
      frequency: 'monthly',
      employer_company: '',
      is_active: true,
      start_date: '',
      notes: ''
    });
  };

  const getSourceTypeLabel = (type) => {
    const labels = {
      'primary_job': 'Primary Job',
      'secondary_job': 'Secondary Job',
      'side_business': 'Side Business',
      'freelance': 'Freelance',
      'rental': 'Rental Income',
      'investments': 'Investments',
      'other': 'Other'
    };
    return labels[type] || type;
  };

  const getFrequencyLabel = (freq) => {
    const labels = {
      'weekly': 'Weekly',
      'biweekly': 'Bi-weekly',
      'monthly': 'Monthly',
      'quarterly': 'Quarterly',
      'annually': 'Annually',
      'variable': 'Variable'
    };
    return labels[freq] || freq;
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading income data...</div></div>;
  }

  // Prepare chart data
  const pieChartData = summary?.by_type?.map((item, index) => ({
    name: getSourceTypeLabel(item.type),
    value: item.monthly,
    color: COLORS[index % COLORS.length]
  })) || [];

  const barChartData = summary?.by_source?.map(source => ({
    name: source.name.length > 15 ? source.name.substring(0, 15) + '...' : source.name,
    monthly: source.monthly,
    annual: source.annual
  })) || [];

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Income Streams</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Income Source
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        <div className="stat-card income">
          <div className="stat-label">Total Monthly Income</div>
          <div className="stat-value">{formatDollar(summary?.total_monthly || 0)}</div>
          <div className="stat-label">From {summary?.active_sources_count || 0} Sources</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Total Annual Income</div>
          <div className="stat-value">{formatDollar(summary?.total_annual || 0)}</div>
          <div className="stat-label">Projected</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Average Per Source</div>
          <div className="stat-value">
            {formatDollar(summary && summary.active_sources_count > 0
              ? summary.total_monthly / summary.active_sources_count
              : 0)}
          </div>
          <div className="stat-label">Monthly</div>
        </div>
      </div>

      {/* Charts */}
      {summary && summary.by_source && summary.by_source.length > 0 && (
        <div className="grid grid-2" style={{ marginBottom: '24px' }}>
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Income by Type</h2>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => formatDollar(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Monthly Income by Source</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={barChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip formatter={(value) => formatDollar(value)} />
                <Legend />
                <Bar dataKey="monthly" fill="#10b981" name="Monthly Income" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Income Breakdown by Type */}
      {summary && summary.by_type && summary.by_type.length > 0 && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '20px' }}>Income Breakdown by Type</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {summary.by_type.map((typeData, index) => (
              <div
                key={typeData.type}
                style={{
                  padding: '16px',
                  background: 'var(--bg-color)',
                  borderRadius: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: COLORS[index % COLORS.length]
                      }}
                    ></div>
                    <strong>{getSourceTypeLabel(typeData.type)}</strong>
                    <span className="badge badge-info">{typeData.count} source{typeData.count !== 1 ? 's' : ''}</span>
                  </div>
                  <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginLeft: '24px' }}>
                    {formatDollar(typeData.annual)} annually
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '24px', fontWeight: '600', color: 'var(--secondary-color)' }}>
                    {formatDollar(typeData.monthly)}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>per month</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Income Sources Table */}
      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>All Income Sources</h2>
        {incomeSources.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Source Name</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Frequency</th>
                <th>Monthly</th>
                <th>Annual</th>
                <th>Employer/Company</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {incomeSources.map((source) => {
                const sourceData = summary?.by_source?.find(s => s.id === source.id);
                return (
                  <tr key={source.id}>
                    <td>
                      <strong>{source.source_name}</strong>
                      {source.start_date && (
                        <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                          Since {new Date(source.start_date).toLocaleDateString()}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className="badge badge-info">{getSourceTypeLabel(source.source_type)}</span>
                    </td>
                    <td style={{ fontWeight: '600' }}>{formatDollar(source.amount)}</td>
                    <td>{getFrequencyLabel(source.frequency)}</td>
                    <td style={{ color: 'var(--secondary-color)', fontWeight: '600' }}>
                      {formatDollar(sourceData?.monthly || 0)}
                    </td>
                    <td>{formatDollar(sourceData?.annual || 0)}</td>
                    <td>{source.employer_company || '-'}</td>
                    <td>
                      <button
                        className="btn btn-outline"
                        style={{ marginRight: '8px', padding: '4px 12px' }}
                        onClick={() => handleEdit(source)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-danger"
                        style={{ padding: '4px 12px' }}
                        onClick={() => handleDelete(source.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No income sources added yet.</p>
            <p>Click "Add Income Source" to track your jobs and side businesses!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingSource ? 'Edit Income Source' : 'Add Income Source'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingSource(null);
                  resetForm();
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Source Name *</label>
                <input
                  type="text"
                  name="source_name"
                  className="input"
                  value={formData.source_name}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Main Job at ABC Corp, Turo Business, Freelance Consulting"
                />
              </div>

              <div className="form-group">
                <label className="label">Type *</label>
                <select
                  name="source_type"
                  className="input"
                  value={formData.source_type}
                  onChange={handleChange}
                  required
                >
                  <option value="primary_job">Primary Job (Your main job)</option>
                  <option value="secondary_job">Secondary Job (Your second job)</option>
                  <option value="side_business">Side Business (Turo, etc.)</option>
                  <option value="freelance">Freelance/Consulting</option>
                  <option value="rental">Rental Income</option>
                  <option value="investments">Investment Income</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="label">Amount *</label>
                  <input
                    type="number"
                    name="amount"
                    className="input"
                    value={formData.amount}
                    onChange={handleChange}
                    step="0.01"
                    min="0"
                    required
                    placeholder="Enter the amount"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Frequency *</label>
                  <select
                    name="frequency"
                    className="input"
                    value={formData.frequency}
                    onChange={handleChange}
                    required
                  >
                    <option value="weekly">Weekly</option>
                    <option value="biweekly">Bi-weekly (Every 2 weeks)</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                    <option value="variable">Variable (Enter monthly average)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="label">Employer/Company Name</label>
                <input
                  type="text"
                  name="employer_company"
                  className="input"
                  value={formData.employer_company}
                  onChange={handleChange}
                  placeholder="e.g., ABC Corporation, Self-employed"
                />
              </div>

              <div className="form-group">
                <label className="label">Start Date</label>
                <input
                  type="date"
                  name="start_date"
                  className="input"
                  value={formData.start_date}
                  onChange={handleChange}
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
                  placeholder="Optional notes about this income source"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    name="is_active"
                    checked={formData.is_active}
                    onChange={handleChange}
                  />
                  <span>Currently Active</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingSource ? 'Update' : 'Add'} Income Source
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowModal(false);
                    setEditingSource(null);
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

export default Income;
