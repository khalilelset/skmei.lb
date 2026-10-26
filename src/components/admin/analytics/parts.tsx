'use client';

import * as React from 'react';
import { useRef } from 'react';
import { ArrowDownRight, ArrowUpRight, type LucideIcon } from 'lucide-react';
import { motion, useInView, useReducedMotion } from 'framer-motion';
import { CountUp } from '@/components/admin/fx/CountUp';
import { Spotlight } from '@/components/admin/fx/Spotlight';
import { Sparkline } from '@/components/admin/fx/Sparkline';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { cn } from '@/lib/utils';
import { EASE, TONES, type ToneName } from './model';

// ─── KPI cards (same tinted look as the dashboard StatCards) ─────────────────
export interface KpiDef {
  key: string;
  label: string;
  /** Numbers count up; strings (e.g. a country code) render as-is. */
  value: number | string;
  format?: (n: number) => string;
  icon: LucideIcon;
  tone: ToneName;
  sub?: string;
  /** undefined = no pill; null = "No prior data"; number = % change vs the previous period. */
  change?: number | null;
  /** Small pill text, used when there is no change figure. */
  pill?: string;
  series?: number[];
  /** 0–1 share drawn as a meter (margins, rates). */
  share?: number;
}

function ChangePill({ value }: { value: number | null }) {
  if (value === null) {
    return (
      <span className="inline-flex h-[22px] items-center whitespace-nowrap rounded-full bg-white/80 px-2 text-[11px] font-semibold text-adm-muted">
        No prior data
      </span>
    );
  }
  const up = value >= 0;
  return (
    <span
      className="inline-flex h-[22px] items-center gap-0.5 whitespace-nowrap rounded-full bg-white/80 pl-1.5 pr-2 text-[11.5px] font-bold tabular-nums"
      style={{ color: up ? '#15803D' : '#B91C1C' }}
      title="Change vs the previous period"
    >
      {up ? <ArrowUpRight className="size-3.5" strokeWidth={2.4} /> : <ArrowDownRight className="size-3.5" strokeWidth={2.4} />}
      {up ? '+' : '−'}
      {Math.abs(value)}%
    </span>
  );
}

export function KpiCard({ kpi, index = 0 }: { kpi: KpiDef; index?: number }) {
  const reduce = useReducedMotion();
  const t = TONES[kpi.tone];
  const Icon = kpi.icon;
  const share = kpi.share === undefined ? null : Math.min(1, Math.max(0, kpi.share));
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: EASE }}
      whileHover={reduce ? undefined : { y: -3 }}
      className="min-w-0"
    >
      <Spotlight
        color={t.glow}
        className="flex h-full flex-col gap-0.5 rounded-[18px] px-4 pb-3.5 pt-4 shadow-[0_0_0_1px_rgba(70,30,32,.04),0_1px_2px_rgba(60,24,26,.04),0_8px_20px_-10px_rgba(60,24,26,.14)] transition-shadow hover:shadow-[0_0_0_1px_rgba(70,30,32,.05),0_2px_4px_rgba(60,24,26,.04),0_18px_32px_-14px_rgba(60,24,26,.22)]"
        style={{ background: t.tint }}
      >
        <div className="mb-2.5 flex items-center justify-between gap-2">
          <span
            className="grid size-[34px] shrink-0 place-items-center rounded-[11px] bg-white/85 shadow-[0_1px_2px_rgba(60,24,26,.06),0_0_0_1px_rgba(255,255,255,.9)]"
            style={{ color: t.tone }}
          >
            <Icon className="size-[18px]" strokeWidth={2} />
          </span>
          {kpi.change !== undefined ? (
            <ChangePill value={kpi.change} />
          ) : (
            kpi.pill && (
              <span className="inline-flex h-[22px] items-center rounded-full bg-white/80 px-2 text-[11.5px] font-bold tabular-nums" style={{ color: t.ink }}>
                {kpi.pill}
              </span>
            )
          )}
        </div>
        <div className="text-[13px] font-semibold leading-snug text-adm-ink-2">{kpi.label}</div>
        {typeof kpi.value === 'number' ? (
          <CountUp
            value={kpi.value}
            format={kpi.format ?? String}
            className="whitespace-nowrap font-adm-display text-[clamp(21px,5.6vw,27px)] font-bold leading-[1.15] tracking-[-0.025em] tabular-nums"
          />
        ) : (
          <span className="truncate font-adm-display text-[clamp(21px,5.6vw,27px)] font-bold capitalize leading-[1.15] tracking-[-0.025em]" title={kpi.value}>
            {kpi.value}
          </span>
        )}
        {kpi.series && kpi.series.length > 1 && <Sparkline data={kpi.series} color={t.tone} />}
        {share !== null && (
          <div aria-hidden className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/85">
            <motion.div
              className="h-full rounded-full"
              style={{ background: t.tone }}
              initial={reduce ? false : { width: 0 }}
              animate={{ width: `${Math.max(share * 100, share > 0 ? 3 : 0)}%` }}
              transition={{ duration: 1.1, delay: 0.15 + index * 0.05, ease: EASE }}
            />
          </div>
        )}
        {kpi.sub && <div className="mt-auto pt-1.5 text-[11.5px] leading-snug text-adm-muted">{kpi.sub}</div>}
      </Spotlight>
    </motion.div>
  );
}

