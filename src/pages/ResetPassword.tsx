import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiService from '../services/api';
import './Auth.css';

const ResetPassword: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const token = searchParams.get('token');

  useEffect(() => {
    // Validate token on mount
    if (!token) {
      setTokenValid(false);
      setError('Invalid or missing reset token');
      return;
    }

    // Token validation will happen on backend when submitting
    setTokenValid(true);
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!password.trim() || !confirmPassword.trim()) {
      setError('Please fill in all fields');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (!token) {
      setError('Invalid reset token');
      return;
    }

    setIsLoading(true);

    try {
      await apiService.resetPassword(token, password);
      alert('Password reset successful! You can now login with your new password.');
      navigate('/login');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to reset password. Token may be invalid or expired.');
      setTokenValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-logo">MemoLink</h1>
            <p className="auth-tagline">Your memories, beautifully connected</p>
          </div>
          <div className="auth-form">
            <div className="auth-loading">
              <svg className="loading-spinner" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"></path>
              </svg>
              <p>Validating reset token...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <div className="auth-header">
            <h1 className="auth-logo">MemoLink</h1>
            <p className="auth-tagline">Your memories, beautifully connected</p>
          </div>
          <div className="auth-form">
            <div className="token-invalid">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="15" y1="9" x2="9" y2="15"></line>
                <line x1="9" y1="9" x2="15" y2="15"></line>
              </svg>
              <h2 className="auth-title">Invalid or Expired Token</h2>
              <p className="auth-subtitle">{error}</p>
              <button className="auth-button" onClick={() => navigate('/forgot-password')}>
                Request New Reset Link
              </button>
              <div className="auth-footer">
                <span className="auth-link" onClick={() => navigate('/login')}>
                  Back to Login
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <div className="auth-header">
          <h1 className="auth-logo">MemoLink</h1>
          <p className="auth-tagline">Your memories, beautifully connected</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <h2 className="auth-title">Reset Password</h2>
          <p className="auth-subtitle">Enter your new password</p>

          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Enter new password (min. 8 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <div className="password-strength">
              {password.length > 0 && (
                <div className={`strength-bar ${
                  password.length < 8 ? 'weak' : 
                  password.length < 12 ? 'medium' : 'strong'
                }`}>
                  <div className="strength-bar-fill"></div>
                </div>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="Re-enter your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isLoading}
            />
            {confirmPassword.length > 0 && password !== confirmPassword && (
              <div className="password-mismatch">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="15" y1="9" x2="9" y2="15"></line>
                  <line x1="9" y1="9" x2="15" y2="15"></line>
                </svg>
                Passwords do not match
              </div>
            )}
            {confirmPassword.length > 0 && password === confirmPassword && password.length >= 8 && (
              <div className="password-match">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                Passwords match
              </div>
            )}
          </div>

          <button type="submit" className="auth-button" disabled={isLoading}>
            {isLoading ? (
              <span className="button-spinner">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" opacity="0.25"></circle>
                  <path d="M12 2a10 10 0 0 1 10 10" strokeLinecap="round"></path>
                </svg>
                Resetting...
              </span>
            ) : (
              'Reset Password'
            )}
          </button>

          <div className="auth-footer">
            Remember your password?{' '}
            <span className="auth-link" onClick={() => navigate('/login')}>
              Back to Login
            </span>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ResetPassword;
