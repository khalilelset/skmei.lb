'use client';

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/admin/ui/card';
import { money, type ProductPoint } from './model';
import { BarRow } from './parts';

export function TopProducts({ products }: { products: ProductPoint[] }) {
  const maxQty = Math.max(...products.map((p) => p.quantity), 1);
  return (
    <Card className="h-full">
      <CardHeader>
        <div>
          <CardTitle>Top 10 products</CardTitle>
          <CardDescription>Ranked by units sold</CardDescription>
        </div>
      </CardHeader>
      {products.length === 0 ? (
        <p className="px-5 py-10 text-center text-[13.5px] text-adm-muted">No products sold yet</p>
      ) : (
        <ol className="space-y-3.5 px-5 pb-5 pt-4">
          {products.map((p, i) => (
            <BarRow
              key={`${p.fullName}-${i}`}
              index={i}
              rank={i + 1}
              rankHot={i < 3}
              label={p.name}
              title={p.fullName}
              value={`${p.quantity} ${p.quantity === 1 ? 'unit' : 'units'}`}
              extra={<span className="hidden sm:inline">{money(p.revenue)}</span>}
              share={p.quantity / maxQty}
              color={i < 3 ? '#DC2626' : '#F0A39B'}
              track="#FBEDEB"
            />
          ))}
        </ol>
      )}
    </Card>
  );
}
