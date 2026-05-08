'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { OrderConfirmation, PlacedOrder } from '@/components/store/OrderConfirmation';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

function SuccessContent() {
  const searchParams  = useSearchParams();
  const orderId       = searchParams.get('orderId');
  const { clearCart } = useCartStore();
  const cleared       = useRef(false);
  const [order, setOrder]     = useState<PlacedOrder | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!cleared.current) {
      clearCart();
      localStorage.removeItem('skmei-pending-checkout');
      cleared.current = true;
    }
  }, [clearCart]);

  useEffect(() => {
    if (!orderId) { setLoading(false); return; }
    fetch(`/api/orders/${orderId}`)
      .then((r) => r.json())
      .then((json) => {
        const data = json.order;
        if (!data) return;
        const addr  = (data.address as Record<string, string>) ?? {};
        const items = ((data.items ?? []) as Record<string, unknown>[]).map((item) => ({
          name:     String(item.name ?? item.product_name ?? ''),
          price:    Number(item.price ?? 0),
          quantity: Number(item.quantity ?? 1),
          image:    item.image ? String(item.image) : null,
        }));
        setOrder({
          orderId:       data.id,
          orderNumber:   data.order_number ?? null,
          customerName:  data.customer_name ?? '',
          phone:         data.customer_phone ?? '',
          email:         data.customer_email ?? '',
          street:        addr.street ?? '',
          area:          addr.area   ?? '',
          city:          addr.city   ?? '',
          notes:         data.notes  ?? '',
          items,
          subtotal:      Number(data.subtotal ?? 0),
          shipping:      Number(data.shipping ?? 0),
          discountAmount: Number(data.discount ?? 0),
          couponCode:    data.coupon_code ?? null,
          total:         Number(data.total ?? 0),
          placedAt:      data.created_at ?? new Date().toISOString(),
          paymentMethod: data.payment_method ?? 'whish',
        });
      })
      .catch(() => { /* show fallback */ })
      .finally(() => setLoading(false));
  }, [orderId]);

  if (loading) return <div className="min-h-screen bg-brand-black" />;

  if (order) return <OrderConfirmation order={order} />;

  // Fallback when order fetch failed
  return (
    <div className="min-h-screen bg-brand-black flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="mb-10"
        >
          <div className="relative w-36 h-36 mx-auto mb-6 flex items-center justify-center">
            <div className="absolute w-36 h-36 rounded-full border border-brand-red/20" />
            <div className="absolute w-28 h-28 rounded-full border border-brand-red/10" />
            <div className="absolute w-20 h-20 bg-brand-red rounded-full flex items-center justify-center shadow-xl shadow-brand-red/30">
              <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute w-36 h-36 rounded-full border border-brand-red/30 animate-ping" style={{ animationIterationCount: 2 }} />
          </div>
          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Payment Confirmed!</h1>
          <p className="text-brand-red font-semibold mb-2">Your Whish payment was successful</p>
          <p className="text-white/50 text-sm leading-relaxed">
            Thank you for your purchase. Your order has been confirmed and will be processed shortly.
          </p>
          {orderId && (
            <p className="text-white/35 text-xs mt-3 font-mono">
              Ref: {orderId.replace(/-/g, '').slice(0, 12).toUpperCase()}
            </p>
          )}
          <div className="mt-6 h-0.5 max-w-xs mx-auto bg-brand-silver rounded-full overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="h-full bg-brand-red origin-left"
            />
          </div>
        </motion.div>
        <Link
          href="/store/products"
          className="inline-flex items-center gap-2 bg-brand-red text-white px-8 py-3.5 rounded-full font-bold hover:bg-brand-red-dark transition-all duration-300 shadow-lg shadow-brand-red/25 hover:scale-[1.02] active:scale-95"
        >
          <ShoppingBag className="w-5 h-5" />
          Continue Shopping
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-brand-black" />}>
      <SuccessContent />
    </Suspense>
  );
}
