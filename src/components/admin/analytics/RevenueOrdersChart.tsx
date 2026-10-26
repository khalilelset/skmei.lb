'use client';

import { useState } from 'react';
import { Area, Bar, CartesianGrid, ComposedChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Segmented } from '@/components/admin/ui/segmented';
import { CHART, fmtK, money, niceScale, type AnalyticsData, type ChartPoint } from './model';
import { InViewChart, Swatch, TooltipCard } from './parts';

type ChartView = 'annual' | 'monthly' | 'weekly' | 'daily';

const VIEWS: { value: ChartView; label: string }[] = [
  { value: 'annual', label: 'Annual' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'daily', label: 'Daily' },
];

function tooltipTitle(view: ChartView, label: string) {
  const now = new Date();
  if (view === 'monthly') return `${label} ${now.getFullYear()}`;
  if (view === 'weekly') return `Week of ${label}`;
  if (view === 'daily') return `${now.toLocaleString('en-US', { month: 'long' })} ${label}`;
  return label;
}

function RevenueTooltip({ view, active, payload }: { view: ChartView; active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const p = payload[0].payload as ChartPoint;
  return (
    <TooltipCard
      title={tooltipTitle(view, p.label)}
      rows={[
        { label: 'Revenue', value: money(p.revenue), swatch: <Swatch color={CHART.red} /> },
        { label: 'Gross profit', value: money(p.grossProfit ?? 0), swatch: <Swatch color={CHART.green} dashed /> },
        { label: 'Orders', value: p.orders, swatch: <Swatch color="#E9A23B" /> },
      ]}
    />
  );
}

export function RevenueOrdersChart({ data }: { data: AnalyticsData }) {
  const [view, setView] = useState<ChartView>('monthly');
  const now = new Date();

  const points: ChartPoint[] =
    view === 'annual' ? data.annualRevenue
    : view === 'monthly' ? data.monthlyRevenue
    : view === 'weekly' ? data.weeklyRevenue
    : data.dailyRevenue;

  const sub =
    view === 'annual' ? 'All-time by year'
    : view === 'monthly' ? `Jan – Dec ${now.getFullYear()}`
    : view === 'weekly' ? 'Last 12 weeks'
    : `${now.toLocaleString('en-US', { month: 'long' })} ${now.getFullYear()}`;

  const peak = Math.max(0, ...points.map((p) => Math.max(p.revenue, p.grossProfit ?? 0)));
  const y = niceScale(peak);
  const maxOrders = Math.max(0, ...points.map((p) => p.orders));
  // Keep the order bars in the lower part of the plot so the revenue line stays readable.
  const ordersMax = Math.max(4, Math.ceil(maxOrders * 1.6));

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Revenue &amp; orders</CardTitle>
          <CardDescription>{sub}</CardDescription>
        </div>
        <Segmented ariaLabel="Chart period" options={VIEWS} value={view} onChange={setView} />
      </CardHeader>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 px-5 pt-3 text-[12.5px] font-medium text-adm-muted">
        <span className="inline-flex items-center gap-1.5">
          <Swatch color={CHART.red} />
          Revenue
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Swatch color={CHART.green} dashed />
          Gross profit
        </span>
        <span className="inline-flex items-center gap-1.5">
          <Swatch color="#E9A23B" />
          Orders <span className="text-adm-faint">(right axis)</span>
        </span>
      </div>
      <InViewChart className="h-[250px] px-1 pb-3 pt-2 sm:h-[320px] sm:px-2 sm:pr-3">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart key={view} data={points} margin={{ top: 10, right: 2, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="adm-an-rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={CHART.red} stopOpacity={0.16} />
                <stop offset="1" stopColor={CHART.red} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="adm-an-gp" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0" stopColor={CHART.green} stopOpacity={0.1} />
                <stop offset="1" stopColor={CHART.green} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke={CHART.grid} yAxisId="rev" />
            <XAxis
              dataKey="label"
              tickLine={false}
              axisLine={{ stroke: CHART.axis }}
              tick={{ fill: CHART.tick, fontSize: 11.5 }}
              interval="preserveStartEnd"
              minTickGap={view === 'daily' ? 6 : 12}
              padding={{ left: 8, right: 8 }}
            />
            <YAxis
              yAxisId="rev"
              tickFormatter={fmtK}
              tickLine={false}
              axisLine={false}
              tick={{ fill: CHART.tick, fontSize: 11.5 }}
              width={50}
              domain={[0, y.max]}
              ticks={y.ticks}
            />
            <YAxis
              yAxisId="ord"
              orientation="right"
              tickLine={false}
              axisLine={false}
              tick={{ fill: '#A39698', fontSize: 11 }}
              width={26}
              allowDecimals={false}
              domain={[0, ordersMax]}
            />
            <Tooltip
              content={(p) => <RevenueTooltip view={view} active={p.active} payload={p.payload} />}
              cursor={{ fill: 'rgba(220,38,38,.04)' }}
            />
            <Bar
              yAxisId="ord"
              dataKey="orders"
              name="Orders"
              fill={CHART.ordersBar}
              fillOpacity={0.75}
              radius={[4, 4, 0, 0]}
              maxBarSize={18}
              animationDuration={900}
            />
            <Area
              yAxisId="rev"
              type="monotone"
              dataKey="grossProfit"
              name="Gross profit"
              stroke={CHART.green}
              strokeWidth={1.75}
              strokeDasharray="5 4"
              fill="url(#adm-an-gp)"
              dot={false}
              activeDot={{ r: 4, fill: CHART.green, stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1100}
              animationEasing="ease-out"
            />
            <Area
              yAxisId="rev"
              type="monotone"
              dataKey="revenue"
              name="Revenue"
              stroke={CHART.red}
              strokeWidth={2}
              fill="url(#adm-an-rev)"
              dot={points.length <= 3 ? { r: 3, fill: CHART.red, stroke: '#fff', strokeWidth: 1.5 } : false}
              activeDot={{ r: 4.5, fill: CHART.red, stroke: '#fff', strokeWidth: 2 }}
              animationDuration={1100}
              animationEasing="ease-out"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </InViewChart>
    </Card>
  );
}
