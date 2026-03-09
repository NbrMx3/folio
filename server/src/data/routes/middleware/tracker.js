import express from 'express';
import { addVisitor } from '../../utils/db.js';
import { v4 as uuidv4 } from 'uuid';
import UAParser from 'ua-parser-js';

const router = express.Router();

// Private/loopback IP ranges that cannot be geolocated
const PRIVATE_IP_RE = /^(::1|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::ffff:127\.|fc|fd)/i;

async function geolocate(ip) {
  const cleanIp = ip.replace(/^::ffff:/, '');
  if (!cleanIp || PRIVATE_IP_RE.test(cleanIp)) {
    return { country: 'Unknown', city: 'Unknown', region: 'Unknown' };
  }
  try {
    // ip-api.com free tier: HTTP only, 45 req/min
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,country,regionName,city`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!response.ok) return { country: 'Unknown', city: 'Unknown', region: 'Unknown' };
    const data = await response.json();
    if (data.status !== 'success') return { country: 'Unknown', city: 'Unknown', region: 'Unknown' };
    return {
      country: data.country || 'Unknown',
      city: data.city || 'Unknown',
      region: data.regionName || 'Unknown',
    };
  } catch {
    return { country: 'Unknown', city: 'Unknown', region: 'Unknown' };
  }
}

function buildVisitorBase(req, referer, ua) {
  const rawIp = req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.socket.remoteAddress
    || 'unknown';
  return {
    id: uuidv4(),
    ip: rawIp,
    timestamp: new Date().toISOString(),
    source: detectPlatform(referer),
    referrer: referer,
    browser: ua.getBrowser().name || 'Unknown',
    os: ua.getOS().name || 'Unknown',
    device: ua.getDevice().type || 'desktop',
    page: '/',
  };
}

router.get('/', async (req, res) => {
  res.json({ success: true }); // respond immediately, track async
  try {
    const ua = new UAParser(req.headers['user-agent']);
    const referer = req.query.ref || req.headers.referer || 'direct';
    const base = buildVisitorBase(req, referer, ua);
    base.page = req.query.page || '/';
    const geo = await geolocate(base.ip);
    addVisitor({ ...base, ...geo }).catch(err => console.error('Tracking save error:', err));
  } catch (error) {
    console.error('Tracking error:', error);
  }
});

router.post('/', async (req, res) => {
  res.json({ success: true }); // respond immediately, track async
  try {
    const ua = new UAParser(req.headers['user-agent']);
    const referer = req.body.ref || req.query.ref || req.headers.referer || 'direct';
    const base = buildVisitorBase(req, referer, ua);
    base.page = req.body.page || req.query.page || '/';
    const geo = await geolocate(base.ip);
    addVisitor({ ...base, ...geo }).catch(err => console.error('Tracking save error:', err));
  } catch (error) {
    console.error('Tracking error:', error);
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
