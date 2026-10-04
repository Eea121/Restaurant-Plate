import api from './api';
import { normalizeOrder } from './adminService';

export const createOrder = (order) => api.post('/Orders', order);

export const getDeliveryMethods = () => api.get('/Orders/DeliveryMethods');

export const getMyOrders = async (params = {}) => {
  const res = await api.get('/Orders', { params });
  const data = (Array.isArray(res.data) ? res.data : []).map(normalizeOrder);
  return { ...res, data };
};
