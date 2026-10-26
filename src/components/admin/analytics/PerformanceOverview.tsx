'use client';

import { useEffect, useState } from 'react';
import { CalendarRange, DollarSign, Percent, Receipt, ShoppingBag, TrendingUp, Truck, X } from 'lucide-react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/admin/ui/button';
import { Card } from '@/components/admin/ui/card';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { Segmented } from '@/components/admin/ui/segmented';
import { EASE, int, money, pct, type AnalyticsData, type CustomRangeKpis, type KPIs } from './model';
import { KpiGrid, KpiGridSkeleton, SectionHeading, type KpiDef } from './parts';

export type GpView = 'total' | 'week' | 'month' | 'year' | 'custom';

const VIEW_OPTIONS: { value: GpView; label: string }[] = [
  { value: 'total', label: 'All time' },
  { value: 'week', label: 'This week' },
  { value: 'month', label: 'This month' },
  { value: 'year', label: 'This year' },
  { value: 'custom', label: 'Custom range' },
];

const marginOf = (gp: number, rev: number) => (rev > 0 ? Math.round((gp / rev) * 1000) / 10 : 0);

/** The six cards for the all-time / week / month / year views — same figures and sub-lines as before. */
function buildKpis(view: Exclude<GpView, 'custom'>, k: KPIs, d: AnalyticsData): KpiDef[] {
  const year = new Date().getFullYear();
  const month = new Date().getMonth();
  const deliveryCard: KpiDef = {
    key: 'delivery', label: 'Delivery rate', value: k.deliveryRate, format: pct, icon: Truck, tone: 'teal',
    share: k.deliveryRate / 100, sub: `Top category: ${k.topCategory}`,
  };

  if (view === 'total') {
    const s = d.annualRevenue;
    return [
      { key: 'revenue', label: 'Total revenue', value: k.totalRevenue, format: money, icon: DollarSign, tone: 'red', series: s.map((p) => p.revenue), sub: `${k.totalOrders} orders all-time` },
      { key: 'orders', label: 'Total orders', value: k.totalOrders, format: int, icon: ShoppingBag, tone: 'amber', series: s.map((p) => p.orders), sub: 'All orders ever placed' },
      { key: 'profit', label: 'Total gross profit', value: k.totalGrossProfit, format: money, icon: TrendingUp, tone: 'green', series: s.map((p) => p.grossProfit ?? 0), sub: `${k.grossMargin}% margin` },
      { key: 'margin', label: 'Gross margin', value: k.grossMargin, format: pct, icon: Percent, tone: 'violet', share: k.grossMargin / 100, sub: `Avg order: ${money(k.avgOrderValue)}` },
      { key: 'aov', label: 'Avg order value', value: k.avgOrderValue, format: money, icon: Receipt, tone: 'blue', sub: `${k.totalOrders} total orders` },
      deliveryCard,
    ];
  }

  if (view === 'week') {
    const s = d.weeklyRevenue;
    const margin = marginOf(k.thisWeekGrossProfit, k.thisWeekRevenue);
    return [
      { key: 'revenue', label: 'This week revenue', value: k.thisWeekRevenue, format: money, icon: DollarSign, tone: 'red', change: k.weekRevenueChange, series: s.map((p) => p.revenue), sub: `Last week: ${money(k.lastWeekRevenue)}` },
      { key: 'orders', label: 'This week orders', value: k.thisWeekOrders, format: int, icon: ShoppingBag, tone: 'amber', change: k.weekOrdersChange, series: s.map((p) => p.orders), sub: `Last week: ${k.lastWeekOrders} orders` },
      { key: 'profit', label: 'This week gross profit', value: k.thisWeekGrossProfit, format: money, icon: TrendingUp, tone: 'green', change: k.weekGPChange, series: s.map((p) => p.grossProfit ?? 0), sub: `Last week: ${money(k.lastWeekGrossProfit)}` },
      { key: 'margin', label: 'Gross margin', value: margin, format: pct, icon: Percent, tone: 'violet', share: margin / 100, sub: `Revenue: ${money(k.thisWeekRevenue)}` },
      { key: 'aov', label: 'Avg order value', value: k.thisWeekOrders > 0 ? k.thisWeekRevenue / k.thisWeekOrders : 0, format: money, icon: Receipt, tone: 'blue', sub: `${k.thisWeekOrders} orders this week` },
      deliveryCard,
    ];
  }

  if (view === 'month') {
    const s = d.dailyRevenue;
    const margin = marginOf(k.thisMonthGrossProfit, k.thisMonthRevenue);
    return [
      { key: 'revenue', label: 'This month revenue', value: k.thisMonthRevenue, format: money, icon: DollarSign, tone: 'red', change: k.revenueChange, series: s.map((p) => p.revenue), sub: `Last month: ${money(k.lastMonthRevenue)}` },
      { key: 'orders', label: 'This month orders', value: k.thisMonthOrders, format: int, icon: ShoppingBag, tone: 'amber', change: k.ordersChange, series: s.map((p) => p.orders), sub: `Last month: ${k.lastMonthOrders} orders` },
      { key: 'profit', label: 'This month gross profit', value: k.thisMonthGrossProfit, format: money, icon: TrendingUp, tone: 'green', change: k.monthGPChange, series: s.map((p) => p.grossProfit ?? 0), sub: `Last month: ${money(k.lastMonthGrossProfit)}` },
      { key: 'margin', label: 'Gross margin', value: margin, format: pct, icon: Percent, tone: 'violet', share: margin / 100, sub: `Revenue: ${money(k.thisMonthRevenue)}` },
      { key: 'aov', label: 'Avg order value', value: k.thisMonthOrders > 0 ? k.thisMonthRevenue / k.thisMonthOrders : 0, format: money, icon: Receipt, tone: 'blue', sub: `${k.thisMonthOrders} orders this month` },
      deliveryCard,
    ];
  }

  // year — the sparkline shows this year month by month, up to the current month.
  const s = d.monthlyRevenue.slice(0, month + 1);
  const margin = marginOf(k.thisYearGrossProfit, k.thisYearRevenue);
  return [
    { key: 'revenue', label: `${year} revenue`, value: k.thisYearRevenue, format: money, icon: DollarSign, tone: 'red', change: k.yearRevenueChange, series: s.map((p) => p.revenue), sub: `Last year: ${money(k.lastYearRevenue)}` },
    { key: 'orders', label: `${year} orders`, value: k.thisYearOrders, format: int, icon: ShoppingBag, tone: 'amber', change: k.yearOrdersChange, series: s.map((p) => p.orders), sub: `Last year: ${k.lastYearOrders} orders` },
    { key: 'profit', label: `${year} gross profit`, value: k.thisYearGrossProfit, format: money, icon: TrendingUp, tone: 'green', change: k.yearGPChange, series: s.map((p) => p.grossProfit ?? 0), sub: `Last year: ${money(k.lastYearGrossProfit)}` },
    { key: 'margin', label: 'Gross margin', value: margin, format: pct, icon: Percent, tone: 'violet', share: margin / 100, sub: `Revenue: ${money(k.thisYearRevenue)}` },
    { key: 'aov', label: 'Avg order value', value: k.thisYearOrders > 0 ? k.thisYearRevenue / k.thisYearOrders : 0, format: money, icon: Receipt, tone: 'blue', sub: `${k.thisYearOrders} orders this year` },
    deliveryCard,
  ];
}

