// server/middleware/validation.js
import { STATUS_SET } from '../constants/orderConstants.js';

export const isUuid = (val) => {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(val);
};

export const requireStatus = (req, res, next) => {
  const status = (req.body && req.body.status) || (req.query && req.query.status);
  if (!status || typeof status !== 'string' || !STATUS_SET.has(status)) {
    return res.status(400).json({ error: `Invalid or missing status. Allowed: ${Array.from(STATUS_SET).join(',')}` });
  }
  next();
};

export const requireStaffId = (req, res, next) => {
  const staffId = (req.body && req.body.staffId) || (req.params && req.params.staffId);
  if (!staffId || !isUuid(staffId)) {
    return res.status(400).json({ error: 'Invalid or missing staffId (must be UUID).' });
  }
  next();
};

export const validatePagination = (req, res, next) => {
  const p = Number(req.query.page ?? 1);
  const l = Number(req.query.limit ?? 25);
  if (!Number.isInteger(p) || p < 1 || !Number.isInteger(l) || l < 1 || l > 1000) {
    return res.status(400).json({ error: 'Invalid pagination. page>=1, 1<=limit<=1000' });
  }
  // sanitize into strings (routes expect strings sometimes)
  req.query.page = String(Math.max(1, p));
  req.query.limit = String(Math.min(100, l));
  next();
};
