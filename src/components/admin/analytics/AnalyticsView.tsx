'use client';

import { useCallback, useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/admin/ui/button';
import { Card } from '@/components/admin/ui/card';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { ORDER_STATUS, isOrderStatus } from '@/components/admin/status';
import { DonutCard } from './DonutCard';
import { MonthlySummary } from './MonthlySummary';
import { PerformanceOverview } from './PerformanceOverview';
import { ProfitabilityCard } from './ProfitabilityCard';
import { RegionChart } from './RegionChart';
import { RevenueOrdersChart } from './RevenueOrdersChart';
import { TopProducts } from './TopProducts';
import { VisitorAnalytics } from './VisitorAnalytics';
import { PALETTE, int, money, type AnalyticsData } from './model';
import { KpiGridSkeleton, Reveal } from './parts';

// Beirut time so the server render and the browser agree on the date.
function todayLabel() {
  return new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'Asia/Beirut' });
}

function PageSkeleton() {
  return (
    <div aria-hidden>
      <div className="mb-3.5 flex flex-wrap items-end justify-between gap-3">
        <div>
          <Skeleton className="h-5 w-48" />
          <Skeleton className="mt-2 h-3.5 w-28" />
        </div>
        <Skeleton className="h-10 w-[440px] max-w-full rounded-[12px]" />
      </div>
      <KpiGridSkeleton className="mb-6" />
      <Skeleton className="mb-4 h-[420px] rounded-[18px] bg-adm-surface" />
      <div className="grid gap-4 lg:grid-cols-2">
        <Skeleton className="h-[300px] rounded-[18px] bg-adm-surface" />
        <Skeleton className="h-[300px] rounded-[18px] bg-adm-surface" />
      </div>
    </div>
  );
}

export function AnalyticsView() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [failed, setFailed] = useState(false);

  const fetchData = useCallback(() => {
    fetch('/api/admin/analytics')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: AnalyticsData) => setData(d))
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const retry = () => {
    setFailed(false);
    fetchData();
  };

  const catTotal = data ? data.categoryBreakdown.reduce((s, c) => s + c.count, 0) : 0;
  const statusTotal = data ? data.statusBreakdown.reduce((s, c) => s + c.count, 0) : 0;

  return (
    <>
      <PageHeader title="Analytics" description={<span suppressHydrationWarning>{todayLabel()}</span>} />

      {failed && !data && (
        <Card className="mb-6 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <b className="font-adm-display text-[15px] text-adm-accent-hover">Failed to load analytics</b>
            <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
          </div>
          <Button variant="outline" onClick={retry}>
            <RotateCw />
            Try again
          </Button>
        </Card>
      )}

      {!data && !failed && <PageSkeleton />}

      {data && (
        <>
          <PerformanceOverview data={data} />

          <Reveal className="mb-4">
            <RevenueOrdersChart data={data} />
          </Reveal>

          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <Reveal>
              <DonutCard
                title="Sales by category"
                description={`${int(catTotal)} units total`}
                unit="units"
                slices={data.categoryBreakdown.map((c, i) => ({
                  key: c.category,
                  label: c.category,
                  value: c.count,
                  extra: money(c.revenue),
                  color: PALETTE[i % PALETTE.length],
                }))}
              />
            </Reveal>
            <Reveal delay={0.05}>
              <DonutCard
                title="Order status"
                description={`${int(statusTotal)} orders total`}
                unit="orders"
                slices={data.statusBreakdown.map((s, i) => ({
                  key: s.status,
                  label: isOrderStatus(s.status) ? ORDER_STATUS[s.status].label : s.status.replace(/_/g, ' '),
                  value: s.count,
                  color: isOrderStatus(s.status) ? ORDER_STATUS[s.status].dot : PALETTE[i % PALETTE.length],
                }))}
              />
            </Reveal>
          </div>

          <div className="mb-4 grid gap-4 lg:grid-cols-2">
            <Reveal>
              <TopProducts products={data.topProducts} />
            </Reveal>
            <Reveal delay={0.05}>
              <MonthlySummary months={data.monthlyRevenue} />
            </Reveal>
          </div>

          <Reveal className="mb-4">
            <RegionChart regions={data.regionBreakdown} />
          </Reveal>

          <Reveal>
            <ProfitabilityCard unit={data.productUnitProfit} all={data.productOrderProfit} website={data.productWebsiteProfit} />
          </Reveal>
        </>
      )}

      <VisitorAnalytics />
    </>
  );
}
