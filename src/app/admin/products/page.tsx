import { Suspense } from 'react';
import { ProductsSkeleton, ProductsView } from '@/components/admin/products/ProductsView';

// ProductsView reads ?q= (the ⌘K "Search products" link), so it needs a Suspense boundary.
export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsSkeleton />}>
      <ProductsView />
    </Suspense>
  );
}
