'use client';

import { useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Badge } from '@/components/admin/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { Segmented } from '@/components/admin/ui/segmented';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table';
import { cn } from '@/lib/utils';
import { EASE, int, money, type OrderProfitPoint, type UnitProfitPoint } from './model';

type ProfitView = 'unit' | 'all' | 'website';

const OPTIONS: { value: ProfitView; label: string }[] = [
  { value: 'unit', label: 'Per unit' },
  { value: 'all', label: 'All orders' },
  { value: 'website', label: 'Website orders' },
];

const SUBTITLE: Record<ProfitView, string> = {
  unit: 'Gross profit per unit sold — current prices',
  all: 'Total gross profit generated across all orders',
  website: 'Total gross profit from website orders only',
};

const MotionRow = motion.create(TableRow);

function RankCell({ i }: { i: number }) {
  return (
    <TableCell className={cn('w-12 text-center font-adm-mono text-[12px] font-bold tabular-nums', i < 3 ? 'text-adm-accent' : 'text-adm-faint')}>
      {i + 1}
    </TableCell>
  );
}

function ProductCell({ name, fullName, category }: { name: string; fullName: string; category: string }) {
  return (
    <TableCell className="max-w-[260px]">
      <div className="truncate font-semibold text-adm-ink" title={fullName}>
        {name}
      </div>
      <div className="text-[11.5px] capitalize text-adm-muted">{category}</div>
    </TableCell>
  );
}

export function ProfitabilityCard({
  unit,
  all,
  website,
}: {
  unit: UnitProfitPoint[];
  all: OrderProfitPoint[];
  website: OrderProfitPoint[];
}) {
  const reduce = useReducedMotion();
  const [view, setView] = useState<ProfitView>('unit');
  const rowAnim = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.4, delay: 0.03 * i, ease: EASE },
        };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3.5">
        <div>
          <CardTitle>Product profitability</CardTitle>
          <CardDescription>{SUBTITLE[view]}</CardDescription>
        </div>
        <Segmented ariaLabel="Profit view" options={OPTIONS} value={view} onChange={setView} />
      </CardHeader>

      {view === 'unit' ? (
        <Table key="unit" className="min-w-[640px]">
          <TableHeader>
            <tr>
              <TableHead className="text-center">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">My cost</TableHead>
              <TableHead className="text-right">Sale price</TableHead>
              <TableHead className="text-right">Profit / unit</TableHead>
              <TableHead className="text-right">Margin</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {unit.length === 0 && (
              <TableEmpty colSpan={6} title="No profit data yet">
                No products with cost price set. Add cost prices to your products to see profitability.
              </TableEmpty>
            )}
            {unit.map((p, i) => (
              <MotionRow key={`${p.fullName}-${i}`} {...rowAnim(i)}>
                <RankCell i={i} />
                <ProductCell name={p.name} fullName={p.fullName} category={p.category} />
                <TableCell className="text-right tabular-nums text-adm-muted">{money(p.costPrice)}</TableCell>
                <TableCell className="text-right tabular-nums">{money(p.salePrice)}</TableCell>
                <TableCell className="text-right font-bold tabular-nums text-[#15803D]">+{money(p.unitProfit)}</TableCell>
                <TableCell className="text-right">
                  <Badge tone="green" className="h-[22px] px-2 tabular-nums">
                    {p.margin}%
                  </Badge>
                </TableCell>
              </MotionRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <Table key={view} className="min-w-[560px]">
          <TableHeader>
            <tr>
              <TableHead className="text-center">#</TableHead>
              <TableHead>Product</TableHead>
              <TableHead className="text-right">Units sold</TableHead>
              <TableHead className="text-right">Revenue</TableHead>
              <TableHead className="text-right">Gross profit</TableHead>
            </tr>
          </TableHeader>
          <TableBody>
            {(view === 'all' ? all : website).length === 0 && (
              <TableEmpty colSpan={5} title="No profit data yet">
                No gross profit data yet. Make sure products have cost prices set.
              </TableEmpty>
            )}
            {(view === 'all' ? all : website).map((p, i) => (
              <MotionRow key={`${p.fullName}-${i}`} {...rowAnim(i)}>
                <RankCell i={i} />
                <ProductCell name={p.name} fullName={p.fullName} category={p.category} />
                <TableCell className="text-right tabular-nums">{int(p.quantity)}</TableCell>
                <TableCell className="text-right tabular-nums text-adm-muted">{money(p.revenue)}</TableCell>
                <TableCell className="text-right font-bold tabular-nums text-[#15803D]">{money(p.grossProfit)}</TableCell>
              </MotionRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Card>
  );
}
