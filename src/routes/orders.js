import express from 'express';
import {
  createOrder,
  getOrderById,
  getOrders,
  getOrdersByStaffId,
  assignOrder,
  updateOrderStatus,
} from '../services/orderService.js';

const router = express.Router();

// Basic auth middleware for admin
const adminAuth = (req, res, next) => {
  if (req.headers.authorization !== process.env.ADMIN_SECRET) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

router.post('/orders/create', async (req, res) => {
  try {
    const result = await createOrder(req.body);
    if (result.error) {
      return res.status(400).json({ error: result.error.message });
    }
    res.status(201).json(result);
  } catch (e) {
    console.error('Error in /api/orders/create:', e);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/orders/:id', async (req, res) => {
  const order = await getOrderById(req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

router.get('/orders', adminAuth, async (req, res) => {
  const orders = await getOrders();
  res.json(orders);
});

router.get('/staff/:staffId/orders', async (req, res) => {
  const orders = await getOrdersByStaffId(req.params.staffId);
  res.json(orders);
});

router.post('/orders/:id/assign', adminAuth, async (req, res) => {
  const { staffId } = req.body;
  const order = await assignOrder(req.params.id, staffId);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

router.post('/orders/:id/status', async (req, res) => {
  const { status, collectedAmount, collectedBy } = req.body;
  const order = await updateOrderStatus(req.params.id, status, collectedAmount, collectedBy);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

router.post('/webhook/razorpay', (req, res) => {
  // This will be implemented later
  res.status(501).json({ message: 'Not Implemented' });
});

export default router;