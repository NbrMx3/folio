
import express from 'express';
import { verifyToken } from '../routes/middleware/auth.js';
import {
  getTotalViews,
  getViewsByTimeRange,
  getPlatformStats,
  getVisitors,
  getChartData,
  getPlatformDetails,
  clearAnalyticsData,
} from '../utils/db.js';
import { getTraccarHealth, getTraccarOverview } from '../services/traccar.js';

const router = express.Router();

// GET /api/analytics/overview — admin only
router.get('/overview', verifyToken, async (req, res) => {
  try {
    const totalViews = await getTotalViews();
    const todayViews = await getViewsByTimeRange(1);
    const weekViews = await getViewsByTimeRange(7);
    const monthViews = await getViewsByTimeRange(30);
    const platformStats = await getPlatformStats();

    res.json({
      totalViews,
      todayViews,
      weekViews,
      monthViews,
      platformStats,
    });
  } catch (error) {
    console.error('Overview error:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

// GET /api/analytics/visitors — admin only
router.get('/visitors', verifyToken, async (req, res) => {
  try {
    const { page = 1, limit = 20, source } = req.query;
    const result = await getVisitors(parseInt(page), parseInt(limit), source);
    res.json(result);
  } catch (error) {
    console.error('Visitors error:', error);
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

// GET /api/analytics/chart — admin only (daily views for last 30 days)
router.get('/chart', verifyToken, async (req, res) => {
  try {
    const chartData = await getChartData(30);
    res.json(chartData);
  } catch (error) {
    console.error('Chart error:', error);
    res.status(500).json({ error: 'Failed to fetch chart data' });
  }
});

// GET /api/analytics/platforms — admin only
router.get('/platforms', verifyToken, async (req, res) => {
  try {
    const platforms = await getPlatformDetails();
    res.json(platforms);
  } catch (error) {
    console.error('Platforms error:', error);
    res.status(500).json({ error: 'Failed to fetch platforms' });
  }
});

// DELETE /api/analytics/clear — admin only
router.delete('/clear', verifyToken, async (req, res) => {
  try {
    await clearAnalyticsData();
    res.json({ success: true, message: 'Analytics cleared successfully' });
  } catch (error) {
    console.error('Clear analytics error:', error);
    res.status(500).json({ error: 'Failed to clear analytics' });
  }
});

// GET /api/analytics/traccar/overview — admin only
router.get('/traccar/overview', verifyToken, async (req, res) => {
  try {
    const overview = await getTraccarOverview();
    res.json(overview);
  } catch (error) {
    console.error('Traccar overview error:', error);
    res.status(500).json({ error: 'Failed to fetch Traccar analytics' });
  }
});

// GET /api/analytics/traccar/health — admin only
router.get('/traccar/health', verifyToken, async (req, res) => {
  try {
    const health = await getTraccarHealth();
    res.json(health);
  } catch (error) {
    console.error('Traccar health error:', error);
    res.status(500).json({ error: 'Failed to fetch Traccar health diagnostics' });
  }
});

export default router;
