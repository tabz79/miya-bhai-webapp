// server/routes/orders.js
import express from 'express';
import {
  createOrder,
  getOrderById,
  getOrders, // getOrders({ page, limit, status, search })
  getOrdersByStaffId,
  assignOrder, // assignOrder(orderId, staffId)
  updateOrderStatus, // updateOrderStatus(orderId, status, opts)
} from '../services/orderService.js';

import { validatePagination, requireStaffId, requireStatus, isUuid } from '../middleware/validation.js';

const router = express.Router();

// Basic auth middleware for admin
const adminAuth = (req, res, next) => {
  if (req.headers.authorization !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

/**
 * Create order
 * POST /api/orders/create
 */
router.post('/orders/create', async (req, res) => {
  try {
    // Normalize and validate incoming payload to avoid simple client/server mismatches
    const incoming = req.body || {};
    const payload = { ...incoming };

    // Normalize coupon_code to uppercase string (or null)
    if (payload.coupon_code) {
      payload.coupon_code = String(payload.coupon_code).trim().toUpperCase();
    } else {
      payload.coupon_code = null;
    }

    // Coerce totals.subtotal to number if present
    if (payload.totals && payload.totals.subtotal != null) {
      payload.totals = { ...payload.totals, subtotal: Number(payload.totals.subtotal) };
    } else if (!payload.totals) {
      payload.totals = { subtotal: 0 };
    } else {
      payload.totals = { ...payload.totals, subtotal: Number(payload.totals.subtotal ?? 0) };
    }

    // Coerce discount_amount/payable_amount to numbers if provided (fallback to compute payable)
    payload.discount_amount = payload.discount_amount != null ? Number(payload.discount_amount) : 0;
    if (payload.payable_amount != null) {
      payload.payable_amount = Number(payload.payable_amount);
    } else {
      const subtotal = Number(payload.totals.subtotal ?? 0);
      const taxable = Math.max(0, subtotal - Number(payload.discount_amount ?? 0));
      const gst = payload.totals && payload.totals.gst != null ? Number(payload.totals.gst) : taxable * 0.05;
      const deliveryCharge = payload.delivery_charge != null ? Number(payload.delivery_charge) : Number(payload.totals?.deliveryCharge ?? 0);
      payload.payable_amount = Number((taxable + gst + deliveryCharge).toFixed(2));
    }

    // Helpful log for debugging bad payloads
    console.log('[orders.create] Normalized incoming payload:', JSON.stringify(payload));

    const result = await createOrder(payload);
    if (result?.error) {
      // preserve the structured error if service returned it
      return res.status(400).json({ error: result.error.message ?? result.error });
    }
    res.status(201).json(result);
  } catch (e) {
    console.error('Error in /api/orders/create:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Get single order
 * GET /api/orders/:id
 */
router.get('/orders/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid order id' });

    const order = await getOrderById(id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (e) {
    console.error('Error in GET /api/orders/:id', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Paginated orders list (admin-only)
 * GET /api/orders?page=&limit=&status=&search=
 */
router.get('/orders', adminAuth, validatePagination, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page || '1', 10));
    const limit = Math.min(100, parseInt(req.query.limit || '25', 10));
    const status = req.query.status || undefined;
    const search = req.query.search || undefined;

    const { items, total } = await getOrders({ page, limit, status, search });

    return res.json({ items, total: Number(total ?? 0), page, limit });
  } catch (e) {
    console.error('Error in GET /api/orders', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Orders for a staff member (no admin auth - restrict later if required)
 * GET /api/staff/:staffId/orders
 */
router.get('/staff/:staffId/orders', requireStaffId, async (req, res) => {
  try {
    const orders = await getOrdersByStaffId(req.params.staffId);
    res.json(orders);
  } catch (e) {
    console.error('Error in GET /api/staff/:staffId/orders', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Assign order to a driver (admin only)
 * PUT /api/orders/:id/assign
 * body: { staffId: 'uuid' }
 */
router.put('/orders/:id/assign', adminAuth, requireStaffId, async (req, res) => {
  try {
    const { staffId } = req.body;
    const id = req.params.id;
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid order id' });

    const updated = await assignOrder(id, staffId);
    if (!updated) return res.status(404).json({ message: 'Order not found or assign failed' });

    return res.json(updated);
  } catch (e) {
    console.error('Error in PUT /api/orders/:id/assign', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Update order status (admin or workflow endpoint)
 * PUT /api/orders/:id/status
 * body: { status: 'NEW|PENDING|COMPLETED|CANCELLED', collectedAmount?, collectedBy? }
 */
router.put('/orders/:id/status', requireStatus, async (req, res) => {
  try {
    const { status, collectedAmount, collectedBy } = req.body;
    const id = req.params.id;
    if (!isUuid(id)) return res.status(400).json({ error: 'Invalid order id' });

    // Optional: enforce adminAuth for certain status transitions
    // if (['CANCELLED','COMPLETED'].includes(status) && req.headers.authorization !== process.env.ADMIN_SECRET) {
    //   return res.status(401).json({ message: 'Unauthorized' });
    // }

    const opts = { collectedAmount, collectedBy };
    const updated = await updateOrderStatus(id, status, opts);
    if (!updated) return res.status(404).json({ message: 'Order not found or status update failed' });

    return res.json(updated);
  } catch (e) {
    console.error('Error in PUT /api/orders/:id/status', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Razorpay webhook stub
 */
router.post('/webhook/razorpay', (req, res) => {
  // TODO: verify signature, validate payload, update order status via updateOrderStatus etc.
  res.status(501).json({ message: 'Not Implemented' });
});

export default router;
