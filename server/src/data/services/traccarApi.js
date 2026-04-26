import axios from 'axios';
import { getTraccarConfigErrors, traccarConfig } from '../../config/traccar.js';

// Axios client configured with Traccar base URL and Basic Authentication.
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

async function getJson(path) {
  assertTraccarConfig();

  try {
    const response = await traccarClient.get(path);
    return response.data;
  } catch (error) {
    const message = getAxiosErrorMessage(error);
    console.error(`Traccar request failed for ${path}:`, message);
    throw new Error(message);
  }
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
