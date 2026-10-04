import api from './api';

export const getBasket = (id) => api.get('/baskets', { params: { id } });

export const createOrUpdateBasket = (basket) => api.post('/baskets', basket);

export const deleteBasket = (key) => api.delete(`/baskets/${key}`);
