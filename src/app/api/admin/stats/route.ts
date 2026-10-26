import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

const TZ = 'Asia/Beirut';
const DAY_MS = 86_400_000;
const dayKey = (d: Date) => d.toLocaleDateString('en-CA', { timeZone: TZ });

export async function GET() {
  const [ordersResult, productsResult, orderItemsResult, statusResult, recentResult] = await Promise.all([
    supabaseServer
      .from('orders')
      .select('id, total, subtotal, shipping, discount, customer_phone, created_at')
      .not('status', 'in', '("pending_payment","cancelled")'),
    supabaseServer.from('products').select('id, created_at'),
    supabaseServer.from('order_items').select('order_id, price, quantity, products:product_id(cost_price)'),
    supabaseServer.from('orders').select('status'),
    supabaseServer
      .from('orders')
      .select('id, order_number, customer_name, total, status, created_at')
      .order('created_at', { ascending: false })
      .limit(6),
  ]);

  const orders = ordersResult.data ?? [];
  const products = productsResult.data ?? [];
  const totalOrders = orders.length;
  const revenueOf = (o: (typeof orders)[number]) => Number(o.total) - Number(o.shipping ?? 0);
  const totalRevenue = orders.reduce((sum, o) => sum + revenueOf(o), 0);
  const totalProducts = products.length;

  // Discount ratio per order: (subtotal - discount) / subtotal
  const orderRatio: Record<string, number> = {};
  const orderDay: Record<string, string> = {};
  orders.forEach((o) => {
    const sub = Number(o.subtotal ?? 0);
    const disc = Number(o.discount ?? 0);
    orderRatio[o.id] = sub > 0 && disc > 0 ? (sub - disc) / sub : 1;
    orderDay[o.id] = dayKey(new Date(o.created_at));
  });

  // Gross profit: apply per-order discount ratio to item prices; only items of counted orders
  const profitByDay: Record<string, number> = {};
  let totalGrossProfit = 0;
  (orderItemsResult.data ?? []).forEach((item) => {
    const prod = item.products as { cost_price?: number | null } | null;
    if (prod?.cost_price == null) return;
    const ratio = orderRatio[item.order_id as string];
    if (ratio === undefined) return;
    const profit = (Number(item.price) * ratio - Number(prod.cost_price)) * Number(item.quantity ?? 1);
    totalGrossProfit += profit;
    const day = orderDay[item.order_id as string];
    profitByDay[day] = (profitByDay[day] ?? 0) + profit;
  });

  // Daily series for the last 30 days, plus totals for the 30 days before that (Beirut calendar days)
  const now = Date.now();
  const days = Array.from({ length: 30 }, (_, i) => dayKey(new Date(now - (29 - i) * DAY_MS)));
  const prevDays = new Set(Array.from({ length: 30 }, (_, i) => dayKey(new Date(now - (59 - i) * DAY_MS))));
  const byDay: Record<string, { revenue: number; orders: number }> = {};
  const previous = { revenue: 0, orders: 0, profit: 0 };
  orders.forEach((o) => {
    const day = orderDay[o.id];
    if (prevDays.has(day)) {
      previous.revenue += revenueOf(o);
      previous.orders += 1;
      return;
    }
    const slot = (byDay[day] ??= { revenue: 0, orders: 0 });
    slot.revenue += revenueOf(o);
    slot.orders += 1;
  });
  prevDays.forEach((d) => {
    previous.profit += profitByDay[d] ?? 0;
  });
  const round2 = (n: number) => Math.round(n * 100) / 100;
  const daily = days.map((date) => ({
    date,
    revenue: round2(byDay[date]?.revenue ?? 0),
    orders: byDay[date]?.orders ?? 0,
    profit: round2(profitByDay[date] ?? 0),
  }));

  // Customers: unique phone numbers; "new" = first counted order in the last 30 days
  const firstOrder: Record<string, number> = {};
  orders.forEach((o) => {
    const t = new Date(o.created_at).getTime();
    const p = o.customer_phone as string;
    if (!(p in firstOrder) || t < firstOrder[p]) firstOrder[p] = t;
  });
  const firstTimes = Object.values(firstOrder);
  const totalCustomers = firstTimes.length;
  const since30 = now - 30 * DAY_MS;
  const newCustomers30 = firstTimes.filter((t) => t >= since30).length;
  const productTimes = products.map((p) => new Date(p.created_at).getTime());
  const newProducts30 = productTimes.filter((t) => t >= since30).length;

  // Cumulative totals at the end of each of the last 11 weeks (for sparklines)
  const weekEnds = Array.from({ length: 11 }, (_, i) => now - (10 - i) * 7 * DAY_MS);
  const customersWeekly = weekEnds.map((end) => firstTimes.filter((t) => t <= end).length);
  const productsWeekly = weekEnds.map((end) => productTimes.filter((t) => t <= end).length);

  const statusCounts: Record<string, number> = {};
  (statusResult.data ?? []).forEach((r) => {
    statusCounts[r.status] = (statusCounts[r.status] ?? 0) + 1;
  });

  const recentOrders = (recentResult.data ?? []).map((o) => ({
    id: o.id,
    orderNumber: o.order_number ? `SK-${o.order_number}` : `SK-${String(o.id).slice(0, 6).toUpperCase()}`,
    customerName: o.customer_name,
    total: Number(o.total),
    status: o.status,
    createdAt: o.created_at,
  }));

  return NextResponse.json({
    totalRevenue,
    totalGrossProfit: round2(totalGrossProfit),
    totalOrders,
    totalCustomers,
    totalProducts,
    recentOrders,
    daily,
    previous: { revenue: round2(previous.revenue), orders: previous.orders, profit: round2(previous.profit) },
    newCustomers30,
    newProducts30,
    customersWeekly,
    productsWeekly,
    statusCounts,
  });
}
