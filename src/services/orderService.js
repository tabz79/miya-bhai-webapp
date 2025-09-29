// src/services/orderService.js
import { supabase } from '../lib/supabase.js';

/* ---------------------- small local constants & helpers --------------------- */
const STATUS_ENUM = [
  'NEW', 'PENDING', 'ACCEPTED', 'PREPARING', 'OUT_FOR_DELIVERY',
  'COMPLETED', 'CANCELLED', 'RETURNED'
];
const STATUS_SET = new Set(STATUS_ENUM);

const isUuid = (val) => {
  if (!val || typeof val !== 'string') return false;
  return /^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(val);
};

/* ---------------------- helpers (unchanged, lightly cleaned) --------------------- */

function computeTotals(items = []) { /* same as before */ 
  let subtotal = 0;
  let tax = 0;
  let discount = 0;

  for (const it of items) {
    const qty = Number(it.qty) || 0;
    const unitPrice = Number(it.unitPrice) || 0;
    const itemDiscount = Number(it.discount) || 0;
    const gstPercent = Number(it.gstPercent) || 0;

    const line = qty * unitPrice;
    const lineDiscount = itemDiscount * qty;
    const taxable = Math.max(0, line - lineDiscount);
    const lineTax = (taxable * gstPercent) / 100;

    subtotal += line;
    discount += lineDiscount;
    tax += lineTax;
  }

  const total = +(subtotal - discount + tax).toFixed(2);
  return {
    subtotal: +subtotal.toFixed(2),
    tax: +tax.toFixed(2),
    discount: +discount.toFixed(2),
    total,
  };
}

function normalizeItems(rawItems = []) { /* same as before */
  if (!Array.isArray(rawItems)) return [];
  return rawItems.map((it) => {
    if (it && it.productId && (typeof it.qty !== 'undefined' || typeof it.quantity !== 'undefined')) {
      return {
        productId: it.productId,
        name: it.name || it.title || null,
        qty: Number(it.qty ?? it.quantity ?? 0),
        unitPrice: Number(it.unitPrice ?? it.price ?? it.rate ?? 0),
        discount: Number(it.discount ?? 0),
        gstPercent: Number(it.gstPercent ?? it.gst ?? 0),
        meta: it.meta ?? {},
      };
    }
    return {
      productId: it?.id ?? it?.product_id ?? it?.sku ?? null,
      name: it?.name ?? it?.title ?? null,
      qty: Number(it?.quantity ?? it?.qty ?? it?.count ?? 0),
      unitPrice: Number(it?.price ?? it?.unit_price ?? it?.rate ?? 0),
      discount: Number(it?.discount ?? 0),
      gstPercent: Number(it?.gstPercent ?? it?.gst ?? 0),
      meta: it ?? {},
    };
  });
}

function validateItems(items = []) { /* same as before */
  if (!Array.isArray(items) || items.length === 0) {
    return { valid: false, error: { code: 'CartEmpty', message: 'Cart has no items. Add items before checkout.' } };
  }

  for (const it of items) {
    if (!it || !it.productId) {
      return { valid: false, error: { code: 'InvalidCartItem', message: 'Cart item missing product id.' } };
    }
    if (!(Number(it.qty) > 0)) {
      return { valid: false, error: { code: 'InvalidCartItem', message: 'Cart item must have qty > 0.' } };
    }
    if (!(Number(it.unitPrice) >= 0)) {
      return { valid: false, error: { code: 'InvalidCartItem', message: 'Cart item must have unitPrice >= 0.' } };
    }
  }

  return { valid: true };
}

/* ---------------------- order operations --------------------- */

