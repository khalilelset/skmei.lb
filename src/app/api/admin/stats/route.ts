import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const [ordersResult, productsResult, orderItemsResult] = await Promise.all([
    supabaseServer.from('orders').select('id, total, subtotal, discount, customer_phone, created_at'),
    supabaseServer.from('products').select('id', { count: 'exact', head: true }),
    supabaseServer.from('order_items').select('order_id, price, quantity, products:product_id(cost_price)'),
  ]);

  const orders = ordersResult.data ?? [];
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalProducts = productsResult.count ?? 0;

  // Discount ratio per order: (subtotal - discount) / subtotal
  const orderRatio: Record<string, number> = {};
  orders.forEach((o) => {
    const sub  = Number((o as Record<string, unknown>).subtotal ?? 0);
    const disc = Number((o as Record<string, unknown>).discount ?? 0);
    orderRatio[o.id as string] = sub > 0 && disc > 0 ? (sub - disc) / sub : 1;
  });

  // Gross profit: apply per-order discount ratio to item prices
  const totalGrossProfit = (orderItemsResult.data ?? []).reduce((sum, item) => {
    const prod = item.products as { cost_price?: number | null } | null;
    if (prod?.cost_price == null) return sum;
    const ratio = orderRatio[(item as Record<string, unknown>).order_id as string] ?? 1;
    const effectivePrice = Number(item.price) * ratio;
    return sum + (effectivePrice - Number(prod.cost_price)) * Number(item.quantity ?? 1);
  }, 0);

  // Unique customers by phone number
  const uniquePhones = new Set(orders.map((o) => o.customer_phone));
  const totalCustomers = uniquePhones.size;

  // Recent orders (last 5)
  const { data: recentRaw } = await supabaseServer
    .from('orders')
    .select('id, customer_name, total, status, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  const recentOrders = (recentRaw ?? []).map((o) => ({
    id: o.id,
    orderNumber: `SK-${String(o.id).slice(0, 6).toUpperCase()}`,
    customerName: o.customer_name,
    total: Number(o.total),
    status: o.status,
    createdAt: o.created_at,
  }));

  return NextResponse.json({
    totalRevenue,
    totalGrossProfit: Math.round(totalGrossProfit * 100) / 100,
    totalOrders,
    totalCustomers,
    totalProducts,
    recentOrders,
  });
}
