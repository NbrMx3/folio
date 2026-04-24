function sanitize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBaseUrl(value) {
  const raw = sanitize(value).replace(/\/+$/, '');
  if (!raw) return '';

  // Many users paste a Traccar URL ending with /api. Endpoints below already include /api.
  const withoutApiSuffix = raw.replace(/\/api$/i, '');

  try {
    const parsed = new URL(withoutApiSuffix);
    if (!/^https?:$/i.test(parsed.protocol)) return '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

const TRACCAR_BASE_URL = normalizeBaseUrl(process.env.TRACCAR_BASE_URL || '');
const TRACCAR_USERNAME = sanitize(process.env.TRACCAR_USERNAME || '');
const TRACCAR_PASSWORD = sanitize(process.env.TRACCAR_PASSWORD || '');
const TRACCAR_SESSION_PATH = sanitize(process.env.TRACCAR_SESSION_PATH || '/api/session') || '/api/session';
const parsedTimeout = Number.parseInt(process.env.TRACCAR_TIMEOUT_MS || '7000', 10);
const TRACCAR_TIMEOUT_MS = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 7000;

let sessionCookie = '';
let sessionExpiresAt = 0;

function getDefaultOverview(extra = {}) {
  return {
    enabled: true,
    configured: Boolean(TRACCAR_BASE_URL && TRACCAR_USERNAME && TRACCAR_PASSWORD),
    connected: false,
    fetchedAt: new Date().toISOString(),
    summary: {
      deviceCount: 0,
      onlineCount: 0,
      offlineCount: 0,
      unknownCount: 0,
      movingCount: 0,
      stoppedCount: 0,
    },
    devices: [],
    ...extra,
  };
}

function authHeader() {
  const token = Buffer.from(`${TRACCAR_USERNAME}:${TRACCAR_PASSWORD}`, 'utf-8').toString('base64');
  return `Basic ${token}`;
}

function asArray(value) {
  return Array.isArray(value) ? value : [];
}

function toIso(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function getMissingTraccarConfig() {
  const missing = [];
  if (!TRACCAR_BASE_URL) missing.push('TRACCAR_BASE_URL');
  if (!TRACCAR_USERNAME) missing.push('TRACCAR_USERNAME');
  if (!TRACCAR_PASSWORD) missing.push('TRACCAR_PASSWORD');
  return missing;
}

function errorMessage(error) {
  if (!error) return 'Unknown error';
  const message = String(error?.message || error);
  if (message.includes('This operation was aborted')) {
    return `Request timeout after ${TRACCAR_TIMEOUT_MS}ms`;
  }
  return message;
}

async function requestJson(path, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    useSessionCookie = false,
  } = options;

  const reqHeaders = {
    Accept: 'application/json',
    ...headers,
  };

  if (TRACCAR_USERNAME && TRACCAR_PASSWORD) {
    reqHeaders.Authorization = authHeader();
  }

  if (useSessionCookie && sessionCookie) {
    reqHeaders.Cookie = sessionCookie;
  }

  const response = await fetch(`${TRACCAR_BASE_URL}${path}`, {
    method,
    headers: reqHeaders,
    body,
    signal: AbortSignal.timeout(TRACCAR_TIMEOUT_MS),
  });

  const isJson = (response.headers.get('content-type') || '').includes('application/json');
  const payload = isJson ? await response.json() : null;

  return { response, payload };
}

async function refreshSessionCookie() {
  const now = Date.now();
  if (sessionCookie && now < sessionExpiresAt) return true;

  const formData = new URLSearchParams({
    email: TRACCAR_USERNAME,
    password: TRACCAR_PASSWORD,
  });

  const response = await fetch(`${TRACCAR_BASE_URL}${TRACCAR_SESSION_PATH}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: formData.toString(),
    signal: AbortSignal.timeout(TRACCAR_TIMEOUT_MS),
  });

  if (!response.ok) {
    sessionCookie = '';
    sessionExpiresAt = 0;
    return false;
  }

  const setCookie = response.headers.get('set-cookie');
  if (!setCookie) return false;

  sessionCookie = setCookie.split(';')[0];
  sessionExpiresAt = now + 5 * 60 * 1000;
  return true;
}

async function traccarFetch(path) {
  const { response, payload } = await requestJson(path);
  if (response.ok) return payload;

  if (response.status !== 401) {
    throw new Error(`Traccar request failed (${response.status})`);
  }

  const hasSession = await refreshSessionCookie();
  if (!hasSession) {
    throw new Error('Traccar authentication failed');
  }

  const retry = await requestJson(path, { useSessionCookie: true });
  if (!retry.response.ok) {
    throw new Error(`Traccar request failed after session auth (${retry.response.status})`);
  }

  return retry.payload;
}

async function getPositionsForDevices(devices) {
  const positionIds = [...new Set(devices.map((d) => d.positionId).filter(Boolean))];
  if (!positionIds.length) return [];

  try {
    const ids = positionIds.join(',');
    const payload = await traccarFetch(`/api/positions?id=${encodeURIComponent(ids)}`);
    const rows = asArray(payload);
    if (rows.length) return rows;
  } catch {
    // Fallback to unfiltered positions endpoint
  }

  try {
    const fallback = await traccarFetch('/api/positions');
    const rows = asArray(fallback);
    const wanted = new Set(positionIds);
    return rows.filter((p) => wanted.has(p.id));
  } catch {
    return [];
  }
}

async function getEventSummary24h() {
  const to = new Date();
  const from = new Date(to.getTime() - 24 * 60 * 60 * 1000);
  const query = `/api/reports/events?from=${encodeURIComponent(from.toISOString())}&to=${encodeURIComponent(to.toISOString())}`;

  try {
    const payload = await traccarFetch(query);
    const events = asArray(payload);
    const byType = {};

    for (const event of events) {
      const type = event?.type || 'unknown';
      byType[type] = (byType[type] || 0) + 1;
    }

    return {
      total: events.length,
      byType,
    };
  } catch {
    return {
      total: 0,
      byType: {},
    };
  }
}

export async function getTraccarOverview() {
  if (getMissingTraccarConfig().length > 0) {
    return getDefaultOverview({
      configured: false,
      enabled: false,
      message: 'Set valid TRACCAR_BASE_URL, TRACCAR_USERNAME, and TRACCAR_PASSWORD to enable Traccar integration.',
    });
  }

  try {
    const devices = asArray(await traccarFetch('/api/devices'));
    const positions = await getPositionsForDevices(devices);
    const events24h = await getEventSummary24h();
    const positionById = new Map(positions.map((p) => [p.id, p]));

    let onlineCount = 0;
    let offlineCount = 0;
    let unknownCount = 0;
    let movingCount = 0;
    let stoppedCount = 0;

    const mappedDevices = devices.map((device) => {
      const position = positionById.get(device.positionId) || null;
      const status = String(device.status || 'unknown').toLowerCase();
      const speedKnots = toNumber(position?.speed, 0);
      const speedKph = speedKnots * 1.852;
      const isMoving = speedKph > 1;

      if (status === 'online') onlineCount += 1;
      else if (status === 'offline') offlineCount += 1;
      else unknownCount += 1;

      if (isMoving) movingCount += 1;
      else stoppedCount += 1;

      return {
        id: device.id,
        name: device.name || `Device ${device.id}`,
        uniqueId: device.uniqueId || '',
        status,
        disabled: Boolean(device.disabled),
        speedKph: Number(speedKph.toFixed(1)),
        latitude: position?.latitude ?? null,
        longitude: position?.longitude ?? null,
        lastUpdate: toIso(device.lastUpdate || position?.deviceTime || position?.fixTime),
      };
    });

    mappedDevices.sort((a, b) => {
      const aOnline = a.status === 'online' ? 1 : 0;
      const bOnline = b.status === 'online' ? 1 : 0;
      if (aOnline !== bOnline) return bOnline - aOnline;
      return a.name.localeCompare(b.name);
    });

    return {
      ...getDefaultOverview(),
      connected: true,
      summary: {
        deviceCount: mappedDevices.length,
        onlineCount,
        offlineCount,
        unknownCount,
        movingCount,
        stoppedCount,
      },
      events24h,
      devices: mappedDevices,
    };
  } catch (error) {
    return getDefaultOverview({
      connected: false,
      error: error?.message || 'Unable to reach Traccar API',
    });
  }
}

export async function getTraccarHealth() {
  const missing = getMissingTraccarConfig();
  const result = {
    configured: missing.length === 0,
    connected: false,
    fetchedAt: new Date().toISOString(),
    config: {
      baseUrl: TRACCAR_BASE_URL || null,
      usernameSet: Boolean(TRACCAR_USERNAME),
      passwordSet: Boolean(TRACCAR_PASSWORD),
      sessionPath: TRACCAR_SESSION_PATH,
      timeoutMs: TRACCAR_TIMEOUT_MS,
      missing,
    },
    checks: {
      basicAuthDevices: null,
      sessionLogin: null,
      sessionCookieDevices: null,
    },
    authMode: null,
    error: null,
  };

  if (missing.length > 0) {
    result.error = `Missing required variables: ${missing.join(', ')}`;
    return result;
  }

  try {
    const direct = await requestJson('/api/devices');
    result.checks.basicAuthDevices = {
      ok: direct.response.ok,
      status: direct.response.status,
      contentType: direct.response.headers.get('content-type') || null,
      deviceCount: Array.isArray(direct.payload) ? direct.payload.length : null,
    };

    if (direct.response.ok) {
      result.connected = true;
      result.authMode = 'basic';
      return result;
    }

    if (direct.response.status !== 401) {
      result.error = `Traccar /api/devices returned ${direct.response.status}`;
      return result;
    }

    const sessionOk = await refreshSessionCookie();
    result.checks.sessionLogin = {
      ok: sessionOk,
      path: TRACCAR_SESSION_PATH,
    };

    if (!sessionOk) {
      result.error = 'Session login failed. Check TRACCAR_USERNAME/TRACCAR_PASSWORD and session path.';
      return result;
    }

    const retry = await requestJson('/api/devices', { useSessionCookie: true });
    result.checks.sessionCookieDevices = {
      ok: retry.response.ok,
      status: retry.response.status,
      contentType: retry.response.headers.get('content-type') || null,
      deviceCount: Array.isArray(retry.payload) ? retry.payload.length : null,
    };

    if (retry.response.ok) {
      result.connected = true;
      result.authMode = 'session-cookie';
      return result;
    }

    result.error = `Traccar session-authenticated /api/devices returned ${retry.response.status}`;
    return result;
  } catch (error) {
    result.error = errorMessage(error);
    return result;
  }
}
