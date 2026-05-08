import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';

export async function GET() {
  try {
    const [ordersResult, itemsResult, productsResult] = await Promise.all([
      supabaseServer
        .from('orders')
        .select('id, total, subtotal, shipping, discount, status, address, created_at, source')
        .not('status', 'in', '("pending_payment","cancelled")'),
      supabaseServer
        .from('order_items')
        .select('order_id, product_name, quantity, price, products:product_id(name, category, cost_price)'),
      supabaseServer
        .from('products')
        .select('id, name, price, cost_price, category')
        .not('cost_price', 'is', null),
    ]);

    const orders = ordersResult.data ?? [];
    const orderItems = itemsResult.data ?? [];
    const productsData = productsResult.data ?? [];

    // Revenue per order = total minus shipping (exclude delivery cost)
    const orderRevenue: Record<string, number> = {};
    orders.forEach((o) => {
      orderRevenue[o.id as string] = Number(o.total ?? 0) - Number((o as Record<string, unknown>).shipping ?? 0);
    });

    // Discount ratio per order: (subtotal - discount) / subtotal — distributes coupon proportionally
    const orderRatio: Record<string, number> = {};
    orders.forEach((o) => {
      const sub  = Number((o as Record<string, unknown>).subtotal ?? 0);
      const disc = Number((o as Record<string, unknown>).discount ?? 0);
      orderRatio[o.id as string] = sub > 0 && disc > 0 ? (sub - disc) / sub : 1;
    });

    // Pre-compute gross profit per order (sum over items, discount-adjusted)
    const orderGrossProfit: Record<string, number> = {};
    orderItems.forEach((item) => {
      const prod = item.products as { cost_price?: number | null } | null;
      const costPrice = prod?.cost_price != null ? Number(prod.cost_price) : null;
      const qty = Number(item.quantity ?? 1);
      const ratio = orderRatio[item.order_id as string] ?? 1;
      const salePrice = Number(item.price ?? 0) * ratio;
      const profit = costPrice != null ? (salePrice - costPrice) * qty : 0;
      const oid = item.order_id as string;
      orderGrossProfit[oid] = (orderGrossProfit[oid] ?? 0) + profit;
    });

    const now = new Date();

    // ── Annual Revenue & Orders — every year that has data ────────────
    const yearSet = new Set<number>();
    orders.forEach((o) => yearSet.add(new Date(o.created_at).getFullYear()));
    // Always include current year
    yearSet.add(now.getFullYear());
    const years = Array.from(yearSet).sort();
    const annualMap: Record<number, { revenue: number; orders: number; grossProfit: number }> = {};
    years.forEach((y) => { annualMap[y] = { revenue: 0, orders: 0, grossProfit: 0 }; });
    orders.forEach((o) => {
      const y = new Date(o.created_at).getFullYear();
      if (annualMap[y]) {
        annualMap[y].revenue += orderRevenue[o.id as string] ?? 0;
        annualMap[y].orders  += 1;
        annualMap[y].grossProfit += orderGrossProfit[o.id as string] ?? 0;
      }
    });
    const annualRevenue = years.map((y) => ({
      label: String(y),
      revenue: round(annualMap[y].revenue),
      orders:  annualMap[y].orders,
      grossProfit: round(annualMap[y].grossProfit),
    }));

    // ── Monthly Revenue & Orders — all months of current year (Jan–Dec) ──
    const currentYear = now.getFullYear();
    const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const monthlyMap: Record<string, { revenue: number; orders: number; grossProfit: number }> = {};
    MONTHS.forEach((_, i) => {
      const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      monthlyMap[key] = { revenue: 0, orders: 0, grossProfit: 0 };
    });
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      if (d.getFullYear() !== currentYear) return;
      const key = `${currentYear}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (monthlyMap[key]) {
        monthlyMap[key].revenue += orderRevenue[o.id as string] ?? 0;
        monthlyMap[key].orders  += 1;
        monthlyMap[key].grossProfit += orderGrossProfit[o.id as string] ?? 0;
      }
    });
    const monthlyRevenue = MONTHS.map((m, i) => {
      const key = `${currentYear}-${String(i + 1).padStart(2, '0')}`;
      return { label: m, revenue: round(monthlyMap[key].revenue), orders: monthlyMap[key].orders, grossProfit: round(monthlyMap[key].grossProfit) };
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
    const weeklyMap: Record<string, { revenue: number; orders: number; grossProfit: number }> = {};
    weekKeys.forEach((k) => { weeklyMap[k] = { revenue: 0, orders: 0, grossProfit: 0 }; });
    orders.forEach((o) => {
      const k = isoWeek(new Date(o.created_at));
      if (weeklyMap[k]) {
        weeklyMap[k].revenue += orderRevenue[o.id as string] ?? 0;
        weeklyMap[k].orders  += 1;
        weeklyMap[k].grossProfit += orderGrossProfit[o.id as string] ?? 0;
      }
    });
    const weeklyRevenue = weekKeys.map((k, i) => ({
      label: weekLabels[i],
      revenue: round(weeklyMap[k].revenue),
      orders:  weeklyMap[k].orders,
      grossProfit: round(weeklyMap[k].grossProfit),
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
    const dailyMap: Record<string, { revenue: number; orders: number; grossProfit: number }> = {};
    dayKeys.forEach((k) => { dailyMap[k] = { revenue: 0, orders: 0, grossProfit: 0 }; });
    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (dailyMap[key]) {
        dailyMap[key].revenue += orderRevenue[o.id as string] ?? 0;
        dailyMap[key].orders  += 1;
        dailyMap[key].grossProfit += orderGrossProfit[o.id as string] ?? 0;
      }
    });
    const dailyRevenue = dayKeys.map((k, i) => ({
      label: dayLabels[i],
      revenue: round(dailyMap[k].revenue),
      orders:  dailyMap[k].orders,
      grossProfit: round(dailyMap[k].grossProfit),
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
      regionMap[region].revenue += orderRevenue[o.id as string] ?? 0;
    });
    const regionBreakdown = Object.entries(regionMap)
      .map(([region, d]) => ({ region, count: d.count, revenue: round(d.revenue) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // ── KPIs ───────────────────────────────────────────────────────────
    const totalRevenue = orders.reduce((s, o) => s + (orderRevenue[o.id as string] ?? 0), 0);
    const totalGrossProfit = Object.values(orderGrossProfit).reduce((s, v) => s + v, 0);
    const grossMargin = totalRevenue > 0 ? (totalGrossProfit / totalRevenue) * 100 : 0;
    const totalOrders = orders.length;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const deliveryRate = totalOrders > 0 ? (deliveredCount / totalOrders) * 100 : 0;
    const topCategory = categoryBreakdown[0]?.category ?? '-';

    const thisMonth = monthlyMap[nowMonthKey]  ?? { revenue: 0, orders: 0, grossProfit: 0 };
    const lastMonth = monthlyMap[prevMonthKey] ?? { revenue: 0, orders: 0, grossProfit: 0 };

    const revenueChange =
      lastMonth.revenue > 0
        ? round(((thisMonth.revenue - lastMonth.revenue) / lastMonth.revenue) * 100)
        : null;
    const ordersChange =
      lastMonth.orders > 0
        ? round(((thisMonth.orders - lastMonth.orders) / lastMonth.orders) * 100)
        : null;

    // ── Period breakdown (week / month / year) ────────────────────────
    const thisWeekKey = weekKeys[weekKeys.length - 1] ?? '';
    const lastWeekKey = weekKeys[weekKeys.length - 2] ?? '';

    const thisWeekRevenue = round(weeklyMap[thisWeekKey]?.revenue ?? 0);
    const lastWeekRevenue = round(weeklyMap[lastWeekKey]?.revenue ?? 0);
    const thisWeekOrders  = weeklyMap[thisWeekKey]?.orders ?? 0;
    const lastWeekOrders  = weeklyMap[lastWeekKey]?.orders ?? 0;
    const thisWeekGP      = weeklyMap[thisWeekKey]?.grossProfit ?? 0;
    const lastWeekGP      = weeklyMap[lastWeekKey]?.grossProfit ?? 0;
    const weekRevenueChange = lastWeekRevenue > 0 ? round(((thisWeekRevenue - lastWeekRevenue) / lastWeekRevenue) * 100) : null;
    const weekOrdersChange  = lastWeekOrders  > 0 ? round(((thisWeekOrders  - lastWeekOrders)  / lastWeekOrders)  * 100) : null;
    const weekGPChange      = lastWeekGP      > 0 ? round(((thisWeekGP      - lastWeekGP)      / lastWeekGP)      * 100) : null;

    const thisMonthGP   = thisMonth.grossProfit ?? 0;
    const lastMonthGP   = lastMonth.grossProfit ?? 0;
    const monthGPChange = lastMonthGP > 0 ? round(((thisMonthGP - lastMonthGP) / lastMonthGP) * 100) : null;

    const prevYear      = currentYear - 1;
    const thisYearRevenue = round(annualMap[currentYear]?.revenue ?? 0);
    const lastYearRevenue = round(annualMap[prevYear]?.revenue ?? 0);
    const thisYearOrders  = annualMap[currentYear]?.orders ?? 0;
    const lastYearOrders  = annualMap[prevYear]?.orders ?? 0;
    const thisYearGP    = annualMap[currentYear]?.grossProfit ?? 0;
    const lastYearGP    = annualMap[prevYear]?.grossProfit ?? 0;
    const yearRevenueChange = lastYearRevenue > 0 ? round(((thisYearRevenue - lastYearRevenue) / lastYearRevenue) * 100) : null;
    const yearOrdersChange  = lastYearOrders  > 0 ? round(((thisYearOrders  - lastYearOrders)  / lastYearOrders)  * 100) : null;
    const yearGPChange      = lastYearGP      > 0 ? round(((thisYearGP      - lastYearGP)      / lastYearGP)      * 100) : null;

    // ── Per-Unit Profit from Products Table ───────────────────────────────
    const productUnitProfit = productsData
      .map((p) => {
        const sp = Number(p.price ?? 0);
        const cp = Number(p.cost_price ?? 0);
        const nm = p.name as string;
        return {
          name: nm.length > 28 ? nm.slice(0, 26) + '…' : nm,
          fullName: nm,
          salePrice: sp,
          costPrice: cp,
          unitProfit: round(sp - cp),
          margin: sp > 0 ? Math.round(((sp - cp) / sp) * 1000) / 10 : 0,
          category: (p.category as string) ?? 'other',
        };
      })
      .filter((p) => p.unitProfit > 0)
      .sort((a, b) => b.unitProfit - a.unitProfit)
      .slice(0, 15);

    // ── Per-Product Profit from Orders ────────────────────────────────────
    const websiteOrderIds = new Set(
      orders
        .filter((o) => ((o as Record<string, unknown>).source as string | null ?? 'website') === 'website')
        .map((o) => o.id as string)
    );

    const prodAllMap: Record<string, { name: string; qty: number; gp: number; rev: number; cat: string }> = {};
    const prodWebMap: Record<string, { name: string; qty: number; gp: number; rev: number; cat: string }> = {};

    orderItems.forEach((item) => {
      const prod  = item.products as { cost_price?: number | null; category?: string } | null;
      const cp    = prod?.cost_price != null ? Number(prod.cost_price) : null;
      const qty   = Number(item.quantity ?? 1);
      const oid   = item.order_id as string;
      const ratio = orderRatio[oid] ?? 1;
      const sp    = Number(item.price ?? 0) * ratio;
      const gp    = cp != null ? (sp - cp) * qty : 0;
      const rev   = sp * qty;
      const nm    = (item.product_name as string) ?? 'Unknown';
      const cat   = prod?.category ?? 'other';

      if (!prodAllMap[nm]) prodAllMap[nm] = { name: nm, qty: 0, gp: 0, rev: 0, cat };
      prodAllMap[nm].qty += qty;
      prodAllMap[nm].gp  += gp;
      prodAllMap[nm].rev += rev;

      if (websiteOrderIds.has(oid)) {
        if (!prodWebMap[nm]) prodWebMap[nm] = { name: nm, qty: 0, gp: 0, rev: 0, cat };
        prodWebMap[nm].qty += qty;
        prodWebMap[nm].gp  += gp;
        prodWebMap[nm].rev += rev;
      }
    });

    const toOrderProfitArr = (map: typeof prodAllMap) =>
      Object.values(map)
        .filter((p) => p.gp > 0)
        .sort((a, b) => b.gp - a.gp)
        .slice(0, 15)
        .map((p) => ({
          name: p.name.length > 28 ? p.name.slice(0, 26) + '…' : p.name,
          fullName: p.name,
          quantity: p.qty,
          grossProfit: round(p.gp),
          revenue: round(p.rev),
          category: p.cat,
        }));

    const productOrderProfit   = toOrderProfitArr(prodAllMap);
    const productWebsiteProfit = toOrderProfitArr(prodWebMap);

    return NextResponse.json({
      annualRevenue,
      monthlyRevenue,
      weeklyRevenue,
      dailyRevenue,
      categoryBreakdown,
      topProducts,
      statusBreakdown,
      regionBreakdown,
      productUnitProfit,
      productOrderProfit,
      productWebsiteProfit,
      kpis: {
        totalRevenue: round(totalRevenue),
        totalGrossProfit: round(totalGrossProfit),
        grossMargin: Math.round(grossMargin * 10) / 10,
        // week
        thisWeekRevenue, lastWeekRevenue, weekRevenueChange,
        thisWeekOrders,  lastWeekOrders,  weekOrdersChange,
        thisWeekGrossProfit: round(thisWeekGP), lastWeekGrossProfit: round(lastWeekGP), weekGPChange,
        // month
        thisMonthGrossProfit: round(thisMonthGP), lastMonthGrossProfit: round(lastMonthGP), monthGPChange,
        // year
        thisYearRevenue, lastYearRevenue, yearRevenueChange,
        thisYearOrders,  lastYearOrders,  yearOrdersChange,
        thisYearGrossProfit: round(thisYearGP), lastYearGrossProfit: round(lastYearGP), yearGPChange,
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
