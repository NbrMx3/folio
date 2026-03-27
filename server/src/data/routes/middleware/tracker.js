import express from 'express';
import { addVisitor } from '../../utils/db.js';
import { v4 as uuidv4 } from 'uuid';
import UAParser from 'ua-parser-js';

const router = express.Router();

// Private/loopback IP ranges that cannot be geolocated
const PRIVATE_IP_RE = /^(::1|127\.|10\.|172\.(1[6-9]|2\d|3[01])\.|192\.168\.|::ffff:127\.|fc|fd)/i;

function unknownGeo() {
  return {
    continent: 'Unknown',
    country: 'Unknown',
    region: 'Unknown',
    county: 'Unknown',
    district: 'Unknown',
    division: 'Unknown',
    city: 'Unknown',
    latitude: null,
    longitude: null,
  };
}

async function reverseGeocode(latitude, longitude) {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(latitude)}&lon=${encodeURIComponent(longitude)}&zoom=12&addressdetails=1`,
      {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'folio-analytics-tracker/1.0',
        },
        signal: AbortSignal.timeout(3000),
      }
    );

    if (!response.ok) return unknownGeo();

    const data = await response.json();
    const address = data.address || {};

    return {
      continent: unknownGeo().continent,
      country: address.country || unknownGeo().country,
      region: address.state || address.region || unknownGeo().region,
      county: address.county || unknownGeo().county,
      district: address.city_district || address.state_district || address.suburb || unknownGeo().district,
      division: address.municipality || address.borough || address.township || unknownGeo().division,
      city: address.city || address.town || address.village || unknownGeo().city,
      latitude: Number.isFinite(Number(latitude)) ? Number(latitude) : null,
      longitude: Number.isFinite(Number(longitude)) ? Number(longitude) : null,
    };
  } catch {
    return unknownGeo();
  }
}

async function geolocate(ip) {
  const cleanIp = ip.replace(/^::ffff:/, '');
  if (!cleanIp || PRIVATE_IP_RE.test(cleanIp)) {
    return unknownGeo();
  }

  try {
    // ip-api.com free tier: HTTP only, 45 req/min
    const response = await fetch(
      `http://ip-api.com/json/${encodeURIComponent(cleanIp)}?fields=status,continent,country,regionName,city,district,lat,lon`,
      { signal: AbortSignal.timeout(3000) }
    );
    if (!response.ok) return unknownGeo();

    const data = await response.json();

    if (data.status !== 'success') return unknownGeo();

    const base = {
      continent: data.continent || 'Unknown',
      country: data.country || 'Unknown',
      region: data.regionName || 'Unknown',
      county: 'Unknown',
      district: data.district || 'Unknown',
      division: 'Unknown',
      city: data.city || 'Unknown',
      latitude: Number.isFinite(Number(data.lat)) ? Number(data.lat) : null,
      longitude: Number.isFinite(Number(data.lon)) ? Number(data.lon) : null,
    };

    if (base.latitude === null || base.longitude === null) {
      return base;
    }

    const detailed = await reverseGeocode(base.latitude, base.longitude);

    return {
      continent: base.continent,
      country: base.country,
      region: base.region,
      county: detailed.county !== 'Unknown' ? detailed.county : base.county,
      district: detailed.district !== 'Unknown' ? detailed.district : base.district,
      division: detailed.division !== 'Unknown' ? detailed.division : base.division,
      city: detailed.city !== 'Unknown' ? detailed.city : base.city,
      latitude: base.latitude,
      longitude: base.longitude,
    };
  } catch {
    return unknownGeo();
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
