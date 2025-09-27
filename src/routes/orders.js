
import express from 'express';
import {
  createOrder,
  getOrderById,
  getOrders,
  markOrderAsPaid,
  updateOrderStatus,
} from '../services/orderService.js';

const router = express.Router();

router.post('/orders/create', async (req, res) => {
  const order = await createOrder(req.body);
  res.status(201).json(order);
});

router.get('/orders/:id', async (req, res) => {
  const order = await getOrderById(req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

router.get('/orders', async (req, res) => {
  const orders = await getOrders();
  res.json(orders);
});

router.post('/orders/:id/mark-paid', async (req, res) => {
  const order = await markOrderAsPaid(req.params.id);
  if (order) {
    res.json(order);
  } else {
    res.status(404).json({ message: 'Order not found' });
  }
});

router.post('/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  const order = await updateOrderStatus(req.params.id, status);
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
