import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

// Whish calls this GET endpoint after a payment attempt.
// We embed orderId and type=success|failure in the URL when creating the Whish session.
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get('orderId');
  const type    = searchParams.get('type'); // 'success' | 'failure'

  if (!orderId || !/^[0-9a-f-]{36}$/.test(orderId)) {
    return NextResponse.json({ error: 'Invalid orderId' }, { status: 400 });
  }

  if (type === 'success') {
    await supabaseServer
      .from('orders')
      .update({ status: 'confirmed' })
      .eq('id', orderId)
      .eq('status', 'pending_payment');
  } else {
    // Payment failed — remove the order entirely so no trace is left
    await supabaseServer.from('order_items').delete().eq('order_id', orderId);
    await supabaseServer
      .from('orders')
      .delete()
      .eq('id', orderId)
      .eq('status', 'pending_payment'); // only delete if still pending, never touch confirmed orders
  }

  return NextResponse.json({ ok: true });
}
