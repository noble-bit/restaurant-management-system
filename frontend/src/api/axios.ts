import axios, { type AxiosError, type InternalAxiosRequestConfig } from 'axios';

// In-memory token storage (never stored in localStorage or sessionStorage)
let inMemoryAccessToken: string | null = null;
let inMemoryRefreshToken: string | null = null;
let onUnauthenticatedCallback: (() => void) | null = null;

export const setTokens = (access: string | null, refresh: string | null) => {
  inMemoryAccessToken = access;
  if (refresh !== undefined) {
    inMemoryRefreshToken = refresh;
  }
};

export const getAccessToken = () => inMemoryAccessToken;
export const getRefreshToken = () => inMemoryRefreshToken;

export const setOnUnauthenticated = (callback: () => void) => {
  onUnauthenticatedCallback = callback;
};

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Attach Access Token if available
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    if (inMemoryAccessToken && !config.headers.Authorization) {
      config.headers.Authorization = `Bearer ${inMemoryAccessToken}`;
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

      if (!inMemoryRefreshToken) {
        isRefreshing = false;
        if (onUnauthenticatedCallback) onUnauthenticatedCallback();
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post<{ access: string }>('/api/v1/auth/jwt/refresh/', {
          refresh: inMemoryRefreshToken,
        });

        const newAccessToken = data.access;
        setTokens(newAccessToken, inMemoryRefreshToken);

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
