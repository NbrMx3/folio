// Production backend URL (Render). VITE_API_BASE env var overrides this at build time.
const RENDER_BACKEND = 'https://folioo-dxty.onrender.com/api';
const RENDER_ORIGIN = 'https://folioo-dxty.onrender.com';

function buildApiBase() {
  const env = import.meta.env.VITE_API_BASE;
  if (env) {
    const trimmed = env.trim().replace(/\/+$/, '');

    // In production we want same-origin /api so Vercel rewrites can proxy to Render.
    // Absolute URLs are still supported for explicit overrides.
    if (trimmed === '/api') return '/api';
    if (/^https?:\/\//i.test(trimmed)) {
      return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    }

    if (trimmed.startsWith('/')) {
      return import.meta.env.PROD ? '/api' : trimmed;
    }

    return import.meta.env.PROD ? '/api' : `/${trimmed}`;
  }
  return '/api';
}

const API_BASE = buildApiBase();

// Make relative /uploads/... paths absolute so they load correctly from Vercel.
export function resolveAssetUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') && path.includes('cloudinary.com')) {
    return path.replace('http://', 'https://');
  }
  if (path.startsWith('http')) return path;
  const base = import.meta.env.PROD ? RENDER_ORIGIN : '';
  return `${base}${path}`;
}

export function getToken() {
  return localStorage.getItem('admin_token');
}

export function setToken(token) {
  localStorage.setItem('admin_token', token);
}

export function removeToken() {
  localStorage.removeItem('admin_token');
}

async function authFetch(url, options = {}) {
  const token = getToken();
  const headers = {
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${url}`, { ...options, headers });

  if (res.status === 401) {
    removeToken();
    window.location.href = '/admin/login';
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    let details = '';
    try {
      const body = await res.json();
      details = body?.error || body?.message || '';
    } catch {
      // ignore non-JSON error payloads
    }
    const suffix = details ? `: ${details}` : '';
    throw new Error(`Request failed (${res.status}) for ${url}${suffix}`);
  }

  return res.json();
}

// Auth
export async function login(email, password) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  return res.json();
}

export async function getRecoveryInfo() {
  const res = await fetch(`${API_BASE}/auth/recovery-info`);
  return res.json();
}

export async function requestPasswordReset(email) {
  const res = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email }),
  });
  return res.json();
}

export async function resetPassword(token, newPassword) {
  const res = await fetch(`${API_BASE}/auth/reset-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token, newPassword }),
  });
  return res.json();
}

export async function verifyAuth() {
  return authFetch('/auth/verify');
}

export async function getAuthSettings() {
  return authFetch('/auth/settings');
}

export async function changeAdminPassword(currentPassword, newPassword) {
  return authFetch('/auth/change-password', {
    method: 'POST',
    body: JSON.stringify({ currentPassword, newPassword }),
  });
}

// Profile
export async function getProfile() {
  const res = await fetch(`${API_BASE}/profile`);
  if (!res.ok) throw new Error(`GET /profile failed: ${res.status}`);
  const data = await res.json();
  // Make profile picture URL absolute so it loads correctly from Vercel
  if (data && data.picture) data.picture = resolveAssetUrl(data.picture);
  return data;
}

