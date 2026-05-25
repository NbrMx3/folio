import express from 'express';
import { createContactMessage } from '../utils/db.js';

const router = express.Router();

function isValidEmail(email) {
  return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

router.post('/', async (req, res) => {
  try {
    const name = String(req.body?.name || '').trim();
    const email = String(req.body?.email || '').trim();
    const message = String(req.body?.message || '').trim();
    const website = String(req.body?.website || '').trim();

    if (website) {
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

    const saved = await createContactMessage({
      name,
      email,
      message,
      source: 'portfolio',
      status: 'new',
    });

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