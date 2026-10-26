'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { ORDER_STATUS, ORDER_STATUSES } from '@/components/admin/status';
import type { DashboardStats } from './types';

export function StatusCard({ stats }: { stats: DashboardStats }) {
  const counts = stats.statusCounts;
  const total = ORDER_STATUSES.reduce((a, s) => a + (counts[s] ?? 0), 0);
  const open = (counts.pending ?? 0) + (counts.confirmed ?? 0) + (counts.processing ?? 0) + (counts.shipped ?? 0);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Orders by status</CardTitle>
          <CardDescription>All time · {total.toLocaleString('en-US')} orders</CardDescription>
        </div>
      </CardHeader>
      <div className="flex items-baseline gap-2 px-5 pt-3.5">
        <b className="font-adm-display text-[30px] font-bold leading-none tracking-[-0.02em] tabular-nums">{open}</b>
        <span className="text-[13px] text-adm-muted">open {open === 1 ? 'order needs' : 'orders need'} your attention</span>
      </div>
      <div className="mx-5 mb-2 mt-3.5 flex h-2.5 gap-[3px]" role="img" aria-label="Order status distribution">
        {ORDER_STATUSES.filter((s) => (counts[s] ?? 0) > 0).map((s, i) => (
          <motion.i
            key={s}
            className="block h-full min-w-1.5 origin-left rounded-full"
            style={{ flex: `${counts[s]} 1 0`, background: ORDER_STATUS[s].dot }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.9, delay: i * 0.06, ease: [0.2, 0.8, 0.2, 1] }}
          />
        ))}
      </div>
      <ul className="px-2.5 pb-3 pt-1">
        {ORDER_STATUSES.map((s) => {
          const n = counts[s] ?? 0;
          const pct = total ? (n / total) * 100 : 0;
          const cfg = ORDER_STATUS[s];
          return (
            <li key={s}>
              <Link
                href={`/admin/orders?status=${s}`}
                className="grid w-full grid-cols-[auto_1fr_auto_auto] items-center gap-2.5 rounded-[10px] px-2.5 py-2 transition-colors hover:bg-adm-surface-2"
              >
                <span className="size-[9px] rounded-full" style={{ background: cfg.dot }} />
                <span>
                  <span className="text-[13.5px] font-semibold">{cfg.label}</span>
                  {cfg.hint && n > 0 && <span className="ml-1.5 text-xs font-medium text-adm-muted">{cfg.hint}</span>}
                </span>
                <span className="font-bold tabular-nums">{n.toLocaleString('en-US')}</span>
                <span className="w-11 text-right text-xs tabular-nums text-adm-muted">
                  {pct > 0 && pct < 1 ? pct.toFixed(1) : Math.round(pct)}%
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Card>
  );
}
