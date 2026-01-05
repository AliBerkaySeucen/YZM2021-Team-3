import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import apiService from '../services/api';
import './Auth.css';

const ForgotPassword: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email.trim()) {
      setError('Please enter your email address');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.forgotPassword(email);
      setMessage(response.message);
      toast.info(response.message);
      setEmail('');
    } catch (err: any) {
      const errorMsg = err.response?.data?.detail || err.message || 'Sıfırlama linki gönderilemedi. Lütfen tekrar deneyin.';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <header className="auth-header-bar">
        <h1 className="auth-logo" onClick={() => navigate('/')}>MemoLink</h1>
        <div className="auth-nav">
          <span>Hesabın yok mu?</span>
          <button className="btn-nav-secondary" onClick={() => navigate('/signup')}>
            Kayıt Ol →
          </button>
        </div>
      </header>

      <div className="auth-main">
        <div className="auth-content">
          <h2 className="auth-title">Şifreni mi Unuttun?</h2>
          <p className="auth-subtitle">Email adresini gir, sıfırlama linki gönderelim</p>

          <form className="auth-form" onSubmit={handleSubmit}>

            {error && <div className="auth-error">{error}</div>}
            {message && <div className="auth-success">{message}</div>}

            <div className="form-group">
              <label className="form-label">Email Adresi</label>
              <input
                type="email"
                className="form-input"
                placeholder="Kayıtlı email adresini gir"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Gönderiliyor...' : 'Sıfırlama Linki Gönder'}
            </button>

            <div className="auth-footer">
              <span>Şifreni hatırladın mı? </span>
              <button type="button" className="auth-link" onClick={() => navigate('/login')}>
                Giriş Yap
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
