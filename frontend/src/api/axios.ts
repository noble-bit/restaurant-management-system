import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// localStorage key names
const ACCESS_TOKEN_KEY = 'restaurant_access_token';
const REFRESH_TOKEN_KEY = 'restaurant_refresh_token';

// Safe localStorage helpers (handles restricted environments like private browsing)
const getStoredToken = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const setStoredToken = (key: string, value: string | null) => {
  try {
    if (value === null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // Ignore storage errors gracefully
  }
};

// In-memory token storage (synced with localStorage)
let inMemoryAccessToken: string | null = getStoredToken(ACCESS_TOKEN_KEY);
let inMemoryRefreshToken: string | null = getStoredToken(REFRESH_TOKEN_KEY);
let onUnauthenticatedCallback: (() => void) | null = null;

export const setTokens = (access: string | null, refresh?: string | null) => {
  inMemoryAccessToken = access;
  setStoredToken(ACCESS_TOKEN_KEY, access);

  if (refresh !== undefined) {
    inMemoryRefreshToken = refresh;
    setStoredToken(REFRESH_TOKEN_KEY, refresh);
  }
};

export const getAccessToken = (): string | null => {
  if (!inMemoryAccessToken) {
    inMemoryAccessToken = getStoredToken(ACCESS_TOKEN_KEY);
  }
  return inMemoryAccessToken;
};

export const getRefreshToken = (): string | null => {
  if (!inMemoryRefreshToken) {
    inMemoryRefreshToken = getStoredToken(REFRESH_TOKEN_KEY);
  }
  return inMemoryRefreshToken;
};

export const setOnUnauthenticated = (callback: () => void) => {
  onUnauthenticatedCallback = callback;
};

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token if available
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Flag to prevent infinite refresh loops
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Response Interceptor: 401 Handling & Token Refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // Avoid retrying for auth endpoints like login or refresh itself
    if (
      error.response?.status === 401 &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/auth/jwt/create/') &&
      !originalRequest.url?.includes('/auth/jwt/refresh/')
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const currentRefreshToken = getRefreshToken();
      if (!currentRefreshToken) {
        isRefreshing = false;
        setTokens(null, null);
        if (onUnauthenticatedCallback) onUnauthenticatedCallback();
        return Promise.reject(error);
      }

      try {
        const refreshUrl = `${API_BASE_URL.replace(/\/+$/, '')}/auth/jwt/refresh/`;
        const { data } = await axios.post<{ access: string }>(refreshUrl, {
          refresh: currentRefreshToken,
        });

        const newAccessToken = data.access;
        setTokens(newAccessToken, currentRefreshToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processQueue(null, newAccessToken);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        setTokens(null, null);
        if (onUnauthenticatedCallback) {
          onUnauthenticatedCallback();
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
