'use client';

import { Suspense } from 'react';
import { OrdersFallback, OrdersView } from '@/components/admin/orders/OrdersView';

// OrdersView reads ?status=, ?q= and ?open= (useSearchParams), which needs a Suspense boundary.
export default function OrdersPage() {
  return (
    <Suspense fallback={<OrdersFallback />}>
      <OrdersView />
    </Suspense>
  );
}
