import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getRecoveryInfo,
  login,
  requestPasswordReset,
  setToken,
} from '../../utils/api';
import './AdminLogin.css';

const DEFAULT_RECOVERY_EMAIL = 'kipkemoi386@gmail.com';

const AdminLogin = () => {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryEmail, setRecoveryEmail] = useState(DEFAULT_RECOVERY_EMAIL);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [previewResetUrl, setPreviewResetUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const loadRecoveryInfo = async () => {
      try {
        const data = await getRecoveryInfo();
        if (isMounted && data?.recoveryEmail) {
          setRecoveryEmail(data.recoveryEmail);
        }
      } catch {
        // Fall back to the configured default recovery email.
      }
    };

    loadRecoveryInfo();

    return () => {
      isMounted = false;
    };
  }, []);

  const switchMode = (nextMode) => {
    setMode(nextMode);
    setError('');
    setStatus('');
    setPreviewResetUrl('');
    setLoading(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setPreviewResetUrl('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.token) {
        setToken(data.token);
        navigate('/admin');
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Server error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');
    setPreviewResetUrl('');
    setLoading(true);

    try {
      const data = await requestPasswordReset(recoveryEmail);
      if (data.error) {
        setError(data.error);
      } else {
        setStatus(data.message || `Reset instructions were sent to ${recoveryEmail}.`);
        setPreviewResetUrl(data.previewResetUrl || '');
      }
    } catch {
      setError('Unable to start password reset right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="login-card">
        <div className="login-header">
          <h1>
            Cyber<span className="highlight">Dev</span>
          </h1>
          <p>{mode === 'login' ? 'Admin Dashboard' : 'Password Recovery'}</p>
        </div>

        {mode === 'login' ? (
          <form className="login-form" onSubmit={handleSubmit}>
            {error && <div className="login-error">{error}</div>}
            {status && <div className="login-success">{status}</div>}

            <div className="login-field">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@cyberdev.com"
                required
              />
            </div>

            <div className="login-field">
              <label>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>

            <button type="button" className="forgot-link" onClick={() => switchMode('forgot')}>
              Forgot password?
            </button>

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        ) : (
          <form className="login-form" onSubmit={handleForgotPassword}>
            {error && <div className="login-error">{error}</div>}
            {status && <div className="login-success">{status}</div>}

            <div className="login-note">
              Reset requests are restricted to the admin recovery email below.
            </div>

            <div className="login-field">
              <label>Recovery Email</label>
              <input type="email" value={recoveryEmail} readOnly />
            </div>

            {previewResetUrl && (
              <a href={previewResetUrl} className="reset-preview-link">
                Open reset link
              </a>
            )}

            <button type="submit" className="login-btn" disabled={loading}>
              {loading ? 'Preparing reset...' : 'Send Reset Link'}
            </button>

            <button
              type="button"
              className="secondary-link-btn"
              onClick={() => switchMode('login')}
            >
              Back to sign in
            </button>
          </form>
        )}

        <a href="/" className="back-link">
          &larr; Back to Portfolio
        </a>
      </div>
    </div>
  );
};

export default AdminLogin;
