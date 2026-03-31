import { useEffect, useState } from 'react';
import {
  changeAdminPassword,
  getAuthSettings,
  requestPasswordReset,
} from '../../../utils/api';
import './AuthenticationSettings.css';

const AuthenticationSettings = () => {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [recoveryMessage, setRecoveryMessage] = useState('');
  const [recoveryError, setRecoveryError] = useState('');
  const [previewResetUrl, setPreviewResetUrl] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [sendingRecovery, setSendingRecovery] = useState(false);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const data = await getAuthSettings();
      setSettings(data);
    } catch {
      setRecoveryError('Unable to load authentication settings right now.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.');
      return;
    }

    setSavingPassword(true);

    try {
      const data = await changeAdminPassword(currentPassword, newPassword);
      if (data.error) {
        setPasswordError(data.error);
      } else {
        setPasswordMessage(data.message || 'Password updated successfully.');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        await loadSettings();
      }
    } catch {
      setPasswordError('Unable to update the password right now.');
    } finally {
      setSavingPassword(false);
    }
  };

  const handleSendRecovery = async () => {
    if (!settings?.recoveryEmail) return;

    setRecoveryError('');
    setRecoveryMessage('');
    setPreviewResetUrl('');
    setSendingRecovery(true);

    try {
      const data = await requestPasswordReset(settings.recoveryEmail);
      if (data.error) {
        setRecoveryError(data.error);
      } else {
        setRecoveryMessage(data.message || `Recovery instructions were sent to ${settings.recoveryEmail}.`);
        setPreviewResetUrl(data.previewResetUrl || '');
      }
    } catch {
      setRecoveryError('Unable to send the recovery link right now.');
    } finally {
      setSendingRecovery(false);
    }
  };

  if (loading) {
    return <div className="auth-settings-loading">Loading authentication settings...</div>;
  }

  return (
    <section className="auth-settings">
      <div className="auth-settings-grid">
        <article className="auth-summary-card">
          <span className="auth-summary-label">Sign-in Email</span>
          <strong>{settings?.loginEmail || 'Not set'}</strong>
          <p>Use this address to log into the admin dashboard after resetting the password.</p>
        </article>

        <article className="auth-summary-card">
          <span className="auth-summary-label">Recovery Email</span>
          <strong>{settings?.recoveryEmail || 'Not set'}</strong>
          <p>Forgot-password requests are locked to this recovery email.</p>
        </article>

        <article className="auth-summary-card">
          <span className="auth-summary-label">Password Status</span>
          <strong>{settings?.hasCustomPassword ? 'Custom password saved' : 'Using current configured password'}</strong>
          <p>Changing the password here will override the existing admin password for future sign-ins.</p>
        </article>
      </div>

      <div className="auth-panels">
        <div className="auth-panel">
          <div className="auth-panel-header">
            <h2>Password Recovery</h2>
            <p>Send a fresh reset link to the configured recovery inbox.</p>
          </div>

          {recoveryError && <div className="auth-feedback auth-feedback-error">{recoveryError}</div>}
          {recoveryMessage && <div className="auth-feedback auth-feedback-success">{recoveryMessage}</div>}

          {previewResetUrl && (
            <a href={previewResetUrl} className="auth-preview-link">
              Open local reset link
            </a>
          )}

          <button
            type="button"
            className="auth-primary-btn"
            onClick={handleSendRecovery}
            disabled={sendingRecovery}
          >
            {sendingRecovery ? 'Preparing link...' : 'Send Recovery Link'}
          </button>
        </div>

        <form className="auth-panel" onSubmit={handlePasswordChange}>
          <div className="auth-panel-header">
            <h2>Change Password</h2>
            <p>Update the admin password while you are already signed in.</p>
          </div>

          {passwordError && <div className="auth-feedback auth-feedback-error">{passwordError}</div>}
          {passwordMessage && <div className="auth-feedback auth-feedback-success">{passwordMessage}</div>}

          <div className="auth-field">
            <label>Current Password</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="Current password"
              required
            />
          </div>

          <div className="auth-field">
            <label>New Password</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="At least 8 characters"
              required
            />
          </div>

          <div className="auth-field">
            <label>Confirm New Password</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Repeat new password"
              required
            />
          </div>

          <button type="submit" className="auth-primary-btn" disabled={savingPassword}>
            {savingPassword ? 'Saving password...' : 'Update Password'}
          </button>
        </form>
      </div>
    </section>
  );
};

export default AuthenticationSettings;
