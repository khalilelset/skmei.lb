import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { phoneKey } from '@/lib/phoneKey';

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  const { phone } = await params;
  const key = phoneKey(decodeURIComponent(phone));
  if (!key) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 });
  }

  // Phones are saved in many spellings ("+96171867784", "71 867 784", "03-123456"…), so match rows
  // with the same phoneKey() that GET /api/admin/customers uses to group them, then delete by id.
  // Candidates are narrowed in SQL by the last digits before the exact key comparison.
  const tail = key.slice(-6);
  const [ordersRes, accountsRes] = await Promise.all([
    supabaseServer.from('orders').select('id, customer_phone').ilike('customer_phone', `%${tail.slice(-3)}%`),
    supabaseServer.from('customers').select('id, phone').ilike('phone', `%${tail.slice(-3)}%`),
  ]);
  if (ordersRes.error) return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  if (accountsRes.error) return NextResponse.json({ error: accountsRes.error.message }, { status: 500 });

  const orderIds = (ordersRes.data ?? []).filter((o) => phoneKey(o.customer_phone) === key).map((o) => o.id);
  const accountIds = new Set((accountsRes.data ?? []).filter((a) => phoneKey(a.phone) === key).map((a) => String(a.id)));
  const accountId = req.nextUrl.searchParams.get('accountId');
  if (accountId) accountIds.add(accountId);

  if (orderIds.length) {
    const { error } = await supabaseServer.from('orders').delete().in('id', orderIds);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }
  if (accountIds.size) {
    const { error } = await supabaseServer.from('customers').delete().in('id', [...accountIds]);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, deletedOrders: orderIds.length, deletedAccounts: accountIds.size });
}
