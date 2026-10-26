'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table';
import { StatusBadge } from '@/components/admin/status';
import { type DashboardStats, money } from './types';

const AVATAR_COLORS = [
  ['#FDE8E4', '#9F2D20'],
  ['#E6F0FF', '#1E4FB8'],
  ['#E4F5EA', '#1F7A43'],
  ['#FFF0D9', '#93560A'],
  ['#F1EBFF', '#5B32B4'],
  ['#E3F4F2', '#0F6B63'],
];

export function avatarStyle(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  const [bg, fg] = AVATAR_COLORS[h % AVATAR_COLORS.length];
  return { background: bg, color: fg };
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';
}

const MotionRow = motion.create(TableRow);

export function RecentOrders({ stats }: { stats: DashboardStats }) {
  const router = useRouter();
  const open = (id: string) => router.push(`/admin/orders?open=${encodeURIComponent(id)}`);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3.5">
        <div>
          <CardTitle>Recent orders</CardTitle>
          <CardDescription>Latest orders from your store</CardDescription>
        </div>
        <Link
          href="/admin/orders"
          className="group inline-flex items-center gap-1.5 rounded-[8px] px-2 py-1.5 text-[13px] font-semibold text-adm-accent-hover transition-colors hover:bg-adm-accent-soft"
        >
          View all orders
          <ArrowRight className="size-[15px] transition-transform duration-300 ease-adm-spring group-hover:translate-x-[3px]" />
        </Link>
      </CardHeader>
      <Table className="min-w-[560px]">
        <TableHeader>
          <tr>
            <TableHead>Order</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead className="text-right">Total</TableHead>
            <TableHead>Status</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {stats.recentOrders.length === 0 && <TableEmpty colSpan={5} title="No orders yet" />}
          {stats.recentOrders.map((o, i) => {
            const d = new Date(o.createdAt);
            return (
              <MotionRow
                key={o.id}
                data-clickable="true"
                tabIndex={0}
                aria-label={`Open order ${o.orderNumber}`}
                onClick={() => open(o.id)}
                onKeyDown={(e: React.KeyboardEvent) => {
                  if (e.key === 'Enter') open(o.id);
                }}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 + i * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
              >
                <TableCell>
                  <span className="font-adm-mono text-[12.5px] font-semibold tracking-[-0.01em] text-adm-accent-hover">{o.orderNumber}</span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2.5">
                    <span className="grid size-[30px] shrink-0 place-items-center rounded-full text-[11px] font-bold tracking-[.02em]" style={avatarStyle(o.customerName ?? '')}>
                      {initials(o.customerName ?? '')}
                    </span>
                    <span className="font-semibold">{o.customerName}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <div>{d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</div>
                  <div className="text-xs text-adm-muted">{d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}</div>
                </TableCell>
                <TableCell className="text-right font-bold tabular-nums">{money(o.total)}</TableCell>
                <TableCell>
                  <StatusBadge status={o.status} />
                </TableCell>
              </MotionRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
