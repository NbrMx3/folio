import dotenv from 'dotenv';

// Load environment variables when this module is imported.
dotenv.config();

function sanitize(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeBaseUrl(value) {
  const raw = sanitize(value).replace(/\/+$/, '');
  if (!raw) return '';

  // Users often paste URLs ending in /api, but service methods add /api themselves.
  const withoutApiSuffix = raw.replace(/\/api$/i, '');

  try {
    const parsed = new URL(withoutApiSuffix);
    if (!/^https?:$/i.test(parsed.protocol)) return '';
    return parsed.toString().replace(/\/+$/, '');
  } catch {
    return '';
  }
}

const parsedTimeout = Number.parseInt(process.env.TRACCAR_TIMEOUT_MS || '7000', 10);

export const traccarConfig = {
  baseUrl: normalizeBaseUrl(process.env.TRACCAR_BASE_URL || ''),
  username: sanitize(process.env.TRACCAR_USERNAME || ''),
  password: sanitize(process.env.TRACCAR_PASSWORD || ''),
  sessionPath: sanitize(process.env.TRACCAR_SESSION_PATH || '/api/session') || '/api/session',
  timeoutMs: Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 7000,
};

export function getTraccarConfigErrors() {
  const errors = [];

  if (!traccarConfig.baseUrl) {
    errors.push('TRACCAR_BASE_URL is missing or invalid. Use a full URL without /api, for example https://your-app-name.onrender.com');
  }
  if (!traccarConfig.username) {
    errors.push('TRACCAR_USERNAME is missing');
  }
  if (!traccarConfig.password) {
    errors.push('TRACCAR_PASSWORD is missing');
  }

  return errors;
}
