'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { type DashboardStats, money, parseDay, pctChange } from './types';

const fmtShort = (date: string) => parseDay(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtLong = (date: string) => parseDay(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

function ChartTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const p = payload[0].payload as DashboardStats['daily'][number];
  return (
    <div className="min-w-[150px] rounded-[10px] border border-adm-line bg-adm-surface px-2.5 py-2 text-xs shadow-adm-md">
      <div className="mb-1 font-semibold text-adm-ink">{fmtLong(p.date)}</div>
      <div className="flex items-center gap-2 leading-[1.7] text-adm-muted">
        <span className="size-2 rounded-[2px] bg-adm-accent" />
        Revenue
        <b className="ml-auto font-semibold tabular-nums text-adm-ink">{money(p.revenue)}</b>
      </div>
      <div className="flex items-center gap-2 leading-[1.7] text-adm-muted">
        <span className="size-2 rounded-[2px] border-[1.5px] border-[#B3A7A9]" />
        Orders
        <b className="ml-auto font-semibold tabular-nums text-adm-ink">{p.orders}</b>
      </div>
    </div>
  );
}

export function RevenueChart({ stats }: { stats: DashboardStats }) {
  const data = stats.daily;
  const total = data.reduce((a, d) => a + d.revenue, 0);
  const orders = data.reduce((a, d) => a + d.orders, 0);
  const change = pctChange(total, stats.previous.revenue);
  const first = data[0]?.date;
  const last = data[data.length - 1]?.date;
  const ticks = data.length ? [0, 7, 14, 21, data.length - 1].map((i) => data[Math.min(i, data.length - 1)].date) : [];
  const peak = Math.max(0, ...data.map((d) => d.revenue));
  const yMax = Math.max(50, Math.ceil(peak / 50) * 50);
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((f) => Math.round(yMax * f));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Revenue</CardTitle>
          <CardDescription>{first && last ? `Last 30 days · ${fmtShort(first)} to ${fmtShort(last)}` : 'Last 30 days'}</CardDescription>
        </div>
        <div className="text-left sm:text-right">
          <div className="font-adm-display text-[22px] font-bold leading-tight tracking-[-0.02em] tabular-nums">{money(total)}</div>
          <div className="mt-0.5 whitespace-nowrap text-xs text-adm-muted">
            {change !== null && (
              <span className={`inline-flex items-center gap-0.5 font-semibold ${change >= 0 ? 'text-[#15803D]' : 'text-adm-accent-hover'}`}>
                {change >= 0 ? <ArrowUpRight className="size-3.5" strokeWidth={2.4} /> : <ArrowDownRight className="size-3.5" strokeWidth={2.4} />}
                {change >= 0 ? '+' : '−'}
                {Math.abs(change).toFixed(1)}%
              </span>
            )}{' '}
            {change !== null ? 'vs previous 30 days · ' : ''}
            {orders} {orders === 1 ? 'order' : 'orders'}
          </div>
        </div>
      </CardHeader>
      <div className="min-h-[260px] flex-1 px-2 pb-3 pt-3 sm:pr-4">
        <ResponsiveContainer width="100%" height="100%" minHeight={260}>
          <AreaChart data={data} margin={{ top: 8, right: 24, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="adm-rev-fill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor="#DC2626" stopOpacity={0.16} />
                <stop offset="1" stopColor="#DC2626" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#EFE9E7" />
            <XAxis
              dataKey="date"
              ticks={ticks}
              tickFormatter={fmtShort}
              tickLine={false}
              axisLine={{ stroke: '#E2D9D6' }}
              tick={{ fill: '#6F6567', fontSize: 11.5 }}
              interval={0}
              padding={{ left: 14, right: 4 }}
            />
            <YAxis
              tickFormatter={(v: number) => `$${v}`}
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#6F6567', fontSize: 11.5 }}
              width={48}
              allowDecimals={false}
              domain={[0, yMax]}
              ticks={yTicks}
            />
            <Tooltip
              content={(p) => <ChartTooltip active={p.active} payload={p.payload} />}
              cursor={{ stroke: '#CFC5C2', strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#DC2626"
              strokeWidth={2}
              fill="url(#adm-rev-fill)"
              activeDot={{ r: 4.5, fill: '#DC2626', stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1100}
              animationEasing="ease-out"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
