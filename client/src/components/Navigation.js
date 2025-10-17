import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

function Navigation({ user, onLogout }) {
  const location = useLocation();
  const [activeDropdown, setActiveDropdown] = useState(null);

  const isActive = (path) => location.pathname === path;

  const isGroupActive = (paths) => paths.some(path => location.pathname === path);

  const toggleDropdown = (dropdown) => {
    setActiveDropdown(activeDropdown === dropdown ? null : dropdown);
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>💰 Timu Financial</h2>
        </div>

        <ul className="nav-menu">
          <li>
            <Link
              to="/dashboard"
              className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            >
              🏠 Dashboard
            </Link>
          </li>

          <li className="nav-dropdown">
            <button
              className={`nav-link dropdown-toggle ${isGroupActive(['/transactions', '/income', '/bills']) ? 'active' : ''}`}
              onClick={() => toggleDropdown('cashflow')}
            >
              💸 Cash Flow
            </button>
            {activeDropdown === 'cashflow' && (
              <ul className="dropdown-menu">
                <li>
                  <Link to="/income" className={`dropdown-item ${isActive('/income') ? 'active' : ''}`}>
                    Income
                  </Link>
                </li>
                <li>
                  <Link to="/bills" className={`dropdown-item ${isActive('/bills') ? 'active' : ''}`}>
                    Bills
                  </Link>
                </li>
                <li>
                  <Link to="/transactions" className={`dropdown-item ${isActive('/transactions') ? 'active' : ''}`}>
                    Transactions
                  </Link>
                </li>
              </ul>
            )}
          </li>

          <li>
            <Link
              to="/budget"
              className={`nav-link ${isActive('/budget') ? 'active' : ''}`}
            >
              📊 Budget
            </Link>
          </li>

          <li>
            <Link
              to="/ai-settings"
              className={`nav-link ${isActive('/ai-settings') ? 'active' : ''}`}
            >
              🤖 AI Assistant
            </Link>
          </li>

          <li className="nav-dropdown">
            <button
              className={`nav-link dropdown-toggle ${isGroupActive(['/wealth', '/opportunities', '/wealth-growth', '/properties']) ? 'active' : ''}`}
              onClick={() => toggleDropdown('wealth')}
            >
              💎 Wealth
            </button>
            {activeDropdown === 'wealth' && (
              <ul className="dropdown-menu">
                <li>
                  <Link to="/wealth" className={`dropdown-item ${isActive('/wealth') ? 'active' : ''}`}>
                    Net Worth
                  </Link>
                </li>
                <li>
                  <Link to="/properties" className={`dropdown-item ${isActive('/properties') || location.pathname.startsWith('/properties/') ? 'active' : ''}`}>
                    Properties
                  </Link>
                </li>
                <li>
                  <Link to="/wealth-growth" className={`dropdown-item ${isActive('/wealth-growth') ? 'active' : ''}`}>
                    Growth Opportunities
                  </Link>
                </li>
                <li>
                  <Link to="/opportunities" className={`dropdown-item ${isActive('/opportunities') ? 'active' : ''}`}>
                    Opportunities
                  </Link>
                </li>
              </ul>
            )}
          </li>
        </ul>

        <div className="nav-user">
          <span className="user-name">{user?.username}</span>
          <button onClick={onLogout} className="btn btn-outline btn-sm">
            Logout
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navigation;
