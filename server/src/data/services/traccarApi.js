import { getTraccarConfigErrors, traccarConfig } from '../../config/traccar.js';

let cachedAxios = undefined;

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

async function getAxiosModule() {
  if (cachedAxios !== undefined) {
    return cachedAxios;
  }

  try {
    const mod = await import('axios');
    cachedAxios = mod.default || mod;
  } catch {
    cachedAxios = null;
  }

  return cachedAxios;
}

async function getJsonWithAxios(path) {
  const axios = await getAxiosModule();
  if (!axios) {
    return null;
  }

  const traccarClient = axios.create({
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

  try {
    const response = await traccarClient.get(path);
    return response.data;
  } catch (error) {
    const message = getAxiosErrorMessage(error);
    console.error(`Traccar request failed for ${path}:`, message);
    throw new Error(message);
  }
}

function toBasicAuthHeader() {
  const token = Buffer.from(`${traccarConfig.username}:${traccarConfig.password}`, 'utf-8').toString('base64');
  return `Basic ${token}`;
}

function getFetchErrorMessage(error) {
  const message = String(error?.message || error);
  const code = error?.cause?.code || error?.code;

  if (code === 'ENOTFOUND') {
    return 'Could not resolve TRACCAR_BASE_URL host. Verify the domain and protocol.';
  }
  if (code === 'ECONNREFUSED') {
    return 'Connection refused by Traccar host. Verify server/port and network access.';
  }
  if (message.includes('aborted')) {
    return `Traccar API request timed out after ${traccarConfig.timeoutMs}ms`;
  }

  return message || 'Unknown Traccar API error';
}

async function getJsonWithFetch(path) {
  try {
    const response = await fetch(`${traccarConfig.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: toBasicAuthHeader(),
      },
      signal: AbortSignal.timeout(traccarConfig.timeoutMs),
    });

    if (!response.ok) {
      let details = '';
      try {
        const body = await response.json();
        details = body?.message || body?.error || '';
      } catch {
        // Ignore non-JSON body.
      }

      const suffix = details ? `: ${details}` : '';
      const message = `Traccar API request failed (${response.status})${suffix}`;
      console.error(`Traccar request failed for ${path}:`, message);
      throw new Error(message);
    }

    return await response.json();
  } catch (error) {
    const message = getFetchErrorMessage(error);
    console.error(`Traccar request failed for ${path}:`, message);
    throw new Error(message);
  }
}

async function getJson(path) {
  assertTraccarConfig();

  const axiosData = await getJsonWithAxios(path);
  if (axiosData !== null) {
    return axiosData;
  }

  return getJsonWithFetch(path);
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
