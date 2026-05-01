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

  const newStatus = type === 'success' ? 'confirmed' : 'cancelled';

  await supabaseServer
    .from('orders')
    .update({ status: newStatus })
    .eq('id', orderId)
    .eq('status', 'pending_payment'); // idempotent: only act on orders still pending

  return NextResponse.json({ ok: true });
}
