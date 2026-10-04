import api from './api';

export const login = (credentials) =>
  api.post('/Authentication/Login', credentials);

export const register = (payload) =>
  api.post('/Authentication/Register', payload);

export const getCurrentUser = () => api.get('/Authentication/CurrentUser');

export const getAddress = () => api.get('/Authentication/Address');

export const updateAddress = (address) =>
  api.put('/Authentication/Address', address);
