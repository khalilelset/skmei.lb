'use client';

import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useProfileStore } from '@/store/profileStore';
import { formatPrice } from '@/lib/utils';
import { X, User, MapPin, Phone, Tag } from 'lucide-react';
import Link from 'next/link';

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
      .filter(Boolean)
      .join(', ');
  };

  const hasProfileData = !!(profile.name || profile.phone);

  const [formData, setFormData] = useState({
    name: profile.name,
    address: buildAddress(),
    phone: profile.phone,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 50 ? 0 : 4;
  const discountAmount = appliedCoupon ? Math.round(subtotal * appliedCoupon.discount) / 100 : 0;
  const total = subtotal + shipping - discountAmount;

  const handleApplyCoupon = async () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) { setCouponError('Please enter a coupon code'); return; }
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedCoupon({ code: data.code, discount: data.discount });
        setCouponError('');
      } else {
        setCouponError(data.error || 'Invalid coupon code.');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Failed to validate coupon. Please try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Full name is required';
    if (!formData.address.trim()) newErrors.address = 'Delivery address is required';
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^[\d\s\+\-()]+$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number format';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    // Create WhatsApp message
    let message = `*🛍️ New Order from SKMEI.LB*\n\n`;
    message += `*Customer Details:*\n`;
    message += `👤 Name: ${formData.name}\n`;
    message += `📍 Address: ${formData.address}\n`;
    message += `📱 Phone: ${formData.phone}\n\n`;

    message += `*Order Items:*\n`;
    items.forEach((item, index) => {
      message += `${index + 1}. ${item.product.name}\n`;
      message += `   • Qty: ${item.quantity} × ${formatPrice(item.product.price)} = ${formatPrice(item.product.price * item.quantity)}\n`;
    });

    message += `\n*Order Summary:*\n`;
    message += `Subtotal: ${formatPrice(subtotal)}\n`;
    message += `Shipping: ${shipping === 0 ? 'FREE ✅' : formatPrice(shipping)}\n`;
    if (appliedCoupon) {
      message += `🏷️ Coupon (${appliedCoupon.code} - ${appliedCoupon.discount}% off): -${formatPrice(discountAmount)}\n`;
    }
    message += `*Total: ${formatPrice(total)}*\n\n`;
    message += `💰 Payment Method: Cash on Delivery\n`;
    message += `\n_Order placed via skmei.lb website_`;

    const encodedMessage = encodeURIComponent(message);
    const whatsappURL = `https://wa.me/96179170387?text=${encodedMessage}`;

    // Save order via API route
    await fetch('/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customer_name: formData.name,
        customer_phone: formData.phone,
        customer_email: profile.email || null,
        items: items.map((item) => ({
          id: item.product.id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          image: item.product.images[0] ?? null,
        })),
        subtotal,
        shipping,
        discount: discountAmount,
        coupon_code: appliedCoupon?.code ?? null,
        total,
        address: { full: formData.address },
        status: 'pending',
      }),
    });

    window.open(whatsappURL, '_blank');
    setIsSubmitting(false);

    setTimeout(() => {
      if (confirm('Your order has been sent via WhatsApp! We will contact you soon to confirm.\n\nWould you like to clear your cart?')) {
        clearCart();
        onClose();
        window.location.href = '/store/products';
      } else {
        onClose();
      }
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />

      {/* Scrollable area — single scroll, centered on desktop */}
      <div className="flex min-h-full items-start justify-center p-4 sm:items-center sm:py-8">
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full p-6 md:p-8 my-4">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-brand-gray hover:text-brand-black transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          {/* WhatsApp Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-14 h-14 bg-green-100 rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-green-600" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-brand-black">WhatsApp Checkout</h2>
              <p className="text-sm text-brand-gray">Quick & Easy</p>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">

            {hasProfileData && (
              <div className="flex items-center gap-2 bg-green-50 border border-green-200 rounded-lg px-3 py-2.5 text-sm text-green-800">
                <User className="w-4 h-4 shrink-0" />
                <span>
                  Pre-filled from your{' '}
                  <Link href="/account" onClick={onClose} className="font-semibold underline">
                    saved profile
                  </Link>
                </span>
              </div>
            )}

            {/* Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-brand-black mb-2">
                Full Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gray" />
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your full name"
                />
              </div>
              {errors.name && <p className="text-red-600 text-sm mt-1">{errors.name}</p>}
            </div>

            {/* Address */}
            <div>
              <label htmlFor="address" className="block text-sm font-semibold text-brand-black mb-2">
                Delivery Address *
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-brand-gray" />
                <textarea
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  rows={3}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors resize-none ${
                    errors.address ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Enter your complete delivery address"
                />
              </div>
              {errors.address && <p className="text-red-600 text-sm mt-1">{errors.address}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="phone" className="block text-sm font-semibold text-brand-black mb-2">
                Phone Number (WhatsApp) *
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gray" />
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition-colors ${
                    errors.phone ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="+961 XX XXX XXX"
                />
              </div>
              {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
            </div>

            {/* Coupon Code */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-semibold text-brand-black mb-2">
                <Tag className="w-4 h-4 text-green-600" />
                Coupon Code
              </label>
              {appliedCoupon ? (
                <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                  <div>
                    <p className="text-sm font-bold text-green-700">{appliedCoupon.code}</p>
                    <p className="text-xs text-green-600">{appliedCoupon.discount}% discount applied — saving {formatPrice(discountAmount)}</p>
                  </div>
                  <button type="button" onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} className="text-green-600 hover:text-red-500 transition-colors p-1">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponInput}
                      onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                      onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                      placeholder="Enter code"
                      className={`flex-1 px-3 py-2.5 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-green-500 uppercase tracking-wide ${couponError ? 'border-red-400' : 'border-gray-300'}`}
                    />
                    <button type="button" onClick={handleApplyCoupon} className="px-4 py-2 bg-brand-black text-white rounded-lg text-sm font-semibold hover:bg-brand-gray-dark transition-colors">
                      Apply
                    </button>
                  </div>
                  {couponError && <p className="text-red-500 text-xs mt-1.5">{couponError}</p>}
                </div>
              )}
            </div>

            {/* Order Total */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 space-y-1.5">
              <div className="flex justify-between text-sm text-brand-gray">
                <span>Subtotal</span><span>{formatPrice(subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm text-brand-gray">
                <span>Shipping</span>
                <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
              </div>
              {appliedCoupon && (
                <div className="flex justify-between text-sm text-green-600 font-medium">
                  <span>Discount ({appliedCoupon.discount}%)</span>
                  <span>-{formatPrice(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-1.5 border-t border-green-200">
                <span className="font-semibold text-brand-black">Order Total:</span>
                <span className="text-xl font-bold text-green-600">{formatPrice(total)}</span>
              </div>
              <p className="text-xs text-brand-gray">Payment: Cash on Delivery</p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
              </svg>
              {isSubmitting ? 'Sending...' : 'Checkout via WhatsApp'}
            </button>

            <p className="text-xs text-center text-brand-gray">
              We'll contact you on WhatsApp to confirm your order
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
