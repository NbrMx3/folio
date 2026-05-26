import express from 'express';
import UAParser from 'ua-parser-js';
import { verifyToken } from './middleware/auth.js';
import { createDownloadLog, getDownloadLogs, getDownloadSummary, clearDownloadLogs } from '../utils/db.js';

const router = express.Router();

function readRequestIp(req) {
  return req.headers['x-forwarded-for']?.split(',')[0].trim()
    || req.socket.remoteAddress
    || 'unknown';
}

function buildDownloadPayload(req) {
  const parser = new UAParser(req.headers['user-agent']);
  const referrer = req.body?.referrer || req.body?.ref || req.query?.ref || req.headers.referer || 'direct';
  const browser = parser.getBrowser().name || 'Unknown';
  const os = parser.getOS().name || 'Unknown';
  const device = parser.getDevice().type || 'desktop';

  return {
    id: req.body?.id,
    assetType: req.body?.assetType || req.body?.asset_type || 'other',
    assetName: req.body?.assetName || req.body?.asset_name || '',
    assetUrl: req.body?.assetUrl || req.body?.asset_url || '',
    action: req.body?.action || 'download',
    referrer,
    page: req.body?.page || req.query?.page || '/',
    ip: readRequestIp(req),
    browser,
    os,
    device,
    application: browser,
    userAgent: req.headers['user-agent'] || '',
    timestamp: new Date().toISOString(),
  };
}

// Public endpoint for logging a download without blocking the browser action.
router.post('/log', async (req, res) => {
  res.json({ success: true });
  try {
    await createDownloadLog(buildDownloadPayload(req));
  } catch (error) {
    console.error('Download log error:', error);
  }
});

// Admin summary for daily/monthly/yearly totals.
router.get('/summary', verifyToken, async (req, res) => {
  try {
    const summary = await getDownloadSummary();
    res.json(summary);
  } catch (error) {
    console.error('Download summary error:', error);
    res.status(500).json({ error: 'Failed to fetch download summary' });
  }
});

// Admin list for recent download activity.
router.get('/logs', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await getDownloadLogs(page, limit);
    res.json(result);
  } catch (error) {
    console.error('Download log list error:', error);
    res.status(500).json({ error: 'Failed to fetch download logs' });
  }
});

// Admin delete action for download analytics.
router.delete('/clear', verifyToken, async (req, res) => {
  try {
    await clearDownloadLogs();
    res.json({ success: true, message: 'Download analytics cleared successfully' });
  } catch (error) {
    console.error('Clear download analytics error:', error);
    res.status(500).json({ error: 'Failed to clear download analytics' });
  }
});

export default router;