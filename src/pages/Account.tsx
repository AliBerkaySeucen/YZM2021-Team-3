import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemory } from '../context/MemoryContext';
import apiService from '../services/api';
import { toast } from 'react-toastify';
import './Account.css';

const Account: React.FC = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode, clearAllData } = useMemory();
  const currentUser = JSON.parse(localStorage.getItem('memolink_current_user') || '{}');
  
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState(currentUser.name?.split(' ')[0] || '');
  const [surname, setSurname] = useState(currentUser.name?.split(' ').slice(1).join(' ') || '');
  const [email, setEmail] = useState(currentUser.email || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handleLogout = () => {
    apiService.logout(clearAllData);
  };

  const handleSave = async () => {
    if (!firstName.trim()) {
      toast.error('First name is required');
      return;
    }

    if (password && password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (password && password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }

    setIsSaving(true);
    try {
      // Update first name if changed
      if (firstName !== currentUser.name?.split(' ')[0]) {
        await apiService.updateProfile('first_name', firstName);
      }

      // Update surname if changed
      if (surname !== currentUser.name?.split(' ').slice(1).join(' ')) {
        await apiService.updateProfile('surname', surname);
      }

      // Update password if provided
      if (password) {
        await apiService.updateProfile('password', password);
      }

      // Refresh user data
      const updatedUser = await apiService.getCurrentUser();
      localStorage.setItem('memolink_current_user', JSON.stringify(updatedUser));

      toast.success('Profile updated successfully!');
      setIsEditing(false);
      setPassword('');
      setConfirmPassword('');
      
      // Refresh page to show updated data
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.detail || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFirstName(currentUser.name?.split(' ')[0] || '');
    setSurname(currentUser.name?.split(' ').slice(1).join(' ') || '');
    setEmail(currentUser.email || '');
    setPassword('');
    setConfirmPassword('');
    setIsEditing(false);
  };

  return (
    <div className="account">
      <h1 className="page-title">Account Settings</h1>
      
      <div className="account-container">
        <div className="account-card">
          <div className="account-card-header">
            <h2 className="account-section-title">Profile Information</h2>
            {!isEditing && (
              <button className="edit-profile-btn" onClick={() => setIsEditing(true)}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                </svg>
                Edit Profile
              </button>
            )}
          </div>
          
          {!isEditing ? (
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
              
              <div className="info-item">
                <span className="info-label">Account Type:</span>
                <span className="info-value premium-status">
                  {currentUser.is_premium ? (
                    <span className="premium-text">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      Premium
                    </span>
                  ) : (
                    <span className="free-text">
                      Free ({currentUser.memory_limit || 30} memories limit)
                    </span>
                  )}
                </span>
              </div>
            </div>
          ) : (
            <div className="account-edit-form">
              <div className="form-group-edit">
                <label className="form-label-edit">First Name</label>
                <input
                  type="text"
                  className="form-input-edit"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Enter first name"
                />
              </div>

              <div className="form-group-edit">
                <label className="form-label-edit">Surname</label>
                <input
                  type="text"
                  className="form-input-edit"
                  value={surname}
                  onChange={(e) => setSurname(e.target.value)}
                  placeholder="Enter surname"
                />
              </div>

              <div className="form-group-edit">
                <label className="form-label-edit">Email (cannot be changed)</label>
                <input
                  type="email"
                  className="form-input-edit"
                  value={email}
                  disabled
                  style={{ 
                    backgroundColor: 'var(--input-disabled-bg, #e8e8e8)', 
                    cursor: 'not-allowed', 
                    opacity: 1,
                    color: 'var(--text-primary, #333)'
                  }}
                />
              </div>

              <div className="form-group-edit">
                <label className="form-label-edit">New Password (leave empty to keep current)</label>
                <input
                  type="password"
                  className="form-input-edit"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter new password"
                />
              </div>

              <div className="form-group-edit">
                <label className="form-label-edit">Confirm Password</label>
                <input
                  type="password"
                  className="form-input-edit"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                />
              </div>

              <div className="edit-actions">
                <button 
                  className="btn-cancel-edit" 
                  onClick={handleCancel}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button 
                  className="btn-save-edit" 
                  onClick={handleSave}
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}
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
