import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { phoneKey } from '@/lib/phoneKey';

interface AccountInfo {
  phone: string;
  accountId: string;
  accountCreatedAt: string;
  addresses: unknown[];
  email: string | null;
  name: string;
}

interface OrderGroup {
  phone: string;
  name: string;
  email: string | null;
  orderCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  orders: { id: string; total: number; status: string; createdAt: string }[];
}

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

  // Accounts and orders store phones in different formats (e.g. "71867784" vs "+96171867784"),
  // so both sides are grouped by the canonical phone key.
  const accountMap = new Map<string, AccountInfo>();
  for (const a of accountsRes.data ?? []) {
    const key = phoneKey(a.phone);
    if (!key) continue;
    accountMap.set(key, {
      phone: String(a.phone).trim(),
      accountId: String(a.id),
      accountCreatedAt: String(a.created_at),
      addresses: Array.isArray(a.addresses) ? a.addresses : [],
      email: a.email ? String(a.email) : null,
      name: [a.first_name, a.last_name].filter(Boolean).join(' '),
    });
  }

  const orderMap = new Map<string, OrderGroup>();
  for (const o of ordersRes.data ?? []) {
    const key = phoneKey(o.customer_phone);
    if (!key) continue;
    let c = orderMap.get(key);
    if (!c) {
      c = {
        phone: String(o.customer_phone).trim(),
        name: String(o.customer_name ?? ''),
        email: o.customer_email ? String(o.customer_email) : null,
        orderCount: 0,
        totalSpent: 0,
        firstOrderAt: String(o.created_at),
        lastOrderAt: String(o.created_at),
        orders: [],
      };
      orderMap.set(key, c);
    }
    if (!c.email && o.customer_email) c.email = String(o.customer_email);
    c.orderCount += 1;
    c.totalSpent += Number(o.total ?? 0);
    if (o.created_at < c.firstOrderAt) c.firstOrderAt = String(o.created_at);
    if (o.created_at > c.lastOrderAt) c.lastOrderAt = String(o.created_at);
    c.orders.push({ id: String(o.id), total: Number(o.total ?? 0), status: String(o.status), createdAt: String(o.created_at) });
  }

  // Fallback: an account whose phone didn't match any orders, but whose email matches the email
  // on an orders-only group, is the same person who typed a different number at checkout.
  const orderKeyByEmail = new Map<string, string>();
  for (const [key, g] of orderMap) {
    if (g.email && !accountMap.has(key)) orderKeyByEmail.set(g.email.trim().toLowerCase(), key);
  }
  const accountByKey = new Map<string, AccountInfo>();
  for (const [key, acc] of accountMap) {
    if (orderMap.has(key)) {
      accountByKey.set(key, acc);
      continue;
    }
    const emailKey = acc.email?.trim().toLowerCase();
    const matched = emailKey ? orderKeyByEmail.get(emailKey) : undefined;
    if (matched && !accountByKey.has(matched)) {
      accountByKey.set(matched, acc);
      orderKeyByEmail.delete(emailKey!);
    } else {
      accountByKey.set(key, acc);
    }
  }

  const allKeys = new Set([...accountByKey.keys(), ...orderMap.keys()]);
  const result = [];

  for (const key of allKeys) {
    const account = accountByKey.get(key);
    const orders = orderMap.get(key);

    result.push({
      // Prefer the order's number: it carries the country code (+961…)
      phone: orders?.phone ?? account?.phone ?? key,
      name: account?.name || orders?.name || '',
      email: account?.email ?? orders?.email ?? null,
      hasAccount: Boolean(account),
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
