import React, { useState, useEffect } from 'react';
import { transactionsAPI } from '../services/api';
import { formatDollar } from '../utils/formatters';

function Transactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [formData, setFormData] = useState({
    type: 'expense',
    amount: '',
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    try {
      const response = await transactionsAPI.getAll();
      setTransactions(response.data);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingTransaction) {
        await transactionsAPI.update(editingTransaction.id, formData);
      } else {
        await transactionsAPI.create(formData);
      }
      setShowModal(false);
      setEditingTransaction(null);
      setFormData({
        type: 'expense',
        amount: '',
        category: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
      });
      fetchTransactions();
    } catch (error) {
      console.error('Error saving transaction:', error);
    }
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setFormData({
      type: transaction.type,
      amount: transaction.amount,
      category: transaction.category,
      description: transaction.description || '',
      date: transaction.date,
    });
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionsAPI.delete(id);
        fetchTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
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

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Transactions</h1>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          Add Transaction
        </button>
      </div>

      <div className="card">
        {transactions.length > 0 ? (
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Category</th>
                <th>Description</th>
                <th>Type</th>
                <th>Amount</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((transaction) => (
                <tr key={transaction.id}>
                  <td>{new Date(transaction.date).toLocaleDateString()}</td>
                  <td><strong>{transaction.category}</strong></td>
                  <td>{transaction.description || '-'}</td>
                  <td>
                    <span
                      className={`badge ${
                        transaction.type === 'income' ? 'badge-success' : 'badge-danger'
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </td>
                  <td>
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
                  <td>
                    <button
                      className="btn btn-outline"
                      style={{ marginRight: '8px', padding: '4px 12px' }}
                      onClick={() => handleEdit(transaction)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 12px' }}
                      onClick={() => handleDelete(transaction.id)}
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
            No transactions yet. Click "Add Transaction" to get started.
          </p>
        )}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingTransaction ? 'Edit Transaction' : 'Add Transaction'}
              </h2>
              <button
                onClick={() => {
                  setShowModal(false);
                  setEditingTransaction(null);
                }}
                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="label">Type</label>
                <select
                  name="type"
                  className="input"
                  value={formData.type}
                  onChange={handleChange}
                  required
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>

              <div className="form-group">
                <label className="label">Amount</label>
                <input
                  type="number"
                  name="amount"
                  className="input"
                  value={formData.amount}
                  onChange={handleChange}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label className="label">Category</label>
                <input
                  type="text"
                  name="category"
                  className="input"
                  value={formData.category}
                  onChange={handleChange}
                  required
                  placeholder="e.g., Groceries, Salary, Entertainment"
                />
              </div>

              <div className="form-group">
                <label className="label">Description</label>
                <input
                  type="text"
                  name="description"
                  className="input"
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Optional"
                />
              </div>

              <div className="form-group">
                <label className="label">Date</label>
                <input
                  type="date"
                  name="date"
                  className="input"
                  value={formData.date}
                  onChange={handleChange}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>
                  {editingTransaction ? 'Update' : 'Add'} Transaction
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                  onClick={() => {
                    setShowModal(false);
                    setEditingTransaction(null);
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

export default Transactions;
