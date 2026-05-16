import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { supabaseServer } from '@/lib/supabase/server';
import { sendOrderEmails, sendStatusChangeEmail } from '@/lib/email';

// Whish calls this GET endpoint after a payment attempt.
// Cart data is carried in the signed `cart` + `sig` query params — no staging table needed.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cartB64 = searchParams.get('cart');
  const sig     = searchParams.get('sig');
  const type    = searchParams.get('type'); // 'success' | 'failure'

  // Verify HMAC signature so nobody can forge a fake callback
  if (!cartB64 || !sig) {
    return NextResponse.json({ error: 'Missing params' }, { status: 400 });
  }
  const expectedSig = createHmac('sha256', process.env.WHISH_SECRET!).update(cartB64).digest('hex');
  if (sig !== expectedSig) {
    console.error('[whish/callback] signature mismatch');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  if (type !== 'success') {
    // Payment failed — cart data is discarded, nothing was written to DB
    return NextResponse.json({ ok: true });
  }

  // ── Payment confirmed — decode cart and create the order ────────────
  let cart: Record<string, unknown>;
  try {
    cart = JSON.parse(Buffer.from(cartB64, 'base64url').toString());
  } catch {
    return NextResponse.json({ error: 'Invalid cart data' }, { status: 400 });
  }

  const { data: order, error: orderError } = await supabaseServer
    .from('orders')
    .insert({
      id:             cart.oid as string,
      customer_id:    cart.cid as string | null,
      customer_name:  cart.cn  as string,
      customer_phone: cart.cp  as string,
      customer_email: cart.ce  as string | null,
      items:          cart.it,
      subtotal:       cart.sub as number,
      shipping:       cart.sh  as number,
      discount:       cart.dis as number,
      coupon_code:    cart.cc  as string | null,
      total:          cart.tot as number,
      address:        cart.addr ?? null,
      notes:          cart.notes as string | null,
      status:         'confirmed',
      source:         'website',
      payment_method: 'whish',
    })
    .select('id, order_number')
    .single();

  if (orderError) {
    // Duplicate callback — order already created
    if (orderError.code === '23505') return NextResponse.json({ ok: true });
    console.error('[whish/callback] order insert error:', orderError);
    return NextResponse.json({ ok: true });
  }

  // Insert order_items
  const orderItems = (cart.it as Record<string, unknown>[]).map((item) => ({
    order_id:      order.id,
    product_id:    (item.id as string) || null,
    product_name:  String(item.name ?? item.productName ?? ''),
    product_image: String(item.image ?? ''),
    price:         Number(item.price ?? 0),
    quantity:      Number(item.quantity ?? 1),
  }));
  await supabaseServer.from('order_items').insert(orderItems);

  // Send admin notification + customer confirmation (non-blocking)
  const emailItems = (cart.it as Record<string, unknown>[]).map((item) => ({
    name:     String(item.name ?? item.productName ?? ''),
    price:    Number(item.price ?? 0),
    quantity: Number(item.quantity ?? 1),
    image:    item.image ? String(item.image) : null,
  }));

  if (cart.ce) {
    sendStatusChangeEmail('confirmed', {
      orderId:       order.id,
      orderNumber:   order.order_number,
      customerName:  cart.cn  as string,
      customerEmail: cart.ce  as string,
      customerPhone: cart.cp  as string,
      items:         emailItems,
      total:         cart.tot as number,
      address:       cart.addr as Record<string, string> | null,
    }).catch((err) => console.error('[whish/callback] customer email error:', err));
  }

  sendOrderEmails({
    orderId:       order.id,
    orderNumber:   order.order_number,
    customerName:  cart.cn  as string,
    customerEmail: cart.ce  as string | null,
    customerPhone: cart.cp  as string,
    items:         emailItems,
    subtotal:      cart.sub  as number,
    shipping:      cart.sh   as number,
    discount:      cart.dis  as number,
    couponCode:    cart.cc   as string | null,
    total:         cart.tot  as number,
    address:       cart.addr as Record<string, string> | null,
    notes:         cart.notes as string | null,
  }).catch((err) => console.error('[whish/callback] email error:', err));

  return NextResponse.json({ ok: true });
}
