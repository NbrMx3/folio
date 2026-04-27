import { getTraccarConfigErrors, traccarConfig } from '../../config/traccar.js';

import axios from 'axios';

let sessionCookie = '';
let sessionCookieExpiresAt = 0;

function assertTraccarConfig() {
  const errors = getTraccarConfigErrors();
  if (errors.length > 0) {
    throw new Error(errors.join('; '));
  }
}

function getAxiosErrorMessage(error) {
  if (error?.response) {
    const status = error.response.status;
    const details = error.response.data?.message || error.response.data?.error || '';
    return details ? `Traccar API request failed (${status}): ${details}` : `Traccar API request failed (${status})`;
  }

  const code = error?.code;
  if (code === 'ENOTFOUND') {
    return 'Could not resolve TRACCAR_BASE_URL host. Verify the domain and protocol.';
  }
  if (code === 'ECONNREFUSED') {
    return 'Connection refused by Traccar host. Verify server/port and network access.';
  }
  if (code === 'ECONNABORTED') {
    return `Traccar API request timed out after ${traccarConfig.timeoutMs}ms`;
  }

  return error?.message || 'Unknown Traccar API error';
}

function createBasicClient() {
  return axios.create({
    baseURL: traccarConfig.baseUrl,
    timeout: traccarConfig.timeoutMs,
    auth: {
      username: traccarConfig.username,
      password: traccarConfig.password,
    },
    headers: {
      Accept: 'application/json',
    },
  });
}

function createSessionClient() {
  return axios.create({
    baseURL: traccarConfig.baseUrl,
    timeout: traccarConfig.timeoutMs,
    headers: {
      Accept: 'application/json',
      Cookie: sessionCookie,
    },
  });
}

async function refreshSessionCookie() {
  const now = Date.now();
  if (sessionCookie && now < sessionCookieExpiresAt) {
    return true;
  }

  const loginForm = new URLSearchParams({
    email: traccarConfig.username,
    password: traccarConfig.password,
  });

  const loginResponse = await axios.post(`${traccarConfig.baseUrl}${traccarConfig.sessionPath}`, loginForm.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    timeout: traccarConfig.timeoutMs,
    validateStatus: () => true,
  });

  if (loginResponse.status < 200 || loginResponse.status >= 300) {
    sessionCookie = '';
    sessionCookieExpiresAt = 0;
    return false;
  }

  const setCookieHeader = loginResponse.headers['set-cookie'];
  if (!Array.isArray(setCookieHeader) || setCookieHeader.length === 0) {
    sessionCookie = '';
    sessionCookieExpiresAt = 0;
    return false;
  }

  sessionCookie = setCookieHeader[0].split(';')[0];
  sessionCookieExpiresAt = now + 5 * 60 * 1000;
  return true;
}

async function getJsonWithBasic(path) {
  const traccarClient = createBasicClient();

  try {
    const response = await traccarClient.get(path);
    return response.data;
  } catch (error) {
    if (error?.response?.status === 401) {
      throw new Error('TRACCAR_AUTH_401_BASIC');
    }

    const message = getAxiosErrorMessage(error);
    console.error(`Traccar request failed for ${path}:`, message);
    throw new Error(message);
  }
}

async function getJsonWithSession(path) {
  const hasSession = await refreshSessionCookie();
  if (!hasSession) {
    throw new Error('Traccar session authentication failed. Check TRACCAR_USERNAME, TRACCAR_PASSWORD, and TRACCAR_SESSION_PATH.');
  }

  const traccarClient = createSessionClient();

  try {
    const response = await traccarClient.get(path);
    return response.data;
  } catch (error) {
    const message = getAxiosErrorMessage(error);
    console.error(`Traccar request failed for ${path}:`, message);
    throw new Error(message);
  }
}

async function getJson(path) {
  assertTraccarConfig();

  try {
    return await getJsonWithBasic(path);
  } catch (error) {
    if (String(error?.message || error) !== 'TRACCAR_AUTH_401_BASIC') {
      throw error;
    }
  }

  return getJsonWithSession(path);
}

// Fetch all devices from Traccar.
export async function getDevices() {
  const data = await getJson('/api/devices');
  return Array.isArray(data) ? data : [];
}

// Fetch all positions from Traccar.
export async function getPositions() {
  const data = await getJson('/api/positions');
  return Array.isArray(data) ? data : [];
}

// Filter positions for a specific deviceId.
export async function getDevicePositions(deviceId) {
  const positions = await getPositions();
  if (deviceId === undefined || deviceId === null || deviceId === '') {
    return positions;
  }

  const targetId = String(deviceId);
  return positions.filter((position) => String(position?.deviceId) === targetId);
}
