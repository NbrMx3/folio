import express from 'express';
import { getDevicePositions, getDevices, getPositions } from '../services/traccarApi.js';

const router = express.Router();

// GET /api/traccar/devices
router.get('/devices', async (req, res) => {
  try {
    const devices = await getDevices();
    res.json({ devices });
  } catch (error) {
    console.error('GET /api/traccar/devices error:', error.message);
    res.status(502).json({ error: error.message || 'Failed to fetch Traccar devices' });
  }
});

// GET /api/traccar/positions?deviceId=123
router.get('/positions', async (req, res) => {
  try {
    const { deviceId } = req.query;
    const positions = deviceId ? await getDevicePositions(deviceId) : await getPositions();
    res.json({ positions });
  } catch (error) {
    console.error('GET /api/traccar/positions error:', error.message);
    res.status(502).json({ error: error.message || 'Failed to fetch Traccar positions' });
  }
});

export default router;
