import express from 'express';
import { addVisitor } from '../../utils/db.js';
import { v4 as uuidv4 } from 'uuid';
import UAParser from 'ua-parser-js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const ua = new UAParser(req.headers['user-agent']);
    const referer = req.query.ref || req.headers.referer || 'direct';
    const source = detectPlatform(referer);

    const visitor = {
      id: uuidv4(),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
      timestamp: new Date().toISOString(),
      source,
      referrer: referer,
      browser: ua.getBrowser().name || 'Unknown',
      os: ua.getOS().name || 'Unknown',
      device: ua.getDevice().type || 'desktop',
      country: req.query.country || 'Unknown',
      page: req.query.page || '/',
    };

    addVisitor(visitor).catch(err => console.error('Tracking save error:', err));
    res.json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    res.json({ success: true });
  }
});

router.post('/', async (req, res) => {
  // Allow POST tracking as well
  try {
    const ua = new UAParser(req.headers['user-agent']);
    const referer = req.body.ref || req.query.ref || req.headers.referer || 'direct';
    const source = detectPlatform(referer);

    const visitor = {
      id: uuidv4(),
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
      timestamp: new Date().toISOString(),
      source,
      referrer: referer,
      browser: ua.getBrowser().name || 'Unknown',
      os: ua.getOS().name || 'Unknown',
      device: ua.getDevice().type || 'desktop',
      country: req.body.country || req.query.country || 'Unknown',
      page: req.body.page || req.query.page || '/',
    };

    addVisitor(visitor).catch(err => console.error('Tracking save error:', err));
    res.json({ success: true });
  } catch (error) {
    console.error('Tracking error:', error);
    res.json({ success: true });
  }
});

export default router;

function detectPlatform(referer) {
  const ref = referer.toLowerCase();
  if (ref.includes('linkedin')) return 'LinkedIn';
  if (ref.includes('github')) return 'GitHub';
  if (ref.includes('twitter') || ref.includes('x.com')) return 'Twitter/X';
  if (ref.includes('facebook') || ref.includes('fb.com')) return 'Facebook';
  if (ref.includes('instagram')) return 'Instagram';
  if (ref.includes('youtube')) return 'YouTube';
  if (ref.includes('tiktok')) return 'TikTok';
  if (ref.includes('reddit')) return 'Reddit';
  if (ref.includes('google')) return 'Google';
  if (ref.includes('bing')) return 'Bing';
  if (ref === 'direct') return 'Direct';
  return 'Other';
}
