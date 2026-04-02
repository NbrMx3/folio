import crypto from 'crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import { getAdminAuth, updateAdminAuth } from '../utils/db.js';
import { verifyToken } from './middleware/auth.js';

dotenv.config();

const router = express.Router();
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const MIN_PASSWORD_LENGTH = 8;

function normalizeEmail(value) {
  return String(value || '').trim().toLowerCase();
}

function hashResetToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

async function verifyAdminPassword(candidatePassword, adminAuth) {
  if (!candidatePassword) return false;

  if (adminAuth.passwordHash) {
    return bcrypt.compare(candidatePassword, adminAuth.passwordHash);
  }

  return candidatePassword === process.env.ADMIN_PASSWORD;
}

function getUrlOrigin(candidate) {
  if (!candidate) return '';
  const raw = String(candidate).trim();
  try {
    const parsed = new URL(raw);
    if (!['http:', 'https:'].includes(parsed.protocol)) return '';
    if (parsed.username || parsed.password) return '';

    const canonicalPrefix = `${parsed.protocol}//${parsed.host}`.toLowerCase();
    if (!raw.toLowerCase().startsWith(canonicalPrefix)) return '';

    return parsed.origin.replace(/\/+$/, '');
  } catch {
    return '';
  }
}

function buildClientUrl(req) {
  const requestOrigin = getUrlOrigin(req.get('origin'));
  if (requestOrigin) return requestOrigin;

  const refererOrigin = getUrlOrigin(req.get('referer'));
  if (refererOrigin) return refererOrigin;

  const configuredClientUrl = getUrlOrigin(process.env.CLIENT_URL);
  if (configuredClientUrl) return configuredClientUrl;

  return 'http://localhost:5173';
}

async function sendResetEmail({ to, resetUrl }) {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_FROM, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return { delivered: false, reason: 'smtp_not_configured' };
  }

  try {
    const nodemailerModule = await import('nodemailer');
    const nodemailer = nodemailerModule.default || nodemailerModule;
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: String(SMTP_SECURE || '').toLowerCase() === 'true' || Number(SMTP_PORT) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    await transporter.sendMail({
      from: SMTP_FROM || SMTP_USER,
      to,
      subject: 'Admin password reset',
      text: [
        'A password reset was requested for your admin account.',
        '',
        `Use this link to set a new password: ${resetUrl}`,
        '',
        'This link expires in 60 minutes.',
        'If you did not request this reset, you can ignore this email.',
      ].join('\n'),
      html: `
        <p>A password reset was requested for your admin account.</p>
        <p><a href="${resetUrl}">Reset your password</a></p>
        <p>This link expires in 60 minutes.</p>
        <p>If you did not request this reset, you can ignore this email.</p>
      `,
    });

    return { delivered: true };
  } catch (error) {
    console.error('Password reset email failed:', error.message);
    return { delivered: false, reason: 'delivery_failed' };
  }
}

function buildResetResponse(adminAuth, resetUrl, emailResult) {
  const response = {
    recoveryEmail: adminAuth.recoveryEmail,
    emailDelivered: emailResult.delivered,
    message: emailResult.delivered
      ? `Password reset instructions were sent to ${adminAuth.recoveryEmail}.`
      : `A reset link was prepared for ${adminAuth.recoveryEmail}. Configure SMTP to send it automatically by email.`,
  };

  if (!emailResult.delivered) {
    if (process.env.NODE_ENV === 'production') {
      response.notice = 'SMTP is not configured on the server, so the reset email could not be delivered automatically.';
    } else {
      response.previewResetUrl = resetUrl;
    }
  }

  return response;
}

