'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useProfileStore } from '@/store/profileStore';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { ArrowLeft, User, MapPin, ShieldCheck, Minus, Plus, Trash2 } from 'lucide-react';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

export default function WhatsAppCheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart, updateQuantity, removeItem } = useCartStore();
  const { profile } = useProfileStore();

  const buildAddress = () => {
    if (!profile.saveAddress) return '';
    return [profile.address.street, profile.address.building, profile.address.city, profile.address.region]
      .filter(Boolean).join(', ');
  };

  const [formData, setFormData] = useState({
    name: profile.name,
    address: buildAddress(),
    phone: profile.phone,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 50 ? 0 : 4;
  const total = subtotal + shipping;

  useEffect(() => {
    if (items.length === 0) router.replace('/store/products');
  }, [items, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.address.trim()) newErrors.address = 'Delivery address is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\+\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const buildMessage = () => {
    let msg = `*🛍️ New Order from SKMEI.LB*\n\n`;
    msg += `*Customer Details:*\n\n`;
    msg += `👤 Name: ${formData.name}\n\n`;
    msg += `📍 Address: ${formData.address}\n\n`;
    msg += `📱 Phone: ${formData.phone}\n\n\n`;
    msg += `*Order Items:*\n\n\n`;
    items.forEach((item, index) => {
      msg += `${index + 1}. ${item.product.name}\n`;
      msg += `   • Qty: ${item.quantity} × ${formatPrice(item.product.price)} = ${formatPrice(item.product.price * item.quantity)}\n\n\n`;
    });
    msg += `*Order Summary:*\n\n`;
    msg += `Subtotal: ${formatPrice(subtotal)}\n`;
    msg += `Shipping: ${shipping === 0 ? 'FREE' : formatPrice(shipping)}\n\n`;
    msg += `*Total: ${formatPrice(total)}*\n\n`;
    msg += `💰 Payment Method: Cash on Delivery\n\n`;
    msg += `_Order placed via skmeilb.com website_`;
    return msg;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    setIsSubmitting(true);

    // Open WhatsApp immediately (must be in the click handler to avoid popup blockers)
    const encodedMessage = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/96179170387?text=${encodedMessage}`, '_blank');

    // Save order to database in background (non-blocking)
    const orderItems = items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.images[0] ?? null,
    }));

    fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: formData.name,
        customer_phone: formData.phone,
        items: orderItems,
        subtotal,
        shipping,
        discount: 0,
        total,
        address: { full: formData.address },
        source: 'whatsapp',
      }),
    }).catch(() => {});

    clearCart();
    router.push('/store/products');
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">

        {/* Back */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-white/40 hover:text-white transition-colors mb-8 text-sm font-medium group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
          Back to Cart
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-2">
          <div className="w-11 h-11 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center shrink-0">
            <WhatsAppIcon className="w-6 h-6 text-green-500" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">WhatsApp Checkout</h1>
            <p className="text-white/40 text-sm mt-0.5">Fill in your details · We'll confirm via WhatsApp</p>
          </div>
        </div>

        {/* Red accent line */}
        <div className="h-px bg-linear-to-r from-brand-red via-brand-red/30 to-transparent mb-8 mt-5" />

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

          {/* ── Form (3/5) ── */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white/4 border border-white/8 rounded-2xl p-6 sm:p-8 space-y-5">

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                  Full Name <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text" id="name" name="name"
                    value={formData.name} onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`w-full pl-10 pr-4 py-3 bg-white/6 border rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-1 transition-colors text-sm ${errors.name ? 'border-brand-red ring-brand-red/20' : 'border-white/10 focus:border-white/30 focus:ring-white/10'}`}
                  />
                </div>
                {errors.name && <p className="text-brand-red text-xs mt-1.5">{errors.name}</p>}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                  Delivery Address <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-white/30" />
                  <textarea
                    id="address" name="address"
                    value={formData.address} onChange={handleChange}
                    rows={3} placeholder="Street, building, city, region…"
                    className={`w-full pl-10 pr-4 py-3 bg-white/6 border rounded-xl text-white placeholder:text-white/25 focus:outline-none focus:ring-1 transition-colors resize-none text-sm ${errors.address ? 'border-brand-red ring-brand-red/20' : 'border-white/10 focus:border-white/30 focus:ring-white/10'}`}
                  />
                </div>
                {errors.address && <p className="text-brand-red text-xs mt-1.5">{errors.address}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                  Phone Number <span className="text-brand-red">*</span>
                  <span className="normal-case tracking-normal font-normal text-white/30 ml-1">(WhatsApp)</span>
                </label>
                <div className={`flex rounded-xl overflow-hidden border transition-colors ${errors.phone ? 'border-brand-red' : 'border-white/10 focus-within:border-white/30'}`}>
                  <span className="flex items-center px-4 bg-white/8 border-r border-white/10 text-white/60 font-bold text-sm shrink-0 select-none">
                    +961
                  </span>
                  <input
                    type="tel" id="phone" name="phone"
                    value={formData.phone} onChange={handleChange}
                    placeholder="XX XXX XXX"
                    className="flex-1 px-4 py-3 bg-white/6 text-white placeholder:text-white/25 focus:outline-none text-sm"
                  />
                </div>
                {errors.phone && <p className="text-brand-red text-xs mt-1.5">{errors.phone}</p>}
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={isSubmitting}
                className="group relative w-full overflow-hidden bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-3 shadow-lg shadow-green-900/30 disabled:opacity-40 disabled:cursor-not-allowed mt-2 active:scale-[0.98]"
              >
                <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/10 group-hover:animate-shimmer-sweep pointer-events-none" />
                <WhatsAppIcon className="w-5 h-5 shrink-0" />
                {isSubmitting ? 'Opening WhatsApp…' : 'Send Order via WhatsApp'}
              </button>

              {/* Trust row */}
              <div className="flex items-center justify-center gap-5 pt-1">
                <span className="flex items-center gap-1.5 text-xs text-white/30">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Secure & Private
                </span>
                <span className="w-px h-3 bg-white/10" />
                <span className="text-xs text-white/30">Cash on Delivery</span>
                <span className="w-px h-3 bg-white/10" />
                <span className="flex items-center gap-1.5 text-xs text-white/30">
                  <WhatsAppIcon className="w-3.5 h-3.5" />
                  Fast Response
                </span>
              </div>
            </form>
          </div>

          {/* ── Order Summary (2/5) ── */}
          <div className="lg:col-span-2">
            <div className="bg-white/4 border border-white/8 rounded-2xl p-5 lg:sticky lg:top-24">
              <h2 className="font-black text-white text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
                Order Summary
                <span className="font-normal text-white/30 normal-case tracking-normal">({items.length} item{items.length !== 1 ? 's' : ''})</span>
              </h2>

              {/* Items */}
              <div className="space-y-4 mb-5">
                {items.map((item) => (
                  <div key={item.product.id} className="flex gap-3">
                    <div className="relative w-14 h-14 bg-white/6 border border-white/10 rounded-xl overflow-hidden shrink-0">
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-white/85 line-clamp-2 leading-snug">{item.product.name}</p>
                      <p className="text-brand-red font-bold text-sm mt-0.5">{formatPrice(item.product.price)}</p>

                      {/* Qty controls */}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex items-center bg-white/6 border border-white/10 rounded-full overflow-hidden">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white active:scale-95"
                            aria-label="Decrease"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-white">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-white/10 transition-colors text-white/50 hover:text-white active:scale-95"
                            aria-label="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeItem(item.product.id)}
                          className="p-1.5 text-white/20 hover:text-brand-red transition-colors rounded-lg hover:bg-brand-red/10 active:scale-95"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                        <span className="ml-auto text-sm font-bold text-white shrink-0">
                          {formatPrice(item.product.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-white/8 pt-4 space-y-2.5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Subtotal</span>
                  <span className="text-white/70 font-medium">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-white/40">Shipping</span>
                  {shipping === 0
                    ? <span className="text-green-400 font-semibold">FREE</span>
                    : <span className="text-white/70 font-medium">{formatPrice(shipping)}</span>
                  }
                </div>
                {subtotal < 50 && (
                  <p className="text-xs text-white/25">
                    Add <span className="text-brand-red font-semibold">{formatPrice(50 - subtotal)}</span> for free shipping
                  </p>
                )}
                <div className="flex justify-between items-center pt-3 border-t border-white/8">
                  <span className="font-black text-white">Total</span>
                  <span className="text-xl font-black text-green-400">{formatPrice(total)}</span>
                </div>

                {/* COD badge */}
                <div className="bg-white/4 border border-white/8 rounded-xl py-2.5 text-center mt-1">
                  <span className="text-xs text-white/40 font-medium">💰 Cash on Delivery</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
