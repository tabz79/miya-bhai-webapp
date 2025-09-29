// server/constants/orderConstants.js
export const STATUS_ENUM = [
  'NEW', 'PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY',
  'COMPLETED', 'CANCELLED', 'RETURNED'
];
export const STATUS_SET = new Set(STATUS_ENUM);
