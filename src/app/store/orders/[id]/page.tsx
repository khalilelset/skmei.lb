'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Truck, Banknote, ShieldCheck,
  Package, User, Phone, Mail, MapPin, Clock, ShoppingBag, Calendar,
} from 'lucide-react';
import { formatPrice } from '@/lib/utils';

interface OrderItem {
  name: string;
  price: number;
  quantity: number;
  image?: string | null;
  productImage?: string | null;
}

interface Order {
  id: string;
  order_number: number | null;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  coupon_code: string | null;
  total: number;
  address: { street?: string; area?: string; city?: string } | null;
  notes: string | null;
  status: string;
  created_at: string;
}

// Confetti particles — 16 brand-colored dots animated outward
const CONFETTI = [
  { x: -80,  y: -60, color: 'bg-brand-red',   shape: 'rounded-full',  size: 'w-2 h-2',     delay: 0 },
  { x: 80,   y: -70, color: 'bg-white',        shape: 'rotate-45',     size: 'w-1.5 h-1.5', delay: 0.05 },
  { x: -100, y: 20,  color: 'bg-brand-red',   shape: 'rounded-sm',    size: 'w-1 h-3',     delay: 0.08 },
  { x: 100,  y: 30,  color: 'bg-brand-silver', shape: 'rounded-full',  size: 'w-2 h-2',     delay: 0.03 },
  { x: -50,  y: 90,  color: 'bg-brand-red',   shape: 'rounded-full',  size: 'w-1.5 h-1.5', delay: 0.12 },
  { x: 60,   y: 80,  color: 'bg-white',        shape: 'rotate-45',     size: 'w-2 h-2',     delay: 0.07 },
  { x: -110, y: -20, color: 'bg-brand-silver', shape: 'rounded-full',  size: 'w-1 h-1',     delay: 0.1 },
  { x: 110,  y: -40, color: 'bg-brand-red',   shape: 'rounded-sm',    size: 'w-3 h-1',     delay: 0.04 },
  { x: 0,    y: -100, color: 'bg-white',       shape: 'rounded-full',  size: 'w-1.5 h-1.5', delay: 0.09 },
  { x: -70,  y: 70,  color: 'bg-brand-red',   shape: 'rotate-45',     size: 'w-2 h-2',     delay: 0.06 },
  { x: 70,   y: 60,  color: 'bg-brand-silver', shape: 'rounded-full',  size: 'w-1 h-1',     delay: 0.11 },
  { x: -40,  y: -90, color: 'bg-brand-red',   shape: 'rounded-full',  size: 'w-2 h-2',     delay: 0.02 },
  { x: 40,   y: -80, color: 'bg-white',        shape: 'rounded-sm',    size: 'w-1 h-3',     delay: 0.14 },
  { x: -90,  y: 50,  color: 'bg-brand-silver', shape: 'rotate-45',     size: 'w-1.5 h-1.5', delay: 0.01 },
  { x: 90,   y: -10, color: 'bg-brand-red',   shape: 'rounded-full',  size: 'w-2.5 h-2.5', delay: 0.13 },
  { x: 20,   y: 100, color: 'bg-white',        shape: 'rounded-full',  size: 'w-1 h-1',     delay: 0.08 },
];

