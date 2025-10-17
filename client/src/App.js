import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navigation from './components/Navigation';
import AIChat from './components/AIChat';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Opportunities from './pages/Opportunities';
import Wealth from './pages/Wealth';
import Income from './pages/Income';
import Bills from './pages/Bills';
import WealthGrowth from './pages/WealthGrowth';
import Properties from './pages/Properties';
import AISettings from './pages/AISettings';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <Router>
      <div className="App">
        {isAuthenticated && <Navigation user={user} onLogout={handleLogout} />}
        {isAuthenticated && <AIChat />}

        <Routes>
          <Route
            path="/login"
            element={
              !isAuthenticated ? (
                <Login onLogin={handleLogin} />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/register"
            element={
              !isAuthenticated ? (
                <Register onRegister={handleLogin} />
              ) : (
                <Navigate to="/dashboard" />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? <Dashboard /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/transactions"
            element={
              isAuthenticated ? <Transactions /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/budget"
            element={
              isAuthenticated ? <Budget /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/opportunities"
            element={
              isAuthenticated ? <Opportunities /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/wealth"
            element={
              isAuthenticated ? <Wealth /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/income"
            element={
              isAuthenticated ? <Income /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/bills"
            element={
              isAuthenticated ? <Bills /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/wealth-growth"
            element={
              isAuthenticated ? <WealthGrowth /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/properties"
            element={
              isAuthenticated ? <Properties /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/ai-settings"
            element={
              isAuthenticated ? <AISettings /> : <Navigate to="/login" />
            }
          />
          <Route
            path="/"
            element={
              <Navigate to={isAuthenticated ? "/dashboard" : "/login"} />
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
