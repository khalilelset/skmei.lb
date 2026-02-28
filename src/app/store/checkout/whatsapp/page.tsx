'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useProfileStore } from '@/store/profileStore';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import { ArrowLeft, User, MapPin, Phone, Tag, X, ShieldCheck } from 'lucide-react';

export default function WhatsAppCheckoutPage() {
  const router = useRouter();
  const { items, getTotalPrice, clearCart } = useCartStore();
  const { profile } = useProfileStore();

  const buildAddress = () => {
    if (!profile.saveAddress) return '';
    return [profile.address.street, profile.address.building, profile.address.city, profile.address.region]
      .filter(Boolean)
      .join(', ');
  };

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

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 50 ? 0 : 4;
  const discountAmount = appliedCoupon ? Math.round(subtotal * appliedCoupon.discount) / 100 : 0;
  const total = subtotal + shipping - discountAmount;

  // Redirect to products if empty
  useEffect(() => {
    if (items.length === 0) router.replace('/store/products');
  }, [items, router]);

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
    if (errors[name]) setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
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
    if (!validateForm()) return;
    setIsSubmitting(true);

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
        subtotal, shipping, discount: discountAmount,
        coupon_code: appliedCoupon?.code ?? null,
        total,
        address: { full: formData.address },
        status: 'pending',
      }),
    });

    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/96179170387?text=${encodedMessage}`, '_blank');

    setIsSubmitting(false);

    setTimeout(() => {
      if (confirm('Your order has been sent via WhatsApp! We will contact you soon to confirm.\n\nWould you like to clear your cart?')) {
        clearCart();
        router.push('/store/products');
      } else {
        router.push('/store/products');
      }
    }, 1000);
  };

  if (items.length === 0) return null;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:py-12">

        {/* Back link */}
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-2 text-brand-gray hover:text-brand-red transition-colors mb-6 text-sm font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center shrink-0">
            <svg className="w-7 h-7 text-green-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
            </svg>
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-black">WhatsApp Checkout</h1>
            <p className="text-brand-gray text-sm mt-0.5">Fill in your details and we'll confirm your order via WhatsApp</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

          {/* Form — takes 3/5 on desktop */}
          <div className="lg:col-span-3">
            <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8 space-y-5">

              {/* Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-brand-black mb-2">
                  Full Name <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gray" />
                  <input
                    type="text" id="name" name="name"
                    value={formData.name} onChange={handleChange}
                    placeholder="Enter your full name"
                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors ${errors.name ? 'border-red-400' : 'border-gray-200 focus:border-green-500'}`}
                  />
                </div>
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Address */}
              <div>
                <label htmlFor="address" className="block text-sm font-semibold text-brand-black mb-2">
                  Delivery Address <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3.5 w-5 h-5 text-brand-gray" />
                  <textarea
                    id="address" name="address"
                    value={formData.address} onChange={handleChange}
                    rows={3} placeholder="Enter your complete delivery address"
                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors resize-none ${errors.address ? 'border-red-400' : 'border-gray-200 focus:border-green-500'}`}
                  />
                </div>
                {errors.address && <p className="text-red-500 text-sm mt-1">{errors.address}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="phone" className="block text-sm font-semibold text-brand-black mb-2">
                  Phone Number (WhatsApp) <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-brand-gray" />
                  <input
                    type="tel" id="phone" name="phone"
                    value={formData.phone} onChange={handleChange}
                    placeholder="+961 XX XXX XXX"
                    className={`w-full pl-11 pr-4 py-3 border-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500/20 transition-colors ${errors.phone ? 'border-red-400' : 'border-gray-200 focus:border-green-500'}`}
                  />
                </div>
                {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
              </div>

              {/* Coupon */}
              <div>
                <label className="flex items-center gap-1.5 text-sm font-semibold text-brand-black mb-2">
                  <Tag className="w-4 h-4 text-green-600" />
                  Coupon Code
                </label>
                {appliedCoupon ? (
                  <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                    <div>
                      <p className="text-sm font-bold text-green-700">{appliedCoupon.code}</p>
                      <p className="text-xs text-green-600">{appliedCoupon.discount}% off — saving {formatPrice(discountAmount)}</p>
                    </div>
                    <button type="button" onClick={() => { setAppliedCoupon(null); setCouponInput(''); }} className="text-green-600 hover:text-red-500 transition-colors">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-2">
                      <input
                        type="text" value={couponInput}
                        onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                        placeholder="Enter coupon code"
                        className={`flex-1 px-4 py-3 border-2 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500/20 uppercase tracking-wide transition-colors ${couponError ? 'border-red-400' : 'border-gray-200 focus:border-green-500'}`}
                      />
                      <button type="button" onClick={handleApplyCoupon}
                        className="px-5 py-3 bg-brand-black text-white rounded-xl text-sm font-semibold hover:bg-brand-red transition-colors">
                        Apply
                      </button>
                    </div>
                    {couponError && <p className="text-red-500 text-xs mt-1.5">{couponError}</p>}
                  </div>
                )}
              </div>

              {/* Submit */}
              <button
                type="submit" disabled={isSubmitting}
                className="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-4 rounded-xl font-bold text-base transition-colors flex items-center justify-center gap-3 shadow-lg shadow-green-600/20 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                {isSubmitting ? 'Sending Order…' : 'Send Order via WhatsApp'}
              </button>

              <p className="text-xs text-center text-brand-gray">
                We'll contact you on WhatsApp to confirm your order · Cash on Delivery
              </p>
            </form>

            {/* Trust badges */}
            <div className="mt-4 flex items-center justify-center gap-6 text-xs text-brand-gray">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-green-600" />
                Secure & Private
              </div>
              <div className="flex items-center gap-1.5">
                <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L0 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/></svg>
                Fast Response
              </div>
            </div>
          </div>

          {/* Order Summary — 2/5 on desktop */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sticky top-24">
              <h2 className="font-bold text-brand-black text-lg mb-4">Order Summary</h2>

              {/* Items */}
              <div className="space-y-3 mb-5">
                {items.map((item) => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="relative w-14 h-14 bg-gray-100 rounded-xl overflow-hidden shrink-0">
                      <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-brand-black line-clamp-1">{item.product.name}</p>
                      <p className="text-xs text-brand-gray">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-sm font-semibold text-brand-black shrink-0">
                      {formatPrice(item.product.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              {/* Totals */}
              <div className="border-t border-gray-100 pt-4 space-y-2">
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
                <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                  <span className="font-bold text-brand-black">Total</span>
                  <span className="text-xl font-black text-green-600">{formatPrice(total)}</span>
                </div>
                <p className="text-xs text-brand-gray text-center pt-1">💰 Cash on Delivery</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
