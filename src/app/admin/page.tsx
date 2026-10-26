'use client';

import { useCallback, useEffect, useState } from 'react';
import { RotateCw } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/admin/ui/button';
import { Card } from '@/components/admin/ui/card';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { StatCards, StatCardsSkeleton } from '@/components/admin/dashboard/StatCards';
import { RevenueChart } from '@/components/admin/dashboard/RevenueChart';
import { StatusCard } from '@/components/admin/dashboard/StatusCard';
import { RecentOrders } from '@/components/admin/dashboard/RecentOrders';
import { QuickActions } from '@/components/admin/dashboard/QuickActions';
import type { DashboardStats } from '@/components/admin/dashboard/types';

function todayLabel() {
  return new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', timeZone: 'Asia/Beirut' });
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [failed, setFailed] = useState(false);

  const fetchStats = useCallback(() => {
    fetch('/api/admin/stats')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then(setStats)
      .catch(() => setFailed(true));
  }, []);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  const load = () => {
    setFailed(false);
    fetchStats();
  };

  return (
    <>
      <PageHeader title="Dashboard" description={`Welcome back. Here's what's happening with your store today, ${todayLabel()}.`} />

      {failed && !stats && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <b className="font-adm-display text-[15px]">Couldn&apos;t load the dashboard</b>
            <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
          </div>
          <Button variant="outline" onClick={load}>
            <RotateCw />
            Try again
          </Button>
        </Card>
      )}

      {stats ? <StatCards stats={stats} /> : !failed && <StatCardsSkeleton />}

      <div className="mb-4 grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        {stats ? (
          <>
            <RevenueChart stats={stats} />
            <StatusCard stats={stats} />
          </>
        ) : (
          !failed && (
            <>
              <Skeleton className="h-[372px] rounded-[18px] bg-adm-surface" />
              <Skeleton className="h-[372px] rounded-[18px] bg-adm-surface" />
            </>
          )
        )}
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(0,1fr)]">
        {stats ? (
          <>
            <RecentOrders stats={stats} />
            <QuickActions stats={stats} />
          </>
        ) : (
          !failed && (
            <>
              <Skeleton className="h-[380px] rounded-[18px] bg-adm-surface" />
              <Skeleton className="h-[380px] rounded-[18px] bg-adm-surface" />
            </>
          )
        )}
      </div>
    </>
  );
}
