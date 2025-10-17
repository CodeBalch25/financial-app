import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { formatDollar, formatMonthYearShort, getVarianceColor, formatVariance } from '../utils/formatters';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function Bills() {
  const [bills, setBills] = useState([]);
  const [summary, setSummary] = useState(null);
  const [trends, setTrends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showBillModal, setShowBillModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);

  const [billForm, setBillForm] = useState({
    bill_name: '',
    bill_type: 'electric',
    target_amount: '',
    due_day: '',
    is_active: true,
    notes: ''
  });

  const [paymentForm, setPaymentForm] = useState({
    amount_paid: '',
    payment_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [billsRes, summaryRes, trendsRes] = await Promise.all([
        api.get('/bills?is_active=true'),
        api.get('/bills/analytics/summary?months=6'),
        api.get('/bills/analytics/trends?months=12')
      ]);

      setBills(billsRes.data);
      setSummary(summaryRes.data);
      setTrends(trendsRes.data.monthly_data || []);
    } catch (error) {
      console.error('Error fetching bills data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBillSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBill) {
        await api.put(`/bills/${editingBill.id}`, billForm);
      } else {
        await api.post('/bills', billForm);
      }
      setShowBillModal(false);
      setEditingBill(null);
      resetBillForm();
      fetchAllData();
    } catch (error) {
      console.error('Error saving bill:', error);
      alert('Error saving bill. Please try again.');
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/bills/${selectedBill.id}/payments`, paymentForm);
      setShowPaymentModal(false);
      setSelectedBill(null);
      resetPaymentForm();
      fetchAllData();
    } catch (error) {
      console.error('Error recording payment:', error);
      alert('Error recording payment. Please try again.');
    }
  };

  const handleEditBill = (bill) => {
    setEditingBill(bill);
    setBillForm({
      bill_name: bill.bill_name,
      bill_type: bill.bill_type,
      target_amount: bill.target_amount,
      due_day: bill.due_day || '',
      is_active: bill.is_active === 1,
      notes: bill.notes || ''
    });
    setShowBillModal(true);
  };

  const handleDeleteBill = async (id) => {
    if (window.confirm('Delete this bill and all payment history?')) {
      try {
        await api.delete(`/bills/${id}`);
        fetchAllData();
      } catch (error) {
        console.error('Error deleting bill:', error);
      }
    }
  };

  const handleRecordPayment = (bill) => {
    setSelectedBill(bill);
    setPaymentForm({
      amount_paid: bill.target_amount,
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowPaymentModal(true);
  };

  const resetBillForm = () => {
    setBillForm({
      bill_name: '',
      bill_type: 'electric',
      target_amount: '',
      due_day: '',
      is_active: true,
      notes: ''
    });
  };

  const resetPaymentForm = () => {
    setPaymentForm({
      amount_paid: '',
      payment_date: new Date().toISOString().split('T')[0],
      notes: ''
    });
  };

  const getBillTypeLabel = (type) => {
    const labels = {
      electric: 'Electric',
      water: 'Water',
      gas: 'Gas',
      internet: 'Internet',
      phone: 'Phone',
      hoa: 'HOA',
      insurance: 'Insurance',
      subscription: 'Subscription',
      other: 'Other'
    };
    return labels[type] || type;
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading bills data...</div></div>;
  }

  // Prepare chart data
  const trendChartData = trends.map(t => ({
    month: formatMonthYearShort(t.month),
    Actual: t.actual,
    Target: t.target
  }));

  const varianceChartData = trends.map(t => ({
    month: formatMonthYearShort(t.month),
    Variance: t.variance
  }));

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Bills Tracking</h1>
        <button className="btn btn-primary" onClick={() => setShowBillModal(true)}>
          Add Bill
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-label">Target Monthly Total</div>
          <div className="stat-value">{formatDollar(summary?.total_target_monthly || 0)}</div>
          <div className="stat-label">Budget for All Bills</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Average Actual</div>
          <div className="stat-value">{formatDollar(summary?.total_average_paid || 0)}</div>
          <div className="stat-label">Last 6 Months Average</div>
        </div>

        <div className={`stat-card ${parseFloat(summary?.overall_variance || 0) > 0 ? 'expense' : 'income'}`}>
          <div className="stat-label">Overall Variance</div>
          <div className="stat-value">
            {formatVariance(summary?.overall_variance || 0)}
          </div>
          <div className="stat-label">
            {parseFloat(summary?.overall_variance || 0) > 0 ? 'Over Budget' : 'Under Budget'} ({summary?.overall_variance_percent || 0}%)
          </div>
        </div>
      </div>

      {/* Trending Charts */}
      {trends.length > 0 && (
        <div className="grid grid-2" style={{ marginBottom: '24px' }}>
          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Target vs Actual (12 Months)</h2>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatDollar(value)} />
                <Legend />
                <Line type="monotone" dataKey="Target" stroke="#2563eb" strokeWidth={2} />
                <Line type="monotone" dataKey="Actual" stroke="#10b981" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h2 style={{ marginBottom: '20px' }}>Monthly Variance</h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={varianceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatDollar(value)} />
                <Bar
                  dataKey="Variance"
                  fill="#ef4444"
                  name="Over/Under Target"
                />
              </BarChart>
            </ResponsiveContainer>
            <div style={{ textAlign: 'center', marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Negative = Under Budget (Good) | Positive = Over Budget (Bad)
            </div>
          </div>
        </div>
      )}

      {/* Bills List with Individual Trends */}
      <div className="card">
        <h2 style={{ marginBottom: '20px' }}>Your Bills</h2>
        {bills.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {summary?.bills_with_trends?.map((billData) => (
              <div key={billData.id} className="card" style={{ padding: '16px', background: 'var(--bg-color)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                  <div>
                    <h3 style={{ marginBottom: '4px' }}>{billData.bill_name}</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <span className="badge badge-info">{getBillTypeLabel(billData.bill_type)}</span>
                      {billData.due_day && (
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                          Due: Day {billData.due_day} of month
                        </span>
                      )}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => handleRecordPayment(billData)}
                    >
                      Record Payment
                    </button>
                    <button
                      className="btn btn-outline"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => handleEditBill(billData)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '6px 12px', fontSize: '13px' }}
                      onClick={() => handleDeleteBill(billData.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>

                <div className="grid grid-3" style={{ marginBottom: '12px' }}>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Target</div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>{formatDollar(billData.target_amount)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Average Actual</div>
                    <div style={{ fontSize: '20px', fontWeight: '600' }}>{formatDollar(billData.average_paid)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Variance</div>
                    <div
                      style={{
                        fontSize: '20px',
                        fontWeight: '600',
                        color: getVarianceColor(billData.variance)
                      }}
                    >
                      {formatVariance(billData.variance)} ({billData.variance_percent}%)
                    </div>
                  </div>
                </div>

                {billData.trend_data && billData.trend_data.length > 0 && (
                  <div>
                    <div style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>
                      Last {billData.trend_data.length} Months
                    </div>
                    <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                      {billData.trend_data.map((trend, idx) => (
                        <div
                          key={idx}
                          style={{
                            minWidth: '120px',
                            padding: '8px',
                            background: 'white',
                            borderRadius: '4px',
                            textAlign: 'center',
                            border: '1px solid var(--border-color)'
                          }}
                        >
                          <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                            {formatMonthYearShort(trend.month)}
                          </div>
                          <div style={{ fontSize: '16px', fontWeight: '600' }}>
                            {formatDollar(trend.amount)}
                          </div>
                          <div
                            style={{
                              fontSize: '11px',
                              marginTop: '4px',
                              color: getVarianceColor(trend.variance)
                            }}
                          >
                            {formatVariance(trend.variance)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {billData.payments_count === 0 && (
                  <div className="alert alert-info" style={{ marginTop: '12px' }}>
                    No payments recorded yet. Click "Record Payment" to start tracking.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            <p>No bills added yet.</p>
            <p>Click "Add Bill" to start tracking electric, water, gas, HOA, and other bills!</p>
          </div>
        )}
      </div>

      {/* Add/Edit Bill Modal */}
      {showBillModal && (
        <div className="modal-overlay" onClick={() => setShowBillModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editingBill ? 'Edit Bill' : 'Add Bill'}</h2>
              <button
                onClick={() => {
                  setShowBillModal(false);
                  setEditingBill(null);
                  resetBillForm();
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleBillSubmit}>
              <div className="form-group">
                <label className="label">Bill Name *</label>
                <input
                  type="text"
                  className="input"
                  value={billForm.bill_name}
                  onChange={(e) => setBillForm({ ...billForm, bill_name: e.target.value })}
                  required
                  placeholder="e.g., Electric Bill - Duke Energy"
                />
              </div>

              <div className="form-group">
                <label className="label">Bill Type *</label>
                <select
                  className="input"
                  value={billForm.bill_type}
                  onChange={(e) => setBillForm({ ...billForm, bill_type: e.target.value })}
                  required
                >
                  <option value="electric">Electric</option>
                  <option value="water">Water</option>
                  <option value="gas">Gas</option>
                  <option value="internet">Internet</option>
                  <option value="phone">Phone</option>
                  <option value="hoa">HOA</option>
                  <option value="insurance">Insurance</option>
                  <option value="subscription">Subscription</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="grid grid-2">
                <div className="form-group">
                  <label className="label">Target Amount (Monthly) *</label>
                  <input
                    type="number"
                    className="input"
                    value={billForm.target_amount}
                    onChange={(e) => setBillForm({ ...billForm, target_amount: e.target.value })}
                    step="0.01"
                    min="0"
                    required
                    placeholder="150.00"
                  />
                </div>

                <div className="form-group">
                  <label className="label">Due Day of Month</label>
                  <input
                    type="number"
                    className="input"
                    value={billForm.due_day}
                    onChange={(e) => setBillForm({ ...billForm, due_day: e.target.value })}
                    min="1"
                    max="31"
                    placeholder="15"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  value={billForm.notes}
                  onChange={(e) => setBillForm({ ...billForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Additional notes about this bill"
                />
              </div>

              <div className="form-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={billForm.is_active}
                    onChange={(e) => setBillForm({ ...billForm, is_active: e.target.checked })}
                  />
                  <span>Currently Active</span>
                </label>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingBill ? 'Update' : 'Add'} Bill
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowBillModal(false);
                    setEditingBill(null);
                    resetBillForm();
                  }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {showPaymentModal && selectedBill && (
        <div className="modal-overlay" onClick={() => setShowPaymentModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Record Payment - {selectedBill.bill_name}</h2>
              <button
                onClick={() => {
                  setShowPaymentModal(false);
                  setSelectedBill(null);
                  resetPaymentForm();
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className="alert alert-info" style={{ marginBottom: '16px' }}>
                Target: {formatDollar(selectedBill.target_amount)}
              </div>

              <div className="form-group">
                <label className="label">Amount Paid *</label>
                <input
                  type="number"
                  className="input"
                  value={paymentForm.amount_paid}
                  onChange={(e) => setPaymentForm({ ...paymentForm, amount_paid: e.target.value })}
                  step="0.01"
                  min="0"
                  required
                  placeholder="150.00"
                />
              </div>

              <div className="form-group">
                <label className="label">Payment Date *</label>
                <input
                  type="date"
                  className="input"
                  value={paymentForm.payment_date}
                  onChange={(e) => setPaymentForm({ ...paymentForm, payment_date: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Notes</label>
                <textarea
                  className="input"
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  rows="3"
                  placeholder="Optional payment notes"
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  Record Payment
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowPaymentModal(false);
                    setSelectedBill(null);
                    resetPaymentForm();
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

export default Bills;
