import axios from "axios";

const OFFICIAL_API_URL = "https://api-finsync.paytech.app.br/api";
const LOCAL_API_URL = "/api";
const AUTH_TOKEN_KEYS = [
  "finsync:token",
];

const AUTH_PAYLOAD_KEYS = [];

function resolveLocalApiBaseUrl() {
  return LOCAL_API_URL;
}

function resolveApiBaseUrl() {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;

  if (configuredUrl) {
    return configuredUrl;
  }

  if (import.meta.env.DEV) {
    return resolveLocalApiBaseUrl();
  }

  return OFFICIAL_API_URL;
}

function readTokenFromStorage(storage) {
  for (const key of AUTH_TOKEN_KEYS) {
    const token = storage.getItem(key);

    if (token) {
      return token;
    }
  }

  for (const key of AUTH_PAYLOAD_KEYS) {
    const rawValue = storage.getItem(key);

    if (!rawValue) {
      continue;
    }

    try {
      const parsedValue = JSON.parse(rawValue);
      const token =
        parsedValue?.token ||
        parsedValue?.jwt ||
        parsedValue?.accessToken ||
        parsedValue?.data?.token ||
        parsedValue?.data?.accessToken;

      if (token) {
        return token;
      }
    } catch {
      continue;
    }
  }

  return null;
}

export function getStoredJwt() {
  if (typeof window === "undefined") {
    return null;
  }

  return readTokenFromStorage(window.localStorage) || readTokenFromStorage(window.sessionStorage);
}

export function clearStoredAuth() {
  if (typeof window === "undefined") {
    return;
  }

  for (const storage of [window.localStorage, window.sessionStorage]) {
    for (const key of [...AUTH_TOKEN_KEYS, ...AUTH_PAYLOAD_KEYS, "finsync:user"]) {
      storage.removeItem(key);
    }
  }
}

export const api = axios.create({
  baseURL: resolveApiBaseUrl(),
  headers: {
    "Content-Type": "application/json"
  },
  timeout: 30000
});

api.interceptors.request.use((config) => {
  const token = getStoredJwt();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if ((status === 401 || status === 403) && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("finsync:auth:denied", { detail: { status } }));
    }

    return Promise.reject(error);
  }
);
