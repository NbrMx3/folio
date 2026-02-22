const API_BASE = '/api';

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

export async function verifyAuth() {
  return authFetch('/auth/verify');
}

// Profile
export async function getProfile() {
  const res = await fetch(`${API_BASE}/profile`);
  return res.json();
}

export async function updateProfile(data) {
  return authFetch('/profile', {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function uploadProfilePicture(file) {
  console.log("fetch image funtion runnig")
  const formData = new FormData();
  formData.append('picture', file);
  return authFetch(`/${API_BASE}/uploads/profile`, {
    method: 'POST',
    body: formData,
  });
}

// Skills
export async function getSkills() {
  const res = await fetch(`${API_BASE}/skills`);
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

// Track a visit (called from portfolio)
export async function trackVisit(ref = 'direct', page = '/') {
  try {
    await fetch(`${API_BASE}/track?ref=${encodeURIComponent(ref)}&page=${encodeURIComponent(page)}`);
  } catch {
    // Silently fail tracking
  }
}
