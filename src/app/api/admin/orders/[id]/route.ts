import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { sendStatusChangeEmail } from '@/lib/email';

const WEBSITE_EMAIL_STATUSES = ['confirmed', 'shipped', 'cancelled'] as const;
const WHATSAPP_EMAIL_STATUSES = ['cancelled'] as const;
type EmailStatus = 'confirmed' | 'shipped' | 'cancelled';

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { status } = await req.json();

  const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: 'Invalid status value' }, { status: 400 });
  }

  // Fetch current order status + items + source before updating
  const { data: currentOrder, error: fetchErr } = await supabaseServer
    .from('orders')
    .select('status, items, source')
    .eq('id', id)
    .single();

  if (fetchErr || !currentOrder) {
    return NextResponse.json({ error: fetchErr?.message ?? 'Order not found' }, { status: 500 });
  }

  const { error } = await supabaseServer
    .from('orders')
    .update({ status })
    .eq('id', id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Stock management (source-aware)
  const prevStatus = currentOrder.status as string;
  const orderSource = (currentOrder.source as string) ?? 'website';
  const items = (currentOrder.items ?? []) as { productId?: string; product_id?: string; quantity?: number }[];

  // website: decrease on shipped; whatsapp: already decreased at creation, never decrease again
  const shouldDecrease = orderSource === 'website' && status === 'shipped' && prevStatus !== 'shipped';
  // website: restore only if cancelling a shipped order; whatsapp: restore on any cancellation
  const shouldRestore = status === 'cancelled' && prevStatus !== 'cancelled' &&
    (orderSource === 'whatsapp' || prevStatus === 'shipped');
  if (shouldDecrease || shouldRestore) {
    for (const item of items) {
      const pid = item.productId ?? item.product_id;
      const qty = Number(item.quantity ?? 1);
      if (!pid) continue;
      const { data: product } = await supabaseServer
        .from('products')
        .select('stock')
        .eq('id', pid)
        .single();
      if (product) {
        const newStock = shouldDecrease
          ? Math.max(0, (product.stock ?? 0) - qty)
          : (product.stock ?? 0) + qty;
        await supabaseServer.from('products').update({ stock: newStock }).eq('id', pid);
      }
    }
  }

  // Send status email — website: confirmed/shipped/cancelled; whatsapp: cancelled only
  const emailStatuses = orderSource === 'whatsapp' ? WHATSAPP_EMAIL_STATUSES : WEBSITE_EMAIL_STATUSES;
  if (emailStatuses.includes(status as EmailStatus)) {
    const { data: order, error: orderFetchError } = await supabaseServer
      .from('orders')
      .select('id, order_number, customer_name, customer_email, customer_phone, items, total, address')
      .eq('id', id)
      .single();

    console.log('[email] order fetch error:', orderFetchError);
    console.log('[email] order found:', !!order, '| customer_email:', order?.customer_email);

    if (order?.customer_email) {
      sendStatusChangeEmail(status as EmailStatus, {
        orderId: order.id,
        orderNumber: order.order_number,
        customerName: order.customer_name,
        customerEmail: order.customer_email,
        customerPhone: String(order.customer_phone ?? ''),
        items: (order.items as Record<string, unknown>[]).map((item) => ({
          name: String(item.name ?? item.productName ?? ''),
          price: Number(item.price ?? 0),
          quantity: Number(item.quantity ?? 1),
          image: (item.image ?? item.productImage ?? null) as string | null,
        })),
        total: Number(order.total),
        address: order.address as { street?: string; building?: string; area?: string; city?: string } | null,
      }).then(() => {
        console.log('[email] Status change email sent OK for', status);
      }).catch((err) => console.error('[email] Status change email threw:', err));
    } else {
      console.warn('[email] No customer_email — skipping status email for order', id);
    }
  }

  return NextResponse.json({ success: true });
}
