import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { sendStatusChangeEmail } from '@/lib/email';

const EMAIL_STATUSES = ['confirmed', 'shipped', 'cancelled'] as const;
type EmailStatus = typeof EMAIL_STATUSES[number];

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

  // Fetch current order status + items before updating (needed for stock logic)
  const { data: currentOrder, error: fetchErr } = await supabaseServer
    .from('orders')
    .select('status, items')
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

  // Stock management: shipped → decrement stock; cancelled (from non-cancelled) → restore stock
  const prevStatus = currentOrder.status as string;
  const items = (currentOrder.items ?? []) as { productId?: string; product_id?: string; quantity?: number }[];
  const shouldDecrease = status === 'shipped' && prevStatus !== 'shipped';
  const shouldRestore = status === 'cancelled' && prevStatus !== 'cancelled' && prevStatus === 'shipped';
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

  // Send status email for confirmed / shipped / cancelled
  if (EMAIL_STATUSES.includes(status as EmailStatus)) {
    const { data: order, error: orderFetchError } = await supabaseServer
      .from('orders')
      .select('id, order_number, customer_name, customer_email, customer_phone, items, total')
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
        })),
        total: Number(order.total),
      }).then(() => {
        console.log('[email] Status change email sent OK for', status);
      }).catch((err) => console.error('[email] Status change email threw:', err));
    } else {
      console.warn('[email] No customer_email — skipping status email for order', id);
    }
  }

  return NextResponse.json({ success: true });
}
