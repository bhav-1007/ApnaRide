import axios from 'axios';

export const API_URL = import.meta.env.VITE_API_URL || '/api';

const TOKEN_KEY = 'apnaride_token';
const ROLE_KEY = 'apnaride_role';

const read = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const write = (key, value) => {
  try {
    if (value == null) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(key, value);
    }
  } catch {
    // Gracefully handle storage errors (e.g. private browsing)
  }
};

export const session = {
  get token() {
    return read(TOKEN_KEY);
  },
  get role() {
    return read(ROLE_KEY);
  },
  save(token, role) {
    write(TOKEN_KEY, token);
    write(ROLE_KEY, role);
  },
  clear() {
    write(TOKEN_KEY, null);
    write(ROLE_KEY, null);
  },
};

export const UNAUTHORIZED_EVENT = 'apnaride:unauthorized';

const apiClient = axios.create({ baseURL: API_URL, timeout: 15000 });

apiClient.interceptors.request.use((config) => {
  const token = session.token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const isAuthCall = /\/(login|register)$/.test(error.config?.url || '');
    if (error.response?.status === 401 && !isAuthCall) {
      window.dispatchEvent(new Event(UNAUTHORIZED_EVENT));
    }
    return Promise.reject(error);
  },
);

export const errorMessage = (error) => {
  if (error.response?.data?.message) return error.response.data.message;
  if (error.code === 'ECONNABORTED') return 'The request timed out. Check your connection and try again.';
  if (error.request) return 'Cannot reach the server. Check your connection and try again.';
  return 'Something went wrong. Please try again.';
};

export default apiClient;
