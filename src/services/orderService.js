
// src/services/orderService.js
import { supabase } from '../lib/supabase.js';

/**
 * Helper: compute totals from items if caller didn't provide totals.
 * Expects each item: { productId, qty, unitPrice, discount?, gstPercent? }
 * Returns { subtotal, tax, discount, total }
 */
function computeTotals(items = []) {
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

/**
 * Normalize raw frontend item shapes into canonical backend shape:
 * { productId, name, qty, unitPrice, discount?, gstPercent?, meta? }
 */
function normalizeItems(rawItems = []) {
  if (!Array.isArray(rawItems)) return [];

  return rawItems.map((it) => {
    // If already in canonical shape, prefer that
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

    // Common frontend shapes: { id, price, quantity }, { id, price, qty }, etc.
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

/**
 * Validate normalized items. Returns { valid: boolean, error?: { code, message } }
 */
function validateItems(items = []) {
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

/**
 * Create order from cart object.
 * Returns { orderId } on success or { error: { code, message } } on failure.
 */
export async function createOrder(cart) {
  try {
    // Defensive: ensure cart is present
    if (!cart) {
      console.warn('createOrder: missing cart');
      return { error: { code: 'CartMissing', message: 'Cart not found or has expired.' } };
    }

    // Accept various names for the items array that the frontend might send
    const rawItems =
      Array.isArray(cart.items) ?
        cart.items :
      Array.isArray(cart.cartItems) ?
        cart.cartItems :
      Array.isArray(cart.products) ?
        cart.products :
      [];

    const items = normalizeItems(rawItems);

    // Validate items present after normalization
    const validation = validateItems(items);
    if (!validation.valid) {
      // Log normalized + raw for easier debugging
      console.warn('createOrder: item validation failed', {
        cartId: cart.id ?? cart.cartId ?? null,
        validationError: validation.error,
        rawItemsLength: rawItems.length,
        normalizedSample: items.slice(0, 3),
      });
      return { error: validation.error };
    }

    // Totals: use provided or compute
    const totals = (cart.totals && typeof cart.totals === 'object' && Object.keys(cart.totals).length)
      ? cart.totals
      : computeTotals(items);

    const customer = cart.customer || cart.customer_details || cart.guest || {};

    // Ensure numeric total is present
    const totalsNumeric = (typeof totals.total !== 'undefined' && totals.total !== null)
      ? Number(totals.total)
      : computeTotals(items).total;

    // Derive a GST percent for items if not provided (uniform slab fallback)
    let derivedGstPercent = 0;
    if (totals && Number(totals.taxableAmount) && Number(totals.gst)) {
      derivedGstPercent = +( (Number(totals.gst) / Number(totals.taxableAmount)) * 100 ).toFixed(2);
    }

    const itemsWithGst = items.map(it => {
      const gstPercent = (typeof it.gstPercent !== 'undefined' && it.gstPercent !== null)
        ? Number(it.gstPercent)
        : (Number(it.meta?.gst ?? 0) || derivedGstPercent || 0);

      return { ...it, gstPercent };
    });

    // Denormalize common customer fields for easier querying
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
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('getOrderById: supabase error', { error, id });
      return null;
    }

    return data;
  } catch (e) {
    console.error('getOrderById: exception', e);
    return null;
  }
}

/**
 * Fetch recent orders (descending by created_at)
 */
export async function getOrders() {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getOrders: supabase error', error);
      return [];
    }

    return data;
  } catch (e) {
    console.error('getOrders: exception', e);
    return [];
  }
}

/**
 * Fetch orders assigned to a given staff id
 */
export async function getOrdersByStaffId(staffId) {
  try {
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
 */
export async function assignOrder(orderId, staffId) {
  try {
    const updates = {
      assigned_to: staffId,
      status: 'ACCEPTED',
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('orders')
      .update(updates)
      .eq('id', orderId)
      .select();

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
 */
export async function updateOrderStatus(orderId, status, collectedAmount, collectedBy) {
  try {
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
      .select();

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
