import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { resetPassword } from '../../utils/api';
import './AdminResetPassword.css';

const AdminResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token') || '';
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setStatus('');

    if (!token) {
      setError('This reset link is missing its token. Request a new one.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const data = await resetPassword(token, newPassword);
      if (data.error) {
        setError(data.error);
      } else {
        setStatus(data.message || 'Password reset complete. You can sign in now.');
      }
    } catch {
      setError('Unable to reset password right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-reset-page">
      <div className="admin-reset-card">
        <div className="admin-reset-header">
          <h1>Reset Admin Password</h1>
          <p>Choose a new password for your admin account.</p>
        </div>

        <form className="admin-reset-form" onSubmit={handleSubmit}>
          {error && <div className="admin-reset-error">{error}</div>}
          {status && <div className="admin-reset-success">{status}</div>}

          <div className="admin-reset-field">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className="admin-reset-field">
            <label>Confirm Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
            />
          </div>

          <button type="submit" className="admin-reset-btn" disabled={loading}>
            {loading ? 'Saving password...' : 'Reset Password'}
          </button>
        </form>

        <div className="admin-reset-links">
          {status ? (
            <button type="button" className="admin-reset-link-btn" onClick={() => navigate('/admin/login')}>
              Back to sign in
            </button>
          ) : (
            <Link to="/admin/login" className="admin-reset-link-btn">
              Back to sign in
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminResetPassword;
