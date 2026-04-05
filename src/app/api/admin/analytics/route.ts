import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const [ordersResult, itemsResult] = await Promise.all([
      supabaseServer
        .from('orders')
        .select('id, total, status, address, created_at'),
      supabaseServer
        .from('order_items')
        .select('order_id, product_name, quantity, price, products:product_id(name, category)'),
    ]);

    const orders = ordersResult.data ?? [];
    const orderItems = itemsResult.data ?? [];

    const now = new Date();

    // ── Annual Revenue & Orders — every year that has data ────────────
    const yearSet = new Set<number>();
    orders.forEach((o) => yearSet.add(new Date(o.created_at).getFullYear()));
    // Always include current year
    yearSet.add(now.getFullYear());
    const years = Array.from(yearSet).sort();
    const annualMap: Record<number, { revenue: number; orders: number }> = {};
    years.forEach((y) => { annualMap[y] = { revenue: 0, orders: 0 }; });
    orders.forEach((o) => {
      const y = new Date(o.created_at).getFullYear();
      if (annualMap[y]) {
        annualMap[y].revenue += Number(o.total ?? 0);
        annualMap[y].orders  += 1;
      }
    });
    const annualRevenue = years.map((y) => ({
      label: String(y),
      revenue: round(annualMap[y].revenue),
      orders:  annualMap[y].orders,
    }));

    // ── Monthly Revenue & Orders — all months of current year (Jan–Dec) ──
    const currentYear = now.getFullYear();
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyMap: Record<string, { revenue: number; orders: number }> = {};
    MONTHS.forEach((_, i) => {
      const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      monthlyMap[key] = { revenue: 0, orders: 0 };
    });
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      if (d.getFullYear() !== currentYear) return;
      const key = `${currentYear}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].revenue += Number(o.total ?? 0);
        monthlyMap[key].orders  += 1;
      }
    });
    const monthlyRevenue = MONTHS.map((m, i) => {
      const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      return { label: m, revenue: round(monthlyMap[key].revenue), orders: monthlyMap[key].orders };
    });

    // ── Weekly Revenue & Orders — last 12 weeks ────────────────────────
    // Week key = ISO week: YYYY-Www
    function isoWeek(d: Date): string {
      const tmp = new Date(d);
      tmp.setHours(0, 0, 0, 0);
      tmp.setDate(tmp.getDate() + 3 - ((tmp.getDay() + 6) % 7));
      const week1 = new Date(tmp.getFullYear(), 0, 4);
      const wn = 1 + Math.round(((tmp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
      return `${tmp.getFullYear()}-W${String(wn).padStart(2, '0')}`;
    }
    function weekLabel(d: Date): string {
      // Monday of the week
      const day = new Date(d);
      day.setDate(day.getDate() - ((day.getDay() + 6) % 7));
      return day.toLocaleString('en-US', { month: 'short', day: 'numeric' });
    }
    const weekKeys: string[] = [];
    const weekLabels: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(now.getDate() - i * 7);
      const k = isoWeek(d);
      if (!weekKeys.includes(k)) {
        weekKeys.push(k);
        weekLabels.push(weekLabel(d));
      }
    }
    const weeklyMap: Record<string, { revenue: number; orders: number }> = {};
    weekKeys.forEach((k) => { weeklyMap[k] = { revenue: 0, orders: 0 }; });
    orders.forEach((o) => {
      const k = isoWeek(new Date(o.created_at));
      if (weeklyMap[k]) {
        weeklyMap[k].revenue += Number(o.total ?? 0);
        weeklyMap[k].orders  += 1;
      }
    });
    const weeklyRevenue = weekKeys.map((k, i) => ({
      label: weekLabels[i],
      revenue: round(weeklyMap[k].revenue),
      orders:  weeklyMap[k].orders,
    }));

    // ── Daily Revenue & Orders — day 1 to today of current month ──────
    const daysInMonth = now.getDate(); // 1..today
    const dayKeys: string[] = [];
    const dayLabels: string[] = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const key = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      dayKeys.push(key);
      dayLabels.push(String(d)); // just the day number: 1, 2, 3 …
    }
    const dailyMap: Record<string, { revenue: number; orders: number }> = {};
    dayKeys.forEach((k) => { dailyMap[k] = { revenue: 0, orders: 0 }; });
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dailyMap[key]) {
        dailyMap[key].revenue += Number(o.total ?? 0);
        dailyMap[key].orders  += 1;
      }
    });
    const dailyRevenue = dayKeys.map((k, i) => ({
      label: dayLabels[i],
      revenue: round(dailyMap[k].revenue),
      orders:  dailyMap[k].orders,
    }));

    // KPI month map still uses current year months for this/last month comparison
    const nowMonthKey  = `${currentYear}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const prevMonthKey = (() => {
      const p = new Date(currentYear, now.getMonth() - 1, 1);
      return `${p.getFullYear()}-${String(p.getMonth() + 1).padStart(2, '0')}`;
    })();

    // ── Order Status Breakdown ─────────────────────────────────────────
    const statusMap: Record<string, number> = {};
    orders.forEach((o) => {
      statusMap[o.status] = (statusMap[o.status] ?? 0) + 1;
    });
    const statusBreakdown = Object.entries(statusMap)
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);

    // ── Category Breakdown (from order_items → products join) ──────────
    const catMap: Record<string, { count: number; revenue: number }> = {};
    orderItems.forEach((item) => {
      const prod = item.products as { category?: string } | null;
      const cat = prod?.category ?? 'other';
      if (!catMap[cat]) catMap[cat] = { count: 0, revenue: 0 };
      catMap[cat].count += Number(item.quantity ?? 1);
      catMap[cat].revenue += Number(item.price ?? 0) * Number(item.quantity ?? 1);
    });
    const categoryBreakdown = Object.entries(catMap)
      .map(([category, d]) => ({ category, count: d.count, revenue: round(d.revenue) }))
      .sort((a, b) => b.count - a.count);

    // ── Top Products ───────────────────────────────────────────────────
    const prodMap: Record<string, { name: string; quantity: number; revenue: number; category: string }> = {};
    orderItems.forEach((item) => {
      const name = item.product_name ?? 'Unknown';
      const cat = (item.products as { category?: string } | null)?.category ?? 'other';
      if (!prodMap[name]) prodMap[name] = { name, quantity: 0, revenue: 0, category: cat };
      prodMap[name].quantity += Number(item.quantity ?? 1);
      prodMap[name].revenue += Number(item.price ?? 0) * Number(item.quantity ?? 1);
    });
    const topProducts = Object.values(prodMap)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10)
      .map((p) => ({
        // Shorten long product names for chart readability
        name: p.name.length > 28 ? p.name.slice(0, 26) + '…' : p.name,
        fullName: p.name,
        quantity: p.quantity,
        revenue: round(p.revenue),
        category: p.category,
      }));

    // ── Region Breakdown (from address.city / address.area) ────────────
    const regionMap: Record<string, { count: number; revenue: number }> = {};
    orders.forEach((o) => {
      const addr = o.address as Record<string, string> | null;
      const region =
        addr?.city?.trim() ||
        addr?.area?.trim() ||
        'Unknown';
      if (!regionMap[region]) regionMap[region] = { count: 0, revenue: 0 };
      regionMap[region].count += 1;
      regionMap[region].revenue += Number(o.total ?? 0);
    });
    const regionBreakdown = Object.entries(regionMap)
      .map(([region, d]) => ({ region, count: d.count, revenue: round(d.revenue) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── KPIs ───────────────────────────────────────────────────────────
    const totalRevenue = orders.reduce((s, o) => s + Number(o.total ?? 0), 0);
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const deliveryRate = totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0;
    const topCategory = categoryBreakdown[0]?.category ?? '-';

    const thisMonth = monthlyMap[nowMonthKey]  ?? { revenue: 0, orders: 0 };
    const lastMonth = monthlyMap[prevMonthKey] ?? { revenue: 0, orders: 0 };

    const revenueChange =
      lastMonth.revenue > 0
        ? round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100)
        : null;
    const ordersChange =
      lastMonth.orders > 0
        ? round(((thisMonth.orders - lastMonth.orders) / lastMonth.orders) * 100)
        : null;

    return NextResponse.json({
      annualRevenue,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      categoryBreakdown,
      topProducts,
      statusBreakdown,
      regionBreakdown,
      kpis: {
        totalRevenue: round(totalRevenue),
        avgOrderValue: round(avgOrderValue),
        topCategory,
        deliveryRate: Math.round(deliveryRate * 10) / 10,
        totalOrders,
        thisMonthRevenue: round(thisMonth.revenue),
        thisMonthOrders: thisMonth.orders,
        lastMonthRevenue: round(lastMonth.revenue),
        lastMonthOrders: lastMonth.orders,
        revenueChange,
        ordersChange,
      },
    });
  } catch (err) {
    console.error('[analytics]', err);
    return NextResponse.json({ error: 'Failed to load analytics' }, { status: 500 });
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
