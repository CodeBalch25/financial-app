import React, { useState, useEffect } from 'react';
import { aiTokensAPI } from '../services/api';
import './AISettings.css';

function AISettings() {
  const [tokens, setTokens] = useState([]);
  const [services, setServices] = useState([]);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedService, setSelectedService] = useState(null);
  const [tokenInput, setTokenInput] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [showInstructions, setShowInstructions] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [tokensRes, linksRes, statusRes] = await Promise.all([
        aiTokensAPI.getAll(),
        aiTokensAPI.getLinks(),
        aiTokensAPI.getStatus()
      ]);

      setTokens(tokensRes.data);
      setServices(linksRes.data.services);
      setStatus(statusRes.data);
    } catch (error) {
      console.error('Error fetching AI settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToken = async () => {
    if (!selectedService || !tokenInput) {
      alert('Please select a service and enter a token');
      return;
    }

    try {
      await aiTokensAPI.create({
        service: selectedService,
        token: tokenInput
      });

      alert('Token saved successfully!');
      setSelectedService(null);
      setTokenInput('');
      setTestResult(null);
      fetchData();
    } catch (error) {
      alert(`Error saving token: ${error.response?.data?.error || error.message}`);
    }
  };

  const handleTestToken = async () => {
    if (!selectedService || !tokenInput) {
      alert('Please select a service and enter a token');
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const result = await aiTokensAPI.test({
        service: selectedService,
        token: tokenInput
      });

      setTestResult(result.data);
    } catch (error) {
      setTestResult({
        success: false,
        message: error.response?.data?.message || 'Connection test failed'
      });
    } finally {
      setTesting(false);
    }
  };

  const handleToggleToken = async (id) => {
    try {
      await aiTokensAPI.toggle(id);
      fetchData();
    } catch (error) {
      alert(`Error toggling token: ${error.message}`);
    }
  };

  const handleDeleteToken = async (id) => {
    if (!window.confirm('Are you sure you want to delete this token?')) {
      return;
    }

    try {
      await aiTokensAPI.delete(id);
      fetchData();
    } catch (error) {
      alert(`Error deleting token: ${error.message}`);
    }
  };

  if (loading) {
    return <div className="container"><div className="loading">Loading...</div></div>;
  }

  return (
    <div className="container ai-settings">
      <h1>AI Assistant Settings</h1>
      <p className="subtitle">
        Configure free Gen AI LLM tokens for automated financial insights and opportunity scanning
      </p>

      {/* Status Overview */}
      <div className="grid grid-3" style={{ marginBottom: '24px' }}>
        <div className={`stat-card ${status?.ready_for_ai ? 'income' : ''}`}>
          <div className="stat-label">AI Status</div>
          <div className="stat-value">{status?.ready_for_ai ? '✓ Ready' : '⚠ Not Configured'}</div>
          <div className="stat-label">
            {status?.active_tokens || 0} active token{status?.active_tokens !== 1 ? 's' : ''}
          </div>
        </div>

        <div className={`stat-card ${status?.has_free_token ? 'income' : ''}`}>
          <div className="stat-label">Free Services</div>
          <div className="stat-value">{status?.has_free_token ? '✓ Connected' : '⚠ None'}</div>
          <div className="stat-label">Groq or Hugging Face</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Auto Scans</div>
          <div className="stat-value">✓ Enabled</div>
          <div className="stat-label">Daily + Every 5 hours</div>
        </div>
      </div>

      {/* Add New Token */}
      <div className="card">
        <h2>Add AI Service Token</h2>

        <div className="form-group">
          <label className="label">Select Service *</label>
          <select
            className="input"
            value={selectedService || ''}
            onChange={(e) => {
              setSelectedService(e.target.value);
              setTokenInput('');
              setTestResult(null);
            }}
          >
            <option value="">-- Choose a service --</option>
            {services.map(service => (
              <option key={service.name} value={service.name}>
                {service.display_name} - {service.cost} {service.recommended ? '⭐ RECOMMENDED' : ''}
              </option>
            ))}
          </select>
        </div>

        {selectedService && (
          <>
            <div className="service-info">
              {services.find(s => s.name === selectedService) && (
                <>
                  <h3>{services.find(s => s.name === selectedService).display_name}</h3>
                  <p>{services.find(s => s.name === selectedService).description}</p>

                  <div className="service-meta">
                    <span className="badge badge-info">Cost: {services.find(s => s.name === selectedService).cost}</span>
                    <span className="badge badge-success">Speed: {services.find(s => s.name === selectedService).speed}</span>
                    {services.find(s => s.name === selectedService).recommended && (
                      <span className="badge badge-warning">⭐ Recommended</span>
                    )}
                  </div>

                  <div className="signup-link">
                    <a
                      href={services.find(s => s.name === selectedService).signup_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline"
                    >
                      🔗 Get Token at {services.find(s => s.name === selectedService).display_name}
                    </a>
                    <button
                      className="btn btn-link"
                      onClick={() => setShowInstructions(selectedService)}
                    >
                      📖 Show Instructions
                    </button>
                  </div>
                </>
              )}
            </div>

            {showInstructions === selectedService && (
              <div className="instructions-box">
                <h4>Step-by-Step Instructions:</h4>
                <ol>
                  <li>Click the "Get Token" button above</li>
                  <li>Sign up or log in to the service</li>
                  <li>Create an API key/token</li>
                  <li>Copy the token</li>
                  <li>Paste it below and click "Test Connection"</li>
                  <li>If test succeeds, click "Save Token"</li>
                </ol>
                <button
                  className="btn btn-outline"
                  style={{ marginTop: '12px' }}
                  onClick={() => setShowInstructions(null)}
                >
                  Hide Instructions
                </button>
              </div>
            )}

            <div className="form-group">
              <label className="label">API Token *</label>
              <input
                type="password"
                className="input"
                value={tokenInput}
                onChange={(e) => setTokenInput(e.target.value)}
                placeholder={`Enter your ${services.find(s => s.name === selectedService)?.display_name} token`}
              />
            </div>

            {testResult && (
              <div className={`alert ${testResult.success ? 'alert-success' : 'alert-error'}`}>
                {testResult.success ? '✅' : '❌'} {testResult.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
              <button
                className="btn btn-outline"
                onClick={handleTestToken}
                disabled={testing || !tokenInput}
              >
                {testing ? 'Testing...' : '🔌 Test Connection'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleSaveToken}
                disabled={!tokenInput || (testResult && !testResult.success)}
              >
                💾 Save Token
              </button>
            </div>
          </>
        )}
      </div>

      {/* Configured Tokens */}
      <div className="card">
        <h2>Configured AI Services</h2>

        {tokens.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '40px', color: 'var(--text-secondary)' }}>
            No AI services configured yet. Add your first token above to get started!
          </p>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Service</th>
                <th>Status</th>
                <th>Last Used</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map(token => (
                <tr key={token.id}>
                  <td>
                    <strong>{services.find(s => s.name === token.service)?.display_name || token.service}</strong>
                  </td>
                  <td>
                    <span className={`badge ${token.is_active ? 'badge-success' : 'badge-secondary'}`}>
                      {token.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    {token.last_used
                      ? new Date(token.last_used).toLocaleDateString()
                      : 'Never'}
                  </td>
                  <td>
                    <button
                      className="btn btn-outline"
                      style={{ marginRight: '8px', padding: '4px 12px' }}
                      onClick={() => handleToggleToken(token.id)}
                    >
                      {token.is_active ? 'Disable' : 'Enable'}
                    </button>
                    <button
                      className="btn btn-danger"
                      style={{ padding: '4px 12px' }}
                      onClick={() => handleDeleteToken(token.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Recommended Services */}
      <div className="card">
        <h2>🌟 Recommended FREE Services</h2>
        <div className="grid grid-2">
          {services.filter(s => s.recommended).map(service => (
            <div key={service.name} className="service-card">
              <h3>{service.display_name}</h3>
              <p>{service.description}</p>
              <div className="service-meta">
                <span className="badge badge-success">{service.cost}</span>
                <span className="badge badge-info">Speed: {service.speed}</span>
              </div>
              <p style={{ fontSize: '12px', marginTop: '8px' }}>
                <strong>Models:</strong> {service.models.join(', ')}
              </p>
              <a
                href={service.signup_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ marginTop: '12px', width: '100%' }}
              >
                Get {service.display_name} Token →
              </a>
            </div>
          ))}
        </div>
      </div>

      {/* Info Box */}
      <div className="info-box">
        <h3>ℹ️ How It Works</h3>
        <ul>
          <li><strong>Daily Reports (8 AM):</strong> Comprehensive financial analysis with insights and recommendations</li>
          <li><strong>5-Hour Scans:</strong> Quick checks for new opportunities, alerts, and spending anomalies</li>
          <li><strong>Manual Insights:</strong> Generate AI insights anytime from the Dashboard</li>
          <li><strong>Automatic Fallback:</strong> If one service fails, automatically tries the next available token</li>
          <li><strong>Priority Order:</strong> Groq (fastest, free) → Hugging Face (free) → Together AI → OpenRouter</li>
        </ul>
        <p style={{ marginTop: '16px', fontSize: '13px', color: 'var(--text-secondary)' }}>
          <strong>💡 Tip:</strong> Start with <strong>Groq</strong> (completely FREE, ultra-fast) and <strong>Hugging Face</strong> (also FREE). These two services will cover all your needs without any cost!
        </p>
      </div>
    </div>
  );
}

export default AISettings;
