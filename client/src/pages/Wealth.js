import React, { useState, useEffect } from 'react';
import { wealthAPI, incomeAPI } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { formatDollar } from '../utils/formatters';

function Wealth() {
  const [activeTab, setActiveTab] = useState('overview');
  const [netWorth, setNetWorth] = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [retirementAccounts, setRetirementAccounts] = useState([]);
  const [assets, setAssets] = useState([]);
  const [targets, setTargets] = useState([]);
  const [creditScores, setCreditScores] = useState([]);
  const [netWorthHistory, setNetWorthHistory] = useState([]);
  const [monthlyIncome, setMonthlyIncome] = useState(0);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showRetirementModal, setShowRetirementModal] = useState(false);
  const [showAssetModal, setShowAssetModal] = useState(false);
  const [showTargetModal, setShowTargetModal] = useState(false);
  const [showCreditModal, setShowCreditModal] = useState(false);

  // Form states
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'checking',
    balance: '',
    credit_limit: '',
    interest_rate: '',
    due_date: '',
    institution: ''
  });

  const [retirementForm, setRetirementForm] = useState({
    name: '',
    type: '401k',
    balance: '',
    contribution_amount: '',
    contribution_frequency: 'monthly',
    employer_match: ''
  });

  const [assetForm, setAssetForm] = useState({
    name: '',
    type: 'real_estate',
    value: '',
    purchase_price: '',
    purchase_date: '',
    notes: ''
  });

  const [targetForm, setTargetForm] = useState({
    category: 'monthly_income',
    name: '',
    target_value: '',
    current_value: '',
    target_date: ''
  });

  const [creditForm, setCreditForm] = useState({
    score: '',
    bureau: 'experian',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      const [
        netWorthRes,
        accountsRes,
        retirementRes,
        assetsRes,
        targetsRes,
        creditRes,
        historyRes,
        incomeRes
      ] = await Promise.all([
        wealthAPI.getNetWorth(),
        wealthAPI.getAccounts(),
        wealthAPI.getRetirementAccounts(),
        wealthAPI.getAssets(),
        wealthAPI.getTargets(),
        wealthAPI.getCreditScores(),
        wealthAPI.getNetWorthHistory(),
        incomeAPI.getSummary()
      ]);

      setNetWorth(netWorthRes.data);
      setAccounts(accountsRes.data);
      setRetirementAccounts(retirementRes.data);
      setAssets(assetsRes.data);
      setTargets(targetsRes.data);
      setCreditScores(creditRes.data);
      setNetWorthHistory(historyRes.data.reverse());
      setMonthlyIncome(incomeRes.data.total_monthly || 0);
    } catch (error) {
      console.error('Error fetching wealth data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Account handlers
  const handleAccountSubmit = async (e) => {
    e.preventDefault();
    try {
      await wealthAPI.createAccount(accountForm);
      setShowAccountModal(false);
      setAccountForm({ name: '', type: 'checking', balance: '', credit_limit: '', interest_rate: '', due_date: '', institution: '' });
      fetchAllData();
    } catch (error) {
      console.error('Error creating account:', error);
    }
  };

  const deleteAccount = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await wealthAPI.deleteAccount(id);
        fetchAllData();
      } catch (error) {
        console.error('Error deleting account:', error);
      }
    }
  };

  // Retirement handlers
  const handleRetirementSubmit = async (e) => {
    e.preventDefault();
    try {
      await wealthAPI.createRetirementAccount(retirementForm);
      setShowRetirementModal(false);
      setRetirementForm({ name: '', type: '401k', balance: '', contribution_amount: '', contribution_frequency: 'monthly', employer_match: '' });
      fetchAllData();
    } catch (error) {
      console.error('Error creating retirement account:', error);
    }
  };

  const deleteRetirement = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await wealthAPI.deleteRetirementAccount(id);
        fetchAllData();
      } catch (error) {
        console.error('Error deleting retirement account:', error);
      }
    }
  };

  // Asset handlers
  const handleAssetSubmit = async (e) => {
    e.preventDefault();
    try {
      await wealthAPI.createAsset(assetForm);
      setShowAssetModal(false);
      setAssetForm({ name: '', type: 'real_estate', value: '', purchase_price: '', purchase_date: '', notes: '' });
      fetchAllData();
    } catch (error) {
      console.error('Error creating asset:', error);
    }
  };

  const deleteAsset = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await wealthAPI.deleteAsset(id);
        fetchAllData();
      } catch (error) {
        console.error('Error deleting asset:', error);
      }
    }
  };

  // Target handlers
  const handleTargetSubmit = async (e) => {
    e.preventDefault();
    try {
      await wealthAPI.createTarget(targetForm);
      setShowTargetModal(false);
      setTargetForm({ category: 'monthly_income', name: '', target_value: '', current_value: '', target_date: '' });
      fetchAllData();
    } catch (error) {
      console.error('Error creating target:', error);
    }
  };

  const deleteTarget = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        await wealthAPI.deleteTarget(id);
        fetchAllData();
      } catch (error) {
        console.error('Error deleting target:', error);
      }
    }
  };

  // Credit score handler
  const handleCreditSubmit = async (e) => {
    e.preventDefault();
    try {
      await wealthAPI.addCreditScore(creditForm);
      setShowCreditModal(false);
      setCreditForm({ score: '', bureau: 'experian', date: new Date().toISOString().split('T')[0], notes: '' });
      fetchAllData();
    } catch (error) {
      console.error('Error adding credit score:', error);
    }
  };

  const saveSnapshot = async () => {
    try {
      await wealthAPI.saveNetWorthSnapshot({
        total_assets: netWorth.total_assets,
        total_liabilities: netWorth.total_liabilities,
        snapshot_date: new Date().toISOString().split('T')[0]
      });
      alert('Net worth snapshot saved!');
      fetchAllData();
    } catch (error) {
      console.error('Error saving snapshot:', error);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading wealth data...</div></div>;
  }

  // Calculate totals
  const totalSavings = accounts.filter(a => a.type === 'savings').reduce((sum, a) => sum + a.balance, 0);
  const totalChecking = accounts.filter(a => a.type === 'checking').reduce((sum, a) => sum + a.balance, 0);
  const totalDebt = accounts.filter(a => ['credit_card', 'loan', 'mortgage', 'other_debt'].includes(a.type))
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);
  const totalRetirement = retirementAccounts.reduce((sum, a) => sum + a.balance, 0);
  const totalAssets = assets.reduce((sum, a) => sum + a.value, 0);
  const latestCredit = creditScores[0];

  return (
    <div className="container">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h1>Wealth Management</h1>
        {netWorth && (
          <button className="btn btn-secondary" onClick={saveSnapshot}>
            Save Net Worth Snapshot
          </button>
        )}
      </div>

      {/* Tab Navigation */}
      <div style={{ borderBottom: '2px solid var(--border-color)', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['overview', 'accounts', 'retirement', 'assets', 'targets', 'credit'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: '12px 24px',
                border: 'none',
                background: activeTab === tab ? 'var(--primary-color)' : 'transparent',
                color: activeTab === tab ? 'white' : 'var(--text-secondary)',
                borderRadius: '6px 6px 0 0',
                cursor: 'pointer',
                fontWeight: '500',
                textTransform: 'capitalize'
              }}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <>
          <div className="grid grid-3">
            <div className="stat-card income">
              <div className="stat-label">Net Worth</div>
              <div className="stat-value">{formatDollar(netWorth?.net_worth || 0)}</div>
              <div className="stat-label">Total Assets - Liabilities</div>
            </div>

            <div className="stat-card">
              <div className="stat-label">Total Assets</div>
              <div className="stat-value">{formatDollar(netWorth?.total_assets || 0)}</div>
              <div className="stat-label">All Accounts + Retirement + Assets</div>
            </div>

            <div className="stat-card expense">
              <div className="stat-label">Total Debt</div>
              <div className="stat-value">{formatDollar(totalDebt)}</div>
              <div className="stat-label">Credit Cards + Loans</div>
            </div>
          </div>

          <div className="grid grid-2" style={{ marginTop: '24px' }}>
            <div className="card">
              <h2 style={{ marginBottom: '20px' }}>Asset Breakdown</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-color)', borderRadius: '6px' }}>
                  <span><strong>Checking Accounts</strong></span>
                  <span style={{ color: 'var(--secondary-color)', fontWeight: '600' }}>{formatDollar(totalChecking)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-color)', borderRadius: '6px' }}>
                  <span><strong>Savings Accounts</strong></span>
                  <span style={{ color: 'var(--secondary-color)', fontWeight: '600' }}>{formatDollar(totalSavings)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-color)', borderRadius: '6px' }}>
                  <span><strong>Retirement (401k, IRA)</strong></span>
                  <span style={{ color: 'var(--secondary-color)', fontWeight: '600' }}>{formatDollar(totalRetirement)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px', background: 'var(--bg-color)', borderRadius: '6px' }}>
                  <span><strong>Assets (Property, etc.)</strong></span>
                  <span style={{ color: 'var(--secondary-color)', fontWeight: '600' }}>{formatDollar(totalAssets)}</span>
                </div>
              </div>
            </div>

            <div className="card">
              <h2 style={{ marginBottom: '20px' }}>Financial Health Metrics</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Emergency Fund (3-6 months expenses)</span>
                    <span style={{ fontWeight: '600' }}>{formatDollar(totalSavings)}</span>
                  </div>
                  <div style={{ background: 'var(--bg-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ background: 'var(--secondary-color)', height: '100%', width: `${Math.min((totalSavings / (monthlyIncome * 6)) * 100, 100)}%` }}></div>
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Credit Score</span>
                    <span style={{ fontWeight: '600' }}>{latestCredit?.score || 'Not tracked'}</span>
                  </div>
                  {latestCredit && (
                    <div style={{ background: 'var(--bg-color)', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                      <div style={{
                        background: latestCredit.score >= 740 ? 'var(--secondary-color)' : latestCredit.score >= 670 ? 'var(--warning-color)' : 'var(--danger-color)',
                        height: '100%',
                        width: `${(latestCredit.score / 850) * 100}%`
                      }}></div>
                    </div>
                  )}
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Debt-to-Income Ratio</span>
                    <span style={{ fontWeight: '600' }}>{monthlyIncome > 0 ? ((totalDebt / (monthlyIncome * 12)) * 100).toFixed(1) : 0}%</span>
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Target: Below 36%
                  </div>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span>Monthly Income</span>
                    <span style={{ fontWeight: '600', color: 'var(--secondary-color)' }}>{formatDollar(monthlyIncome)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {netWorthHistory.length > 0 && (
            <div className="card" style={{ marginTop: '24px' }}>
              <h2 style={{ marginBottom: '20px' }}>Net Worth Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={netWorthHistory}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="snapshot_date" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatDollar(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="net_worth" stroke="#10b981" strokeWidth={2} name="Net Worth" />
                  <Line type="monotone" dataKey="total_assets" stroke="#2563eb" strokeWidth={2} name="Assets" />
                  <Line type="monotone" dataKey="total_liabilities" stroke="#ef4444" strokeWidth={2} name="Liabilities" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Accounts (Checking, Savings, Credit Cards, Loans)</h2>
            <button className="btn btn-primary" onClick={() => setShowAccountModal(true)}>
              Add Account
            </button>
          </div>

          {accounts.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Balance</th>
                  <th>Credit Limit</th>
                  <th>Interest Rate</th>
                  <th>Institution</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map(account => (
                  <tr key={account.id}>
                    <td><strong>{account.name}</strong></td>
                    <td>
                      <span className="badge badge-info">{account.type.replace('_', ' ')}</span>
                    </td>
                    <td style={{
                      color: account.balance >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)',
                      fontWeight: '600'
                    }}>
                      {formatDollar(Math.abs(account.balance))}
                    </td>
                    <td>{account.credit_limit ? formatDollar(account.credit_limit) : '-'}</td>
                    <td>{account.interest_rate ? `${account.interest_rate}%` : '-'}</td>
                    <td>{account.institution || '-'}</td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '4px 12px' }} onClick={() => deleteAccount(account.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No accounts yet. Add your bank accounts, credit cards, and loans.
            </p>
          )}
        </div>
      )}

      {/* Retirement Tab */}
      {activeTab === 'retirement' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Retirement Accounts (401k, IRA, Pension)</h2>
            <button className="btn btn-primary" onClick={() => setShowRetirementModal(true)}>
              Add Retirement Account
            </button>
          </div>

          <div className="grid grid-3" style={{ marginBottom: '24px' }}>
            <div className="stat-card">
              <div className="stat-label">Total Retirement Balance</div>
              <div className="stat-value">{formatDollar(totalRetirement)}</div>
            </div>
            <div className="stat-card income">
              <div className="stat-label">Monthly Contributions</div>
              <div className="stat-value">
                {formatDollar(retirementAccounts.filter(a => a.contribution_frequency === 'monthly').reduce((sum, a) => sum + (a.contribution_amount || 0), 0))}
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Projected at 65</div>
              <div className="stat-value">Calculate</div>
              <div className="stat-label" style={{ fontSize: '11px' }}>Based on 7% annual return</div>
            </div>
          </div>

          {retirementAccounts.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Balance</th>
                  <th>Contribution</th>
                  <th>Employer Match</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {retirementAccounts.map(account => (
                  <tr key={account.id}>
                    <td><strong>{account.name}</strong></td>
                    <td><span className="badge badge-success">{account.type}</span></td>
                    <td style={{ color: 'var(--secondary-color)', fontWeight: '600' }}>
                      {formatDollar(account.balance)}
                    </td>
                    <td>
                      {account.contribution_amount ? `${formatDollar(account.contribution_amount)} / ${account.contribution_frequency}` : '-'}
                    </td>
                    <td>{account.employer_match ? `${account.employer_match}%` : '-'}</td>
                    <td>
                      <button className="btn btn-danger" style={{ padding: '4px 12px' }} onClick={() => deleteRetirement(account.id)}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No retirement accounts yet. Add your 401k, IRA, or other retirement accounts.
            </p>
          )}
        </div>
      )}

      {/* Assets Tab */}
      {activeTab === 'assets' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Assets (Property, Vehicles, Valuables)</h2>
            <button className="btn btn-primary" onClick={() => setShowAssetModal(true)}>
              Add Asset
            </button>
          </div>

          {assets.length > 0 ? (
            <table className="table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Current Value</th>
                  <th>Purchase Price</th>
                  <th>Appreciation</th>
                  <th>Purchase Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {assets.map(asset => {
                  const appreciation = asset.purchase_price ? ((asset.value - asset.purchase_price) / asset.purchase_price * 100) : 0;
                  return (
                    <tr key={asset.id}>
                      <td><strong>{asset.name}</strong></td>
                      <td><span className="badge badge-info">{asset.type.replace('_', ' ')}</span></td>
                      <td style={{ color: 'var(--secondary-color)', fontWeight: '600' }}>
                        {formatDollar(asset.value)}
                      </td>
                      <td>{asset.purchase_price ? formatDollar(asset.purchase_price) : '-'}</td>
                      <td style={{ color: appreciation >= 0 ? 'var(--secondary-color)' : 'var(--danger-color)' }}>
                        {asset.purchase_price ? `${appreciation >= 0 ? '+' : ''}${appreciation.toFixed(1)}%` : '-'}
                      </td>
                      <td>{asset.purchase_date ? new Date(asset.purchase_date).toLocaleDateString() : '-'}</td>
                      <td>
                        <button className="btn btn-danger" style={{ padding: '4px 12px' }} onClick={() => deleteAsset(asset.id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No assets yet. Track your real estate, vehicles, and valuable possessions.
            </p>
          )}
        </div>
      )}

      {/* Targets Tab */}
      {activeTab === 'targets' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Financial Targets & Goals</h2>
            <button className="btn btn-primary" onClick={() => setShowTargetModal(true)}>
              Add Target
            </button>
          </div>

          {targets.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {targets.map(target => {
                const progress = (target.current_value / target.target_value) * 100;
                return (
                  <div key={target.id} style={{ padding: '20px', background: 'var(--bg-color)', borderRadius: '8px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '12px' }}>
                      <div>
                        <h3 style={{ marginBottom: '4px' }}>{target.name}</h3>
                        <span className="badge badge-info">{target.category.replace('_', ' ')}</span>
                      </div>
                      <button className="btn btn-danger" style={{ padding: '4px 12px' }} onClick={() => deleteTarget(target.id)}>
                        Delete
                      </button>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                      <span>{formatDollar(target.current_value)} / {formatDollar(target.target_value)}</span>
                      <span style={{ fontWeight: '600' }}>{progress.toFixed(0)}%</span>
                    </div>

                    <div style={{ background: 'white', height: '12px', borderRadius: '6px', overflow: 'hidden' }}>
                      <div style={{
                        background: progress >= 100 ? 'var(--secondary-color)' : 'var(--primary-color)',
                        height: '100%',
                        width: `${Math.min(progress, 100)}%`,
                        transition: 'width 0.3s'
                      }}></div>
                    </div>

                    {target.target_date && (
                      <div style={{ marginTop: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                        Target Date: {new Date(target.target_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No targets set. Create goals for income, savings rate, net worth, and more.
            </p>
          )}
        </div>
      )}

      {/* Credit Tab */}
      {activeTab === 'credit' && (
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2>Credit Score Tracking</h2>
            <button className="btn btn-primary" onClick={() => setShowCreditModal(true)}>
              Add Credit Score
            </button>
          </div>

          {latestCredit && (
            <div className="grid grid-3" style={{ marginBottom: '24px' }}>
              <div className="stat-card income">
                <div className="stat-label">Current Score</div>
                <div className="stat-value">{latestCredit.score}</div>
                <div className="stat-label">{latestCredit.bureau} - {new Date(latestCredit.date).toLocaleDateString()}</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Credit Rating</div>
                <div className="stat-value" style={{ fontSize: '24px' }}>
                  {latestCredit.score >= 800 ? 'Exceptional' :
                   latestCredit.score >= 740 ? 'Very Good' :
                   latestCredit.score >= 670 ? 'Good' :
                   latestCredit.score >= 580 ? 'Fair' : 'Poor'}
                </div>
                <div className="stat-label">FICO Range</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Range</div>
                <div className="stat-value" style={{ fontSize: '20px' }}>300 - 850</div>
                <div className="stat-label">Target: 740+</div>
              </div>
            </div>
          )}

          {creditScores.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={creditScores.slice(0, 12).reverse()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[300, 850]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} name="Credit Score" />
                </LineChart>
              </ResponsiveContainer>

              <table className="table" style={{ marginTop: '24px' }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Score</th>
                    <th>Bureau</th>
                    <th>Notes</th>
                  </tr>
                </thead>
                <tbody>
                  {creditScores.slice(0, 10).map(score => (
                    <tr key={score.id}>
                      <td>{new Date(score.date).toLocaleDateString()}</td>
                      <td><strong>{score.score}</strong></td>
                      <td><span className="badge badge-info">{score.bureau}</span></td>
                      <td>{score.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          ) : (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
              No credit scores tracked yet. Add your credit scores to monitor your progress.
            </p>
          )}
        </div>
      )}

      {/* Account Modal */}
      {showAccountModal && (
        <div className="modal-overlay" onClick={() => setShowAccountModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Account</h2>
              <button onClick={() => setShowAccountModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleAccountSubmit}>
              <div className="form-group">
                <label className="label">Account Name *</label>
                <input type="text" className="input" value={accountForm.name} onChange={(e) => setAccountForm({...accountForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Type *</label>
                <select className="input" value={accountForm.type} onChange={(e) => setAccountForm({...accountForm, type: e.target.value})} required>
                  <option value="checking">Checking</option>
                  <option value="savings">Savings</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="loan">Loan</option>
                  <option value="mortgage">Mortgage</option>
                  <option value="other_debt">Other Debt</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Balance *</label>
                <input type="number" step="0.01" className="input" value={accountForm.balance} onChange={(e) => setAccountForm({...accountForm, balance: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Credit Limit (for credit cards)</label>
                <input type="number" step="0.01" className="input" value={accountForm.credit_limit} onChange={(e) => setAccountForm({...accountForm, credit_limit: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Interest Rate (%)</label>
                <input type="number" step="0.01" className="input" value={accountForm.interest_rate} onChange={(e) => setAccountForm({...accountForm, interest_rate: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Institution</label>
                <input type="text" className="input" value={accountForm.institution} onChange={(e) => setAccountForm({...accountForm, institution: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Account</button>
            </form>
          </div>
        </div>
      )}

      {/* Retirement Modal */}
      {showRetirementModal && (
        <div className="modal-overlay" onClick={() => setShowRetirementModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Retirement Account</h2>
              <button onClick={() => setShowRetirementModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleRetirementSubmit}>
              <div className="form-group">
                <label className="label">Account Name *</label>
                <input type="text" className="input" value={retirementForm.name} onChange={(e) => setRetirementForm({...retirementForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Type *</label>
                <select className="input" value={retirementForm.type} onChange={(e) => setRetirementForm({...retirementForm, type: e.target.value})} required>
                  <option value="401k">401(k)</option>
                  <option value="roth_401k">Roth 401(k)</option>
                  <option value="traditional_ira">Traditional IRA</option>
                  <option value="roth_ira">Roth IRA</option>
                  <option value="sep_ira">SEP IRA</option>
                  <option value="pension">Pension</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Current Balance *</label>
                <input type="number" step="0.01" className="input" value={retirementForm.balance} onChange={(e) => setRetirementForm({...retirementForm, balance: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Contribution Amount</label>
                <input type="number" step="0.01" className="input" value={retirementForm.contribution_amount} onChange={(e) => setRetirementForm({...retirementForm, contribution_amount: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Contribution Frequency</label>
                <select className="input" value={retirementForm.contribution_frequency} onChange={(e) => setRetirementForm({...retirementForm, contribution_frequency: e.target.value})}>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Bi-weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Employer Match (%)</label>
                <input type="number" step="0.1" className="input" value={retirementForm.employer_match} onChange={(e) => setRetirementForm({...retirementForm, employer_match: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Retirement Account</button>
            </form>
          </div>
        </div>
      )}

      {/* Asset Modal */}
      {showAssetModal && (
        <div className="modal-overlay" onClick={() => setShowAssetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Asset</h2>
              <button onClick={() => setShowAssetModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleAssetSubmit}>
              <div className="form-group">
                <label className="label">Asset Name *</label>
                <input type="text" className="input" value={assetForm.name} onChange={(e) => setAssetForm({...assetForm, name: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Type *</label>
                <select className="input" value={assetForm.type} onChange={(e) => setAssetForm({...assetForm, type: e.target.value})} required>
                  <option value="real_estate">Real Estate</option>
                  <option value="vehicle">Vehicle</option>
                  <option value="jewelry">Jewelry</option>
                  <option value="art">Art</option>
                  <option value="collectibles">Collectibles</option>
                  <option value="business">Business</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Current Value *</label>
                <input type="number" step="0.01" className="input" value={assetForm.value} onChange={(e) => setAssetForm({...assetForm, value: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Purchase Price</label>
                <input type="number" step="0.01" className="input" value={assetForm.purchase_price} onChange={(e) => setAssetForm({...assetForm, purchase_price: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Purchase Date</label>
                <input type="date" className="input" value={assetForm.purchase_date} onChange={(e) => setAssetForm({...assetForm, purchase_date: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Notes</label>
                <textarea className="input" rows="3" value={assetForm.notes} onChange={(e) => setAssetForm({...assetForm, notes: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Asset</button>
            </form>
          </div>
        </div>
      )}

      {/* Target Modal */}
      {showTargetModal && (
        <div className="modal-overlay" onClick={() => setShowTargetModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Financial Target</h2>
              <button onClick={() => setShowTargetModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleTargetSubmit}>
              <div className="form-group">
                <label className="label">Category *</label>
                <select className="input" value={targetForm.category} onChange={(e) => setTargetForm({...targetForm, category: e.target.value})} required>
                  <option value="monthly_income">Monthly Income</option>
                  <option value="savings_rate">Savings Rate</option>
                  <option value="net_worth">Net Worth</option>
                  <option value="debt_payoff">Debt Payoff</option>
                  <option value="retirement">Retirement</option>
                  <option value="emergency_fund">Emergency Fund</option>
                  <option value="custom">Custom</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Target Name *</label>
                <input type="text" className="input" value={targetForm.name} onChange={(e) => setTargetForm({...targetForm, name: e.target.value})} required placeholder="e.g., Reach $10k/month income" />
              </div>
              <div className="form-group">
                <label className="label">Target Value *</label>
                <input type="number" step="0.01" className="input" value={targetForm.target_value} onChange={(e) => setTargetForm({...targetForm, target_value: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Current Value</label>
                <input type="number" step="0.01" className="input" value={targetForm.current_value} onChange={(e) => setTargetForm({...targetForm, current_value: e.target.value})} />
              </div>
              <div className="form-group">
                <label className="label">Target Date</label>
                <input type="date" className="input" value={targetForm.target_date} onChange={(e) => setTargetForm({...targetForm, target_date: e.target.value})} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Target</button>
            </form>
          </div>
        </div>
      )}

      {/* Credit Score Modal */}
      {showCreditModal && (
        <div className="modal-overlay" onClick={() => setShowCreditModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Credit Score</h2>
              <button onClick={() => setShowCreditModal(false)} style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer' }}>×</button>
            </div>
            <form onSubmit={handleCreditSubmit}>
              <div className="form-group">
                <label className="label">Credit Score *</label>
                <input type="number" min="300" max="850" className="input" value={creditForm.score} onChange={(e) => setCreditForm({...creditForm, score: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Bureau *</label>
                <select className="input" value={creditForm.bureau} onChange={(e) => setCreditForm({...creditForm, bureau: e.target.value})} required>
                  <option value="experian">Experian</option>
                  <option value="equifax">Equifax</option>
                  <option value="transunion">TransUnion</option>
                  <option value="vantage">VantageScore</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="form-group">
                <label className="label">Date *</label>
                <input type="date" className="input" value={creditForm.date} onChange={(e) => setCreditForm({...creditForm, date: e.target.value})} required />
              </div>
              <div className="form-group">
                <label className="label">Notes</label>
                <textarea className="input" rows="3" value={creditForm.notes} onChange={(e) => setCreditForm({...creditForm, notes: e.target.value})} placeholder="Optional notes about changes or events affecting your score" />
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Credit Score</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Wealth;
