import api from './api';

const pick = (obj, ...keys) => {
  for (const key of keys) {
    const value = obj?.[key];
    if (value !== undefined && value !== null) return value;
  }
  return undefined;
};

const normalizeBranch = (b) =>
  b
    ? {
        id: pick(b, 'id', 'Id'),
        location: pick(b, 'location', 'Location'),
        phone: pick(b, 'phone', 'Phone'),
        latitude: pick(b, 'latitude', 'Latitude'),
        longitude: pick(b, 'longitude', 'Longitude'),
      }
    : b;

const normalizeDaySlot = (s) =>
  s
    ? {
        id: pick(s, 'id', 'Id'),
        time: pick(s, 'time', 'Time'),
        isAvailable: pick(s, 'isAvailable', 'IsAvailable'),
        dayId: pick(s, 'dayId', 'DayId'),
      }
    : s;

const normalizeDay = (d) =>
  d
    ? {
        id: pick(d, 'id', 'Id'),
        date: pick(d, 'date', 'Date'),
        isReserved: pick(d, 'isReserved', 'IsReserved'),
        branchId: pick(d, 'branchId', 'BranchId'),
        daySlots: (pick(d, 'daySlots', 'DaySlots') || []).map(normalizeDaySlot),
      }
    : d;

const normalizeReservation = (r) =>
  r
    ? {
        id: pick(r, 'id', 'Id'),
        firstName: pick(r, 'firstName', 'FirstName'),
        lastName: pick(r, 'lastName', 'LastName'),
        phoneNumber: pick(r, 'phoneNumber', 'PhoneNumber'),
        note: pick(r, 'note', 'Note'),
        numberOfPeople: pick(r, 'numberOfPeople', 'NumberOfPeople'),
        branchId: pick(r, 'branchId', 'BranchId'),
        branchLocation: pick(r, 'branchLocation', 'BranchLocation'),
        dayId: pick(r, 'dayId', 'DayId'),
        dayDate: pick(r, 'dayDate', 'DayDate'),
        daySlotId: pick(r, 'daySlotId', 'DaySlotId'),
        daySlotTime: pick(r, 'daySlotTime', 'DaySlotTime'),
        status: pick(r, 'status', 'Status'),
      }
    : r;

const normalizeOpenHours = (o) =>
  o
    ? {
        startTime: pick(o, 'startTime', 'StartTime'),
        endTime: pick(o, 'endTime', 'EndTime'),
        dayId: pick(o, 'dayId', 'DayId'),
        dayDate: pick(o, 'dayDate', 'DayDate'),
      }
    : o;

const normalizeFeedback = (f) =>
  f
    ? {
        id: pick(f, 'id', 'Id'),
        name: pick(f, 'name', 'Name'),
        location: pick(f, 'location', 'Location'),
        msg: pick(f, 'msg', 'Msg'),
        rate: pick(f, 'rate', 'Rate'),
        isApproved: pick(f, 'isApproved', 'IsApproved'),
        createdAt: pick(f, 'createdAt', 'CreatedAt'),
      }
    : f;

const normalizeContactUs = (c) =>
  c
    ? {
        id: pick(c, 'id', 'Id'),
        fullName: pick(c, 'fullName', 'FullName'),
        contactEmail: pick(c, 'contactEmail', 'ContactEmail'),
        phoneNumber: pick(c, 'phoneNumber', 'PhoneNumber'),
        message: pick(c, 'message', 'Message'),
        isRead: pick(c, 'isRead', 'IsRead'),
        createdAt: pick(c, 'createdAt', 'CreatedAt'),
      }
    : c;

const normalizePagination = (body = {}, mapper) => ({
  pageSize: pick(body, 'pageSize', 'PageSize'),
  pageIndex: pick(body, 'pageIndex', 'PageIndex'),
  count: pick(body, 'count', 'Count'),
  data: (pick(body, 'data', 'Data') || []).map(mapper || ((x) => x)),
});

// ---------------------------- Branch ----------------------------

export const getBranches = async () => {
  const res = await api.get('/Branch');
  const data = (Array.isArray(res.data) ? res.data : []).map(normalizeBranch);
  return { ...res, data };
};

