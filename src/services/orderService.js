// src/services/orderService.js
import { supabase } from '../lib/supabase.js';
import { v4 as uuidv4 } from 'uuid'; // used only if needed by other helpers

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

function normalizeItems(rawItems = []) {
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

/* ---------------------- NEW: upsert customer + create order helper --------------------- */

/**
 * normalizePhone: remove all non-digits
 */
function normalizePhone(phone) {
  if (!phone) return null;
  return String(phone).replace(/\D/g, '');
}

/**
 * upsertCustomerAndCreateOrder(payload)
 *
 * - Finds existing customer by email (preferred) or phone_normalized
 * - If not found, inserts a new customer
 * - Inserts order linked to that customer
 * - Handles simple race condition where insert may fail due to uniqueness by trying a fallback lookup
 *
 * Returns: { order, customerId } or throws an error
 */
export async function upsertCustomerAndCreateOrder(payload) {
  const {
    customer_name,
    customer_email,
    customer_phone,
    items,
    totals,
    total = 0,
    payment_method = 'COD',
    payment_status = 'PENDING',
    order_number,
    cart_id = null,
    delivery_lat,
    delivery_lng,
    delivery_address,
    // NEW fields: coupon + amounts
    coupon_code = null,
    discount_amount = 0,
    payable_amount = null,
  } = payload;

  const phone_normalized = normalizePhone(customer_phone);
  const emailNormalized = customer_email ? String(customer_email).trim().toLowerCase() : null;

  try {
    // 1) Try find by email first, then phone
    let existing = null;
    if (emailNormalized) {
      const { data: byEmail, error: e1 } = await supabase
        .from('customers')
        .select('id')
        .eq('email', emailNormalized)
        .limit(1);
      if (e1) throw e1;
      if (byEmail && byEmail.length) existing = byEmail[0];
    }

    if (!existing && phone_normalized) {
      const { data: byPhone, error: e2 } = await supabase
        .from('customers')
        .select('id')
        .eq('phone_normalized', phone_normalized)
        .limit(1);
      if (e2) throw e2;
      if (byPhone && byPhone.length) existing = byPhone[0];
    }

    let customerId = null;

    if (existing && existing.id) {
      customerId = existing.id;
      // optionally update contact fields to improve data over time
      await supabase.from('customers').update({
        name: customer_name ?? undefined,
        email: emailNormalized ?? undefined,
        phone: customer_phone ?? undefined,
        phone_normalized: phone_normalized ?? undefined,
        updated_at: new Date().toISOString(),
      }).eq('id', customerId);
    } else {
      // 2) create new customer
      const insertPayload = {
        name: customer_name ?? null,
        email: emailNormalized ?? null,
        phone: customer_phone ?? null,
        phone_normalized: phone_normalized ?? null,
        created_at: new Date().toISOString(),
      };

      const { data: created, error: createErr } = await supabase
        .from('customers')
        .insert([insertPayload])
        .select('id');

      if (createErr) {
        // handle simple race where another process inserted same customer concurrently
        // try fallback lookup by email/phone
        if (createErr.code === '23505' || String(createErr.message).toLowerCase().includes('duplicate')) {
          let fallback = null;
          if (emailNormalized) {
            const { data: fb1 } = await supabase.from('customers').select('id').eq('email', emailNormalized).limit(1);
            if (fb1 && fb1.length) fallback = fb1[0];
          }
          if (!fallback && phone_normalized) {
            const { data: fb2 } = await supabase.from('customers').select('id').eq('phone_normalized', phone_normalized).limit(1);
            if (fb2 && fb2.length) fallback = fb2[0];
          }
          if (fallback && fallback.id) {
            customerId = fallback.id;
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      } else if (created && created.length) {
        customerId = created[0].id;
      } else {
        throw new Error('Failed to create customer (no id returned)');
      }
    }

    // 3) Insert order linked to customerId
    const orderPayload = {
      customer_id: customerId,
      customer_name: customer_name ?? null,
      customer_email: emailNormalized,
      customer_phone: customer_phone ?? null,
      items: items || [],
      totals: totals || {},
      total,
      payment_method,
      payment_status,
      status: (payment_status && payment_status.toUpperCase() === 'PAID') ? 'PAID' : 'NEW',
      cart_id,
      created_at: new Date().toISOString(),
      order_number: order_number || `MB-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
      delivery_lat,
      delivery_lng,
      delivery_address,
      // Persist coupon/discount/payable on the order row (NEW)
      coupon_code: coupon_code ?? null,
      discount_amount: Number(discount_amount ?? 0),
      payable_amount: payable_amount != null ? Number(payable_amount) : null,
    };

    const { data: orderData, error: orderErr } = await supabase
      .from('orders')
      .insert([orderPayload])
      .select('*');

    if (orderErr) {
      throw orderErr;
    }

    const createdOrder = (orderData && orderData.length) ? orderData[0] : null;
    if (!createdOrder || !createdOrder.id) throw new Error('Order insert returned no id');

    return { order: createdOrder, customerId };
  } catch (err) {
    // bubble up
    throw err;
  }
}

/* ---------------------- order operations (createOrder now uses upsert helper) --------------------- */

export async function createOrder(cart) {
  try {
    if (!cart) {
      return { error: { code: 'CartMissing', message: 'Cart not found or has expired.' } };
    }

    // Validate pincode
    const { data: settingsData, error: settingsError } = await supabase.from('settings').select('value').eq('key', 'delivery').single();
    if (settingsError) throw settingsError;
    const allowedPincodes = settingsData?.value?.allowed_pincodes || [];
    if (cart.pincode && !allowedPincodes.includes(cart.pincode)) {
      return { error: { code: 'PincodeNotAllowed', message: 'We don’t deliver to this pincode yet' } };
    }
    if (cart.pincode && (!cart.delivery_address || !cart.delivery_lat || !cart.delivery_lng)) {
      return { error: { code: 'LocationRequired', message: 'Delivery address and location are required for this pincode' } };
    }

    // Validate coupon
    let coupon = null;
    let discountAmount = 0;
    if (cart.coupon_code) {
      const codeUpper = String(cart.coupon_code).toUpperCase();
      // FIXED: lookup by code (DB stores codes uppercase). Avoid expression on LHS.
      const { data: couponData, error: couponError } = await supabase
        .from('coupons')
        .select('*')
        .eq('code', codeUpper)
        .single();

      if (couponError || !couponData) {
        console.warn('createOrder: coupon lookup failed', couponError);
        return { error: { code: 'InvalidCoupon', message: 'Coupon not found' } };
      }
      coupon = couponData;

      if (!coupon.is_active) {
        return { error: { code: 'InactiveCoupon', message: 'This coupon is not active' } };
      }
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        return { error: { code: 'ExpiredCoupon', message: 'This coupon has expired' } };
      }
      if (coupon.max_uses && (coupon.uses_count ?? 0) >= coupon.max_uses) {
        return { error: { code: 'UsageLimitReached', message: 'This coupon has reached its usage limit' } };
      }
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

    const frontendProvidedTotals = (cart.totals && typeof cart.totals === 'object' && typeof cart.totals.total !== 'undefined' && cart.totals.total !== null);

    const totals = frontendProvidedTotals
      ? cart.totals
      : computeTotals(items);

    // NEW: Do not double-apply coupon.
    // If frontend already provided totals, trust those totals (but capture discountAmount if present).
    // Otherwise compute & apply coupon on server.
    if (coupon) {
      if (frontendProvidedTotals) {
        // Frontend pre-applied coupon. Read discount if provided; otherwise try to derive it.
        discountAmount = Number(cart.totals?.discount ?? cart.totals?.discount_amount ?? 0);
        // keep totals as provided by frontend (do not subtract again)
      } else {
        // Frontend didn't pre-apply — compute and apply on server (old behaviour)
        if (coupon.type === 'flat') {
          discountAmount = Number(coupon.value ?? 0);
        } else if (coupon.type === 'percentage') {
          discountAmount = (totals.subtotal * coupon.value) / 100;
        }
        totals.discount = (totals.discount || 0) + Number(discountAmount || 0);
        totals.total = Number((totals.total - discountAmount).toFixed(2));
      }
    }

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

    // Build a payload for upsert + create
    const payload = {
      user_id: cart.user_id || null, // Pass user_id if it exists
      customer_name: denormName,
      customer_email: denormEmail,
      customer_phone: denormPhone,
      items: itemsWithGst,
      totals,
      total: Number(totalsNumeric),
      payment_method: (cart.payment_method || cart.paymentMethod || 'COD'),
      payment_status: (cart.payment_status || 'pending'),
      cart_id: cart.id || cart.cartId || null,
      delivery_lat: cart.delivery_lat,
      delivery_lng: cart.delivery_lng,
      delivery_address: cart.delivery_address,
      coupon_code: cart.coupon_code ? String(cart.coupon_code).toUpperCase() : null, // pass normalized coupon
      discount_amount: Number(discountAmount || totals.discount || 0),
      payable_amount: Number(totalsNumeric),
    };

    // Use the robust helper (ensures customers row exists and returns created order)
    const result = await upsertCustomerAndCreateOrder(payload);

    if (!result || !result.order || !result.order.id) {
      console.error('createOrder: failed upsert/create flow', { result });
      return { error: { code: 'CreateFailed', message: 'Failed to create order' } };
    }

    if (coupon) {
      try {
        await supabase.rpc('increment_coupon_uses', { coupon_id: coupon.id });
      } catch (rpcErr) {
        console.warn('createOrder: increment_coupon_uses RPC failed (non-fatal):', rpcErr);
      }
    }

    return { orderId: result.order.id };
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
 * Fetch orders for a given user id
 */
export async function getOrdersByUserId(userId) {
  try {
    if (!isUuid(userId)) return [];
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('getOrdersByUserId: supabase error', { error, userId });
      return [];
    }

    return data;
  } catch (e) {
    console.error('getOrdersByUserId: exception', e);
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