function buildCustomKpis(c: CustomRangeKpis, from: string, to: string): KpiDef[] {
  return [
    { key: 'revenue', label: 'Revenue', value: c.totalRevenue, format: money, icon: DollarSign, tone: 'red', sub: `${c.totalOrders} orders in range` },
    { key: 'orders', label: 'Orders', value: c.totalOrders, format: int, icon: ShoppingBag, tone: 'amber', sub: `${from} – ${to}` },
    { key: 'profit', label: 'Gross profit', value: c.totalGrossProfit, format: money, icon: TrendingUp, tone: 'green', sub: `${c.grossMargin}% margin` },
    { key: 'margin', label: 'Gross margin', value: c.grossMargin, format: pct, icon: Percent, tone: 'violet', share: c.grossMargin / 100, sub: `Revenue: ${money(c.totalRevenue)}` },
    { key: 'aov', label: 'Avg order value', value: c.avgOrderValue, format: money, icon: Receipt, tone: 'blue', sub: `${c.totalOrders} orders` },
    { key: 'delivery', label: 'Delivery rate', value: c.deliveryRate, format: pct, icon: Truck, tone: 'teal', share: c.deliveryRate / 100, sub: 'Delivered vs total' },
  ];
}

interface RangeResult {
  key: string;
  data: CustomRangeKpis | null;
}

