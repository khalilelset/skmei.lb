import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  const [ordersResult, productsResult] = await Promise.all([
    supabaseServer.from('orders').select('total, customer_phone, created_at'),
    supabaseServer.from('products').select('id', { count: 'exact', head: true }),
  ]);

  const orders = ordersResult.data ?? [];
  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + Number(o.total), 0);
  const totalProducts = productsResult.count ?? 0;

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
    totalOrders,
    totalCustomers,
    totalProducts,
    recentOrders,
  });
}
