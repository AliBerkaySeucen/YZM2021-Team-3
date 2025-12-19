import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemory } from '../context/MemoryContext';
import apiService from '../services/api';
import './Account.css';

const Account: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, clearAllData } = useMemory();
  const currentUser = JSON.parse(localStorage.getItem('memolink_current_user') || '{}');

  const handleLogout = () => {
    apiService.logout(clearAllData);
  };

  return (
    <div className="account">
      <h1 className="page-title">Account Settings</h1>
      
      <div className="account-container">
        <div className="account-card">
          <h2 className="account-section-title">Profile Information</h2>
          
          <div className="account-info">
            <div className="info-item">
              <span className="info-label">Name:</span>
              <span className="info-value">{currentUser.name || 'Not set'}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Email:</span>
              <span className="info-value">{currentUser.email || 'Not set'}</span>
            </div>
            
            <div className="info-item">
              <span className="info-label">Member Since:</span>
              <span className="info-value">
                {currentUser.createdAt 
                  ? new Date(currentUser.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })
                  : 'Unknown'}
              </span>
            </div>
          </div>
        </div>

        <div className="account-card">
          <h2 className="account-section-title">Preferences</h2>
          
          <div className="preference-item">
            <div className="preference-info">
              <span className="preference-label">Dark Mode</span>
              <span className="preference-description">Toggle between light and dark theme</span>
            </div>
            <button 
              className={`dark-mode-toggle-account ${darkMode ? 'active' : ''}`}
              onClick={toggleDarkMode}
              aria-label="Toggle dark mode"
            >
              <div className="toggle-slider">
                {darkMode ? (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                    <circle cx="12" cy="12" r="5"></circle>
                    <line x1="12" y1="1" x2="12" y2="3"></line>
                    <line x1="12" y1="21" x2="12" y2="23"></line>
                    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
                    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
                    <line x1="1" y1="12" x2="3" y2="12"></line>
                    <line x1="21" y1="12" x2="23" y2="12"></line>
                    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
                    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
                  </svg>
                )}
              </div>
            </button>
          </div>
        </div>

        <div className="account-card">
          <h2 className="account-section-title">Account Actions</h2>
          
          <button className="logout-btn" onClick={handleLogout}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default Account;
