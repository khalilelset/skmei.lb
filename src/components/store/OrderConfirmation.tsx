'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import {
  CheckCircle2, ShoppingBag, Truck, Banknote, ShieldCheck,
  Package, Calendar, User, Phone, Mail, MapPin, Clock, Wallet,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export interface PlacedOrder {
  orderId: string;
  orderNumber: number | null;
  customerName: string;
  phone: string;
  email: string;
  street: string;
  area: string;
  city: string;
  notes: string;
  items: { name: string; price: number; quantity: number; image: string | null }[];
  subtotal: number;
  shipping: number;
  discountAmount: number;
  couponCode: string | null;
  total: number;
  placedAt: string;
  paymentMethod?: string;
}

export function OrderConfirmation({ order }: { order: PlacedOrder }) {
  const isWhish = order.paymentMethod === 'whish';

  return (
    <div className="min-h-screen bg-brand-black py-8 px-4">
      <div className="max-w-2xl mx-auto">

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="text-center mb-8"
        >
          <div className="relative w-36 h-36 mx-auto mb-5 flex items-center justify-center">
            <div className="absolute w-36 h-36 rounded-full border border-brand-red/20" />
            <div className="absolute w-28 h-28 rounded-full border border-brand-red/10" />
            <div className="absolute w-20 h-20 bg-brand-red rounded-full flex items-center justify-center shadow-xl shadow-brand-red/30">
              <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            <div className="absolute w-36 h-36 rounded-full border border-brand-red/30 animate-ping" style={{ animationIterationCount: 2 }} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">Order Confirmed!</h1>
          <p className="text-brand-red font-semibold mb-1">Your watch is on its way</p>
          <p className="text-white/45 text-sm">
            Thank you, <span className="font-bold text-white">{order.customerName.split(' ')[0]}</span>! Your order has been received.
          </p>
          <div className="mt-5 h-0.5 max-w-xs mx-auto bg-brand-silver rounded-full overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="h-full bg-brand-red origin-left"
            />
          </div>
        </motion.div>

        <div className="bg-brand-black rounded-2xl p-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Order Number</p>
            <p className="text-3xl font-black text-white tracking-wide">
              {order.orderNumber ? `SK-${order.orderNumber}` : `SK-${order.orderId.replace(/-/g, '').slice(0, 8).toUpperCase()}`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Calendar className="w-4 h-4 text-brand-red shrink-0" />
            <span>{new Date(order.placedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Truck, title: 'Delivery', sub: '3–5 days' },
            { icon: isWhish ? Wallet : Banknote, title: 'Payment', sub: isWhish ? 'Paid via Whish' : 'Cash on delivery' },
            { icon: ShieldCheck, title: 'Warranty', sub: '1-year included' },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="bg-white/5 rounded-xl pt-0 border border-white/8 text-center overflow-hidden">
              <div className="h-0.5 bg-brand-red" />
              <div className="p-4">
                <div className="w-9 h-9 bg-brand-red/10 rounded-lg flex items-center justify-center mx-auto mb-2 border border-brand-red/20">
                  <Icon className="w-5 h-5 text-brand-red" />
                </div>
                <p className="text-xs font-bold text-white">{title}</p>
                <p className="text-xs text-white/40 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="bg-white/5 rounded-2xl border border-white/8 overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-red" />
            <h2 className="font-bold text-white">
              Items Ordered <span className="text-white/40 font-normal">({order.items.length})</span>
            </h2>
          </div>
          <div className="divide-y divide-white/8">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="relative w-16 h-16 shrink-0">
                  <div className="absolute inset-0 rounded-xl overflow-hidden bg-white/8 border border-white/12">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-white/30" />
                      </div>
                    )}
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow z-10">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm leading-snug line-clamp-2">{item.name}</p>
                  <p className="text-xs text-white/40 mt-0.5">{formatPrice(item.price)} × {item.quantity}</p>
                </div>
                <p className="font-bold text-white text-sm shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          <div className="px-5 py-4 bg-white/3 border-t border-white/8 space-y-2">
            <div className="flex justify-between text-sm text-white/45">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/45">
              <span>Shipping</span>
              <span className={order.shipping === 0 ? 'text-brand-red font-semibold' : ''}>
                {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-brand-red font-medium">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                <span>-{formatPrice(order.discountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-white text-base pt-2 border-t border-white/10">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white/5 rounded-2xl border border-white/8 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-brand-red" />
              <h3 className="font-bold text-white text-sm">Contact Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <span className="font-medium text-white">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-white/30 shrink-0" />
                <span className="text-white/55">{order.phone}</span>
              </div>
              {order.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3.5 h-3.5 text-white/30 shrink-0" />
                  <span className="text-white/55">{order.email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/8 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-brand-red" />
              <h3 className="font-bold text-white text-sm">Delivery Address</h3>
            </div>
            <div className="space-y-1.5 text-sm text-white/55">
              <p className="font-medium text-white">{order.area}{order.city && order.city !== order.area ? `, ${order.city}` : ''}</p>
              {order.street && <p>{order.street}</p>}
              <p>Lebanon</p>
            </div>
            {order.notes && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs font-semibold text-white/35 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-white/55">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <Clock className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
          <p className="text-sm text-white/55 leading-relaxed">
            We will contact you at{' '}
            <span className="font-bold text-white">{order.phone}</span>{' '}
            {isWhish ? 'to arrange delivery.' : 'shortly to confirm your order and arrange delivery.'}
          </p>
        </div>

        <div className="text-center">
          <Link
            href="/store/products"
            className="inline-flex items-center gap-2 bg-brand-red text-white px-8 py-3.5 rounded-full font-bold hover:bg-brand-red-dark transition-all duration-300 shadow-lg shadow-brand-red/25 hover:scale-[1.02] active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
}
