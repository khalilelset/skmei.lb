'use client';

import Link from 'next/link';
import { XCircle, RefreshCw, Banknote, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function PaymentFailedPage() {
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
            <div className="absolute w-36 h-36 rounded-full border border-red-500/20" />
            <div className="absolute w-28 h-28 rounded-full border border-red-500/10" />
            <div className="absolute w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-xl shadow-red-500/30">
              <XCircle className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
          </div>

          <h1 className="text-4xl font-black text-white mb-3 tracking-tight">Payment Failed</h1>
          <p className="text-red-400 font-semibold mb-2">Your Whish payment could not be completed</p>
          <p className="text-white/50 text-sm leading-relaxed">
            No charge has been made. Retry with Whish or switch to Cash on Delivery — your order details are saved.
          </p>
        </motion.div>

        <div className="flex flex-col gap-3">
          {/* Primary: switch to COD */}
          <Link
            href="/store/checkout?resume=1&method=cod"
            className="inline-flex items-center justify-center gap-2 bg-brand-red text-white px-7 py-4 rounded-full font-bold hover:bg-brand-red-dark transition-all duration-300 shadow-lg shadow-brand-red/25 hover:scale-[1.02] active:scale-95 text-base"
          >
            <Banknote className="w-5 h-5" />
            Pay with Cash on Delivery
          </Link>

          {/* Secondary: retry Whish */}
          <Link
            href="/store/checkout?resume=1"
            className="inline-flex items-center justify-center gap-2 border border-white/20 text-white/70 px-7 py-3.5 rounded-full font-bold hover:bg-white/5 hover:text-white transition-all duration-300"
          >
            <RefreshCw className="w-4 h-4" />
            Retry Whish Payment
          </Link>

          {/* Tertiary: back to store */}
          <Link
            href="/store/products"
            className="inline-flex items-center justify-center gap-2 text-white/30 hover:text-white/60 transition-colors text-sm font-medium py-2"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Store
          </Link>
        </div>
      </div>
    </div>
  );
}
