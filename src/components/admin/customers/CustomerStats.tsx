'use client';

import { DollarSign, ShoppingBag, UserRoundCheck, Users, type LucideIcon } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { CountUp } from '@/components/admin/fx/CountUp';
import { Spotlight } from '@/components/admin/fx/Spotlight';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { formatPrice } from '@/lib/utils';
import { customerSince, type Customer } from './model';

const EASE = [0.2, 0.8, 0.2, 1] as const;
const int = (n: number) => Math.round(n).toLocaleString('en-US');
const DAY = 86_400_000;

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
  pill: string | null;
  /** 0–1 share of all customers, drawn as a bar. */
  share: number | null;
  foot: string;
}

export function buildCustomerStats(customers: Customer[], now: number): StatDef[] {
  const total = customers.length;
  const withAccount = customers.filter((c) => c.hasAccount).length;
  const orderOnly = customers.filter((c) => !c.hasAccount && c.orderCount > 0).length;
  const accountNoOrders = customers.filter((c) => c.hasAccount && c.orderCount === 0).length;
  const repeat = customers.filter((c) => c.orderCount > 1).length;
  const orders = customers.reduce((s, c) => s + c.orderCount, 0);
  const revenue = customers.reduce((s, c) => s + c.totalSpent, 0);
  const new30 = customers.filter((c) => {
    const since = customerSince(c);
    return since !== null && now - new Date(since).getTime() <= 30 * DAY;
  }).length;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return [
    {
      key: 'total', label: 'Total customers', value: total, format: int, icon: Users,
      tone: '#2563EB', toneInk: '#1D4ED8', tint: '#EEF4FF', glow: 'rgba(37,99,235,.13)',
      pill: `+${new30}`, share: null, foot: 'New in the last 30 days',
    },
    {
      key: 'account', label: 'Have an account', value: withAccount, format: int, icon: UserRoundCheck,
      tone: '#7C3AED', toneInk: '#6D28D9', tint: '#F4EFFF', glow: 'rgba(124,58,237,.13)',
      pill: `${pct(withAccount)}%`, share: total ? withAccount / total : 0,
      foot: accountNoOrders ? `${accountNoOrders} haven't ordered yet` : 'All of them have ordered',
    },
    {
      key: 'order-only', label: 'Order only', value: orderOnly, format: int, icon: ShoppingBag,
      tone: '#D97706', toneInk: '#B45309', tint: '#FFF6E5', glow: 'rgba(217,119,6,.15)',
      pill: `${pct(orderOnly)}%`, share: total ? orderOnly / total : 0, foot: 'Ordered without an account',
    },
    {
      key: 'revenue', label: 'Total revenue', value: revenue, format: formatPrice, icon: DollarSign,
      tone: '#DC2626', toneInk: '#B91C1C', tint: '#FFF1EF', glow: 'rgba(220,38,38,.14)',
      pill: null, share: null,
      foot: `${int(orders)} ${orders === 1 ? 'order' : 'orders'} · ${repeat} repeat ${repeat === 1 ? 'customer' : 'customers'}`,
    },
  ];
}

const gridClass = 'mb-4 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4';

export function CustomerStats({ customers, now }: { customers: Customer[]; now: number }) {
  const reduce = useReducedMotion();
  return (
    <section aria-label="Customer totals" className={gridClass}>
      {buildCustomerStats(customers, now).map((st, i) => {
        const Icon = st.icon;
        return (
          <motion.div
            key={st.key}
            initial={reduce ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: i * 0.05, ease: EASE }}
            whileHover={reduce ? undefined : { y: -3 }}
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
                {st.pill && (
                  <span className="inline-flex h-[22px] items-center rounded-full bg-white/80 px-2 text-[11.5px] font-bold tabular-nums" style={{ color: st.toneInk }}>
                    {st.pill}
                  </span>
                )}
              </div>
              <div className="text-[13px] font-semibold text-adm-ink-2">{st.label}</div>
              <CountUp
                value={st.value}
                format={st.format}
                className="whitespace-nowrap font-adm-display text-[clamp(21px,5.6vw,27px)] font-bold leading-[1.15] tracking-[-0.025em] tabular-nums"
              />
              {st.share !== null && (
                <div aria-hidden className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-white/85">
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: st.tone }}
                    initial={reduce ? false : { width: 0 }}
                    animate={{ width: `${Math.max(st.share * 100, st.share > 0 ? 3 : 0)}%` }}
                    transition={{ duration: 1.1, delay: 0.15 + i * 0.05, ease: EASE }}
                  />
                </div>
              )}
              <div className="mt-auto pt-1.5 text-[11.5px] text-adm-muted">{st.foot}</div>
            </Spotlight>
          </motion.div>
        );
      })}
    </section>
  );
}

export function CustomerStatsSkeleton() {
  return (
    <div className={gridClass} aria-hidden>
      {Array.from({ length: 4 }, (_, i) => (
        <div key={i} className="rounded-[18px] bg-adm-surface p-4 shadow-adm-sm">
          <div className="mb-3 flex justify-between">
            <Skeleton className="size-[34px] rounded-[11px]" />
            <Skeleton className="h-[22px] w-12 rounded-full" />
          </div>
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="mt-2 h-7 w-20" />
          <Skeleton className="mt-3 h-3 w-28" />
        </div>
      ))}
    </div>
  );
}
