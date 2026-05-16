import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const [ordersRes, accountsRes] = await Promise.all([
    supabaseServer
      .from('orders')
      .select('id, customer_name, customer_phone, customer_email, total, status, created_at')
      .not('status', 'in', '("pending_payment","cancelled")')
      .order('created_at', { ascending: false }),
    supabaseServer
      .from('customers')
      .select('id, first_name, last_name, email, phone, addresses, created_at'),
  ]);

  if (ordersRes.error) {
    return NextResponse.json({ error: ordersRes.error.message }, { status: 500 });
  }

  // Build account map keyed by normalized phone
  const accountMap = new Map<string, {
    hasAccount: true;
    accountId: string;
    accountCreatedAt: string;
    addresses: unknown[];
    email: string | null;
    name: string;
  }>();

  for (const a of accountsRes.data ?? []) {
    const phone = String(a.phone ?? '').trim();
    if (!phone) continue;
    accountMap.set(phone, {
      hasAccount: true,
      accountId: String(a.id),
      accountCreatedAt: String(a.created_at),
      addresses: Array.isArray(a.addresses) ? a.addresses : [],
      email: a.email ? String(a.email) : null,
      name: [a.first_name, a.last_name].filter(Boolean).join(' '),
    });
  }

  // Aggregate orders by phone
  const orderMap = new Map<string, {
    phone: string;
    name: string;
    email: string | null;
    orderCount: number;
    totalSpent: number;
    firstOrderAt: string;
    lastOrderAt: string;
    orders: { id: string; total: number; status: string; createdAt: string }[];
  }>();

  for (const o of ordersRes.data ?? []) {
    const phone = String(o.customer_phone ?? '').trim();
    if (!phone) continue;
    if (!orderMap.has(phone)) {
      orderMap.set(phone, {
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
    const c = orderMap.get(phone)!;
    c.orderCount += 1;
    c.totalSpent += Number(o.total ?? 0);
    if (o.created_at < c.firstOrderAt) c.firstOrderAt = String(o.created_at);
    if (o.created_at > c.lastOrderAt) c.lastOrderAt = String(o.created_at);
    c.orders.push({ id: String(o.id), total: Number(o.total ?? 0), status: String(o.status), createdAt: String(o.created_at) });
  }

  // Merge: start from all phones seen in either source
  const allPhones = new Set([...accountMap.keys(), ...orderMap.keys()]);
  const result = [];

  for (const phone of allPhones) {
    const account = accountMap.get(phone);
    const orders = orderMap.get(phone);

    result.push({
      phone,
      name: account?.name || orders?.name || '',
      email: account?.email ?? orders?.email ?? null,
      hasAccount: account?.hasAccount ?? false,
      accountId: account?.accountId ?? null,
      accountCreatedAt: account?.accountCreatedAt ?? null,
      addresses: account?.addresses ?? [],
      orderCount: orders?.orderCount ?? 0,
      totalSpent: orders?.totalSpent ?? 0,
      firstOrderAt: orders?.firstOrderAt ?? account?.accountCreatedAt ?? null,
      lastOrderAt: orders?.lastOrderAt ?? null,
      orders: orders?.orders ?? [],
    });
  }

  // Sort: most recent activity first
  result.sort((a, b) => {
    const aDate = a.lastOrderAt ?? a.accountCreatedAt ?? '';
    const bDate = b.lastOrderAt ?? b.accountCreatedAt ?? '';
    return bDate.localeCompare(aDate);
  });

  return NextResponse.json(result);
}
