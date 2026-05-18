'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  CheckCircle2, Truck, Banknote, ShieldCheck,
  Package, User, Phone, Mail, MapPin, Clock,
  ShoppingBag, Calendar, XCircle, Wallet,
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
  payment_method?: string | null;
  warranty_label?: string | null;
}

// ── Status configuration ─────────────────────────────────────────────────────
const STATUS_CONFIG: Record<string, {
  Icon: React.ElementType;
  bg: string; ring: string; shadow: string; text: string; ping: string;
  title: string; subtitle: string; message: string;
}> = {
  pending: {
    Icon: Clock,
    bg: 'bg-red-500', ring: 'border-red-500/30', shadow: 'shadow-red-500/25', ping: 'border-red-500/30',
    text: 'text-red-400',
    title: 'Order Received',
    subtitle: "We've received your order",
    message: "We're reviewing your order and will contact you shortly to confirm.",
  },
  confirmed: {
    Icon: CheckCircle2,
    bg: 'bg-red-500', ring: 'border-red-500/30', shadow: 'shadow-red-500/25', ping: 'border-red-500/30',
    text: 'text-red-400',
    title: 'Order Confirmed!',
    subtitle: "We're preparing your order",
    message: "Your order is confirmed. We're carefully packing your watch for shipment.",
  },
  processing: {
    Icon: Package,
    bg: 'bg-red-500', ring: 'border-red-500/30', shadow: 'shadow-red-500/25', ping: 'border-red-500/30',
    text: 'text-red-400',
    title: 'Being Packed',
    subtitle: 'Your order is being prepared',
    message: "Your order is being carefully packed and will be handed to delivery soon.",
  },
  shipped: {
    Icon: Truck,
    bg: 'bg-red-500', ring: 'border-red-500/30', shadow: 'shadow-red-500/25', ping: 'border-red-500/30',
    text: 'text-red-400',
    title: "It's On Its Way!",
    subtitle: 'Your watch is en route',
    message: "Your order has been handed to our delivery team. Please be available to receive it.",
  },
  delivered: {
    Icon: CheckCircle2,
    bg: 'bg-red-500', ring: 'border-red-500/30', shadow: 'shadow-red-500/25', ping: 'border-red-500/30',
    text: 'text-red-400',
    title: 'Delivered!',
    subtitle: 'Enjoy your new watch',
    message: "Your order has been delivered successfully. Thank you for choosing SKMEI.LB!",
  },
  cancelled: {
    Icon: XCircle,
    bg: 'bg-red-500', ring: 'border-red-500/30', shadow: 'shadow-red-500/25', ping: 'border-red-500/30',
    text: 'text-red-400',
    title: 'Order Cancelled',
    subtitle: 'This order has been cancelled',
    message: "If you have any questions or wish to reorder, please contact us via WhatsApp.",
  },
};

const PROGRESS_STEPS = [
  { key: 'pending',   label: 'Received' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'shipped',   label: 'Shipped' },
  { key: 'delivered', label: 'Delivered' },
];

function getStepIndex(status: string) {
  const map: Record<string, number> = { pending: 0, confirmed: 1, processing: 1, shipped: 2, delivered: 3 };
  return map[status] ?? 0;
}

// ── Skeleton loading ─────────────────────────────────────────────────────────
function Shimmer({ className }: { className: string }) {
  return (
    <div className={`relative overflow-hidden rounded-xl bg-white/8 ${className}`}>
      <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.4s_infinite] bg-linear-to-r from-transparent via-white/10 to-transparent" />
    </div>
  );
}

