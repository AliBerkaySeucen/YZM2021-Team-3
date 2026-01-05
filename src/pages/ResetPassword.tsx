import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
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
      setError('Şifre sıfırlama linki geçersiz veya eksik');
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
      setError('Lütfen tüm alanları doldurun');
      return;
    }

    if (password.length < 8) {
      setError('Şifre en az 8 karakter olmalıdır');
      return;
    }

    if (password !== confirmPassword) {
      setError('Şifreler eşleşmiyor');
      return;
    }

    if (!token) {
      setError('Geçersiz sıfırlama token');
      return;
    }

    setIsLoading(true);

    try {
      const response = await apiService.resetPassword(token, password);
      toast.success(response.message || 'Şifreniz başarıyla sıfırlandı!');
      setTimeout(() => navigate('/login'), 1500);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Şifre sıfırlama başarısız oldu. Token geçersiz veya süresi dolmuş olabilir.');
      setTokenValid(false);
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="auth-container">
        <header className="auth-header-bar">
          <h1 className="auth-logo" onClick={() => navigate('/')}>MemoLink</h1>
          <div className="auth-nav">
            <button className="btn-nav-secondary" onClick={() => navigate('/login')}>
              Giriş Yap →
            </button>
          </div>
        </header>

        <div className="auth-main">
          <div className="auth-content">
            <h2 className="auth-title">Token Doğrulanıyor...</h2>
            <p className="auth-subtitle">Lütfen bekleyin</p>
          </div>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="auth-container">
        <header className="auth-header-bar">
          <h1 className="auth-logo" onClick={() => navigate('/')}>MemoLink</h1>
          <div className="auth-nav">
            <button className="btn-nav-secondary" onClick={() => navigate('/login')}>
              Giriş Yap →
            </button>
          </div>
        </header>

        <div className="auth-main">
          <div className="auth-content">
            <h2 className="auth-title">Geçersiz veya Süresi Dolmuş Token</h2>
            <p className="auth-subtitle">{error}</p>

            <form className="auth-form">
              <button className="auth-button" onClick={() => navigate('/forgot-password')}>
                Yeni Sıfırlama Linki İste
              </button>

              <div className="auth-footer">
                <span className="auth-link" onClick={() => navigate('/login')}>
                  Giriş Yap
                </span>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <header className="auth-header-bar">
        <h1 className="auth-logo" onClick={() => navigate('/')}>MemoLink</h1>
        <div className="auth-nav">
          <span>Zaten hesabın var mı?</span>
          <button className="btn-nav-secondary" onClick={() => navigate('/login')}>
            Giriş Yap →
          </button>
        </div>
      </header>

      <div className="auth-main">
        <div className="auth-content">
          <h2 className="auth-title">Şifreni Sıfırla</h2>
          <p className="auth-subtitle">Yeni şifreni belirle</p>

          <form className="auth-form" onSubmit={handleSubmit}>
            {error && <div className="auth-error">{error}</div>}

            <div className="form-group">
              <label className="form-label">Yeni Şifre</label>
              <input
                type="password"
                className="form-input"
                placeholder="Yeni şifreni gir (min. 8 karakter)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Şifre Tekrar</label>
              <input
                type="password"
                className="form-input"
                placeholder="Şifreni tekrar gir"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Şifre sıfırlanıyor...' : 'Şifremi Sıfırla'}
            </button>

            <div className="auth-footer">
              <span className="auth-link" onClick={() => navigate('/login')}>
                Giriş Yap
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
