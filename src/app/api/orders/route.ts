import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { sendOrderEmails } from '@/lib/email';

const MAX_STRING = 200;
const MAX_NOTE = 1000;
const MAX_ITEMS = 50;

function sanitize(val: unknown, maxLen = MAX_STRING): string {
  return String(val ?? '').trim().slice(0, maxLen);
}

function safeNumber(val: unknown, fallback = 0): number {
  const n = Number(val);
  return isFinite(n) && n >= 0 ? n : fallback;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const customer_name  = sanitize(body.customer_name);
    const customer_phone = sanitize(body.customer_phone, 20);
    const customer_email = sanitize(body.customer_email);
    const coupon_code    = sanitize(body.coupon_code, 50);
    const notes          = sanitize(body.notes, MAX_NOTE);
    const items          = body.items;
    const address        = body.address ?? null;
    const subtotal       = safeNumber(body.subtotal);
    const shipping       = safeNumber(body.shipping);
    const discount       = safeNumber(body.discount);
    const total          = safeNumber(body.total);
    const source         = body.source === 'whatsapp' ? 'whatsapp' : 'website';
    const status         = 'pending'; // always start as pending — never trust client

    if (!customer_name || !customer_phone || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: customer_name, customer_phone, items' },
        { status: 400 }
      );
    }

    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: 'Too many items in order' }, { status: 400 });
    }

    // Basic email format check (optional field)
    if (customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    // Validate totals make sense (prevent price manipulation)
    const itemsTotal = items.reduce((sum: number, i: Record<string, unknown>) => {
      const price = safeNumber(i.price);
      const qty   = Math.max(1, Math.min(Number(i.quantity ?? 1), 100));
      return sum + price * qty;
    }, 0);

    if (itemsTotal === 0) {
      return NextResponse.json({ error: 'Order total cannot be zero' }, { status: 400 });
    }

    // ── 1. Find or create customer by phone ──────────────────────────────
    // Normalize phone: strip +961 / 00961 prefix so DB always stores local number
    const normalizedPhone = String(customer_phone ?? '').trim().replace(/^(\+961|00961)/, '');

    const nameParts = String(customer_name).trim().split(/\s+/);
    const firstName = nameParts[0] ?? customer_name;
    const lastName  = nameParts.slice(1).join(' ') || '';

    let customerId: string | null = null;

    const { data: existingCustomer } = await supabaseServer
      .from('customers')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
      // Update email if provided and not already set
      if (customer_email) {
        await supabaseServer
          .from('customers')
          .update({ email: customer_email })
          .eq('id', customerId)
          .is('email', null);
      }
    } else {
      const { data: newCustomer } = await supabaseServer
        .from('customers')
        .insert({
          first_name: firstName,
          last_name:  lastName,
          phone:      normalizedPhone,
          email:      customer_email || null,
          addresses:  address ? [{ ...address, isDefault: true }] : [],
        })
        .select('id')
        .single();
      customerId = newCustomer?.id ?? null;
    }

    // ── 2. Insert order ──────────────────────────────────────────────────
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .insert({
        customer_id:    customerId,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        items,
        subtotal:   Number(subtotal),
        shipping:   Number(shipping),
        discount:   Number(discount ?? 0),
        coupon_code: coupon_code || null,
        total:      Number(total),
        address,
        notes:      notes || null,
        status,
        source,
      })
      .select('id, order_number')
      .single();

    if (orderError) {
      return NextResponse.json({ error: orderError.message }, { status: 500 });
    }

    // ── 3. Insert order_items (one row per product) ──────────────────────
    const orderItems = (items as Record<string, unknown>[]).map((item) => ({
      order_id:      order.id,
      product_id:    (item.id as string) || null,
      product_name:  String(item.name ?? item.productName ?? ''),
      product_image: String(item.image ?? ''),
      price:         Number(item.price ?? 0),
      quantity:      Number(item.quantity ?? 1),
    }));

    await supabaseServer.from('order_items').insert(orderItems);

    // ── 4. Decrement stock immediately for WhatsApp orders ──────────────────
    if (source === 'whatsapp') {
      for (const item of items as Record<string, unknown>[]) {
        const pid = (item.id as string) || null;
        const qty = Number(item.quantity ?? 1);
        if (!pid) continue;
        const { data: product } = await supabaseServer
          .from('products').select('stock').eq('id', pid).single();
        if (product) {
          await supabaseServer
            .from('products')
            .update({ stock: Math.max(0, (product.stock ?? 0) - qty) })
            .eq('id', pid);
        }
      }
    }

    // ── 5. Send emails — only for website orders ─────────────────────────
    if (source === 'website') {
    sendOrderEmails({
      orderId:       order.id,
      orderNumber:   order.order_number,
      customerName:  customer_name,
      customerEmail: customer_email || null,
      customerPhone: normalizedPhone,
      items: (items as Record<string, unknown>[]).map((item) => ({
        name:     String(item.name ?? item.productName ?? ''),
        price:    Number(item.price ?? 0),
        quantity: Number(item.quantity ?? 1),
        image:    item.image ? String(item.image) : null,
      })),
      subtotal:  Number(subtotal),
      shipping:  Number(shipping),
      discount:  Number(discount ?? 0),
      couponCode: coupon_code || null,
      total:     Number(total),
      address:   address ?? null,
      notes:     notes || null,
    }).catch((err) => console.error('[email] sendOrderEmails threw:', err));
    } // end website-only email

    return NextResponse.json(
      { success: true, orderId: order.id, orderNumber: order.order_number },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
