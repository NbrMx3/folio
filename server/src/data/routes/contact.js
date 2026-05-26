import express from 'express';
import { createContactMessage } from '../utils/db.js';

const router = express.Router();

const RATE_WINDOW_MS = 15 * 60 * 1000;
const MAX_MESSAGES_PER_IP = 4;
const MAX_MESSAGES_PER_EMAIL = 2;
const MIN_SUBMISSION_DELAY_MS = 4000;
const WINDOW_SAFETY_MS = 1000;

const requestBuckets = new Map();
const emailBuckets = new Map();

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.trim()) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function cleanupExpiredBuckets(now = Date.now()) {
  for (const [key, bucket] of requestBuckets.entries()) {
    if (!bucket || bucket.resetAt <= now) {
      requestBuckets.delete(key);
    }
  }

  for (const [key, bucket] of emailBuckets.entries()) {
    if (!bucket || bucket.resetAt <= now) {
      emailBuckets.delete(key);
    }
  }
}

function getBucket(map, key, now) {
  const existing = map.get(key);
  if (!existing || existing.resetAt <= now) {
    const bucket = { count: 0, resetAt: now + RATE_WINDOW_MS };
    map.set(key, bucket);
    return bucket;
  }
  return existing;
}

function looksSpammy(message) {
  const urlCount = (message.match(/https?:\/\/|www\./gi) || []).length;
  if (urlCount > 2) return 'Please remove extra links from your message.';

  const repeatedChars = /(.)\1{7,}/i.test(message);
  if (repeatedChars) return 'Please make your message more natural.';

  const letters = message.replace(/[^a-zA-Z]/g, '');
  if (letters.length > 24) {
    const uppercaseRatio = (letters.match(/[A-Z]/g) || []).length / letters.length;
    if (uppercaseRatio > 0.68) return 'Please avoid writing the message in all caps.';
  }

  return '';
}

router.post('/', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();
    const message = String(req.body?.message || '').trim();
    const website = String(req.body?.website || '').trim();
    const company = String(req.body?.company || '').trim();
    const submittedAt = Number(req.body?.submittedAt || 0);
    const now = Date.now();

    cleanupExpiredBuckets(now);

    const ip = getClientIp(req);
    const ipBucket = getBucket(requestBuckets, ip, now);

    if (ipBucket.count >= MAX_MESSAGES_PER_IP) {
      const retryAfterSeconds = Math.max(1, Math.ceil((ipBucket.resetAt - now) / 1000));
      return res.status(429).json({
        error: 'Too many messages from this network. Please try again later.',
        retryAfterSeconds,
      });
    }

    if (typeof submittedAt === 'number' && submittedAt > 0 && now - submittedAt < MIN_SUBMISSION_DELAY_MS) {
      return res.status(400).json({ error: 'Form submitted too quickly. Please wait a few seconds and try again.' });
    }

    if (website || company) {
      return res.status(200).json({ success: true, message: 'Message received.' });
    }

    if (name.length < 2) {
      return res.status(400).json({ error: 'Please enter your name.' });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }

    if (message.length < 20) {
      return res.status(400).json({ error: 'Your message should be at least 20 characters.' });
    }

    const spamWarning = looksSpammy(message);
    if (spamWarning) {
      return res.status(400).json({ error: spamWarning });
    }

    const emailBucket = getBucket(emailBuckets, email.toLowerCase(), now);
    if (emailBucket.count >= MAX_MESSAGES_PER_EMAIL) {
      const retryAfterSeconds = Math.max(1, Math.ceil((emailBucket.resetAt - now) / 1000));
      return res.status(429).json({
        error: 'You have already sent several messages recently. Please wait before trying again.',
        retryAfterSeconds,
      });
    }

    const saved = await createContactMessage({
      name,
      email,
      message,
      source: 'portfolio',
      status: 'new',
    });

    ipBucket.count += 1;
    emailBucket.count += 1;

    return res.status(201).json({
      success: true,
      message: 'Thanks. Your message was sent successfully.',
      id: saved?.id,
    });
  } catch (error) {
    console.error('Create contact message error:', error);
    return res.status(500).json({ error: 'Failed to send message' });
  }
});

export default router;