// Production backend URL (Render). VITE_API_BASE env var overrides this at build time.
const RENDER_BACKEND = 'https://folioo-dxty.onrender.com/api';
const RENDER_ORIGIN = 'https://folioo-dxty.onrender.com';

function buildApiBase() {
  const env = import.meta.env.VITE_API_BASE;
  if (env) {
    // Normalize: ensure the base always ends with /api
    const trimmed = env.replace(/\/+$/, '');
    const normalized = trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
    // Production must use an absolute URL. If env is accidentally set to a relative path,
    // fall back to the known Render backend to avoid Vercel /api 404s.
    if (import.meta.env.PROD && !/^https?:\/\//i.test(normalized)) {
      return RENDER_BACKEND;
    }
    return normalized;
  }
  return import.meta.env.PROD ? RENDER_BACKEND : '/api';
}

const API_BASE = buildApiBase();

// Make relative /uploads/... paths absolute so they load correctly from Vercel.
export function resolveAssetUrl(path) {
  if (!path) return '';
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

export async function getTraccarOverview() {
  try {
    return await authFetch('/analytics/traccar/overview');
  } catch (error) {
    const message = String(error?.message || error);
    if (message.includes('(404)')) {
      return {
        configured: true,
        connected: false,
        routeMissing: true,
        error: 'Traccar endpoint not found on API server (404). Redeploy backend and verify VITE_API_BASE points to the correct server.',
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
    throw error;
  }
}

export async function clearAnalytics() {
  return authFetch('/analytics/clear', {
    method: 'DELETE',
  });
}

// Track a visit (called from portfolio)
export async function trackVisit(ref = 'direct', page = '/') {
  try {
    await fetch(`${API_BASE}/track?ref=${encodeURIComponent(ref)}&page=${encodeURIComponent(page)}`);
  } catch {
    // Silently fail tracking
  }
}
