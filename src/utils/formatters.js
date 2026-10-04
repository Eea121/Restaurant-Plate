export const formatPrice = (value) => {
  const num = Number(value);
  if (Number.isNaN(num)) return '$0.00';
  return `$${num.toFixed(2)}`;
};

// Price Actually Charged: Base Price Minus The Active Special-Offer Discount.
export const getEffectivePrice = (product) => {
  const price = Number(product?.price) || 0;
  const discount = Number(product?.discountPercentage) || 0;
  if (!product?.isSpecialOffer || discount <= 0) return price;
  return Math.round((price - (price * discount) / 100) * 100) / 100;
};

// True When A Menu Item Has A Live Special-Offer Discount Worth Showing.
export const hasActiveOffer = (item) =>
  !!item?.isSpecialOffer &&
  item.discountPercentage !== null &&
  item.discountPercentage !== undefined &&
  Number(item.discountPercentage) > 0;

export const formatDayDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDayName = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString('en-US', { weekday: 'long' });
};

export const formatTimeSlot = (value) => {
  if (!value) return '';
  const match = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return String(value);
  const hours = parseInt(match[1], 10);
  const minutes = match[2];
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${minutes} ${period}`;
};