export async function updateProfile(data) {
  return authFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadProfilePicture(file) {
  const formData = new FormData();
  formData.append('picture', file);
  // Route is POST /api/profile/upload — authFetch already prepends API_BASE
  return authFetch('/profile/upload', {
    method: 'POST',
    body: formData,
  });
}

// Skills
export async function getSkills() {
  const res = await fetch(`${API_BASE}/skills`);
  if (!res.ok) throw new Error(`GET /skills failed: ${res.status}`);
  return res.json();
}

export async function createSkill(data) {
  return authFetch('/skills', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateSkill(id, data) {
  return authFetch(`/skills/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteSkill(id) {
  return authFetch(`/skills/${id}`, {
    method: 'DELETE',
  });
}

// Projects
export async function getProjectsList() {
  const res = await fetch(`${API_BASE}/projects`);
  if (!res.ok) throw new Error(`GET /projects failed: ${res.status}`);
  return res.json();
}

export async function createProject(data) {
  return authFetch('/projects', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProject(id, data) {
  return authFetch(`/projects/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProject(id) {
  return authFetch(`/projects/${id}`, {
    method: 'DELETE',
  });
}

// Analytics
export async function getAnalyticsOverview() {
  return authFetch('/analytics/overview');
}

export async function getVisitors(page = 1, source = 'all') {
  return authFetch(`/analytics/visitors?page=${page}&source=${source}`);
}

export async function getChartData() {
  return authFetch('/analytics/chart');
}

export async function getPlatforms() {
  return authFetch('/analytics/platforms');
}

function toEpoch(value) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}

function mapTraccarOverviewFromRaw(devices, positions) {
  const deviceRows = Array.isArray(devices) ? devices : [];
  const positionRows = Array.isArray(positions) ? positions : [];

  const latestPositionByDeviceId = new Map();
  for (const position of positionRows) {
    const key = String(position?.deviceId ?? '');
    if (!key) continue;
    const current = latestPositionByDeviceId.get(key);
    const nextTs = toEpoch(position?.fixTime || position?.deviceTime || position?.serverTime);
    const currentTs = toEpoch(current?.fixTime || current?.deviceTime || current?.serverTime);
    if (!current || nextTs >= currentTs) {
      latestPositionByDeviceId.set(key, position);
    }
  }

  let onlineCount = 0;
  let offlineCount = 0;
  let unknownCount = 0;
  let movingCount = 0;
  let stoppedCount = 0;

  const mappedDevices = deviceRows.map((device) => {
    const status = String(device?.status || 'unknown').toLowerCase();
    const position = latestPositionByDeviceId.get(String(device?.id ?? '')) || null;
    const speedKnots = Number(position?.speed || 0);
    const speedKph = Number.isFinite(speedKnots) ? speedKnots * 1.852 : 0;
    const isMoving = speedKph > 1;

    if (status === 'online') onlineCount += 1;
    else if (status === 'offline') offlineCount += 1;
    else unknownCount += 1;

    if (isMoving) movingCount += 1;
    else stoppedCount += 1;

    return {
      id: device?.id,
      name: device?.name || `Device ${device?.id ?? ''}`,
      uniqueId: device?.uniqueId || '',
      status,
      disabled: Boolean(device?.disabled),
      speedKph: Number(speedKph.toFixed(1)),
      latitude: position?.latitude ?? null,
      longitude: position?.longitude ?? null,
      lastUpdate: device?.lastUpdate || position?.deviceTime || position?.fixTime || position?.serverTime || null,
    };
  });

  mappedDevices.sort((a, b) => {
    const aOnline = a.status === 'online' ? 1 : 0;
    const bOnline = b.status === 'online' ? 1 : 0;
    if (aOnline !== bOnline) return bOnline - aOnline;
    return String(a.name).localeCompare(String(b.name));
  });

  return {
    configured: true,
    connected: true,
    devices: mappedDevices,
    summary: {
      deviceCount: mappedDevices.length,
      onlineCount,
      offlineCount,
      unknownCount,
      movingCount,
      stoppedCount,
    },
  };
}

export async function getTraccarOverview() {
  try {
    // Prefer the long-lived analytics endpoint to avoid 404s on older backend deploys.
    return await authFetch('/analytics/traccar/overview');
  } catch (analyticsError) {
    const analyticsMessage = String(analyticsError?.message || analyticsError);

    // If analytics endpoint is missing, fall back to direct Traccar routes on newer backends.
    if (analyticsMessage.includes('(404)')) {
      try {
        const [devicesResponse, positionsResponse] = await Promise.all([
          authFetch('/traccar/devices'),
          authFetch('/traccar/positions'),
        ]);
        return mapTraccarOverviewFromRaw(devicesResponse?.devices, positionsResponse?.positions);
      } catch (routesError) {
        const routesMessage = String(routesError?.message || routesError);
        if (routesMessage.includes('(404)')) {
          return {
            configured: true,
            connected: false,
            routeMissing: true,
            error: 'Traccar endpoints are missing on the API server (404). Redeploy backend and verify VITE_API_BASE points to the correct server.',
            devices: [],
            summary: {
              deviceCount: 0,
              onlineCount: 0,
              offlineCount: 0,
              unknownCount: 0,
              movingCount: 0,
              stoppedCount: 0,
            },
          };
        }

        const missingConfig =
          routesMessage.includes('TRACCAR_BASE_URL') ||
          routesMessage.includes('TRACCAR_USERNAME') ||
          routesMessage.includes('TRACCAR_PASSWORD') ||
          routesMessage.includes('missing or invalid') ||
          routesMessage.includes(' is missing');

        return {
          configured: !missingConfig,
          connected: false,
          error: routesMessage,
          devices: [],
          summary: {
            deviceCount: 0,
            onlineCount: 0,
            offlineCount: 0,
            unknownCount: 0,
            movingCount: 0,
            stoppedCount: 0,
          },
        };
      }
    }

    throw analyticsError;
  }
}

export async function clearAnalytics() {
  return authFetch('/analytics/clear', {
    method: 'DELETE',
  });
}

// Track a visit (called from portfolio)
export async function trackVisit(ref = 'direct', page = '/') {
  const payload = { ref, page };
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(`${API_BASE}/track`, blob);
      return;
    }

    await fetch(`${API_BASE}/track`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    });
  } catch {
    // Silently fail tracking
  }
}

// Gallery
export async function getGallery() {
  const res = await fetch(`${API_BASE}/gallery`);
  if (!res.ok) throw new Error(`GET /gallery failed: ${res.status}`);
  const items = await res.json();
  // Make gallery URLs absolute so they load correctly from Vercel
  return items.map(item => ({
    ...item,
    url: resolveAssetUrl(item.url),
    type: normalizeGalleryType({ ...item, url: resolveAssetUrl(item.url) }),
    playbackUrl: buildGalleryPlaybackUrl({ ...item, url: resolveAssetUrl(item.url) })
  }));
}

function normalizeGalleryType(item) {
  const current = String(item?.type || '').toLowerCase();
  const inferred = inferTypeFromUrl(item?.url);
  if (inferred) return inferred;
  if (current === 'video' || current === 'photo') return current;
  return 'photo';
}

function inferTypeFromUrl(url) {
  if (!url) return '';
  const cleaned = String(url).split('?')[0].split('#')[0].toLowerCase();
  return /\.(mp4|mov|webm|mkv|avi)$/.test(cleaned) ? 'video' : '';
}

function buildGalleryPlaybackUrl(item) {
  const normalizedType = normalizeGalleryType(item);
  if (normalizedType !== 'video') return '';
  return buildCloudinaryVideoUrl(item?.url) || item?.url || '';
}

function buildCloudinaryVideoUrl(url) {
  if (!url || !url.includes('res.cloudinary.com')) return '';
  const [base, query] = String(url).split('?');
  const uploadToken = '/upload/';
  const idx = base.indexOf(uploadToken);
  if (idx === -1) return '';

  const prefix = base.slice(0, idx + uploadToken.length);
  const rest = base.slice(idx + uploadToken.length);
  const firstSegment = rest.split('/')[0] || '';
  if (firstSegment.includes(',')) return url;

  const transform = 'q_auto:best,f_auto,c_limit,w_1920,h_1080';
  const transformed = `${prefix}${transform}/${rest}`;
  return query ? `${transformed}?${query}` : transformed;
}

export async function uploadGalleryMedia(file, title = '', description = '', type = null) {
  const formData = new FormData();
  formData.append('media', file);
  if (title) formData.append('title', title);
  if (description) formData.append('description', description);
  if (type) formData.append('type', type);
  
  return authFetch('/gallery/upload', {
    method: 'POST',
    body: formData,
  });
}

export async function updateGalleryItem(id, data) {
  return authFetch(`/gallery/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteGalleryItem(id) {
  return authFetch(`/gallery/${id}`, {
    method: 'DELETE',
  });
}