// GET /api/auth/recovery-info
router.get('/recovery-info', async (_req, res) => {
  try {
    const adminAuth = await getAdminAuth();
    res.json({ recoveryEmail: String(adminAuth.recoveryEmail || '').trim() });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load recovery email.' });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const adminAuth = await getAdminAuth();

    if (email !== adminAuth.email) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await verifyAdminPassword(password, adminAuth);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { email, role: 'admin' },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({ token, user: { email, role: 'admin' } });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', async (req, res) => {
  try {
    const requestedEmail = normalizeEmail(req.body.email);
    const adminAuth = await getAdminAuth();
    const recoveryEmail = String(adminAuth.recoveryEmail || '').trim();
    const normalizedRecoveryEmail = normalizeEmail(recoveryEmail);

    if (!normalizedRecoveryEmail) {
      return res.status(500).json({
        error: 'Recovery email is not configured for this admin account.',
      });
    }

    if (requestedEmail !== normalizedRecoveryEmail) {
      return res.status(400).json({
        error: `Password recovery is only enabled for ${recoveryEmail}.`,
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = hashResetToken(resetToken);
    const resetTokenExpiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    const resetUrl = `${buildClientUrl(req)}/admin/reset-password?token=${resetToken}`;

    await updateAdminAuth({
      resetTokenHash,
      resetTokenExpiresAt,
    });

    const emailResult = await sendResetEmail({
      to: recoveryEmail,
      resetUrl,
    });

    res.json(buildResetResponse({ ...adminAuth, recoveryEmail }, resetUrl, emailResult));
  } catch (error) {
    console.error('Forgot password error:', error.message);
    res.status(500).json({ error: 'Unable to start password reset.' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', async (req, res) => {
  try {
    const token = String(req.body.token || '').trim();
    const newPassword = String(req.body.newPassword || '');
    const adminAuth = await getAdminAuth();

    if (!token) {
      return res.status(400).json({ error: 'Missing reset token.' });
    }

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
    }

    if (!adminAuth.resetTokenHash || !adminAuth.resetTokenExpiresAt) {
      return res.status(400).json({ error: 'This reset link is invalid or has already been used.' });
    }

    if (new Date(adminAuth.resetTokenExpiresAt).getTime() < Date.now()) {
      await updateAdminAuth({
        resetTokenHash: '',
        resetTokenExpiresAt: null,
      });
      return res.status(400).json({ error: 'This reset link has expired. Request a new one.' });
    }

    if (hashResetToken(token) !== adminAuth.resetTokenHash) {
      return res.status(400).json({ error: 'This reset link is invalid.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateAdminAuth({
      passwordHash,
      resetTokenHash: '',
      resetTokenExpiresAt: null,
    });

    res.json({
      message: 'Password updated successfully. Sign in with your admin email.',
      loginEmail: adminAuth.email,
    });
  } catch (error) {
    console.error('Reset password error:', error.message);
    res.status(500).json({ error: 'Unable to reset password.' });
  }
});

// GET /api/auth/settings
router.get('/settings', verifyToken, async (_req, res) => {
  try {
    const adminAuth = await getAdminAuth();
    res.json({
      loginEmail: adminAuth.email,
      recoveryEmail: adminAuth.recoveryEmail,
      hasCustomPassword: Boolean(adminAuth.passwordHash),
    });
  } catch (error) {
    res.status(500).json({ error: 'Unable to load authentication settings.' });
  }
});

// POST /api/auth/change-password
router.post('/change-password', verifyToken, async (req, res) => {
  try {
    const currentPassword = String(req.body.currentPassword || '');
    const newPassword = String(req.body.newPassword || '');
    const adminAuth = await getAdminAuth();

    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return res.status(400).json({ error: `New password must be at least ${MIN_PASSWORD_LENGTH} characters long.` });
    }

    const isValidPassword = await verifyAdminPassword(currentPassword, adminAuth);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect.' });
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await updateAdminAuth({
      passwordHash,
      resetTokenHash: '',
      resetTokenExpiresAt: null,
    });

    res.json({ message: 'Password changed successfully.' });
  } catch (error) {
    console.error('Change password error:', error.message);
    res.status(500).json({ error: 'Unable to change password.' });
  }
});

// GET /api/auth/verify
router.get('/verify', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ valid: false });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    res.json({ valid: true, user: decoded });
  } catch {
    res.status(401).json({ valid: false });
  }
});

export default router;
