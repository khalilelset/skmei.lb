'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { EASE, int } from './model';
import { InViewChart } from './parts';

export interface DonutSlice {
  key: string;
  label: string;
  value: number;
  color: string;
  /** Extra figure shown before the count, e.g. revenue. */
  extra?: string;
}

function DonutTooltip({ active, payload, total, unit }: { active?: boolean; payload?: ReadonlyArray<{ payload?: unknown }>; total: number; unit: string }) {
  if (!active || !payload?.length || !payload[0].payload) return null;
  const s = payload[0].payload as DonutSlice;
  const share = total > 0 ? ((s.value / total) * 100).toFixed(1) : '0.0';
  return (
    <div className="min-w-[128px] rounded-[10px] border border-adm-line bg-adm-surface px-2.5 py-2 text-xs shadow-adm-md">
      <div className="mb-0.5 flex items-center gap-1.5 font-semibold capitalize text-adm-ink">
        <span className="size-2 rounded-full" style={{ background: s.color }} />
        {s.label}
      </div>
      <div className="font-adm-display text-[19px] font-bold leading-tight tabular-nums text-adm-ink">{share}%</div>
      <div className="text-adm-muted">
        {int(s.value)} {unit}
      </div>
    </div>
  );
}

export function DonutCard({
  title,
  description,
  slices,
  unit,
  emptyText = 'No data yet',
}: {
  title: string;
  description: string;
  slices: DonutSlice[];
  unit: string;
  emptyText?: string;
}) {
  const reduce = useReducedMotion();
  const total = slices.reduce((a, s) => a + s.value, 0);
  return (
    <Card className="@container flex h-full flex-col">
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
      </CardHeader>
      {slices.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13.5px] text-adm-muted">{emptyText}</p>
      ) : (
        // Donut beside the legend only when the card itself is wide enough (container query).
        <div className="flex flex-col items-center gap-5 px-5 pb-5 pt-4 @md:flex-row @md:items-start">
          <div className="relative size-[156px] shrink-0">
            <InViewChart className="size-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={slices.map((s) => ({ ...s, fill: s.color }))}
                    dataKey="value"
                    nameKey="label"
                    innerRadius={52}
                    outerRadius={76}
                    paddingAngle={slices.length > 1 ? 2.5 : 0}
                    cornerRadius={4}
                    startAngle={90}
                    endAngle={-270}
                    stroke="none"
                    animationDuration={900}
                    animationEasing="ease-out"
                  />
                  <Tooltip content={(p) => <DonutTooltip active={p.active} payload={p.payload} total={total} unit={unit} />} />
                </PieChart>
              </ResponsiveContainer>
            </InViewChart>
            <div className="pointer-events-none absolute inset-0 grid place-items-center text-center">
              <div>
                <b className="block font-adm-display text-[24px] font-bold leading-none tracking-[-0.02em] tabular-nums text-adm-ink">{int(total)}</b>
                <span className="text-[11.5px] text-adm-muted">{unit}</span>
              </div>
            </div>
          </div>
          <ul className="w-full min-w-0 flex-1 space-y-3">
            {slices.map((s, i) => {
              const share = total > 0 ? s.value / total : 0;
              return (
                <li key={s.key}>
                  <div className="mb-1.5 flex items-center justify-between gap-3">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="size-[9px] shrink-0 rounded-full" style={{ background: s.color }} />
                      <span className="truncate text-[13.5px] font-semibold capitalize">{s.label}</span>
                    </span>
                    <span className="flex shrink-0 items-baseline gap-2.5 tabular-nums">
                      {s.extra && <span className="text-[12px] text-adm-muted">{s.extra}</span>}
                      <b className="min-w-6 text-right text-[13px] font-bold">{int(s.value)}</b>
                      <span className="w-9 text-right text-xs text-adm-muted">{(share * 100).toFixed(0)}%</span>
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full" style={{ background: `${s.color}1A` }}>
                    <motion.div
                      className="h-full origin-left rounded-full"
                      style={{ background: s.color, width: `${share * 100}%` }}
                      initial={reduce ? false : { scaleX: 0 }}
                      whileInView={{ scaleX: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.9, delay: 0.1 + i * 0.05, ease: EASE }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </Card>
  );
}
