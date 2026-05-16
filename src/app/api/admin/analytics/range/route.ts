import { NextRequest, NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const from = searchParams.get('from'); // YYYY-MM-DD
  const to   = searchParams.get('to');   // YYYY-MM-DD

  if (!from || !to) {
    return NextResponse.json({ error: 'from and to are required' }, { status: 400 });
  }

  try {
    const { data: orders } = await supabaseServer
      .from('orders')
      .select('id, total, subtotal, shipping, discount, status, items')
      .gte('created_at', `${from}T00:00:00.000Z`)
      .lte('created_at', `${to}T23:59:59.999Z`)
      .not('status', 'in', '("pending_payment","cancelled")');

    const safeOrders = orders ?? [];
    const orderIds   = safeOrders.map((o) => o.id as string);

    const { data: items } =
      orderIds.length > 0
        ? await supabaseServer
            .from('order_items')
            .select('order_id, quantity, price, products:product_id(cost_price)')
            .in('order_id', orderIds)
        : { data: [] };

    const safeItems = items ?? [];

    // Discount ratio per order
    const orderRatio: Record<string, number> = {};
    safeOrders.forEach((o) => {
      const sub  = Number((o as Record<string, unknown>).subtotal ?? 0);
      const disc = Number((o as Record<string, unknown>).discount ?? 0);
      orderRatio[o.id as string] = sub > 0 && disc > 0 ? (sub - disc) / sub : 1;
    });

    let totalRevenue     = 0;
    let totalGrossProfit = 0;
    let deliveredCount   = 0;

    for (const o of safeOrders) {
      totalRevenue += Number(o.total ?? 0) - Number((o as Record<string,unknown>).shipping ?? 0);
      if (o.status === 'delivered') deliveredCount++;
    }

    for (const item of safeItems) {
      const costPrice = (item.products as { cost_price?: number | null } | null)?.cost_price;
      if (costPrice != null) {
        const ratio = orderRatio[(item as Record<string, unknown>).order_id as string] ?? 1;
        const effectivePrice = Number(item.price) * ratio;
        totalGrossProfit += (effectivePrice - Number(costPrice)) * Number(item.quantity ?? 1);
      }
    }

    // Add box profit (boxes cost nothing — full price is profit)
    for (const o of safeOrders) {
      const rawItems = (o as Record<string, unknown>).items;
      if (!Array.isArray(rawItems)) continue;
      for (const item of rawItems as Record<string, unknown>[]) {
        const box = item.box as { price?: number } | null | undefined;
        if (!box || !box.price) continue;
        totalGrossProfit += Number(box.price) * Number(item.quantity ?? 1);
      }
    }

    const totalOrders  = safeOrders.length;
    const grossMargin  = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const deliveryRate  = totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0;

    return NextResponse.json({
      totalRevenue:    round(totalRevenue),
      totalOrders,
      totalGrossProfit: round(totalGrossProfit),
      grossMargin:     Math.round(grossMargin * 10) / 10,
      avgOrderValue:   round(avgOrderValue),
      deliveryRate:    Math.round(deliveryRate * 10) / 10,
    });
  } catch (err) {
    console.error('[analytics/range]', err);
    return NextResponse.json({ error: 'Failed to load range analytics' }, { status: 500 });
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
