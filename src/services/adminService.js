import api, { getToken } from './api';
import config from '../config';

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

export const ORDER_STATUS = {
  Pending: 0,
  PaymentReceived: 1,
  PaymentFailed: 2,
  Preparing: 3,
  Ready: 4,
  Delivered: 5,
  Cancelled: 6,
};

export const ORDER_STATUS_LABELS = {
  Pending: 'Pending',
  PaymentReceived: 'Payment Received',
  PaymentFailed: 'Payment Failed',
  Preparing: 'Preparing',
  Ready: 'Ready',
  Delivered: 'Delivered',
  Cancelled: 'Cancelled',
};

export const ORDER_STATUS_STYLES = {
  Pending: 'bg-gray-100 text-gray-600',
  PaymentReceived: 'bg-blue-100 text-blue-700',
  PaymentFailed: 'bg-red-100 text-red-600',
  Preparing: 'bg-amber-100 text-amber-700',
  Ready: 'bg-purple-100 text-purple-700',
  Delivered: 'bg-green-100 text-green-700',
  Cancelled: 'bg-gray-200 text-gray-500',
};

export const RESERVATION_STATUS = {
  Pending: 0,
  Approved: 1,
  Rejected: 2,
  Cancelled: 3,
  Completed: 4,
};

export const RESERVATION_STATUS_LABELS = {
  Pending: 'Pending',
  Approved: 'Approved',
  Rejected: 'Rejected',
  Cancelled: 'Cancelled',
  Completed: 'Completed',
};

export const RESERVATION_STATUS_STYLES = {
  Pending: 'bg-gray-100 text-gray-600',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-600',
  Cancelled: 'bg-gray-200 text-gray-500',
  Completed: 'bg-blue-100 text-blue-700',
};

export const normalizeOrder = (o) =>
  o
    ? {
        id: pick(o, 'id', 'Id'),
        buyerEmail: pick(o, 'buyerEmail', 'BuyerEmail'),
        orderDate: pick(o, 'orderDate', 'OrderDate'),
        status: pick(o, 'status', 'Status'),
        deliveryMethod: pick(o, 'deliveryMethod', 'DeliveryMethod'),
        deliveryCost: pick(o, 'deliveryCost', 'DeliveryCost'),
        subtotal: pick(o, 'subtotal', 'Subtotal'),
        total: pick(o, 'total', 'Total'),
        shipToAddress: pick(o, 'shipToAddress', 'ShipToAddress'),
        items: (pick(o, 'items', 'Items') || []).map((item) => ({
          productName: pick(item, 'productName', 'ProductName'),
          pictureUrl: pick(item, 'pictureUrl', 'PictureUrl'),
          price: pick(item, 'price', 'Price'),
          quantity: pick(item, 'quantity', 'Quantity'),
        })),
      }
    : o;

const normalizeUser = (u) =>
  u
    ? {
        id: pick(u, 'id', 'Id'),
        userName: pick(u, 'userName', 'UserName'),
        email: pick(u, 'email', 'Email'),
        displayName: pick(u, 'displayName', 'DisplayName'),
        phoneNumber: pick(u, 'phoneNumber', 'PhoneNumber'),
        roles: pick(u, 'roles', 'Roles') || [],
        isLocked: pick(u, 'isLocked', 'IsLocked'),
        lockoutEnd: pick(u, 'lockoutEnd', 'LockoutEnd'),
      }
    : u;

const normalizePagination = (body = {}, mapper) => ({
  pageSize: pick(body, 'pageSize', 'PageSize'),
  pageIndex: pick(body, 'pageIndex', 'PageIndex'),
  count: pick(body, 'count', 'Count'),
  data: (pick(body, 'data', 'Data') || []).map(mapper || ((x) => x)),
});

// ---------------------------- Dashboard ----------------------------

export const getDashboardData = (params = {}) => api.get('/Dashboard', { params });

// ---------------------------- Orders (Admin) ----------------------------

export const getAdminOrders = async (params = {}, config = {}) => {
  const res = await api.get('/Orders/admin', { params, ...config });
  const body = normalizePagination(res.data, normalizeOrder);
  return { ...res, data: body };
};

export const updateOrderStatus = (id, status) =>
  api.put(`/Orders/admin/${id}/status`, { status });

// ---------------------------- Users (Admin) ----------------------------

export const getUsers = async (params = {}) => {
  const res = await api.get('/Users', { params });
  const body = normalizePagination(res.data, normalizeUser);
  return { ...res, data: body };
};

export const getRoles = () => api.get('/Users/roles');

export const lockUser = (id) => api.put(`/Users/${id}/lock`);

export const unlockUser = (id) => api.put(`/Users/${id}/unlock`);

export const changeUserRole = (id, role) => api.put(`/Users/${id}/role`, { role });

// ---------------------------- Reservation / FeedBack / ContactUs actions ----------------------------

export const updateReservationStatus = (id, status) =>
  api.put(`/Reservation/${id}/status`, { status });

export const updateFeedbackApproval = (id, isApproved) =>
  api.put(`/FeedBack/${id}/approval/${isApproved}`);

export const markContactRead = (id) => api.put(`/ContactUs/${id}/read`);

// ---------------------------- Menu Image Upload ----------------------------

export const uploadMenuItemImage = (file) => {
  const formData = new FormData();
  formData.append('file', file);
  // Uploads Are Slower Than JSON Calls; Override The Global 15s Timeout.
  return api.post('/MenuItems/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 60000,
  });
};

// ---------------------------- Reports ----------------------------

export const downloadReport = async (type, format = 'xlsx') => {
  const token = getToken();
  const res = await fetch(
    `${config.apiUrl}/Reports/${type}?format=${encodeURIComponent(format)}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    },
  );
  if (!res.ok) {
    throw new Error('Failed to download the report. Please try again.');
  }
  const blob = await res.blob();
  const disposition = res.headers.get('Content-Disposition') || '';
  const match = disposition.match(/filename="?([^";]+)"?/i);
  const filename = match ? match[1] : `report-${type}.${format === 'xlsx' ? 'xlsx' : format}`;
  const url = window.URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  window.URL.revokeObjectURL(url);
};
