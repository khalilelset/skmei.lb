'use client';

import { useEffect, useState } from 'react';
import { Eye, Globe, MonitorSmartphone, MousePointerClick, RotateCw, SearchX, Sun } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Button } from '@/components/admin/ui/button';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Segmented } from '@/components/admin/ui/segmented';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table';
import { CHART, PALETTE, VS_PERIODS, int, parseDay, type VisitorStats, type VsPeriod } from './model';
import { DonutCard } from './DonutCard';
import { BarRow, InViewChart, KpiCard, Reveal, SectionHeading, Swatch, TooltipCard, type KpiDef } from './parts';

const shortDay = (d: string) => parseDay(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const longDay = (d: string) => parseDay(d).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

function VisitsTooltip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }> }) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const p = payload[0].payload as VisitorStats['daily'][number];
  return <TooltipCard title={longDay(p.date)} rows={[{ label: 'Page visits', value: int(p.pageviews), swatch: <Swatch color={CHART.blue} /> }]} />;
}

function RankedList({ title, rows, color, track }: { title: string; rows: { key: string; count: number }[]; color: string; track: string }) {
  const top = rows.slice(0, 8);
  const max = rows[0]?.count ?? 1;
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>
            Top {top.length} of {rows.length}
          </CardDescription>
        </div>
      </CardHeader>
      <ul className="space-y-3 px-5 pb-5 pt-4">
        {top.map((r, i) => (
          <BarRow key={r.key} index={i} label={r.key} value={int(r.count)} share={r.count / max} color={color} track={track} />
        ))}
      </ul>
    </Card>
  );
}

function VisitorSkeleton() {
  return (
    <div aria-hidden>
      <div className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="rounded-[18px] bg-adm-surface p-4 shadow-adm-sm">
            <Skeleton className="mb-3 size-[34px] rounded-[11px]" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="mt-2 h-7 w-20" />
          </div>
        ))}
      </div>
      <Skeleton className="h-[300px] rounded-[18px] bg-adm-surface" />
    </div>
  );
}

