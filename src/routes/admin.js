// src/routes/admin.js
import express from 'express';
import { createClient } from '@supabase/supabase-js';
import { parse } from 'json2csv';
import requireAdmin from '../middleware/requireAdmin.js';

const router = express.Router();

console.log('[admin routes] loaded'); // debug: indicate routes file loaded

router.use(requireAdmin); // Apply admin middleware to all routes in this file

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
        const startOfWeek = new Date(date);
        startOfWeek.setDate(date.getDate() - date.getDay());
        key = startOfWeek.toISOString().substring(0, 10);
      } else {
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
  console.log('[admin/orders] route hit', { query: req.query }); // debug: show when route is hit
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const status = req.query.status;
    const search = (req.query.search || '').trim();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Select orders and include the related customer name when available
    let query = supabase.from('orders').select('*, customers(name)', { count: 'exact' });

    if (status && status !== 'All') {
      query = query.eq('status', status);
    }

    if (search) {
      // Try a couple of helpful search fields; keep it simple for MVP
      const like = `%${search}%`;
      // We include order id and customer snapshot name; also attempt customers.name (joined)
      query = query.or(`id.ilike.${like},customer_name.ilike.${like},customers.name.ilike.${like}`);
    }

    const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, to);

    if (error) throw error;

    // Defensive: ensure every order has customer_name (either snapshot or joined)
    const normalized = (data || []).map((r) => {
      return {
        ...r,
        customer_name: r.customer_name || (r.customers && r.customers.name) || null,
      };
    });

    return res.json({ data: normalized, meta: { total: count ?? 0, page, limit } });
  } catch (err) {
    console.error('[admin/orders] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// PUT /api/admin/orders/:id/status
router.put('/admin/orders/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status, markPaid } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Status is required' });
    }

    // Load current order
    const { data: existing, error: fetchErr } = await supabase
      .from('orders')
      .select('id, payment_method, payment_status')
      .eq('id', id)
      .single();

    if (fetchErr) {
      console.error('[admin/orders/:id/status] fetchErr', fetchErr);
      return res.status(500).json({ error: 'Failed to load order' });
    }
    if (!existing) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const updates = { status, updated_at: new Date().toISOString() };

    // MVP rule: when admin marks COMPLETED, treat COD as collected → mark PAID
    if (status === 'COMPLETED') {
      const pm = (existing.payment_method || '').toUpperCase();
      if (markPaid === true || pm === 'COD') {
        updates.payment_status = 'PAID';
      }
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) throw error;
    if (!data || data.length === 0) {
      return res.status(404).json({ error: 'Order not found after update' });
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
    const { data, error } = await supabase
      .from('deliveries_for_admin')
      .select('order_number, order_id, driver_name, status, payment_method, payment_status, payment_amount, total')
      .in('status', ['PREPARING', 'OUT_FOR_DELIVERY']);

    if (error) throw error;

    return res.json({ data: data || [] });
  } catch (err) {
    console.error('[admin/deliveries] error', err);
    if (err.code === '42P01') {
      return res.status(500).json({ error: 'Database view deliveries_for_admin not found. Please ensure migrations are run.' });
    }
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/admin/customers
router.get('/admin/customers', async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.max(1, parseInt(req.query.limit, 10) || 10);
    const query = (req.query.query || '').trim();
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    let customersQuery = supabase.from('customers').select('id, name, phone, email, total_spent, last_order_at', { count: 'exact' });

    if (query) {
      if (/^\d+$/.test(query)) {
        customersQuery = customersQuery.eq('phone_normalized', query);
      } else {
        customersQuery = customersQuery.or(`name.ilike.%${query}%,email.ilike.%${query}%`);
      }
    }

    const { data, count, error } = await customersQuery
      .order('name', { ascending: true })
      .range(from, to);

    if (error) throw error;

    return res.json({
      data: data || [],
      count: count ?? 0,
      page,
      limit,
    });
  } catch (err) {
    console.error('[admin/customers] error', err);
    return res.status(500).json({ error: err.message || String(err) });
  }
});

// GET /api/admin/customers/:id
router.get('/admin/customers/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data: customer, error: customerError } = await supabase.from('customers').select('id, name, phone, email, total_spent, last_order_at').eq('id', id).single();
    if (customerError) throw customerError;
    if (!customer) {
      return res.status(404).json({ error: 'Customer not found' });
    }

    // Fetch last 10 orders for this customer
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, created_at, total, status')
      .eq('customer_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (ordersError) throw ordersError;

    return res.json({ customer, orders: orders || [] });
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
