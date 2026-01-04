import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMemory } from '../context/MemoryContext';
import apiService from '../services/api';
import './Auth.css';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { refreshData, clearAllData } = useMemory();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      clearAllData();
      await apiService.login(email, password);
      await refreshData();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Invalid email or password');
    } finally {
      setLoading(false);
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
          <h2 className="auth-title">MemoLink'e Giriş Yap</h2>
          <p className="auth-subtitle">Hoş geldin! Lütfen bilgilerini gir.</p>

          <form className="auth-form" onSubmit={handleSubmit}>

            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Email</label>
              <input
                type="email"
                className="form-input"
                placeholder="Email adresini gir"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Şifre</label>
              <input
                type="password"
                className="form-input"
                placeholder="Şifreni gir"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div className="form-footer">
              <span className="auth-link" onClick={() => navigate('/forgot-password')}>
                Şifreni mi unuttun?
              </span>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;