export function KpiGrid({ items, ariaLabel, className }: { items: KpiDef[]; ariaLabel: string; className?: string }) {
  return (
    <section aria-label={ariaLabel} className={cn('grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3', className)}>
      {items.map((k, i) => (
        <KpiCard key={k.key} kpi={k} index={i} />
      ))}
    </section>
  );
}

export function KpiGridSkeleton({ count = 6, className }: { count?: number; className?: string }) {
  return (
    <div aria-hidden className={cn('grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-3', className)}>
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="rounded-[18px] bg-adm-surface p-4 shadow-adm-sm">
          <div className="mb-3 flex justify-between">
            <Skeleton className="size-[34px] rounded-[11px]" />
            <Skeleton className="h-[22px] w-14 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-2 h-7 w-32 max-w-full" />
          <Skeleton className="mt-3 h-3 w-28 max-w-full" />
        </div>
      ))}
    </div>
  );
}

// ─── Section heading (between cards, outside a Card) ─────────────────────────
export function SectionHeading({
  id,
  title,
  description,
  icon,
  actions,
  className,
}: {
  id?: string;
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-3.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-3', className)}>
      <div className="flex min-w-0 items-center gap-3">
        {icon && (
          <span className="grid size-[38px] shrink-0 place-items-center rounded-[12px] bg-adm-surface shadow-adm-sm [&_svg]:size-[18px]">{icon}</span>
        )}
        <div className="min-w-0">
          <h2 id={id} className="font-adm-display text-[19px] font-bold leading-tight tracking-[-0.015em] text-adm-ink">
            {title}
          </h2>
          {description && <p className="mt-0.5 text-[13px] text-adm-muted">{description}</p>}
        </div>
      </div>
      {actions && <div className="min-w-0 max-w-full">{actions}</div>}
    </div>
  );
}

// ─── Motion helpers ──────────────────────────────────────────────────────────
/** Fades a block up the first time it scrolls into view. */
export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const reduce = useReducedMotion();
  return (
    <motion.div
      className={cn('min-w-0', className)}
      initial={reduce ? false : { opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '0px 0px -40px 0px' }}
      transition={{ duration: 0.5, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

/** Mounts a chart only once it is on screen, so Recharts' draw-in animation is actually seen. */
export function InViewChart({ children, className, style }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '0px 0px -40px 0px' });
  return (
    <div ref={ref} className={cn('min-w-0', className)} style={style}>
      {inView ? children : null}
    </div>
  );
}

// ─── Chart tooltip card (matches the dashboard RevenueChart tooltip) ─────────
export function TooltipCard({ title, rows }: { title: React.ReactNode; rows: { label: string; value: React.ReactNode; swatch: React.ReactNode }[] }) {
  return (
    <div className="min-w-[160px] rounded-[10px] border border-adm-line bg-adm-surface px-2.5 py-2 text-xs shadow-adm-md">
      <div className="mb-1 font-semibold text-adm-ink">{title}</div>
      {rows.map((r) => (
        <div key={r.label} className="flex items-center gap-2 leading-[1.7] text-adm-muted">
          {r.swatch}
          {r.label}
          <b className="ml-auto pl-3 font-semibold tabular-nums text-adm-ink">{r.value}</b>
        </div>
      ))}
    </div>
  );
}

export function Swatch({ color, dashed, outline }: { color: string; dashed?: boolean; outline?: boolean }) {
  if (dashed) return <span className="h-0 w-2.5 shrink-0 border-t-2 border-dashed" style={{ borderColor: color }} />;
  if (outline) return <span className="size-2 shrink-0 rounded-[2px] border-[1.5px]" style={{ borderColor: color }} />;
  return <span className="size-2 shrink-0 rounded-[2px]" style={{ background: color }} />;
}

// ─── Ranked bar list (top products, countries, browsers) ─────────────────────
export function BarRow({
  label,
  title,
  value,
  extra,
  share,
  color,
  track,
  rank,
  rankHot,
  index = 0,
}: {
  label: React.ReactNode;
  title?: string;
  value: React.ReactNode;
  extra?: React.ReactNode;
  share: number;
  color: string;
  track: string;
  rank?: number;
  rankHot?: boolean;
  index?: number;
}) {
  const reduce = useReducedMotion();
  return (
    <li className="flex items-start gap-3">
      {rank !== undefined && (
        <span
          className={cn(
            'w-6 shrink-0 text-right font-adm-mono text-[11.5px] font-bold leading-5 tabular-nums',
            rankHot ? 'text-adm-accent' : 'text-adm-faint',
          )}
        >
          #{rank}
        </span>
      )}
      <div className="min-w-0 flex-1">
        <div className="mb-1.5 flex items-baseline justify-between gap-3 leading-5">
          <span className="min-w-0 truncate text-[13.5px] font-semibold text-adm-ink" title={title}>
            {label}
          </span>
          <span className="flex shrink-0 items-baseline gap-2.5 tabular-nums">
            <b className="text-[13px] font-bold text-adm-ink">{value}</b>
            {extra && <span className="text-[12.5px] text-adm-muted">{extra}</span>}
          </span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full" style={{ background: track }}>
          <motion.div
            className="h-full origin-left rounded-full"
            style={{ background: color, width: `${Math.max(0, Math.min(1, share)) * 100}%` }}
            initial={reduce ? false : { scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.9, delay: 0.05 + index * 0.04, ease: EASE }}
          />
        </div>
      </div>
    </li>
  );
}
