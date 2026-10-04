import api from './api';

export const createOrUpdatePaymentIntent = (basketId) =>
  api.post(`/Payments/${basketId}`);
