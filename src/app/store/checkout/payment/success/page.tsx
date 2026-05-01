'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag } from 'lucide-react';
import { motion } from 'framer-motion';

function SuccessContent() {
  const searchParams = useSearchParams();
  const orderId      = searchParams.get('orderId');
  const { clearCart } = useCartStore();
  const cleared = useRef(false);

  useEffect(() => {
    if (!cleared.current) {
      clearCart();
      cleared.current = true;
    }
  }, [clearCart]);

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
            <div
              className="absolute w-36 h-36 rounded-full border border-brand-red/30 animate-ping"
              style={{ animationIterationCount: 2 }}
            />
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