export default function OrderPage() {
  const { id } = useParams<{ id: string }>();
  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    fetch(`/api/orders/${id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.order) {
          setOrder(data.order);
          // Only show confetti once per tab session
          if (!sessionStorage.getItem(`confetti_${id}`)) {
            setShowConfetti(true);
            sessionStorage.setItem(`confetti_${id}`, '1');
          }
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true))
      .finally(() => setIsLoading(false));
  }, [id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-silver-light flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-brand-red border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-gray text-sm">Loading your order...</p>
        </div>
      </div>
    );
  }

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-brand-silver-light flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Package className="w-10 h-10 text-brand-red" />
          </div>
          <h1 className="text-xl font-bold text-brand-black mb-2">Order Not Found</h1>
          <p className="text-brand-gray text-sm mb-6">This order link may be invalid or expired.</p>
          <Link href="/store/products" className="inline-flex items-center gap-2 bg-brand-red text-white px-6 py-3 rounded-full font-bold hover:bg-brand-red-dark transition">
            <ShoppingBag className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const label = order.order_number
    ? `SK-${order.order_number}`
    : `SK-${order.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  const area = order.address?.area ?? '';
  const city = order.address?.city ?? '';
  const street = order.address?.street ?? '';
  const firstName = order.customer_name.split(' ')[0];

  const whatsappText = encodeURIComponent(`I just ordered from SKMEI.LB! Order: ${label}. Check out authentic SKMEI watches at skmei.lb`);

  return (
    <div className="min-h-screen bg-brand-silver-light py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Success hero */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="text-center mb-8"
        >
          {/* Concentric rings */}
          <div className="relative w-36 h-36 mx-auto mb-5 flex items-center justify-center">
            {/* Confetti particles */}
            {showConfetti && CONFETTI.map((p, i) => (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.9, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute ${p.size} ${p.color} ${p.shape} pointer-events-none`}
              />
            ))}

            {/* Three concentric rings */}
            <div className="absolute w-36 h-36 rounded-full border border-brand-red/20" />
            <div className="absolute w-28 h-28 rounded-full border border-brand-red/10" />
            {/* Solid center */}
            <div className="relative w-20 h-20 bg-brand-red rounded-full flex items-center justify-center shadow-xl shadow-brand-red/30">
              <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            {/* Ping — 2 iterations then stops */}
            <div className="absolute w-36 h-36 rounded-full border border-brand-red/25 animate-ping" style={{ animationIterationCount: 2 }} />
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-brand-black mb-2 tracking-tight">Order Confirmed!</h1>
          <p className="text-brand-red font-semibold mb-1">Your watch is on its way</p>
          <p className="text-brand-gray text-sm">
            Thank you, <span className="font-bold text-brand-black">{firstName}</span>! Your order has been received.
          </p>
        </motion.div>

        {/* Order number — dark card */}
        <div className="bg-brand-black rounded-2xl p-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Order Number</p>
            <p className="text-3xl font-black text-white tracking-wide">{label}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Calendar className="w-4 h-4 text-brand-red shrink-0" />
            <span>{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Trust badges — red top border */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Truck,       title: 'Delivery',  sub: '3–5 days' },
            { icon: Banknote,    title: 'Payment',   sub: 'Cash on delivery' },
            { icon: ShieldCheck, title: 'Warranty',  sub: '1-year included' },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="bg-white rounded-xl overflow-hidden border border-brand-silver shadow-sm text-center">
              <div className="h-0.5 bg-brand-red" />
              <div className="p-4">
                <div className="w-9 h-9 bg-brand-red/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-5 h-5 text-brand-red" />
                </div>
                <p className="text-xs font-bold text-brand-black">{title}</p>
                <p className="text-xs text-brand-gray mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Items */}
        <div className="bg-white rounded-2xl border border-brand-silver shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-brand-silver flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-red" />
            <h2 className="font-bold text-brand-black">
              Items Ordered <span className="text-brand-gray font-normal">({order.items.length})</span>
            </h2>
          </div>
          <div className="divide-y divide-brand-silver">
            {order.items.map((item, i) => {
              const img = item.image ?? item.productImage ?? null;
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  {/* Larger product image */}
                  <div className="relative w-20 h-20 shrink-0">
                    <div className="absolute inset-0 rounded-xl overflow-hidden bg-brand-silver-light border border-brand-silver">
                      {img ? (
                        <Image src={img} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-brand-gray" />
                        </div>
                      )}
                    </div>
                    {/* Quantity pill */}
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-red/10 text-brand-red text-[10px] font-bold rounded-full px-1.5 py-0.5 border border-brand-red/20 shadow z-10 whitespace-nowrap">
                      ×{item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-brand-black text-sm leading-snug line-clamp-2">{item.name}</p>
                    <p className="text-xs text-brand-gray mt-1">{formatPrice(item.price)} each</p>
                  </div>
                  <p className="font-bold text-brand-red text-sm shrink-0">
                    {formatPrice(item.price * item.quantity)}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Totals */}
          <div className="px-5 py-4 bg-brand-silver-light border-t border-brand-silver space-y-2">
            <div className="flex justify-between text-sm text-brand-gray">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-brand-gray">
              <span>Shipping</span>
              <span className={order.shipping === 0 ? 'text-brand-red font-bold' : ''}>
                {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-brand-red font-medium">
                <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-brand-black text-base pt-2 border-t border-brand-silver">
              <span>Total</span>
              <span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* Contact + Address */}
        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white rounded-2xl border border-brand-silver shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-brand-red" />
              <h3 className="font-bold text-brand-black text-sm">Contact Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-3.5 h-3.5 text-brand-gray shrink-0" />
                <span className="font-medium text-brand-black">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-brand-gray shrink-0" />
                <span className="text-brand-gray">{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3.5 h-3.5 text-brand-gray shrink-0" />
                  <span className="text-brand-gray">{order.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-brand-silver shadow-sm p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-brand-red" />
              <h3 className="font-bold text-brand-black text-sm">Delivery Address</h3>
            </div>
            <div className="space-y-1.5 text-sm text-brand-gray">
              <p className="font-medium text-brand-black">{area}{city && city !== area ? `, ${city}` : ''}</p>
              {street && <p>{street}</p>}
              <p>Lebanon</p>
            </div>
            {order.notes && (
              <div className="mt-3 pt-3 border-t border-brand-silver">
                <p className="text-xs font-bold text-brand-gray uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-brand-gray">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Notice */}
        <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <Clock className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
          <p className="text-sm text-brand-gray leading-relaxed">
            We will contact you at{' '}
            <span className="font-bold text-brand-black">{order.customer_phone}</span>{' '}
            shortly to confirm your order and arrange delivery.
          </p>
        </div>

        {/* CTAs */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/store/products"
            className="inline-flex items-center gap-2 bg-brand-red text-white px-10 py-4 rounded-full font-bold hover:bg-brand-red-dark transition-all shadow-lg shadow-brand-red/25 hover:scale-[1.02] active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
          <a
            href={`https://wa.me/96179170387?text=${whatsappText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-brand-gray hover:text-brand-black underline-offset-2 hover:underline transition-colors flex items-center gap-1.5"
          >
            <svg className="w-3.5 h-3.5 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
            </svg>
            Share on WhatsApp
          </a>
        </div>

      </div>
    </div>
  );
}