export function VisitorAnalytics() {
  const [period, setPeriod] = useState<VsPeriod>('last_30_days');
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<{ key: string; data: VisitorStats | null } | null>(null);
  const reqKey = `${period}#${attempt}`;

  useEffect(() => {
    let alive = true;
    const key = `${period}#${attempt}`;
    fetch(`/api/admin/analytics/visitors?period=${period}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: VisitorStats) => {
        if (alive) setResult({ key, data: d });
      })
      .catch(() => {
        if (alive) setResult({ key, data: null });
      });
    return () => {
      alive = false;
    };
  }, [period, attempt]);

  const loading = result?.key !== reqKey;
  const data = loading ? null : result.data;
  const periodLabel = VS_PERIODS.find((p) => p.value === period)?.label ?? 'Last 30 days';

  let body: React.ReactNode;
  if (loading) {
    body = (
      <>
        <p className="sr-only" role="status">
          Loading visitor data…
        </p>
        <VisitorSkeleton />
      </>
    );
  } else if (!data) {
    body = (
      <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        <div>
          <b className="font-adm-display text-[15px] text-adm-ink">Couldn&apos;t load visitor data</b>
          <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
        </div>
        <Button variant="outline" onClick={() => setAttempt((a) => a + 1)}>
          <RotateCw />
          Try again
        </Button>
      </Card>
    );
  } else if (data.total === 0) {
    body = (
      <Card className="flex items-center gap-4 px-5 py-6">
        <span className="grid size-11 shrink-0 place-items-center rounded-[14px] bg-[#EEF4FF] text-[#2563EB]">
          <SearchX className="size-5" />
        </span>
        <div>
          <b className="block font-adm-display text-[15px] text-adm-ink">No visits for this period</b>
          <p className="text-[13px] text-adm-muted">
            No page views recorded for <strong className="text-adm-ink-2">{periodLabel}</strong>. Try a wider period or check that the site is deployed.
          </p>
        </div>
      </Card>
    );
  } else {
    const { total, todayVisits, daily, countries, devices, browsers, pages } = data;
    const maxPv = Math.max(...daily.map((d) => d.pageviews), 1);
    const deviceTotal = devices.reduce((a, d) => a + d.count, 0);
    // Shares use the same totals as the breakdown cards (rows without geo/device data are excluded).
    const countryTotal = countries.reduce((a, c) => a + c.count, 0);
    const kpis: KpiDef[] = [
      { key: 'visits', label: `Page visits · ${periodLabel}`, value: total, format: int, icon: Eye, tone: 'blue', series: daily.map((d) => d.pageviews) },
      { key: 'today', label: "Today's visits", value: todayVisits, format: int, icon: Sun, tone: 'teal' },
      {
        key: 'country', label: 'Top country', value: countries[0]?.key ?? '—', icon: Globe, tone: 'violet',
        ...(countries[0] && countryTotal ? { share: countries[0].count / countryTotal, pill: `${Math.round((countries[0].count / countryTotal) * 100)}%` } : {}),
      },
      {
        key: 'device', label: 'Top device', value: devices[0]?.key ?? '—', icon: MonitorSmartphone, tone: 'green',
        ...(devices[0] && deviceTotal ? { share: devices[0].count / deviceTotal, pill: `${Math.round((devices[0].count / deviceTotal) * 100)}%` } : {}),
      },
    ];

    body = (
      <>
        <section aria-label="Visitor figures" className="mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
          {kpis.map((k, i) => (
            <KpiCard key={k.key} kpi={k} index={i} />
          ))}
        </section>

        <Reveal className="mb-4">
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Page visits</CardTitle>
                <CardDescription>Visits per day — {periodLabel}</CardDescription>
              </div>
              <div className="text-left sm:text-right">
                <div className="font-adm-display text-[22px] font-bold leading-tight tracking-[-0.02em] tabular-nums">{int(total)}</div>
                <div className="mt-0.5 text-xs text-adm-muted">page visits</div>
              </div>
            </CardHeader>
            <InViewChart className="h-[240px] px-1 pb-3 pt-3 sm:h-[260px] sm:px-2 sm:pr-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={daily} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="adm-an-visits" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0" stopColor={CHART.blue} stopOpacity={0.16} />
                      <stop offset="1" stopColor={CHART.blue} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid vertical={false} stroke={CHART.grid} />
                  <XAxis
                    dataKey="date"
                    tickFormatter={shortDay}
                    tickLine={false}
                    axisLine={{ stroke: CHART.axis }}
                    tick={{ fill: CHART.tick, fontSize: 11.5 }}
                    interval={daily.length <= 7 ? 0 : 'preserveStartEnd'}
                    minTickGap={14}
                    padding={{ left: 10, right: 4 }}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: CHART.tick, fontSize: 11.5 }}
                    width={36}
                    allowDecimals={false}
                    domain={[0, maxPv + 1]}
                  />
                  <Tooltip content={(p) => <VisitsTooltip active={p.active} payload={p.payload} />} cursor={{ stroke: '#CFC5C2', strokeDasharray: '3 3' }} />
                  <Area
                    type="monotone"
                    dataKey="pageviews"
                    name="Page visits"
                    stroke={CHART.blue}
                    strokeWidth={2}
                    fill="url(#adm-an-visits)"
                    dot={daily.length <= 7 ? { r: 3, fill: CHART.blue, stroke: '#fff', strokeWidth: 1.5 } : false}
                    activeDot={{ r: 4.5, fill: CHART.blue, stroke: '#fff', strokeWidth: 2 }}
                    animationDuration={1100}
                    animationEasing="ease-out"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </InViewChart>
          </Card>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {countries.length > 0 && (
            <Reveal>
              <RankedList title="Countries" rows={countries} color={CHART.blue} track="#E8EFFD" />
            </Reveal>
          )}
          {devices.length > 0 && (
            <Reveal delay={0.05}>
              <DonutCard
                title="Devices"
                description={`${int(deviceTotal)} visits by device type`}
                unit="visits"
                slices={devices.map((d, i) => ({ key: d.key, label: d.key, value: d.count, color: PALETTE[i % PALETTE.length] }))}
              />
            </Reveal>
          )}
          {browsers.length > 0 && (
            <Reveal delay={0.1}>
              <RankedList title="Browsers" rows={browsers} color={CHART.green} track="#E4F5EA" />
            </Reveal>
          )}
          {pages.length > 0 && (
            <Reveal className="md:col-span-2 xl:col-span-3">
              <Card className="overflow-hidden">
                <CardHeader className="pb-3.5">
                  <div>
                    <CardTitle>Top pages</CardTitle>
                    <CardDescription>Most visited pages — {periodLabel}</CardDescription>
                  </div>
                </CardHeader>
                <Table>
                  <TableHeader>
                    <tr>
                      <TableHead>Page</TableHead>
                      <TableHead className="text-right">Visits</TableHead>
                    </tr>
                  </TableHeader>
                  <TableBody>
                    {pages.map((r) => (
                      <TableRow key={r.key}>
                        <TableCell className="py-[9px]">
                          <span className="flex min-w-0 items-center gap-2">
                            <MousePointerClick className="size-3.5 shrink-0 text-adm-faint" />
                            <span className="block max-w-[58vw] truncate font-adm-mono text-[12.5px] text-adm-ink-2 sm:max-w-[640px]" title={r.key}>
                              {r.key}
                            </span>
                          </span>
                        </TableCell>
                        <TableCell className="py-[9px] text-right font-semibold tabular-nums">{int(r.count)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Card>
            </Reveal>
          )}
        </div>
      </>
    );
  }

  return (
    <section aria-labelledby="adm-visitors-title" className="mt-8">
      <SectionHeading
        id="adm-visitors-title"
        title="Visitor analytics"
        description="Page views on the storefront"
        icon={<Globe className="text-[#2563EB]" />}
        actions={
          <Segmented
            ariaLabel="Visitor period"
            options={VS_PERIODS}
            value={period}
            onChange={setPeriod}
          />
        }
      />
      <div key={loading ? 'loading' : reqKey}>{body}</div>
    </section>
  );
}