export const getAvailableBranchDaysAndSlotes = async (branchId) => {
  const res = await api.get(`/Branch/GetAvailableBranchDaysAndSlotes/${branchId}`);
  const data = (Array.isArray(res.data) ? res.data : []).map(normalizeDay);
  return { ...res, data };
};

export const getBranchOpenHours = async (branchId, options = {}) => {
  const res = await api.get(`/Branch/GetOpenHours/${branchId}`, {
    params: options.openOnly ? { openOnly: true } : undefined,
  });
  const data = (Array.isArray(res.data) ? res.data : []).map(normalizeOpenHours);
  return { ...res, data };
};

export const createBranch = (payload) => api.post('/Branch', payload);

export const updateBranch = (id, payload) =>
  api.put(`/Branch/Update/${id}`, payload);

export const deleteBranch = (id) => api.delete(`/Branch/${id}`);

// ---------------------------- Day ----------------------------

export const getDays = async () => {
  const res = await api.get('/Day');
  const data = (Array.isArray(res.data) ? res.data : []).map(normalizeDay);
  return { ...res, data };
};

export const createDay = (payload) => api.post('/Day', payload);

export const updateDay = (id, payload) => api.put(`/Day/Update/${id}`, payload);

export const deleteDay = (id) => api.delete(`/Day/${id}`);

// ---------------------------- DaySlot ----------------------------

export const getDaySlots = async () => {
  const res = await api.get('/DaySlot');
  const data = (Array.isArray(res.data) ? res.data : []).map(normalizeDaySlot);
  return { ...res, data };
};

export const createDaySlot = (payload) => api.post('/DaySlot', payload);

export const updateDaySlot = (id, payload) =>
  api.put(`/DaySlot/Update/${id}`, payload);

export const deleteDaySlot = (id) => api.delete(`/DaySlot/${id}`);

// ---------------------------- Reservation ----------------------------

export const getReservations = async (params = {}) => {
  const res = await api.get('/Reservation', { params });
  const body = normalizePagination(res.data, normalizeReservation);
  return { ...res, data: body };
};

export const createReservation = (payload) => api.post('/Reservation', payload);

export const getMyReservations = async () => {
  const res = await api.get('/Reservation/my-reservations');
  const data = (Array.isArray(res.data) ? res.data : []).map(normalizeReservation);
  return { ...res, data };
};

export const cancelReservation = (id) => api.put(`/Reservation/${id}/cancel`);

export const updateReservation = (id, payload) =>
  api.put(`/Reservation/Update/${id}`, payload);

export const deleteReservation = (id) => api.delete(`/Reservation/${id}`);

// ---------------------------- OpenHours ----------------------------

export const getOpenHours = async () => {
  const res = await api.get('/OpenHours');
  const data = (Array.isArray(res.data) ? res.data : []).map(normalizeOpenHours);
  return { ...res, data };
};

export const createOpenHours = (payload) => api.post('/OpenHours', payload);

export const updateOpenHours = (dayId, startTime, endTime, payload) =>
  api.put(`/OpenHours/Update/${dayId}/${startTime}/${endTime}`, payload);

export const deleteOpenHours = (dayId, startTime, endTime) =>
  api.delete(`/OpenHours/${dayId}/${startTime}/${endTime}`);

// ---------------------------- FeedBack ----------------------------

export const getFeedBacks = async (params = {}) => {
  const res = await api.get('/FeedBack', { params });
  const body = normalizePagination(res.data, normalizeFeedback);
  return { ...res, data: body };
};

export const addFeedback = (payload) => api.post('/FeedBack', payload);

export const updateFeedBack = (id, payload) =>
  api.put(`/FeedBack/Update/${id}`, payload);

export const deleteFeedBack = (id) => api.delete(`/FeedBack/${id}`);

// ---------------------------- ContactUs ----------------------------

export const getContactUsMessages = async (params = {}) => {
  const res = await api.get('/ContactUs', { params });
  const body = normalizePagination(res.data, normalizeContactUs);
  return { ...res, data: body };
};

export const createContactUs = (payload) => api.post('/ContactUs', payload);

export const updateContactUs = (id, payload) =>
  api.put(`/ContactUs/Update/${id}`, payload);

export const deleteContactUs = (id) => api.delete(`/ContactUs/${id}`);
