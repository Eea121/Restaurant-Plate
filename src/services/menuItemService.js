import api from './api';

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

const normalizeMenuItem = (item) =>
  item
    ? {
        id: pick(item, 'id', 'Id'),
        name: pick(item, 'name', 'Name'),
        description: pick(item, 'description', 'Description'),
        price: pick(item, 'price', 'Price'),
        pictureUrl: pick(item, 'pictureUrl', 'PictureUrl'),
        foodCategory: pick(item, 'foodCategory', 'FoodCategory'),
        typeId: pick(item, 'typeId', 'TypeId'),
        isSpecialOffer:
          pick(item, 'isSpecialOffer', 'IsSpecialOffer') === true,
        discountPercentage: pick(
          item,
          'discountPercentage',
          'DiscountPercentage',
        ),
      }
    : item;

const normalizePagination = (body = {}) => ({
  pageSize: pick(body, 'pageSize', 'PageSize'),
  pageIndex: pick(body, 'pageIndex', 'PageIndex'),
  count: pick(body, 'count', 'Count'),
  data: (pick(body, 'data', 'Data') || []).map(normalizeMenuItem),
});

export const getMenuItems = async (params = {}) => {
  const res = await api.get('/MenuItems', { params });
  return { ...res, data: normalizePagination(res.data) };
};

export const getFoodCategories = () => api.get('/MenuItems/foodCategories');

export const createMenuItem = (payload) => api.post('/MenuItems', payload);

export const updateMenuItem = (id, payload) =>
  api.put(`/MenuItems/Update/${id}`, payload);

export const deleteMenuItem = (id) => api.delete(`/MenuItems/${id}`);
