// api/order/create.ts
import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabaseAdmin } from '../../lib/supabaseAdmin'; // adjust path if your functions folder differs

function normalizePhone(phone?: string | null) {
  if (!phone) return null;
  return phone.replace(/\D/g, '');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const payload = req.body || {};
    const {
      customer_name,
      customer_email,
      customer_phone,
      items,
      total,
      payment_method = 'COD',
      payment_status = 'PENDING',
      order_number
    } = payload;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Missing items' });
    }

    // normalize inputs
    const emailNormalized = customer_email ? String(customer_email).trim().toLowerCase() : null;
    const phoneNormalized = normalizePhone(customer_phone);

    // 1) try to find existing customer by email or phone
    let foundCustomer: { id: string } | null = null;
    if (emailNormalized) {
      const { data: byEmail } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('email', emailNormalized)
        .limit(1)
        .maybeSingle();
      if (byEmail) foundCustomer = byEmail as any;
    }

    if (!foundCustomer && phoneNormalized) {
      const { data: byPhone } = await supabaseAdmin
        .from('customers')
        .select('id')
        .eq('phone_normalized', phoneNormalized)
        .limit(1)
        .maybeSingle();
      if (byPhone) foundCustomer = byPhone as any;
    }

    // 2) upsert / create if not found
    let customerId: string;
    if (foundCustomer && foundCustomer.id) {
      customerId = foundCustomer.id;
      // optional: update contact fields so we gradually improve data quality
      await supabaseAdmin
        .from('customers')
        .update({
          name: customer_name ?? undefined,
          email: emailNormalized ?? undefined,
          phone: customer_phone ?? undefined,
          phone_normalized: phoneNormalized ?? undefined,
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);
    } else {
      const insertPayload: any = {
        name: customer_name ?? null,
        email: emailNormalized ?? null,
        phone: customer_phone ?? null,
        phone_normalized: phoneNormalized ?? null,
        created_at: new Date().toISOString()
      };

      const { data: created, error: createErr } = await supabaseAdmin
        .from('customers')
        .insert([insertPayload])
        .select('id')
        .maybeSingle();

      if (createErr) {
        console.error('create customer error', createErr);
        return res.status(500).json({ error: 'Failed creating customer' });
      }

      customerId = (created as any).id;
    }

    // 3) insert order linked to customerId
    const orderPayload: any = {
      customer_id: customerId,
      customer_name: customer_name ?? null,
      customer_email: emailNormalized,
      customer_phone: customer_phone ?? null,
      items: items, // expects an array; store as jsonb
      total: total ?? 0,
      payment_method,
      payment_status,
      status: payment_status === 'PAID' ? 'PAID' : 'NEW',
      created_at: new Date().toISOString(),
      order_number: order_number ?? `ORD-${Date.now().toString().slice(-6)}`,
    };

    const { data: orderData, error: orderErr } = await supabaseAdmin
      .from('orders')
      .insert([orderPayload])
      .select('*')
      .maybeSingle();

    if (orderErr) {
      console.error('create order error', orderErr);
      return res.status(500).json({ error: 'Failed creating order' });
    }

    // Return created order and customer id
    return res.status(201).json({ order: orderData, customerId });
  } catch (e: any) {
    console.error('order create handler error', e);
    return res.status(500).json({ error: e?.message || 'Server error' });
  }
}
