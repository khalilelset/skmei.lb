import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { sendOrderEmails } from '@/lib/email';

const WHISH_BASE    = 'https://api.whish.money/itel-service/api';
const WHISH_CHANNEL = process.env.WHISH_CHANNEL!;
const WHISH_SECRET  = process.env.WHISH_SECRET!;
const WHISH_WEBSITE = process.env.WHISH_WEBSITE_URL!;
const SITE_URL      = process.env.NEXT_PUBLIC_SITE_URL!;

const MAX_STRING = 200;
const MAX_NOTE   = 1000;
const MAX_ITEMS  = 50;

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

    if (!customer_name || !customer_phone || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (items.length > MAX_ITEMS) {
      return NextResponse.json({ error: 'Too many items in order' }, { status: 400 });
    }

    if (customer_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer_email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 });
    }

    const normalizedPhone = String(customer_phone ?? '').trim().replace(/^(\+961|00961)/, '');
    const nameParts = String(customer_name).trim().split(/\s+/);
    const firstName = nameParts[0] ?? customer_name;
    const lastName  = nameParts.slice(1).join(' ') || '';

    // ── 1. Find or create customer ───────────────────────────────────────
    let customerId: string | null = null;
    const { data: existingCustomer } = await supabaseServer
      .from('customers')
      .select('id')
      .eq('phone', normalizedPhone)
      .maybeSingle();

    if (existingCustomer) {
      customerId = existingCustomer.id;
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

    // ── 2. Insert order with pending_payment status ──────────────────────
    const { data: order, error: orderError } = await supabaseServer
      .from('orders')
      .insert({
        customer_id:    customerId,
        customer_name,
        customer_phone,
        customer_email: customer_email || null,
        items,
        subtotal:       Number(subtotal),
        shipping:       Number(shipping),
        discount:       Number(discount ?? 0),
        coupon_code:    coupon_code || null,
        total:          Number(total),
        address,
        notes:          notes || null,
        status:         'pending_payment',
        source:         'website',
        payment_method: 'whish',
      })
      .select('id, order_number')
      .single();

    if (orderError || !order) {
      console.error('[whish/initiate] order insert error:', orderError);
      return NextResponse.json(
        { error: orderError?.message ?? 'Order creation failed' },
        { status: 500 }
      );
    }

    // ── 3. Insert order_items ────────────────────────────────────────────
    const orderItems = (items as Record<string, unknown>[]).map((item) => ({
      order_id:      order.id,
      product_id:    (item.id as string) || null,
      product_name:  String(item.name ?? item.productName ?? ''),
      product_image: String(item.image ?? ''),
      price:         Number(item.price ?? 0),
      quantity:      Number(item.quantity ?? 1),
    }));
    await supabaseServer.from('order_items').insert(orderItems);

    // ── 4. Build Whish payload ───────────────────────────────────────────
    const externalId   = Date.now();
    const callbackBase = `${SITE_URL}/api/whish/callback?orderId=${order.id}`;
    // websiteUrl must be the full URL as registered with Whish
    const websiteUrl   = WHISH_WEBSITE.startsWith('http') ? WHISH_WEBSITE : `https://${WHISH_WEBSITE}`;

    const whishPayload = {
      amount:             total,
      currency:           'USD',
      invoice:            `Order #${order.order_number}`,
      externalId,
      successCallbackUrl: `${callbackBase}&type=success`,
      failureCallbackUrl: `${callbackBase}&type=failure`,
      successRedirectUrl: `${SITE_URL}/store/checkout/payment/success?orderId=${order.id}`,
      failureRedirectUrl: `${SITE_URL}/store/checkout/payment/failed?orderId=${order.id}`,
    };

    // ── 5. Call Whish API ────────────────────────────────────────────────
    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 12_000);

    let collectUrl: string | null = null;
    let whishErrorDetail = '';

    try {
      const whishRes = await fetch(`${WHISH_BASE}/payment/whish`, {
        method: 'POST',
        signal: controller.signal,
        headers: {
          'Content-Type': 'application/json',
          'channel':      WHISH_CHANNEL,
          'secret':       WHISH_SECRET,
          'websiteUrl':   websiteUrl,
          'User-Agent':   'Whish/1.0 (https://whish.money; support@whish.money)',
        },
        body: JSON.stringify(whishPayload),
      });
      clearTimeout(timeoutId);

      const rawBody = await whishRes.text();
      console.log('[whish/payment] status:', whishRes.status, 'body:', rawBody);

      const parsed = JSON.parse(rawBody) as Record<string, unknown>;
      if (parsed?.status === true) {
        const data = parsed?.data as Record<string, unknown> | undefined;
        collectUrl = (data?.collectUrl as string) ?? null;
      }
      if (!collectUrl) {
        whishErrorDetail = rawBody.slice(0, 300);
      }
    } catch (err) {
      clearTimeout(timeoutId);
      const msg = err instanceof Error ? err.message : String(err);
      whishErrorDetail = msg;
      console.error('[whish/initiate] fetch error:', msg);
    }

    if (!collectUrl) {
      console.error('[whish/initiate] aborting. detail:', whishErrorDetail);
      await supabaseServer
        .from('orders')
        .update({ status: 'cancelled' })
        .eq('id', order.id);
      return NextResponse.json(
        { error: `Payment gateway error: ${whishErrorDetail || 'unknown'}` },
        { status: 502 }
      );
    }

    // ── 6. Send confirmation email (non-blocking) ───────────────────────
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
      subtotal:   Number(subtotal),
      shipping:   Number(shipping),
      discount:   Number(discount ?? 0),
      couponCode: coupon_code || null,
      total:      Number(total),
      address:    address ?? null,
      notes:      notes || null,
    }).catch((err) => console.error('[whish/initiate] email error:', err));

    return NextResponse.json({ collectUrl, orderId: order.id });
  } catch (err) {
    console.error('[whish/initiate]', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
