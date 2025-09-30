// src/routes/admin.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'json2csv';

const router = express.Router();

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.warn('[admin routes] WARNING: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not set. Endpoints will fail until these env vars are provided.');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function toNumber(v) {
  const n = Number(v);
  return isNaN(n) ? 0 : n;
}

// Middleware for basic admin authentication (optional, for later)
// router.use((req, res, next) => {
//   const adminSecret = process.env.ADMIN_SECRET; // TODO: Define ADMIN_SECRET env var
//   if (!adminSecret || req.headers['x-admin-secret'] !== adminSecret) {
//     return res.status(401).json({ error: 'Unauthorized' });
//   }
//   next();
// });

// GET /api/admin/summary
router.get('/admin/summary', async (req, res) => {
  try {
    // total orders (all time)
    const { count: totalOrders, error: totalErr } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    if (totalErr) throw totalErr;

    // pending orders
    const { count: pendingOrders, error: pendingErr } = await supabase.from('orders').select('*', { count: 'exact', head: true }).in('status', ['NEW', 'PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY']);
    if (pendingErr) throw pendingErr;

    // completed orders
    const { count: completedOrders, error: completedErr } = await supabase.from('orders').select('*', { count: 'exact', head: true }).eq('status', 'COMPLETED');
    if (completedErr) throw completedErr;

    // total revenue (all time)
    // TODO: Ensure 'total' column in 'orders' table is numeric. Consider a database function for sum for better performance.
    const { data: revenueData, error: revenueErr } = await supabase.from('orders').select('total');
    if (revenueErr) throw revenueErr;
    const totalRevenue = (revenueData || []).reduce((s, r) => s + toNumber(r.total), 0);

    return res.json({ totalRevenue, totalOrders, pendingOrders, completedOrders });
  } catch (err) {
    console.error('[admin/summary] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/admin/charts/orders-over-time
router.get('/admin/charts/orders-over-time', async (req, res) => {
  try {
    const { from, to, interval } = req.query; // interval: 'day', 'week', 'month'

    let query = supabase.from('orders').select('created_at');

    if (from) {
      query = query.gte('created_at', from);
    }
    if (to) {
      query = query.lte('created_at', to);
    }

    const { data, error } = await query.order('created_at', { ascending: true });
    if (error) throw error;

    const aggregatedData = data.reduce((acc, order) => {
      let key;
      const date = new Date(order.created_at);

      if (interval === 'month') {
        key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      } else if (interval === 'week') {
        // Simple week calculation (might need refinement for ISO weeks)
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay()); // Sunday as start of week
        key = startOfWeek.toISOString().substring(0, 10);
      } else { // Default to day
        key = date.toISOString().substring(0, 10);
      }

      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.keys(aggregatedData).sort().map(key => ({
      period: key,
      orders: aggregatedData[key],
    }));

    return res.json({ data: chartData });
  } catch (err) {
    console.error('[admin/charts/orders-over-time] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/admin/charts/payment-methods
router.get('/admin/charts/payment-methods', async (req, res) => {
  try {
    // Assumption: 'payment_method' column exists in 'orders' table
    const { data, error } = await supabase.from('orders').select('payment_method');
    if (error) throw error;

    const methodCounts = data.reduce((acc, order) => {
      const method = order.payment_method || 'Unknown';
      acc[method] = (acc[method] || 0) + 1;
      return acc;
    }, {});

    const chartData = Object.keys(methodCounts).map(name => ({
      name,
      value: methodCounts[name],
    }));

    return res.json({ data: chartData });
  } catch (err) {
    console.error('[admin/charts/payment-methods] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/admin/orders
router.get('/admin/orders', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const status = req.query.status;
    const search = (req.query.search || '').trim();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let query = supabase.from('orders').select('*', { count: 'exact' });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    // Apply search filter if provided
    if (search) {
      // Supabase doesn't directly support complex OR conditions on multiple columns easily
      // For simplicity, we'll search 'order_id' and 'customer_details->>name'
      // TODO: Adjust based on actual Supabase search capabilities and performance needs
      query = query.or(`order_id.ilike.%${search}%,customer_details->>name.ilike.%${search}%`);
    }

    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) throw error;

    return res.json({ data: data || [], meta: { total: count ?? 0, page, limit } });
  } catch (err) {
    console.error('[admin/orders] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/admin/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }
    // TODO: Validate status against allowed enum values (e.g., NEW, PENDING, ACCEPTED, PREPARING, OUT_FOR_DELIVERY, DELIVERED, COMPLETED, CANCELLED)

    const { data, error } = await supabase.from('orders').update({ status }).eq('id', id).select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ message: 'Order status updated', order: data[0] });
  } catch (err) {
    console.error('[admin/orders/:id/status] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// PUT /api/admin/orders/:id/assign
router.put('/admin/orders/:id/assign', async (req, res) => {
  try {
    const { id } = req.params;
    const { driverId } = req.body; // driverId can be null to unassign

    // TODO: Validate driverId exists if not null, perhaps check against a list of active drivers

    const { data, error } = await supabase.from('orders').update({ assigned_to: driverId }).eq('id', id).select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    return res.json({ message: 'Driver assigned', order: data[0] });
  } catch (err) {
    console.error('[admin/orders/:id/assign] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/admin/drivers
router.get('/admin/drivers', async (req, res) => {
  try {
    const { data, error } = await supabase.from('drivers').select('*').order('name', { ascending: true });
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    console.error('[admin/drivers] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// POST /api/admin/drivers
router.post('/admin/drivers', async (req, res) => {
  try {
    const { name, phone, status } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    // TODO: Validate phone format (e.g., regex), status enum (e.g., active, inactive, on_leave)

    const { data, error } = await supabase.from('drivers').insert([{ name, phone, status: status || 'active' }]).select();
    if (error) throw error;
    return res.status(201).json({ message: 'Driver created', driver: data[0] });
  } catch (err) {
    console.error('[admin/drivers] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// PUT /api/admin/drivers/:id
router.put('/admin/drivers/:id', async (req, res) => {
  try {
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }
    // TODO: Validate phone format (e.g., regex), status enum (e.g., active, inactive, on_leave)

    const { data, error } = await supabase.from('drivers').update({ name, phone, status }).eq('id', id).select();
    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    return res.json({ message: 'Driver updated', driver: data[0] });
  } catch (err) {
    console.error('[admin/drivers/:id] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// DELETE /api/admin/drivers/:id
router.delete('/admin/drivers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('drivers').delete().eq('id', id);
    if (error) throw error;
    return res.json({ message: 'Driver deleted' });
  } catch (err) {
    console.error('[admin/drivers/:id] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/admin/deliveries
router.get('/admin/deliveries', async (req, res) => {
  try {
    // Query the new deliveries_for_admin view
    const { data, error } = await supabase
      .from('deliveries_for_admin')
      .select('order_number, order_id, driver_name, status, payment_method, payment_status, payment_amount, total')
      .in('status', ['PREPARING', 'OUT_FOR_DELIVERY']); // Filter for relevant delivery statuses

    if (error) throw error;

    // The view already provides the normalized shape, so no further mapping is needed here
    return res.json({ data: data || [] });
  } catch (err) {
    console.error('[admin/deliveries] error', err);
    // Gracefully handle missing view by providing a fallback message
    if (err.code === '42P01') { // undefined_table
      return res.status(500).json({ error: 'Database view deliveries_for_admin not found. Please ensure migrations are run.' });
    }
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/admin/customers
router.get('/admin/customers', async (req, res) => {
  try {
    const { data, error } = await supabase.from('customers').select('*').order('name', { ascending: true });
    if (error) throw error;
    return res.json({ data: data || [] });
  } catch (err) {
    console.error('[admin/customers] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/admin/customers/:id
router.get('/admin/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('customers').select('*').eq('id', id).single();
    if (error) throw error;
    if (!data) {
      return res.status(404).json({ error: 'Customer not found' });
    }
    // Optionally fetch customer's orders
    const { data: orders, error: ordersError } = await supabase.from('orders').select('*').eq('customer_id', id).order('created_at', { ascending: false }); // Assumption: orders.customer_id exists
    if (ordersError) throw ordersError;

    return res.json({ customer: data, orders: orders || [] });
  } catch (err) {
    console.error('[admin/customers/:id] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/admin/reports/export (CSV)
router.get('/admin/reports/export', async (req, res) => {
  try {
    const { from, to, status } = req.query; // Optional filters
    let query = supabase.from('orders').select('*');

    if (from) query = query.gte('created_at', from);
    if (to) query = query.lte('created_at', to);
    if (status) query = query.eq('status', status);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;

    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'No data found for report' });
    }

    const fields = Object.keys(data[0]); // Use keys from the first object as CSV headers
    const csv = parse(data, { fields });

    res.header('Content-Type', 'text/csv');
    res.attachment('orders_report.csv');
    return res.send(csv);
  } catch (err) {
    console.error('[admin/reports/export] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

export default router;
