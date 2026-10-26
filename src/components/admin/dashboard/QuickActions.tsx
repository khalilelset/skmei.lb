'use client';

import Link from 'next/link';
import { ChevronRight, ShoppingBag, Ticket, Users, Watch } from 'lucide-react';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { cn } from '@/lib/utils';
import type { DashboardStats } from './types';

export function QuickActions({ stats }: { stats: DashboardStats }) {
  const pending = stats.statusCounts.pending ?? 0;
  const items = [
    {
      href: '/admin/orders',
      label: 'Orders',
      sub: pending ? `${pending} pending to confirm` : 'Nothing waiting to confirm',
      icon: ShoppingBag,
      iconStyle: 'bg-adm-accent text-white',
      primary: true,
    },
    { href: '/admin/products', label: 'Products', sub: `${stats.totalProducts} watches in the catalog`, icon: Watch, iconStyle: 'bg-[#E9F7F5] text-[#0F766E]' },
    { href: '/admin/customers', label: 'Customers', sub: `${stats.totalCustomers} people have ordered`, icon: Users, iconStyle: 'bg-[#EEF4FF] text-[#1D4ED8]' },
    { href: '/admin/coupons', label: 'Coupons', sub: 'Codes, brand limits and caps', icon: Ticket, iconStyle: 'bg-[#FFF6E5] text-[#B45309]' },
  ];
  return (
    <Card className="flex flex-col">
      <CardHeader>
        <div>
          <CardTitle>Quick actions</CardTitle>
          <CardDescription>Jump to the pages you use most</CardDescription>
        </div>
      </CardHeader>
      <div className="grid flex-1 auto-rows-fr gap-2.5 p-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <Link
              key={it.href}
              href={it.href}
              className={cn(
                'group flex items-center gap-3 rounded-[14px] px-3.5 py-3 transition-[background-color,box-shadow,transform] duration-300 ease-adm-spring hover:-translate-y-0.5',
                it.primary
                  ? 'bg-adm-accent-soft shadow-[inset_0_0_0_1px_#F8D5D0] hover:bg-[#FDE7E4]'
                  : 'bg-adm-surface-2 shadow-[inset_0_0_0_1px_var(--color-adm-line)] hover:bg-adm-surface hover:shadow-adm-md',
              )}
            >
              <span className={cn('grid size-[38px] shrink-0 place-items-center rounded-[11px]', it.iconStyle)}>
                <Icon className="size-[18px]" strokeWidth={2} />
              </span>
              <span className="min-w-0 flex-1">
                <b className="block text-sm font-semibold">{it.label}</b>
                <span className="block truncate text-[12.5px] text-adm-muted">{it.sub}</span>
              </span>
              <ChevronRight className="size-[18px] text-[#B3A7A9] transition-[transform,color] duration-300 ease-adm-spring group-hover:translate-x-[3px] group-hover:text-adm-accent" />
            </Link>
          );
        })}
      </div>
    </Card>
  );
}
