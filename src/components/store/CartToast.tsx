'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, X, Check } from 'lucide-react';
import { useToastStore, CartToastData } from '@/store/toastStore';
import { formatPrice } from '@/lib/utils';

const DURATION = 3500;

function ToastItem({ toast, onDismiss }: { toast: CartToastData; onDismiss: () => void }) {
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    // Trigger enter animation
    const enterTimer = setTimeout(() => setVisible(true), 10);

    // Shrink progress bar
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      const remaining = Math.max(0, 100 - (elapsed / DURATION) * 100);
      setProgress(remaining);
      if (remaining === 0) clearInterval(interval);
    }, 30);

    return () => {
      clearTimeout(enterTimer);
      clearInterval(interval);
    };
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(onDismiss, 350);
  };

  return (
    <div
      className={`relative w-80 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden transition-all duration-350 ease-out ${
        visible
          ? 'opacity-100 translate-x-0 scale-100'
          : 'opacity-0 translate-x-full scale-95'
      }`}
      style={{ transitionDuration: '350ms' }}
    >
      {/* Top accent */}
      <div className="h-1 bg-gradient-to-r from-brand-red to-red-400" />

      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
              <Check className="w-3.5 h-3.5 text-white" strokeWidth={3} />
            </div>
            <span className="text-sm font-bold text-gray-900">Added to Cart!</span>
          </div>
          <button
            onClick={handleDismiss}
            className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
          >
            <X className="w-3 h-3 text-gray-500" />
          </button>
        </div>

        {/* Product */}
        <div className="flex items-center gap-3 mb-3">
          <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 flex-shrink-0">
            {toast.productImage ? (
              <Image
                src={toast.productImage}
                alt={toast.productName}
                fill
                className="object-cover"
                sizes="56px"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <ShoppingCart className="w-5 h-5 text-gray-300" />
              </div>
            )}
            {toast.quantity > 1 && (
              <span className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-brand-red text-white text-[9px] font-bold rounded-full flex items-center justify-center leading-none px-1">
                ×{toast.quantity}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
              {toast.productName}
            </p>
            <p className="text-sm font-bold text-brand-red mt-0.5">
              {formatPrice(toast.productPrice)}
            </p>
          </div>
        </div>

        {/* View Cart CTA */}
        <Link
          href="/store/cart"
          onClick={handleDismiss}
          className="flex items-center justify-center gap-2 w-full bg-brand-red hover:bg-red-700 text-white text-sm font-semibold py-2.5 rounded-xl transition-colors active:scale-95"
        >
          <ShoppingCart className="w-4 h-4" />
          View Cart
        </Link>
      </div>

      {/* Progress bar */}
      <div className="h-0.5 bg-gray-100">
        <div
          className="h-full bg-brand-red transition-none"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

export default function CartToast() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-20 right-4 lg:bottom-6 lg:right-6 z-[9999] flex flex-col gap-3 items-end pointer-events-none">
      {toasts.map((toast) => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onDismiss={() => dismiss(toast.id)} />
        </div>
      ))}
    </div>
  );
}
