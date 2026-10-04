import {
  getMenuItems,
  createMenuItem,
  updateMenuItem,
  deleteMenuItem,
  getFoodCategories,
} from '../services/menuItemService';
import {
  getBranches,
  createBranch,
  updateBranch,
  deleteBranch,
  getDays,
  createDay,
  updateDay,
  deleteDay,
  getDaySlots,
  createDaySlot,
  updateDaySlot,
  deleteDaySlot,
  getReservations,
  updateReservation,
  deleteReservation,
  getFeedBacks,
  updateFeedBack,
  deleteFeedBack,
  getContactUsMessages,
  updateContactUs,
  deleteContactUs,
} from '../services/restaurantService';
import {
  updateReservationStatus,
  updateFeedbackApproval,
  markContactRead,
  uploadMenuItemImage,
  RESERVATION_STATUS,
  RESERVATION_STATUS_LABELS,
  RESERVATION_STATUS_STYLES,
} from '../services/adminService';

const branchOptions = () =>
  getBranches().then((r) =>
    (r.data || []).map((b) => ({ value: b.id, label: b.location })),
  );

const formatDayDate = (date) => {
  if (!date) return null;
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return String(date);
  return parsed.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const dayOptions = () =>
  getDays().then((r) =>
    (r.data || []).map((d) => ({ value: d.id, label: formatDayDate(d.date) })),
  );

const daySlotOptions = async () => {
  const [slotsRes, daysRes] = await Promise.all([getDaySlots(), getDays()]);
  const days = daysRes.data || [];
  const dayById = Object.fromEntries(days.map((d) => [d.id, d]));
  return (slotsRes.data || []).map((s) => ({
    value: s.id,
    label: `${formatDayDate(dayById[s.dayId]?.date) || `Day ${s.dayId}`} - ${s.time}`,
  }));
};

const foodCategoryOptions = () =>
  getFoodCategories().then((r) =>
    (r.data || []).map((c) => ({ value: c.id, label: c.name })),
  );

const reservationStatusSelect = {
  options: [
    { value: RESERVATION_STATUS.Pending, label: RESERVATION_STATUS_LABELS.Pending },
    { value: RESERVATION_STATUS.Approved, label: RESERVATION_STATUS_LABELS.Approved },
    { value: RESERVATION_STATUS.Completed, label: RESERVATION_STATUS_LABELS.Completed },
    { value: RESERVATION_STATUS.Cancelled, label: RESERVATION_STATUS_LABELS.Cancelled },
    { value: RESERVATION_STATUS.Rejected, label: RESERVATION_STATUS_LABELS.Rejected },
  ],
  getValue: (row) => String(RESERVATION_STATUS[row.status] ?? ''),
  style: (row) => RESERVATION_STATUS_STYLES[row.status] || 'bg-gray-100 text-gray-600',
  onChange: (row, value) => updateReservationStatus(row.id, Number(value)),
};

const reservationFilters = [
  {
    name: 'status',
    label: 'All Statuses',
    paramName: 'status',
    type: 'number',
    options: Object.entries(RESERVATION_STATUS_LABELS).map(([value, label]) => ({
      value: RESERVATION_STATUS[value],
      label,
    })),
  },
];

export const entityConfigs = {
  menuItems: {
    title: 'Menu Items',
    service: {
      list: (params) =>
        getMenuItems(params).then((r) => ({ data: r.data.data, count: r.data.count })),
      create: createMenuItem,
      update: (row, payload) => updateMenuItem(row.id, payload),
      remove: (row) => deleteMenuItem(row.id),
    },
    paginated: true,
    columns: [
      {
        key: 'pictureUrl',
        label: 'Image',
        render: (row) =>
          row.pictureUrl ? (
            <img
              src={row.pictureUrl}
              alt={row.name}
              className="w-12 h-12 rounded-md object-cover border border-gray-100"
            />
          ) : (
            <span className="text-xs text-gray-400">No image</span>
          ),
      },
      { key: 'name', label: 'Name' },
      { key: 'foodCategory', label: 'Category' },
      { key: 'price', label: 'Price', type: 'currency' },
      { key: 'isSpecialOffer', label: 'Special Offer', type: 'boolean' },
      {
        key: 'discountPercentage',
        label: 'Discount %',
        // Never Blank: Offers Show Their Percentage, Everything Else "No Discount".
        render: (row) => {
          const discount = Number(row.discountPercentage);
          if (row.isSpecialOffer && discount > 0) {
            return (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                {discount}%
              </span>
            );
          }
          return (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
              No Discount
            </span>
          );
        },
      },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'price', label: 'Price', type: 'number', step: '0.01', required: true },
      { name: 'pictureUrl', label: 'Image', type: 'file', upload: uploadMenuItemImage },
      {
        name: 'typeId',
        label: 'Food Category',
        type: 'select',
        required: true,
        options: foodCategoryOptions,
      },
      {
        name: 'isSpecialOffer',
        label: 'Special Offer',
        type: 'checkbox',
        defaultValue: false,
      },
      {
        name: 'discountPercentage',
        label: 'Discount %',
        type: 'number',
        step: 'any',
        min: '1',
        max: '100',
        // Locked Until The "Special Offer" Checkbox Is Ticked.
        enabledWhen: 'isSpecialOffer',
        requiredWhenEnabled: true,
      },
    ],
  },

  branches: {
    title: 'Branches',
    service: {
      list: async () => {
        const r = await getBranches();
        return { data: r.data, count: r.data.length };
      },
      create: createBranch,
      update: (row, payload) => updateBranch(row.id, payload),
      remove: (row) => deleteBranch(row.id),
    },
    paginated: false,
    columns: [
      { key: 'location', label: 'Location' },
      { key: 'phone', label: 'Phone' },
      { key: 'latitude', label: 'Latitude' },
      { key: 'longitude', label: 'Longitude' },
    ],
    fields: [
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'phone', label: 'Phone', type: 'text', required: true },
      { name: 'latitude', label: 'Latitude', type: 'number', step: 'any', required: true },
      { name: 'longitude', label: 'Longitude', type: 'number', step: 'any', required: true },
    ],
  },

  days: {
    title: 'Days',
    service: {
      list: async () => {
        const r = await getDays();
        return { data: r.data, count: r.data.length };
      },
      create: createDay,
      update: (row, payload) => updateDay(row.id, payload),
      remove: (row) => deleteDay(row.id),
    },
    paginated: false,
    columns: [
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'branchId', label: 'Branch ID' },
      { key: 'isReserved', label: 'Reserved', type: 'boolean' },
    ],
    fields: [
      { name: 'date', label: 'Date', type: 'datetime-local', required: true },
      { name: 'branchId', label: 'Branch', type: 'select', required: true, options: branchOptions },
      { name: 'isReserved', label: 'Reserved', type: 'checkbox', defaultValue: false },
    ],
  },

  daySlots: {
    title: 'Day Slots',
    service: {
      list: async () => {
        const r = await getDaySlots();
        return { data: r.data, count: r.data.length };
      },
      create: createDaySlot,
      update: (row, payload) => updateDaySlot(row.id, payload),
      remove: (row) => deleteDaySlot(row.id),
    },
    paginated: false,
    columns: [
      { key: 'dayId', label: 'Day ID' },
      { key: 'time', label: 'Time', type: 'time' },
      { key: 'isAvailable', label: 'Available', type: 'boolean' },
    ],
    fields: [
      { name: 'dayId', label: 'Day', type: 'select', required: true, options: dayOptions },
      { name: 'time', label: 'Time', type: 'time', required: true },
      { name: 'isAvailable', label: 'Available', type: 'checkbox', defaultValue: true },
    ],
  },

  reservations: {
    title: 'Reservations',
    service: {
      list: (params) =>
        getReservations(params).then((r) => ({ data: r.data.data, count: r.data.count })),
      update: (row, payload) => updateReservation(row.id, payload),
      remove: (row) => deleteReservation(row.id),
    },
    paginated: true,
    createDisabled: true,
    editDisabled: true,
    columns: [
      { key: 'firstName', label: 'First Name' },
      { key: 'lastName', label: 'Last Name' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'numberOfPeople', label: 'People' },
      { key: 'branchLocation', label: 'Branch' },
      { key: 'dayDate', label: 'Day', type: 'date' },
      { key: 'daySlotTime', label: 'Time', type: 'time' },
      { key: 'status', label: 'Status', select: reservationStatusSelect },
    ],
    fields: [
      { name: 'firstName', label: 'First Name', type: 'text', required: true },
      { name: 'lastName', label: 'Last Name', type: 'text', required: true },
      { name: 'phoneNumber', label: 'Phone Number', type: 'text', required: true },
      { name: 'numberOfPeople', label: 'Number of People', type: 'number', required: true },
      { name: 'branchId', label: 'Branch', type: 'select', required: true, options: branchOptions },
      { name: 'dayId', label: 'Day', type: 'select', required: true, options: dayOptions },
      { name: 'daySlotId', label: 'Day Slot', type: 'select', required: true, options: daySlotOptions },
      { name: 'note', label: 'Note', type: 'textarea' },
    ],
    filters: reservationFilters,
  },

  feedbacks: {
    title: 'Feedbacks',
    service: {
      list: (params) =>
        getFeedBacks(params).then((r) => ({ data: r.data.data, count: r.data.count })),
      update: (row, payload) => updateFeedBack(row.id, payload),
      remove: (row) => deleteFeedBack(row.id),
    },
    paginated: true,
    editDisabled: true,
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'location', label: 'Location' },
      { key: 'rate', label: 'Rate' },
      { key: 'msg', label: 'Message' },
      {
        key: 'isApproved',
        label: 'Approval',
        select: {
          options: [
            { value: 'true', label: 'Approved' },
            { value: 'false', label: 'Not Approved' },
          ],
          getValue: (row) => String(!!row.isApproved),
          style: (row) =>
            row.isApproved ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600',
          onChange: (row, value) => updateFeedbackApproval(row.id, value === 'true'),
        },
      },
      { key: 'createdAt', label: 'Date', type: 'date' },
    ],
    fields: [
      { name: 'name', label: 'Name', type: 'text', required: true },
      { name: 'location', label: 'Location', type: 'text', required: true },
      { name: 'msg', label: 'Message', type: 'textarea', required: true },
      { name: 'rate', label: 'Rate', type: 'number', min: '1', max: '5', required: true },
    ],
    filters: [
      {
        name: 'isApproved',
        label: 'All Approval',
        paramName: 'isApproved',
        type: 'number',
        options: [
          { value: 1, label: 'Approved' },
          { value: 0, label: 'Not Approved' },
        ],
      },
      {
        name: 'rate',
        label: 'All Ratings',
        paramName: 'rate',
        type: 'number',
        options: [
          { value: 1, label: '1 Star' },
          { value: 2, label: '2 Stars' },
          { value: 3, label: '3 Stars' },
          { value: 4, label: '4 Stars' },
          { value: 5, label: '5 Stars' },
        ],
      },
    ],
  },

  contacts: {
    title: 'Contact Messages',
    service: {
      list: (params) =>
        getContactUsMessages(params).then((r) => ({ data: r.data.data, count: r.data.count })),
      update: (row, payload) => updateContactUs(row.id, payload),
      remove: (row) => deleteContactUs(row.id),
    },
    paginated: true,
    createDisabled: true,
    editDisabled: true,
    columns: [
      { key: 'fullName', label: 'Full Name' },
      { key: 'contactEmail', label: 'Email' },
      { key: 'phoneNumber', label: 'Phone' },
      { key: 'message', label: 'Message' },
      { key: 'isRead', label: 'Read', type: 'boolean' },
      { key: 'createdAt', label: 'Date', type: 'date' },
    ],
    fields: [
      { name: 'fullName', label: 'Full Name', type: 'text', required: true },
      { name: 'contactEmail', label: 'Email', type: 'text', required: true },
      { name: 'phoneNumber', label: 'Phone Number', type: 'text', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: true },
    ],
    filters: [
      {
        name: 'isRead',
        label: 'All Read Status',
        paramName: 'isRead',
        type: 'number',
        options: [
          { value: 1, label: 'Read' },
          { value: 0, label: 'Unread' },
        ],
      },
    ],
    rowActions: [
      {
        label: 'Mark as Read',
        reload: true,
        show: (row) => !row.isRead,
        onClick: (row) => markContactRead(row.id),
      },
    ],
  },
};
