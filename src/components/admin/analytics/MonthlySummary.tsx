'use client';

import { Badge } from '@/components/admin/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table';
import { cn } from '@/lib/utils';
import { money, type ChartPoint } from './model';

export function MonthlySummary({ months }: { months: ChartPoint[] }) {
  const now = new Date().getMonth(); // current month index, for the highlight
  const rows = [...months].reverse();
  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="pb-3.5">
        <div>
          <CardTitle>Monthly summary</CardTitle>
          <CardDescription>{new Date().getFullYear()} breakdown</CardDescription>
        </div>
      </CardHeader>
      <Table>
        <TableHeader>
          <tr>
            <TableHead>Month</TableHead>
            <TableHead className="text-right">Revenue</TableHead>
            <TableHead className="text-right">Orders</TableHead>
            <TableHead className="hidden text-right sm:table-cell">Avg / order</TableHead>
          </tr>
        </TableHeader>
        <TableBody>
          {rows.map((row, i) => {
            const current = 11 - i === now;
            return (
              <TableRow key={row.label} className={cn(current && '[&>td]:bg-adm-accent-soft/60 hover:[&>td]:bg-adm-accent-soft')}>
                <TableCell className={cn('py-[9px]', current && 'font-bold text-adm-accent-hover')}>
                  {row.label}
                  {current && (
                    <Badge tone="red" className="ml-2 h-[18px] px-1.5 text-[10.5px]">
                      now
                    </Badge>
                  )}
                </TableCell>
                <TableCell className={cn('py-[9px] text-right font-semibold tabular-nums', row.revenue === 0 && 'font-normal text-adm-faint')}>
                  {money(row.revenue)}
                </TableCell>
                <TableCell className={cn('py-[9px] text-right tabular-nums', row.orders === 0 && 'text-adm-faint')}>{row.orders}</TableCell>
                <TableCell className="hidden py-[9px] text-right tabular-nums text-adm-muted sm:table-cell">
                  {row.orders > 0 ? money(row.revenue / row.orders) : '—'}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Card>
  );
}
