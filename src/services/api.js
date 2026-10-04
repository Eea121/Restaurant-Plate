import axios from 'axios';
import config from '../config';

const TOKEN_KEY = 'auth_token';

export const getToken = () => localStorage.getItem(TOKEN_KEY);
export const setToken = (token) => localStorage.setItem(TOKEN_KEY, token);
export const clearToken = () => localStorage.removeItem(TOKEN_KEY);

const api = axios.create({
  baseURL: config.apiUrl,
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.request.use((request) => {
  const token = getToken();
  if (token) {
    request.headers.Authorization = `Bearer ${token}`;
  }
  return request;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const { response } = error;
    if (response && response.status === 401) {
      const url = error.config?.url || '';
      const isLoginCall = url.includes('/Authentication/Login');
      if (!isLoginCall) {
        clearToken();
        window.dispatchEvent(new Event('auth:unauthorized'));
      }
    }
    return Promise.reject(error);
  },
);

const getErrorMessage = (error) => {
  // Timeouts Carry No Response Object, So They Must Be Detected Via Code.
  if (error?.code === 'ECONNABORTED') {
    return 'The request timed out. Please check your connection and try again.';
  }
  const data = error?.response?.data;
  if (!data) {
    if (error?.message === 'Network Error') {
      return 'Unable to reach the server. Please try again.';
    }
    const status = error?.response?.status;
    return status
      ? `Something went wrong (HTTP ${status}). Please try again.`
      : 'Something went wrong. Please try again.';
  }
  const joinErrors = (errors) =>
    Object.values(errors)
      .flatMap((item) => (Array.isArray(item) ? item : [item]))
      .filter(Boolean)
      .join(' ');
  if (Array.isArray(data.validationErrors)) {
    return data.validationErrors
      .flatMap((item) => joinErrors(item.errors || {}))
      .join(' ');
  }
  // ASP.NET ProblemDetails Uses An Errors Dictionary, Not An Array.
  if (typeof data.errors === 'object' && !Array.isArray(data.errors)) {
    const msg = joinErrors(data.errors);
    if (msg) return msg;
  }
  if (Array.isArray(data.errors) && data.errors.length > 0) {
    return data.errors.join(' ');
  }
  if (typeof data === 'string') {
    return data;
  }
  if (data.message || data.title) {
    return data.message || data.title;
  }
  const status = error?.response?.status;
  return status
    ? `Something went wrong (HTTP ${status}). Please try again.`
    : 'Something went wrong. Please try again.';
};

export { getErrorMessage };
export default api;
