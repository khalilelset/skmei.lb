import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { supabaseServer } from '@/lib/supabase/server';

// Use sandbox URL when WHISH_SANDBOX=true (testing credentials only work on sandbox)
const WHISH_BASE    = process.env.WHISH_SANDBOX === 'true'
  ? 'https://api.sandbox.whish.money/itel-service/api'
  : 'https://api.whish.money/itel-service/api';
const WHISH_CHANNEL = process.env.WHISH_CHANNEL!;
const WHISH_SECRET  = process.env.WHISH_SECRET!;
// Whish registered websiteUrl without protocol — strip https:// and trim any whitespace
const WHISH_WEBSITE = (process.env.WHISH_WEBSITE_URL ?? '')
  .trim()
  .replace(/^https?:\/\//, '')
  .replace(/\/$/, '')
  .trim();

console.log('[whish/initiate] websiteUrl being sent:', JSON.stringify(WHISH_WEBSITE));
console.log('[whish/initiate] channel being sent:', JSON.stringify(WHISH_CHANNEL));

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

    // ── 2. Sign cart data and embed it in the callback URL ───────────────
    // No order is created here. The callback creates it only on success.
    const orderId = crypto.randomUUID();

    const cartPayload = {
      oid:   orderId,
      cid:   customerId,
      cn:    customer_name,
      cp:    normalizedPhone,
      ce:    customer_email || null,
      it:    items,
      sub:   Number(subtotal),
      sh:    Number(shipping),
      dis:   Number(discount ?? 0),
      cc:    coupon_code || null,
      tot:   Number(total),
      addr:  address ?? null,
      notes: notes || null,
    };

    const cartB64 = Buffer.from(JSON.stringify(cartPayload)).toString('base64url');
    const sig     = createHmac('sha256', WHISH_SECRET).update(cartB64).digest('hex');

    // ── 3. Build Whish payload ───────────────────────────────────────────
    const origin =
      req.headers.get('origin') ??
      (req.headers.get('x-forwarded-proto') ?? 'https') +
        '://' +
        (req.headers.get('x-forwarded-host') ?? req.headers.get('host') ?? 'localhost:3000');

    const callbackBase = `${origin}/api/whish/callback?cart=${cartB64}&sig=${sig}`;

    const whishPayload = {
      amount:             Number(total).toFixed(2),
      currency:           'USD',
      invoice:            `Order ${orderId.slice(0, 8).toUpperCase()}`,
      externalId:         String(Date.now()),
      successCallbackUrl: `${callbackBase}&type=success`,
      failureCallbackUrl: `${callbackBase}&type=failure`,
      successRedirectUrl: `${origin}/store/checkout/payment/success?orderId=${orderId}`,
      failureRedirectUrl: `${origin}/store/checkout/payment/failed?orderId=${orderId}`,
    };

    // ── 4. Call Whish API ────────────────────────────────────────────────
    // Whish confirmed the registered websiteUrl is exactly "skmeilb.com"
    const websiteUrl = WHISH_WEBSITE || 'skmeilb.com';
    console.log(`[whish/initiate] websiteUrl: ${JSON.stringify(websiteUrl)}`);

    const controller = new AbortController();
    const timeoutId  = setTimeout(() => controller.abort(), 15_000);

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
      console.log(`[whish/payment] status:`, whishRes.status, 'body:', rawBody);

      const parsed = JSON.parse(rawBody) as Record<string, unknown>;
      if (parsed?.status === true) {
        const data = parsed?.data as Record<string, unknown> | undefined;
        collectUrl = (data?.collectUrl as string) ?? null;
      }
      if (!collectUrl) whishErrorDetail = rawBody.slice(0, 300);
    } catch (err) {
      clearTimeout(timeoutId);
      whishErrorDetail = err instanceof Error ? err.message : String(err);
      console.error('[whish/initiate] request failed:', whishErrorDetail);
    }

    if (!collectUrl) {
      console.error('[whish/initiate] failed. detail:', whishErrorDetail);
      return NextResponse.json(
        { error: `Payment gateway error: ${whishErrorDetail || 'unknown'}` },
        { status: 502 }
      );
    }

    return NextResponse.json({ collectUrl, orderId });
  } catch (err) {
    console.error('[whish/initiate]', err);
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }
}