export function PerformanceOverview({ data }: { data: AnalyticsData }) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<GpView>('total');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [range, setRange] = useState<RangeResult | null>(null);

  const year = new Date().getFullYear();
  const validRange = !!from && !!to && from <= to;
  // Same trigger as before: fetch whenever the custom view is open with a valid from ≤ to.
  const rangeKey = view === 'custom' && validRange ? `${from}|${to}` : null;

  useEffect(() => {
    if (!rangeKey) return;
    let alive = true;
    const [f, t] = rangeKey.split('|');
    fetch(`/api/admin/analytics/range?from=${f}&to=${t}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: CustomRangeKpis) => {
        if (alive) setRange({ key: rangeKey, data: d });
      })
      .catch(() => {
        if (alive) setRange({ key: rangeKey, data: null });
      });
    return () => {
      alive = false;
    };
  }, [rangeKey]);

  const rangeLoading = rangeKey !== null && range?.key !== rangeKey;
  const rangeData = rangeKey !== null && range?.key === rangeKey ? range.data : null;
  const rangeFailed = rangeKey !== null && range?.key === rangeKey && range.data === null;

  const subtitle =
    view === 'total' ? 'All-time totals'
    : view === 'week' ? 'This week vs last week'
    : view === 'month' ? 'This month vs last month'
    : view === 'year' ? `${year} vs ${year - 1}`
    : validRange ? `${from} – ${to}`
    : 'Select a date range';

  let body: React.ReactNode;
  if (view !== 'custom') {
    body = <KpiGrid ariaLabel="Performance figures" items={buildKpis(view, data.kpis, data)} />;
  } else if (!from || !to || from > to) {
    body = (
      <Card className="grid place-items-center px-5 py-9 text-center">
        <span className="mb-2.5 grid size-11 place-items-center rounded-[14px] bg-adm-accent-soft text-adm-accent">
          <CalendarRange className="size-5" />
        </span>
        <b className="font-adm-display text-[15px] text-adm-ink">
          {!from || !to ? 'Pick a start and end date above.' : 'End date must be on or after start date.'}
        </b>
        <p className="mt-0.5 text-[13px] text-adm-muted">Revenue, profit and orders for the range show here.</p>
      </Card>
    );
  } else if (rangeLoading) {
    body = <KpiGridSkeleton />;
  } else if (rangeFailed || !rangeData) {
    body = (
      <Card className="px-5 py-6 text-center text-[13.5px] text-adm-muted">
        <b className="mb-0.5 block font-adm-display text-[15px] text-adm-ink">Couldn&apos;t load this range</b>
        Change a date to try again.
      </Card>
    );
  } else {
    body = <KpiGrid ariaLabel="Figures for the selected range" items={buildCustomKpis(rangeData, from, to)} />;
  }

  // Re-run the entrance animation whenever the figures change.
  const bodyKey = view === 'custom' ? `custom:${rangeKey ?? (from && to ? 'invalid' : 'empty')}:${rangeLoading ? 'l' : 'd'}` : view;

  return (
    <section aria-labelledby="adm-perf-title" className="mb-6">
      <SectionHeading
        id="adm-perf-title"
        title="Performance overview"
        description={subtitle}
        actions={<Segmented ariaLabel="Period" options={VIEW_OPTIONS} value={view} onChange={setView} />}
      />

      <AnimatePresence initial={false}>
        {view === 'custom' && (
          <motion.div
            key="range"
            initial={reduce ? false : { opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={reduce ? undefined : { opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="overflow-hidden"
          >
            <Card className="mb-3.5 flex flex-wrap items-end gap-3 px-4 py-3.5 sm:px-5">
              <div className="grid min-w-[140px] flex-1 gap-1.5 sm:max-w-[200px]">
                <Label htmlFor="adm-range-from">From</Label>
                <Input id="adm-range-from" type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
              </div>
              <div className="grid min-w-[140px] flex-1 gap-1.5 sm:max-w-[200px]">
                <Label htmlFor="adm-range-to">To</Label>
                <Input id="adm-range-to" type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} />
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setFrom('');
                  setTo('');
                }}
                disabled={!from && !to}
              >
                <X />
                Clear dates
              </Button>
              <p className="basis-full text-[12.5px] text-adm-muted sm:ml-auto sm:basis-auto sm:self-center">
                Updates as soon as both dates are set.
              </p>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div key={bodyKey}>{body}</div>
    </section>
  );
}
