import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { propertiesAPI } from '../services/api';
import './Properties.css';

function Properties() {
  const navigate = useNavigate();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    property_name: '',
    address: '',
    city: '',
    state: '',
    zip_code: '',
    property_type: 'single_family',
    purchase_price: '',
    purchase_date: '',
    current_value: '',
    bedrooms: '',
    bathrooms: '',
    square_feet: '',
    notes: ''
  });

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const response = await propertiesAPI.getAll();
      setProperties(response.data);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await propertiesAPI.create(formData);
      setShowAddModal(false);
      setFormData({
        property_name: '',
        address: '',
        city: '',
        state: '',
        zip_code: '',
        property_type: 'single_family',
        purchase_price: '',
        purchase_date: '',
        current_value: '',
        bedrooms: '',
        bathrooms: '',
        square_feet: '',
        notes: ''
      });
      fetchProperties();
    } catch (error) {
      console.error('Error creating property:', error);
      alert('Failed to create property. Please try again.');
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '$0';
    return `$${parseFloat(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  };

  if (loading) {
    return (
      <div className="container">
        <div className="loading">Loading properties...</div>
      </div>
    );
  }

  return (
    <div className="container properties-container">
      {/* Header */}
      <div className="properties-header">
        <div>
          <h1>🏘️ Investment Properties</h1>
          <p className="properties-subtitle">
            Track your rental properties, mortgages, income, and expenses
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          + Add Property
        </button>
      </div>

      {/* Properties Grid */}
      {properties.length === 0 ? (
        <div className="no-properties">
          <div className="no-properties-icon">🏠</div>
          <h3>No Properties Yet</h3>
          <p>Add your first investment property to start tracking income and expenses</p>
          <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
            + Add Your First Property
          </button>
        </div>
      ) : (
        <div className="properties-grid">
          {properties.map((property) => (
            <div
              key={property.id}
              className="property-card"
              onClick={() => navigate(`/properties/${property.id}`)}
            >
              <div className="property-card-header">
                <div className="property-icon">🏠</div>
                <span className={`property-status ${property.status}`}>
                  {property.status === 'active' ? 'Active' : property.status}
                </span>
              </div>

              <h3 className="property-name">{property.property_name}</h3>
              <p className="property-address">
                {property.address}<br />
                {property.city}, {property.state} {property.zip_code}
              </p>

              <div className="property-details">
                <div className="property-detail-item">
                  <span className="detail-label">Type</span>
                  <span className="detail-value">
                    {property.property_type?.replace('_', ' ')}
                  </span>
                </div>
                {property.bedrooms && (
                  <div className="property-detail-item">
                    <span className="detail-label">Bed/Bath</span>
                    <span className="detail-value">
                      {property.bedrooms} / {property.bathrooms}
                    </span>
                  </div>
                )}
              </div>

              <div className="property-financials">
                <div className="financial-item">
                  <span className="financial-label">Purchase Price</span>
                  <span className="financial-value">
                    {formatCurrency(property.purchase_price)}
                  </span>
                </div>
                <div className="financial-item">
                  <span className="financial-label">Current Value</span>
                  <span className="financial-value">
                    {formatCurrency(property.current_value)}
                  </span>
                </div>
              </div>

              <div className="property-card-footer">
                <span className="view-details">View Details →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Property Modal */}
      {showAddModal && (
        <div className="modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">Add Investment Property</h2>
              <button
                className="modal-close"
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="property-form">
              <div className="form-section">
                <h3>Property Information</h3>

                <div className="form-group">
                  <label className="label">Property Name *</label>
                  <input
                    type="text"
                    name="property_name"
                    className="input"
                    value={formData.property_name}
                    onChange={handleInputChange}
                    placeholder="e.g., 2018 NW 14th Way"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label">Address *</label>
                  <input
                    type="text"
                    name="address"
                    className="input"
                    value={formData.address}
                    onChange={handleInputChange}
                    placeholder="Street address"
                    required
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label">City *</label>
                    <input
                      type="text"
                      name="city"
                      className="input"
                      value={formData.city}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">State *</label>
                    <input
                      type="text"
                      name="state"
                      className="input"
                      value={formData.state}
                      onChange={handleInputChange}
                      maxLength="2"
                      placeholder="WA"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">ZIP Code *</label>
                    <input
                      type="text"
                      name="zip_code"
                      className="input"
                      value={formData.zip_code}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Property Type</label>
                  <select
                    name="property_type"
                    className="input"
                    value={formData.property_type}
                    onChange={handleInputChange}
                  >
                    <option value="single_family">Single Family</option>
                    <option value="multi_family">Multi Family</option>
                    <option value="condo">Condo</option>
                    <option value="townhouse">Townhouse</option>
                    <option value="land">Land</option>
                    <option value="commercial">Commercial</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>Financial Information</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Purchase Price</label>
                    <input
                      type="number"
                      name="purchase_price"
                      className="input"
                      value={formData.purchase_price}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Purchase Date</label>
                    <input
                      type="date"
                      name="purchase_date"
                      className="input"
                      value={formData.purchase_date}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Current Value</label>
                  <input
                    type="number"
                    name="current_value"
                    className="input"
                    value={formData.current_value}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3>Property Details</h3>

                <div className="form-row">
                  <div className="form-group">
                    <label className="label">Bedrooms</label>
                    <input
                      type="number"
                      name="bedrooms"
                      className="input"
                      value={formData.bedrooms}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Bathrooms</label>
                    <input
                      type="number"
                      step="0.5"
                      name="bathrooms"
                      className="input"
                      value={formData.bathrooms}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                  <div className="form-group">
                    <label className="label">Square Feet</label>
                    <input
                      type="number"
                      name="square_feet"
                      className="input"
                      value={formData.square_feet}
                      onChange={handleInputChange}
                      placeholder="0"
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="label">Notes</label>
                  <textarea
                    name="notes"
                    className="input"
                    value={formData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    placeholder="Additional notes about the property..."
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Property
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Properties;