export async function createOrder(cart) { /* unchanged implementation - same as earlier file */ 
  try {
    if (!cart) {
      console.warn('createOrder: missing cart');
      return { error: { code: 'CartMissing', message: 'Cart not found or has expired.' } };
    }

    const rawItems =
      Array.isArray(cart.items) ? cart.items :
      Array.isArray(cart.cartItems) ? cart.cartItems :
      Array.isArray(cart.products) ? cart.products : [];

    const items = normalizeItems(rawItems);
    const validation = validateItems(items);
    if (!validation.valid) {
      console.warn('createOrder: item validation failed', {
        cartId: cart.id ?? cart.cartId ?? null,
        validationError: validation.error,
        rawItemsLength: rawItems.length,
        normalizedSample: items.slice(0, 3),
      });
      return { error: validation.error };
    }

    const totals = (cart.totals && typeof cart.totals === 'object' && Object.keys(cart.totals).length)
      ? cart.totals
      : computeTotals(items);

    const totalsNumeric = (typeof totals.total !== 'undefined' && totals.total !== null)
      ? Number(totals.total)
      : computeTotals(items).total;

    let derivedGstPercent = 0;
    if (totals && Number(totals.taxableAmount) && Number(totals.gst)) {
      derivedGstPercent = +(((Number(totals.gst) / Number(totals.taxableAmount)) * 100).toFixed(2));
    }

    const itemsWithGst = items.map((it) => {
      const gstPercent = (typeof it.gstPercent !== 'undefined' && it.gstPercent !== null)
        ? Number(it.gstPercent)
        : (Number(it.meta?.gst ?? 0) || derivedGstPercent || 0);
      return { ...it, gstPercent };
    });

    const customer = cart.customer || cart.customer_details || cart.guest || {};
    const denormEmail = customer?.email ?? customer?.emailAddress ?? null;
    const denormName = customer?.name ?? customer?.fullName ?? null;
    const denormPhone = customer?.phone ?? customer?.phoneNumber ?? null;

    const orderData = {
      items: itemsWithGst,
      totals,
      total: Number(totalsNumeric),
      customer_details: customer,
      customer_email: denormEmail,
      customer_name: denormName,
      customer_phone: denormPhone,
      payment_method: (cart.payment_method || cart.paymentMethod || 'COD'),
      payment_status: 'pending',
      status: 'NEW',
      cart_id: cart.id || cart.cartId || null,
      created_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .insert([orderData])
      .select('id')
      .single();

    if (error) {
      console.error('createOrder: supabase insert error', { error, cartId: cart.id ?? null });
      return { error: { code: 'DatabaseError', message: error.message || 'Failed to create order' } };
    }

    if (!data || !data.id) {
      console.error('createOrder: no data returned from insert', { data, cartId: cart.id ?? null });
      return { error: { code: 'NoData', message: 'Failed to create order, no id returned.' } };
    }

    return { orderId: data.id };
  } catch (e) {
    console.error('createOrder: unexpected exception', e);
    return { error: { code: 'ServerError', message: e.message || 'Unexpected server error' } };
  }
}

/**
 * Fetch a single order by id
 */
export async function getOrderById(id) {
  try {
    if (!isUuid(id)) return null;
    const { data, error } = await supabase
      .from('orders')
      .select('*, customers(name), drivers(name)')
      .eq('id', id)
      .single();

    if (error) {
      console.error('getOrderById: supabase error', { error, id });
      return null;
    }

    // normalize shape
    return {
      ...data,
      customer_name: data.customers?.name ?? null,
      assigned_to_name: data.drivers?.name ?? null,
    };
  } catch (e) {
    console.error('getOrderById: exception', e);
    return null;
  }
}

/**
 * Paginated, filterable fetch for admin
 * getOrders({ page, limit, status, search }) => { items, total }
 */
export async function getOrders({ page = 1, limit = 25, status, search } = {}) {
  try {
    const p = Math.max(1, Number(page));
    const l = Math.min(100, Number(limit));
    const from = (p - 1) * l;
    const to = from + l - 1;

    // Validate status param server-side too
    if (status && !STATUS_SET.has(status)) {
      return { items: [], total: 0 };
    }

    // Select fields and related names (via FK)
    let qb = supabase
      .from('orders')
      .select('id,created_at,status,total,assigned_to,customer_id,payment_method,customers(name),drivers(name)', { count: 'exact' });

    if (status) qb = qb.eq('status', status);
    if (search) {
      const like = `%${search}%`;
      qb = qb.or(`id.ilike.${like},payment_method.ilike.${like},customer_name.ilike.${like},customer_phone.ilike.${like}`);
    }

    const { data, error, count } = await qb.order('created_at', { ascending: false }).range(from, to);

    if (error) {
      console.error('getOrders: supabase error', error);
      return { items: [], total: 0 };
    }

    const items = (data || []).map((r) => ({
      id: r.id,
      created_at: r.created_at,
      status: r.status,
      total: r.total,
      assigned_to: r.assigned_to,
      assigned_to_name: r.drivers?.name ?? null,
      customer_id: r.customer_id,
      customer_name: r.customers?.name ?? null,
      payment_method: r.payment_method,
    }));

    return { items, total: Number(count ?? 0) };
  } catch (e) {
    console.error('getOrders: exception', e);
    return { items: [], total: 0 };
  }
}

/**
 * Fetch orders assigned to a given staff id
 */
export async function getOrdersByStaffId(staffId) {
  try {
    if (!isUuid(staffId)) return [];
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('assigned_to', staffId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getOrdersByStaffId: supabase error', { error, staffId });
      return [];
    }

    return data;
  } catch (e) {
    console.error('getOrdersByStaffId: exception', e);
    return [];
  }
}

/**
 * Assign order to staff and mark as ACCEPTED
 * returns single updated order object or null
 */
export async function assignOrder(orderId, staffId) {
  try {
    if (!isUuid(orderId) || !isUuid(staffId)) {
      console.warn('assignOrder: invalid ids', { orderId, staffId });
      return null;
    }

    // validate driver exists
    const { data: driver, error: driverErr } = await supabase
      .from('drivers')
      .select('id')
      .eq('id', staffId)
      .single();

    if (driverErr || !driver) {
      console.warn('assignOrder: driver not found', { driverErr, staffId });
      return null;
    }

    const updates = {
      assigned_to: staffId,
      status: 'ACCEPTED',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('assignOrder: supabase error', { error, orderId, staffId });
      return null;
    }

    return data;
  } catch (e) {
    console.error('assignOrder: exception', e);
    return null;
  }
}

/**
 * Update order status and optionally collected amount/by fields
 * updateOrderStatus(orderId, status, opts = {})
 */
export async function updateOrderStatus(orderId, status, opts = {}) {
  try {
    if (!isUuid(orderId)) {
      console.warn('updateOrderStatus: invalid orderId', { orderId });
      return null;
    }
    if (!status || !STATUS_SET.has(status)) {
      console.warn('updateOrderStatus: invalid status', { status });
      return null;
    }

    const { collectedAmount, collectedBy } = opts;
    const updates = { status, updated_at: new Date().toISOString() };
    if (typeof collectedAmount !== 'undefined' && collectedAmount !== null) {
      updates.collected_amount = collectedAmount;
    }
    if (collectedBy) {
      updates.collected_by = collectedBy;
    }

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select()
      .single();

    if (error) {
      console.error('updateOrderStatus: supabase error', { error, orderId, status });
      return null;
    }

    return data;
  } catch (e) {
    console.error('updateOrderStatus: exception', e);
    return null;
  }
}
