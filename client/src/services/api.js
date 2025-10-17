import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  register: (data) => api.post('/auth/register', data),
  login: (data) => api.post('/auth/login', data),
};

// Transactions API
export const transactionsAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getOne: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
};

// Budget API
export const budgetAPI = {
  getOverview: () => api.get('/budget/overview'),
  getAnalysis: () => api.get('/budget/analysis'),
  getGoals: () => api.get('/budget/goals'),
  setGoal: (data) => api.post('/budget/goals', data),
};

// Opportunities API
export const opportunitiesAPI = {
  getAll: (params) => api.get('/opportunities', { params }),
  getOne: (id) => api.get(`/opportunities/${id}`),
  getAnalytics: () => api.get('/opportunities/analytics'),
  create: (data) => api.post('/opportunities', data),
  update: (id, data) => api.put(`/opportunities/${id}`, data),
  delete: (id) => api.delete(`/opportunities/${id}`),
};

// Wealth API
export const wealthAPI = {
  // Net Worth
  getNetWorth: () => api.get('/wealth/networth'),
  saveNetWorthSnapshot: (data) => api.post('/wealth/networth/snapshot', data),
  getNetWorthHistory: () => api.get('/wealth/networth/history'),

  // Accounts (Checking, Savings, Credit Cards, Loans)
  getAccounts: (params) => api.get('/wealth/accounts', { params }),
  createAccount: (data) => api.post('/wealth/accounts', data),
  updateAccount: (id, data) => api.put(`/wealth/accounts/${id}`, data),
  deleteAccount: (id) => api.delete(`/wealth/accounts/${id}`),

  // Retirement Accounts
  getRetirementAccounts: () => api.get('/wealth/retirement'),
  createRetirementAccount: (data) => api.post('/wealth/retirement', data),
  updateRetirementAccount: (id, data) => api.put(`/wealth/retirement/${id}`, data),
  deleteRetirementAccount: (id) => api.delete(`/wealth/retirement/${id}`),

  // Assets
  getAssets: () => api.get('/wealth/assets'),
  createAsset: (data) => api.post('/wealth/assets', data),
  updateAsset: (id, data) => api.put(`/wealth/assets/${id}`, data),
  deleteAsset: (id) => api.delete(`/wealth/assets/${id}`),

  // Financial Targets
  getTargets: () => api.get('/wealth/targets'),
  createTarget: (data) => api.post('/wealth/targets', data),
  updateTarget: (id, data) => api.put(`/wealth/targets/${id}`, data),
  deleteTarget: (id) => api.delete(`/wealth/targets/${id}`),

  // Credit Score
  getCreditScores: () => api.get('/wealth/credit'),
  addCreditScore: (data) => api.post('/wealth/credit', data),
};

// Income API
export const incomeAPI = {
  getAll: (params) => api.get('/income', { params }),
  getOne: (id) => api.get(`/income/${id}`),
  getSummary: () => api.get('/income/summary'),
  create: (data) => api.post('/income', data),
  update: (id, data) => api.put(`/income/${id}`, data),
  delete: (id) => api.delete(`/income/${id}`),
};

// Bills API
export const billsAPI = {
  getAll: (params) => api.get('/bills', { params }),
  getOne: (id) => api.get(`/bills/${id}`),
  getSummary: () => api.get('/bills/analytics/summary'),
  getTrending: () => api.get('/bills/analytics/trending'),
  create: (data) => api.post('/bills', data),
  update: (id, data) => api.put(`/bills/${id}`, data),
  delete: (id) => api.delete(`/bills/${id}`),
  recordPayment: (id, data) => api.post(`/bills/${id}/payment`, data),
};

// AI API
export const aiAPI = {
  getInsights: () => api.get('/ai/insights'),
  chat: (message) => api.post('/ai/chat', { message }),
  getWealthGrowthOpportunities: () => api.get('/ai/wealth-growth'),
  generateWealthGrowthPlan: () => api.get('/ai/wealth-growth'),
};

// AI Tokens API
export const aiTokensAPI = {
  getAll: () => api.get('/ai-tokens'),
  create: (data) => api.post('/ai-tokens', data),
  toggle: (id) => api.put(`/ai-tokens/${id}/toggle`),
  delete: (id) => api.delete(`/ai-tokens/${id}`),
  test: (data) => api.post('/ai-tokens/test', data),
  getLinks: () => api.get('/ai-tokens/links'),
  getStatus: () => api.get('/ai-tokens/status'),
};

// Properties API
export const propertiesAPI = {
  // Properties
  getAll: () => api.get('/properties'),
  getOne: (id) => api.get(`/properties/${id}`),
  create: (data) => api.post('/properties', data),
  update: (id, data) => api.put(`/properties/${id}`, data),
  delete: (id) => api.delete(`/properties/${id}`),
  getSummary: (id) => api.get(`/properties/${id}/summary`),

  // Loans
  getLoans: (propertyId) => api.get(`/properties/${propertyId}/loans`),
  addLoan: (propertyId, data) => api.post(`/properties/${propertyId}/loans`, data),
  updateLoan: (propertyId, loanId, data) => api.put(`/properties/${propertyId}/loans/${loanId}`, data),

  // Income
  getIncome: (propertyId) => api.get(`/properties/${propertyId}/income`),
  addIncome: (propertyId, data) => api.post(`/properties/${propertyId}/income`, data),

  // Expenses
  getExpenses: (propertyId) => api.get(`/properties/${propertyId}/expenses`),
  addExpense: (propertyId, data) => api.post(`/properties/${propertyId}/expenses`, data),

  // Tenants
  getTenants: (propertyId) => api.get(`/properties/${propertyId}/tenants`),
  addTenant: (propertyId, data) => api.post(`/properties/${propertyId}/tenants`, data),
  updateTenant: (propertyId, tenantId, data) => api.put(`/properties/${propertyId}/tenants/${tenantId}`, data),
};

export default api;
