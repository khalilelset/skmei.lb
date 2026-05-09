'use client';

import { useState, useEffect } from 'react';
import ProductCard from './ProductCard';
import type { Product } from '@/types';

interface Props {
  type: 'featured' | 'sale' | 'newest';
  count?: number;
}

function filterProducts(all: Product[], type: Props['type'], count: number): Product[] {
  if (type === 'newest') return all.filter((p) => p.isNew).slice(0, count);
  if (type === 'featured') return all.filter((p) => p.isBestseller || p.isNew).slice(0, count);
  return all.filter((p) => p.onSale || (p.originalPrice && p.originalPrice > p.price)).slice(0, count);
}

export default function HomeProductGrid({ type, count = 8 }: Props) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/products')
      .then((r) => r.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? filterProducts(data, type, count) : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [type, count]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
        {[...Array(count)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden border border-brand-silver">
            <div className="relative aspect-square overflow-hidden">
              <div className="skeleton-shimmer absolute inset-0" />
            </div>
            <div className="p-3 sm:p-4 space-y-2.5">
              <div className="skeleton-shimmer h-3 w-14 rounded-full" />
              <div className="space-y-1.5">
                <div className="skeleton-shimmer h-4 w-full rounded" />
                <div className="skeleton-shimmer h-4 w-3/4 rounded" />
              </div>
              <div className="flex items-center gap-1 pt-0.5">
                {[...Array(5)].map((_, j) => (
                  <div key={j} className="skeleton-shimmer w-3 h-3 rounded-sm" />
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <div className="skeleton-shimmer h-5 w-20 rounded" />
                <div className="skeleton-shimmer h-4 w-12 rounded" />
              </div>
              <div className="skeleton-shimmer h-9 w-full rounded-lg lg:hidden" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
