'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useProfileStore } from '@/store/profileStore';
import { formatPrice } from '@/lib/utils';
import { X, User, MapPin } from 'lucide-react';
import Link from 'next/link';

const WhatsAppIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
  </svg>
);

interface WhatsAppCheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WhatsAppCheckoutModal({ isOpen, onClose }: WhatsAppCheckoutModalProps) {
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { profile } = useProfileStore();

  const buildAddress = () => {
    if (!profile.saveAddress) return '';
    return [profile.address.street, profile.address.building, profile.address.city, profile.address.region]
      .filter(Boolean).join(', ');
  };

  const hasProfileData = !!(profile.name || profile.phone);

  const [formData, setFormData] = useState({
    name: profile.name,
    address: buildAddress(),
    phone: profile.phone,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 50 ? 0 : 4;
  const total = subtotal + shipping;

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

    const encodedMessage = encodeURIComponent(buildMessage());
    window.open(`https://wa.me/96179170387?text=${encodedMessage}`, '_blank');

    clearCart();
    onClose();
    window.location.href = '/store/products';
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:py-8">
        <div className="relative bg-[#111111] border border-white/8 rounded-2xl shadow-2xl shadow-black max-w-md w-full p-6 md:p-8 my-4">

          {/* Red accent line at top */}
          <div className="absolute top-0 left-6 right-6 h-px bg-linear-to-r from-transparent via-brand-red/50 to-transparent rounded-full" />

          {/* Close */}
          <button onClick={onClose} className="absolute top-4 right-4 p-2 text-white/30 hover:text-white hover:bg-white/8 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-6 pr-8">
            <div className="w-10 h-10 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center shrink-0">
              <WhatsAppIcon className="w-5 h-5 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">WhatsApp Checkout</h2>
              <p className="text-xs text-white/35">Quick & Easy · Cash on Delivery</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">

            {hasProfileData && (
              <div className="flex items-center gap-2 bg-green-500/8 border border-green-500/15 rounded-xl px-3.5 py-2.5 text-xs text-green-400">
                <User className="w-4 h-4 shrink-0" />
                <span>
                  Pre-filled from your{' '}
                  <Link href="/account" onClick={onClose} className="font-bold underline underline-offset-2">
                    saved profile
                  </Link>
                </span>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="modal-name" className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                Full Name <span className="text-brand-red">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/25" />
                <input
                  type="text" id="modal-name" name="name"
                  value={formData.name} onChange={handleChange}
                  placeholder="Enter your full name"
                  className={`w-full pl-10 pr-4 py-3 bg-white/6 border rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 transition-colors ${errors.name ? 'border-brand-red ring-brand-red/20' : 'border-white/10 focus:border-white/25 focus:ring-white/10'}`}
                />
              </div>
              {errors.name && <p className="text-brand-red text-xs mt-1">{errors.name}</p>}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="modal-address" className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                Delivery Address <span className="text-brand-red">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3.5 w-4 h-4 text-white/25" />
                <textarea
                  id="modal-address" name="address"
                  value={formData.address} onChange={handleChange}
                  rows={3} placeholder="Street, building, city, region…"
                  className={`w-full pl-10 pr-4 py-3 bg-white/6 border rounded-xl text-white text-sm placeholder:text-white/20 focus:outline-none focus:ring-1 transition-colors resize-none ${errors.address ? 'border-brand-red ring-brand-red/20' : 'border-white/10 focus:border-white/25 focus:ring-white/10'}`}
                />
              </div>
              {errors.address && <p className="text-brand-red text-xs mt-1">{errors.address}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="modal-phone" className="block text-xs font-bold text-white/40 uppercase tracking-widest mb-2">
                Phone <span className="text-brand-red">*</span>
                <span className="normal-case tracking-normal font-normal text-white/25 ml-1">(WhatsApp)</span>
              </label>
              <div className={`flex rounded-xl overflow-hidden border transition-colors ${errors.phone ? 'border-brand-red' : 'border-white/10 focus-within:border-white/25'}`}>
                <span className="flex items-center px-3.5 bg-white/8 border-r border-white/10 text-white/50 font-bold text-sm shrink-0 select-none">
                  +961
                </span>
                <input
                  type="tel" id="modal-phone" name="phone"
                  value={formData.phone} onChange={handleChange}
                  placeholder="XX XXX XXX"
                  className="flex-1 px-4 py-3 bg-white/6 text-white text-sm placeholder:text-white/20 focus:outline-none"
                />
              </div>
              {errors.phone && <p className="text-brand-red text-xs mt-1">{errors.phone}</p>}
            </div>

            {/* Order Total */}
            <div className="bg-white/4 border border-white/8 rounded-xl p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Subtotal</span>
                <span className="text-white/70">{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/40">Shipping</span>
                {shipping === 0
                  ? <span className="text-green-400 font-semibold">FREE</span>
                  : <span className="text-white/70">{formatPrice(shipping)}</span>
                }
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-white/8">
                <span className="font-black text-white">Total</span>
                <span className="text-xl font-black text-green-400">{formatPrice(total)}</span>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit" disabled={isSubmitting}
              className="group relative w-full overflow-hidden bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-3 shadow-lg shadow-green-900/30 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.98]"
            >
              <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/10 group-hover:animate-shimmer-sweep pointer-events-none" />
              <WhatsAppIcon className="w-5 h-5 shrink-0" />
              {isSubmitting ? 'Opening WhatsApp…' : 'Send Order via WhatsApp'}
            </button>

            <p className="text-xs text-center text-white/25">
              We'll contact you on WhatsApp to confirm your order
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
