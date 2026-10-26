'use client';

import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { CHART, money, type RegionPoint } from './model';
import { InViewChart, Swatch, TooltipCard } from './parts';

const shorten = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1)}…` : s);

function RegionTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const r = payload[0].payload as RegionPoint;
  return (
    <TooltipCard
      title={r.region}
      rows={[
        { label: 'Orders', value: r.count, swatch: <Swatch color={CHART.red} /> },
        { label: 'Revenue', value: money(r.revenue), swatch: <Swatch color="#B3A7A9" outline /> },
      ]}
    />
  );
}

export function RegionChart({ regions }: { regions: RegionPoint[] }) {
  const height = Math.max(150, regions.length * 36 + 16);
  return (
    <Card className="flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>Orders by region</CardTitle>
          <CardDescription>Top 10 delivery areas</CardDescription>
        </div>
      </CardHeader>
      {regions.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13.5px] text-adm-muted">No orders yet</p>
      ) : (
        <InViewChart className="px-2 pb-3 pt-3 sm:pr-4" style={{ height: height + 24 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regions} layout="vertical" margin={{ top: 0, right: 34, bottom: 0, left: 4 }} barCategoryGap={8}>
              <defs>
                <linearGradient id="adm-an-region" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor={CHART.red} stopOpacity={0.55} />
                  <stop offset="1" stopColor={CHART.red} stopOpacity={0.9} />
                </linearGradient>
              </defs>
              <CartesianGrid horizontal={false} stroke={CHART.grid} />
              <XAxis type="number" allowDecimals={false} tickLine={false} axisLine={false} tick={{ fill: CHART.tick, fontSize: 11 }} />
              <YAxis
                type="category"
                dataKey="region"
                width={104}
                tickLine={false}
                axisLine={false}
                interval={0}
                tick={{ fill: '#3D3436', fontSize: 12.5, fontWeight: 500 }}
                tickFormatter={(v: string) => shorten(v, 15)}
              />
              <Tooltip content={(p) => <RegionTooltip active={p.active} payload={p.payload} />} cursor={{ fill: 'rgba(220,38,38,.05)' }} />
              <Bar dataKey="count" name="Orders" fill="url(#adm-an-region)" radius={[0, 6, 6, 0]} maxBarSize={22} animationDuration={900}>
                <LabelList dataKey="count" position="right" offset={8} style={{ fill: '#3D3436', fontSize: 12, fontWeight: 700 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </InViewChart>
      )}
    </Card>
  );
}
