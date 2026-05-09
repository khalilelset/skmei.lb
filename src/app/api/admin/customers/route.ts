import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const { data: orders, error } = await supabaseServer
    .from('orders')
    .select('id, customer_name, customer_phone, customer_email, total, status, created_at')
    .not('status', 'in', '("pending_payment","cancelled")')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Aggregate unique customers by phone
  const map = new Map<string, {
    phone: string;
    name: string;
    email: string | null;
    orderCount: number;
    totalSpent: number;
    firstOrderAt: string;
    lastOrderAt: string;
    orders: { id: string; total: number; status: string; createdAt: string }[];
  }>();

  for (const o of orders ?? []) {
    const phone = String(o.customer_phone ?? '').trim();
    if (!phone) continue;
    if (!map.has(phone)) {
      map.set(phone, {
        phone,
        name: String(o.customer_name ?? ''),
        email: o.customer_email ? String(o.customer_email) : null,
        orderCount: 0,
        totalSpent: 0,
        firstOrderAt: String(o.created_at),
        lastOrderAt: String(o.created_at),
        orders: [],
      });
    }
    const c = map.get(phone)!;
    c.orderCount += 1;
    c.totalSpent += Number(o.total ?? 0);
    if (o.created_at < c.firstOrderAt) c.firstOrderAt = String(o.created_at);
    if (o.created_at > c.lastOrderAt)  c.lastOrderAt  = String(o.created_at);
    c.orders.push({ id: String(o.id), total: Number(o.total ?? 0), status: String(o.status), createdAt: String(o.created_at) });
  }

  return NextResponse.json(Array.from(map.values()));
}
