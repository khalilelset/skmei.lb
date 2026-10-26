'use client';

import { DollarSign, ShoppingBag, TrendingUp, Users, Watch, type LucideIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import { CountUp } from '@/components/admin/fx/CountUp';
import { Spotlight } from '@/components/admin/fx/Spotlight';
import { Sparkline } from '@/components/admin/fx/Sparkline';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { cn } from '@/lib/utils';
import { type DashboardStats, int, money, pctChange } from './types';

interface StatDef {
  key: string;
  label: string;
  value: number;
  format: (n: number) => string;
  icon: LucideIcon;
  tone: string;
  toneInk: string;
  tint: string;
  glow: string;
  series: number[];
  delta: string | null;
  negative: boolean;
  foot: string;
}

function pctLabel(p: number | null) {
  if (p === null) return null;
  return `${p >= 0 ? '+' : '−'}${Math.abs(p).toFixed(1)}%`;
}

export function buildStats(s: DashboardStats): StatDef[] {
  const sum = (key: 'revenue' | 'orders' | 'profit') => s.daily.reduce((a, d) => a + d[key], 0);
  const revP = pctChange(sum('revenue'), s.previous.revenue);
  const profP = pctChange(sum('profit'), s.previous.profit);
  const ordP = pctChange(sum('orders'), s.previous.orders);
  const margin = s.totalRevenue > 0 ? (s.totalGrossProfit / s.totalRevenue) * 100 : 0;
  return [
    {
      key: 'revenue', label: 'Total revenue', value: s.totalRevenue, format: money, icon: DollarSign,
      tone: '#DC2626', toneInk: '#B91C1C', tint: '#FFF1EF', glow: 'rgba(220,38,38,.14)',
      series: s.daily.map((d) => d.revenue), delta: pctLabel(revP), negative: (revP ?? 0) < 0,
      foot: 'Last 30 days vs the 30 before',
    },
    {
      key: 'profit', label: 'Gross profit', value: s.totalGrossProfit, format: money, icon: TrendingUp,
      tone: '#16A34A', toneInk: '#15803D', tint: '#ECFAF1', glow: 'rgba(22,163,74,.14)',
      series: s.daily.map((d) => d.profit), delta: pctLabel(profP), negative: (profP ?? 0) < 0,
      foot: `${margin.toFixed(0)}% margin overall`,
    },
    {
      key: 'orders', label: 'Total orders', value: s.totalOrders, format: int, icon: ShoppingBag,
      tone: '#D97706', toneInk: '#B45309', tint: '#FFF6E5', glow: 'rgba(217,119,6,.15)',
      series: s.daily.map((d) => d.orders), delta: pctLabel(ordP), negative: (ordP ?? 0) < 0,
      foot: 'Last 30 days vs the 30 before',
    },
    {
      key: 'customers', label: 'Total customers', value: s.totalCustomers, format: int, icon: Users,
      tone: '#2563EB', toneInk: '#1D4ED8', tint: '#EEF4FF', glow: 'rgba(37,99,235,.13)',
      series: s.customersWeekly, delta: `+${s.newCustomers30}`, negative: false,
      foot: 'New in the last 30 days',
    },
    {
      key: 'products', label: 'Total products', value: s.totalProducts, format: int, icon: Watch,
      tone: '#0F766E', toneInk: '#0F766E', tint: '#E9F7F5', glow: 'rgba(15,118,110,.14)',
      series: s.productsWeekly, delta: `+${s.newProducts30}`, negative: false,
      foot: 'Added in the last 30 days',
    },
  ];
}

const gridClass =
  'mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-6 xl:grid-cols-5 [&>*:last-child]:col-span-2 lg:[&>*]:col-span-2 lg:[&>*:nth-child(n+4)]:col-span-3 xl:[&>*]:!col-span-1';

export function StatCards({ stats }: { stats: DashboardStats }) {
  return (
    <section aria-label="Store totals" className={gridClass}>
      {buildStats(stats).map((st, i) => {
        const Icon = st.icon;
        return (
          <motion.div
            key={st.key}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.05, ease: [0.2, 0.8, 0.2, 1] }}
            whileHover={{ y: -3 }}
          >
            <Spotlight
              color={st.glow}
              className="flex h-full flex-col gap-0.5 rounded-[18px] px-4 pb-3.5 pt-4 shadow-[0_0_0_1px_rgba(70,30,32,.04),0_1px_2px_rgba(60,24,26,.04),0_8px_20px_-10px_rgba(60,24,26,.14)] transition-shadow hover:shadow-[0_0_0_1px_rgba(70,30,32,.05),0_2px_4px_rgba(60,24,26,.04),0_18px_32px_-14px_rgba(60,24,26,.22)]"
              style={{ background: st.tint }}
            >
              <div className="mb-2.5 flex items-center justify-between gap-2">
                <span
                  className="grid size-[34px] place-items-center rounded-[11px] bg-white/85 shadow-[0_1px_2px_rgba(60,24,26,.06),0_0_0_1px_rgba(255,255,255,.9)]"
                  style={{ color: st.tone }}
                >
                  <Icon className="size-[18px]" strokeWidth={2} />
                </span>
                {st.delta && (
                  <span
                    className={cn('inline-flex h-[22px] items-center rounded-full bg-white/80 px-2 text-[11.5px] font-bold tabular-nums')}
                    style={{ color: st.negative ? '#B91C1C' : st.toneInk }}
                  >
                    {st.delta}
                  </span>
                )}
              </div>
              <div className="text-[13px] font-semibold text-adm-ink-2">{st.label}</div>
              <CountUp
                value={st.value}
                format={st.format}
                className="whitespace-nowrap font-adm-display text-[clamp(21px,5.6vw,27px)] font-bold leading-[1.15] tracking-[-0.025em] tabular-nums"
              />
              <Sparkline data={st.series} color={st.tone} />
              <div className="mt-1.5 text-[11.5px] text-adm-muted">{st.foot}</div>
            </Spotlight>
          </motion.div>
        );
      })}
    </section>
  );
}

export function StatCardsSkeleton() {
  return (
    <div className={gridClass}>
      {Array.from({ length: 5 }, (_, i) => (
        <div key={i} className="rounded-[18px] bg-adm-surface p-4 shadow-adm-sm">
          <div className="mb-3 flex justify-between">
            <Skeleton className="size-[34px] rounded-[11px]" />
            <Skeleton className="h-[22px] w-14 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-2 h-7 w-32" />
          <Skeleton className="mt-3 h-[34px] w-full" />
          <Skeleton className="mt-2 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}
