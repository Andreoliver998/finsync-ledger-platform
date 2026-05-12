import axios from 'axios';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

import { tokenStorage } from './tokenStorage';
import { normalizeApiError } from '@utils/errors';

function safeParseUrl(value) {
  try {
    return new URL(value);
  } catch {
    return null;
  }
}

function extractExpoHost() {
  const hostUri =
    Constants.expoConfig?.hostUri ??
    Constants.expoGoConfig?.debuggerHost ??
    Constants.manifest2?.extra?.expoClient?.hostUri ??
    '';

  if (!hostUri || typeof hostUri !== 'string') {
    return null;
  }

  const normalized = hostUri.includes('://') ? hostUri : `http://${hostUri}`;
  const parsed = safeParseUrl(normalized);
  const hostname = parsed?.hostname ?? null;

  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return null;
  }

  return hostname;
}

function buildLanApiUrl(templateUrl, fallbackHost) {
  const parsed = safeParseUrl(templateUrl);
  if (!parsed || !fallbackHost) {
    return null;
  }

  return `${parsed.protocol}//${fallbackHost}${parsed.port ? `:${parsed.port}` : ''}${parsed.pathname}`;
}

/**
 * Resolve API base URL.
 *
 * Priority:
 *   1. EXPO_PUBLIC_API_URL / EXPO_PUBLIC_API_BASE_URL (.env override).
 *   2. app.json -> expo.extra.apiBaseUrlAndroid / apiBaseUrlIos / apiBaseUrlDevice.
 *   3. Hardcoded fallback.
 *
 * Important:
 *   - Android Emulator uses 10.0.2.2
 *   - Physical devices must use the LAN IP of the development machine
 */
function resolveBaseUrl() {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL || process.env.EXPO_PUBLIC_API_BASE_URL;
  if (fromEnv && typeof fromEnv === 'string' && fromEnv.length > 0) {
    return fromEnv;
  }

  const extra =
    Constants.expoConfig?.extra ??
    Constants.manifest2?.extra?.expoClient?.extra ??
    {};

  const deviceUrl = extra.apiBaseUrlDevice || 'http://192.168.1.103:3334/api';
  const lanHost = extractExpoHost();
  const lanUrl = buildLanApiUrl(deviceUrl, lanHost);

  if (Platform.OS === 'android') {
    if (lanUrl) {
      return lanUrl;
    }
    return extra.apiBaseUrlAndroid || 'http://10.0.2.2:3334/api';
  }
  if (Platform.OS === 'ios') {
    return lanUrl || extra.apiBaseUrlIos || deviceUrl;
  }
  return lanUrl || deviceUrl;
}

function resolveTimeout() {
  const fromEnv = Number(process.env.EXPO_PUBLIC_API_TIMEOUT_MS);
  if (Number.isFinite(fromEnv) && fromEnv > 0) return fromEnv;
  const extra = Constants.expoConfig?.extra ?? {};
  return Number(extra.apiTimeoutMs) || 15000;
}

const baseURL = resolveBaseUrl();
const timeout = resolveTimeout();

if (__DEV__) {
  console.info('[FinSync API] baseURL:', baseURL);
}

export const api = axios.create({
  baseURL,
  timeout,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json'
  }
});

let inMemoryToken = null;
let onUnauthorized = null;

export function setAuthToken(token) {
  inMemoryToken = token || null;
}

export function getAuthToken() {
  return inMemoryToken;
}

export function registerUnauthorizedHandler(handler) {
  onUnauthorized = typeof handler === 'function' ? handler : null;
}

api.interceptors.request.use(async (config) => {
  if (!inMemoryToken) {
    // Cold start fallback — hydrate from SecureStore once.
    const persisted = await tokenStorage.get();
    if (persisted) inMemoryToken = persisted;
  }
  if (inMemoryToken) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${inMemoryToken}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const status = error?.response?.status;
    if (status === 401) {
      inMemoryToken = null;
      await tokenStorage.clear();
      if (onUnauthorized) {
        try {
          onUnauthorized();
        } catch {
          /* noop */
        }
      }
    }

    const normalizedError = normalizeApiError(error);
    if (!error?.response && __DEV__) {
      normalizedError.message = `${normalizedError.message} URL atual: ${baseURL}`;
      console.warn('[FinSync API] network error', {
        method: error?.config?.method,
        url: error?.config?.url,
        baseURL,
        timeout
      });
    }

    return Promise.reject(normalizedError);
  }
);

/** Convenience meta — useful in debug screens. NEVER log tokens. */
export const apiMeta = Object.freeze({
  baseURL,
  timeout
});