function OrderSkeleton() {
  return (
    <div className="min-h-screen bg-brand-black py-8 px-4">
      <style>{`@keyframes shimmer{100%{transform:translateX(100%)}}`}</style>
      <div className="max-w-2xl mx-auto space-y-4">

        {/* Hero skeleton */}
        <div className="flex flex-col items-center gap-4 mb-8 pt-4">
          <div className="relative w-36 h-36 flex items-center justify-center">
            <div className="absolute w-36 h-36 rounded-full bg-white/5" />
            <div className="absolute w-28 h-28 rounded-full bg-white/5" />
            <Shimmer className="w-20 h-20 rounded-full" />
          </div>
          <div className="flex flex-col items-center gap-2 w-full">
            <Shimmer className="h-8 w-56" />
            <Shimmer className="h-4 w-40" />
            <Shimmer className="h-3 w-64" />
          </div>
        </div>

        {/* Progress bar skeleton */}
        <Shimmer className="h-16 w-full rounded-2xl" />

        {/* Order number card */}
        <Shimmer className="h-24 w-full rounded-2xl" />

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3">
          {[0, 1, 2].map(i => <Shimmer key={i} className="h-24 rounded-2xl" />)}
        </div>

        {/* Items card */}
        <div className="rounded-2xl bg-white/5 overflow-hidden border border-white/8 space-y-0">
          <Shimmer className="h-12 rounded-none rounded-t-2xl" />
          {[0, 1].map(i => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 border-t border-white/8">
              <Shimmer className="w-20 h-20 rounded-xl shrink-0" />
              <div className="flex-1 space-y-2">
                <Shimmer className="h-4 w-3/4" />
                <Shimmer className="h-3 w-1/3" />
              </div>
              <Shimmer className="h-5 w-16 shrink-0" />
            </div>
          ))}
          <div className="px-5 py-4 border-t border-white/8 space-y-2">
            {[0, 1, 2].map(i => (
              <div key={i} className="flex justify-between">
                <Shimmer className="h-4 w-20" />
                <Shimmer className="h-4 w-16" />
              </div>
            ))}
          </div>
        </div>

        {/* Contact + address */}
        <div className="grid sm:grid-cols-2 gap-4">
          <Shimmer className="h-36 rounded-2xl" />
          <Shimmer className="h-36 rounded-2xl" />
        </div>

        {/* Notice */}
        <Shimmer className="h-16 rounded-2xl" />
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────
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

  if (isLoading) return <OrderSkeleton />;

  if (notFound || !order) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center px-4">
        <div className="text-center">
          <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-brand-red/20">
            <Package className="w-10 h-10 text-brand-red" />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Order Not Found</h1>
          <p className="text-white/40 text-sm mb-6">This order link may be invalid or expired.</p>
          <Link href="/store/products" className="inline-flex items-center gap-2 bg-brand-red text-white px-6 py-3 rounded-full font-bold hover:bg-brand-red-dark transition">
            <ShoppingBag className="w-4 h-4" /> Browse Products
          </Link>
        </div>
      </div>
    );
  }

  const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
  const { Icon } = cfg;
  const isCancelled = order.status === 'cancelled';
  const stepIndex = getStepIndex(order.status);
  const isWhish = order.payment_method === 'whish';

  const label = order.order_number
    ? `SK-${order.order_number}`
    : `SK-${order.id.replace(/-/g, '').slice(0, 8).toUpperCase()}`;

  const area   = order.address?.area   ?? '';
  const city   = order.address?.city   ?? '';
  const street = order.address?.street ?? '';
  const firstName = order.customer_name.split(' ')[0];

  // Confetti particles
  const CONFETTI = [
    { x: -80, y: -60, cls: 'bg-brand-red w-2 h-2 rounded-full', delay: 0 },
    { x: 80, y: -70, cls: 'bg-white w-1.5 h-1.5 rotate-45', delay: 0.05 },
    { x: -100, y: 20, cls: 'bg-brand-red w-1 h-3 rounded-sm', delay: 0.08 },
    { x: 100, y: 30, cls: 'bg-white/60 w-2 h-2 rounded-full', delay: 0.03 },
    { x: -50, y: 90, cls: 'bg-brand-red w-1.5 h-1.5 rounded-full', delay: 0.12 },
    { x: 60, y: 80, cls: 'bg-white w-2 h-2 rotate-45', delay: 0.07 },
    { x: -110, y: -20, cls: 'bg-white/40 w-1 h-1 rounded-full', delay: 0.1 },
    { x: 110, y: -40, cls: 'bg-brand-red w-3 h-1 rounded-sm', delay: 0.04 },
    { x: 0, y: -100, cls: 'bg-white w-1.5 h-1.5 rounded-full', delay: 0.09 },
    { x: -70, y: 70, cls: 'bg-brand-red w-2 h-2 rotate-45', delay: 0.06 },
    { x: 70, y: 60, cls: 'bg-white/60 w-1 h-1 rounded-full', delay: 0.11 },
    { x: -40, y: -90, cls: 'bg-brand-red w-2 h-2 rounded-full', delay: 0.02 },
    { x: 40, y: -80, cls: 'bg-white w-1 h-3 rounded-sm', delay: 0.14 },
    { x: -90, y: 50, cls: 'bg-white/40 w-1.5 h-1.5 rotate-45', delay: 0.01 },
    { x: 90, y: -10, cls: 'bg-brand-red w-2.5 h-2.5 rounded-full', delay: 0.13 },
    { x: 20, y: 100, cls: 'bg-white w-1 h-1 rounded-full', delay: 0.08 },
  ];

  return (
    <div className="min-h-screen bg-brand-black py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* ── Status hero ─────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="text-center mb-6"
        >
          <div className="relative w-36 h-36 mx-auto mb-5 flex items-center justify-center">
            {showConfetti && CONFETTI.map((p, i) => (
              <motion.span
                key={i}
                initial={{ x: 0, y: 0, opacity: 1, scale: 1 }}
                animate={{ x: p.x, y: p.y, opacity: 0, scale: 0.5 }}
                transition={{ duration: 0.9, delay: p.delay, ease: [0.22, 1, 0.36, 1] }}
                className={`absolute ${p.cls} pointer-events-none`}
              />
            ))}
            <div className={`absolute w-36 h-36 rounded-full border ${cfg.ring}`} />
            <div className={`absolute w-28 h-28 rounded-full border ${cfg.ring}`} />
            <div className={`relative w-20 h-20 ${cfg.bg} rounded-full flex items-center justify-center shadow-xl ${cfg.shadow}`}>
              <Icon className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            {!isCancelled && (
              <div className={`absolute w-36 h-36 rounded-full border ${cfg.ping} animate-ping`} style={{ animationIterationCount: 2 }} />
            )}
          </div>

          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">{cfg.title}</h1>
          <p className={`${cfg.text} font-semibold mb-1`}>{cfg.subtitle}</p>
          <p className="text-white/45 text-sm max-w-sm mx-auto leading-relaxed">
            {cfg.message.replace('__name__', firstName)}
          </p>
        </motion.div>

        {/* ── Progress tracker (hidden for cancelled) ──────────── */}
        {!isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="bg-white/5 border border-white/8 rounded-2xl px-5 py-4 mb-4"
          >
            <div className="flex items-center justify-between relative">
              {/* connecting line */}
              <div className="absolute left-0 right-0 top-4 h-px bg-white/10 mx-8" />
              <div
                className={`absolute left-0 top-4 h-px transition-all duration-700 mx-8 ${cfg.bg}`}
                style={{ right: `${(1 - stepIndex / (PROGRESS_STEPS.length - 1)) * 100}%` }}
              />
              {PROGRESS_STEPS.map((step, i) => {
                const done    = i < stepIndex;
                const current = i === stepIndex;
                return (
                  <div key={step.key} className="flex flex-col items-center gap-1.5 z-10">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-500 ${
                      done    ? `${cfg.bg} border-transparent` :
                      current ? `bg-brand-black ${cfg.bg.replace('bg-', 'border-')}` :
                                'bg-brand-black border-white/15'
                    }`}>
                      {done ? (
                        <CheckCircle2 className="w-4 h-4 text-white" strokeWidth={3} />
                      ) : (
                        <div className={`w-2 h-2 rounded-full ${current ? cfg.bg : 'bg-white/20'}`} />
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold whitespace-nowrap ${
                      current ? cfg.text : done ? 'text-white/60' : 'text-white/25'
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* ── Order number card ────────────────────────────────── */}
        <div className="bg-white/5 border border-white/8 rounded-2xl p-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold mb-1">Order Number</p>
            <p className="text-3xl font-black text-white tracking-wide">{label}</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-white/50">
            <Calendar className="w-4 h-4 text-brand-red shrink-0" />
            <span>{new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* ── Trust badges ─────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Truck,                                               title: 'Delivery',  sub: '3–5 days' },
            { icon: isWhish ? Wallet : Banknote,                        title: 'Payment',   sub: isWhish ? 'Paid via Whish' : 'Cash on delivery' },
            { icon: ShieldCheck,                                         title: 'Warranty',  sub: order.warranty_label ?? '1-year included' },
          ].map(({ icon: BIcon, title, sub }) => (
            <div key={title} className="bg-white/5 rounded-2xl overflow-hidden border border-white/8 text-center">
              <div className={`h-0.5 ${cfg.bg}`} />
              <div className="p-4">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center mx-auto mb-2 border ${cfg.ring}`} style={{ background: 'rgba(255,255,255,0.04)' }}>
                  <BIcon className={`w-5 h-5 ${cfg.text}`} />
                </div>
                <p className="text-xs font-bold text-white">{title}</p>
                <p className="text-xs text-white/40 mt-0.5">{sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ── Items ───────────────────────────────────────────── */}
        <div className="bg-white/5 rounded-2xl border border-white/8 overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-white/8 flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-red" />
            <h2 className="font-bold text-white">
              Items Ordered <span className="text-white/35 font-normal">({order.items.length})</span>
            </h2>
          </div>
          <div className="divide-y divide-white/8">
            {order.items.map((item, i) => {
              const img = item.image ?? item.productImage ?? null;
              return (
                <div key={i} className="flex items-center gap-4 px-5 py-4">
                  <div className="relative w-20 h-20 shrink-0">
                    <div className="absolute inset-0 rounded-xl overflow-hidden bg-white/5 border border-white/10">
                      {img ? (
                        <Image src={img} alt={item.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-white/20" />
                        </div>
                      )}
                    </div>
                    <span className="absolute -top-1.5 -right-1.5 bg-brand-red text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center shadow z-10">
                      {item.quantity}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm leading-snug line-clamp-2">{item.name}</p>
                    <p className="text-xs text-white/35 mt-1">{formatPrice(item.price)} × {item.quantity}</p>
                  </div>
                  <p className="font-bold text-white text-sm shrink-0">{formatPrice(item.price * item.quantity)}</p>
                </div>
              );
            })}
          </div>
          <div className="px-5 py-4 bg-white/3 border-t border-white/8 space-y-2">
            <div className="flex justify-between text-sm text-white/40">
              <span>Subtotal</span><span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-white/40">
              <span>Shipping</span>
              <span className={order.shipping === 0 ? 'text-green-400 font-semibold' : ''}>
                {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
              </span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-400 font-medium">
                <span>Discount{order.coupon_code ? ` (${order.coupon_code})` : ''}</span>
                <span>-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between font-black text-white text-base pt-2 border-t border-white/10">
              <span>Total</span><span>{formatPrice(order.total)}</span>
            </div>
          </div>
        </div>

        {/* ── Contact + Address ────────────────────────────────── */}
        <div className="grid sm:grid-cols-2 gap-4 mb-4">
          <div className="bg-white/5 rounded-2xl border border-white/8 p-5">
            <div className="flex items-center gap-2 mb-4">
              <User className="w-4 h-4 text-brand-red" />
              <h3 className="font-bold text-white text-sm">Contact Information</h3>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-3.5 h-3.5 text-white/25 shrink-0" />
                <span className="font-medium text-white">{order.customer_name}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-white/25 shrink-0" />
                <span className="text-white/50">{order.customer_phone}</span>
              </div>
              {order.customer_email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3.5 h-3.5 text-white/25 shrink-0" />
                  <span className="text-white/50">{order.customer_email}</span>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white/5 rounded-2xl border border-white/8 p-5">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-4 h-4 text-brand-red" />
              <h3 className="font-bold text-white text-sm">Delivery Address</h3>
            </div>
            <div className="space-y-1.5 text-sm text-white/50">
              <p className="font-medium text-white">{area}{city && city !== area ? `, ${city}` : ''}</p>
              {street && <p>{street}</p>}
              <p>Lebanon</p>
            </div>
            {order.notes && (
              <div className="mt-3 pt-3 border-t border-white/10">
                <p className="text-xs font-bold text-white/30 uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-white/50">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* ── Notice ──────────────────────────────────────────── */}
        <div className={`border rounded-2xl p-4 flex items-start gap-3 mb-6 ${
          isCancelled
            ? 'bg-red-500/5 border-red-500/20'
            : 'bg-white/4 border-white/10'
        }`}>
          <Clock className={`w-5 h-5 shrink-0 mt-0.5 ${isCancelled ? 'text-red-400' : cfg.text}`} />
          <p className="text-sm text-white/50 leading-relaxed">
            {isCancelled
              ? 'This order has been cancelled. Contact us if you have any questions.'
              : <>We will contact you at <span className="font-bold text-white">{order.customer_phone}</span> to arrange delivery.</>
            }
          </p>
        </div>

        {/* ── CTA ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          <Link
            href="/store/products"
            className="inline-flex items-center gap-2 bg-brand-red text-white px-10 py-4 rounded-full font-bold hover:bg-brand-red-dark transition-all shadow-lg shadow-brand-red/25 hover:scale-[1.02] active:scale-95"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
        </div>

      </div>
    </div>
  );
}
