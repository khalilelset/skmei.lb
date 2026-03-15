'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Truck,
  Banknote,
  CheckCircle2,
  User,
  Tag,
  X,
  MapPin,
  Phone,
  Mail,
  Package,
  Clock,
  Calendar,
} from 'lucide-react';

interface PlacedOrder {
  orderId: string;
  orderNumber: number | null;
  customerName: string;
  phone: string;
  email: string;
  street: string;
  city: string;
  notes: string;
  items: { name: string; price: number; quantity: number; image: string | null }[];
  subtotal: number;
  shipping: number;
  discountAmount: number;
  couponCode: string | null;
  total: number;
  placedAt: string;
}

function OrderConfirmation({ order }: { order: PlacedOrder }) {
  return (
    <div className="min-h-screen bg-brand-silver-light py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Success hero */}
        <div className="text-center mb-8">
          <div className="relative w-24 h-24 mx-auto mb-5">
            <div className="absolute inset-0 bg-brand-red/15 rounded-full animate-ping opacity-60" />
            <div className="relative w-24 h-24 bg-brand-red rounded-full flex items-center justify-center shadow-xl shadow-brand-red/30">
              <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
            </div>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-black mb-2">Order Confirmed!</h1>
          <p className="text-brand-gray">
            Thank you, <span className="font-semibold text-brand-black">{order.customerName.split(' ')[0]}</span>! Your order has been received.
          </p>
        </div>

        {/* Order number + date */}
        <div className="bg-white rounded-2xl border border-brand-silver shadow-sm p-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-xs text-brand-gray uppercase tracking-widest font-bold mb-1">Order Number</p>
            <p className="text-2xl font-black text-brand-black tracking-wide">
              {order.orderNumber ? `SK-${order.orderNumber}` : `SK-${order.orderId.replace(/-/g, '').slice(0, 8).toUpperCase()}`}
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-brand-gray">
            <Calendar className="w-4 h-4 text-brand-red shrink-0" />
            <span>{new Date(order.placedAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Truck,       title: 'Delivery',  sub: '2–4 days' },
            { icon: Banknote,    title: 'Payment',   sub: 'Cash on delivery' },
            { icon: ShieldCheck, title: 'Warranty',  sub: '1-year included' },
          ].map(({ icon: Icon, title, sub }) => (
            <div key={title} className="bg-white rounded-xl p-4 border border-brand-silver shadow-sm text-center">
              <div className="w-9 h-9 bg-brand-red/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Icon className="w-5 h-5 text-brand-red" />
              </div>
              <p className="text-xs font-bold text-brand-black">{title}</p>
              <p className="text-xs text-brand-gray mt-0.5">{sub}</p>
            </div>
          ))}
        </div>

        {/* Items ordered */}
        <div className="bg-white rounded-2xl border border-brand-silver shadow-sm overflow-hidden mb-4">
          <div className="px-5 py-4 border-b border-brand-silver flex items-center gap-2">
            <Package className="w-4 h-4 text-brand-red" />
            <h2 className="font-bold text-brand-black">
              Items Ordered <span className="text-brand-gray font-normal">({order.items.length})</span>
            </h2>
          </div>
          <div className="divide-y divide-brand-silver">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-4">
                <div className="relative w-16 h-16 shrink-0">
                  <div className="absolute inset-0 rounded-xl overflow-hidden bg-brand-silver-light border border-brand-silver">
                    {item.image ? (
                      <Image src={item.image} alt={item.name} fill className="object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-brand-gray" />
                      </div>
                    )}
                  </div>
                  <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-brand-red text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow z-10">
                    {item.quantity}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-brand-black text-sm leading-snug line-clamp-2">{item.name}</p>
                  <p className="text-xs text-brand-gray mt-0.5">{formatPrice(item.price)} × {item.quantity}</p>
                </div>
                <p className="font-bold text-brand-black text-sm shrink-0">
                  {formatPrice(item.price * item.quantity)}
                </p>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="px-5 py-4 bg-brand-silver-light border-t border-brand-silver space-y-2">
            <div className="flex justify-between text-sm text-brand-gray">
              <span>Subtotal</span>
              <span>{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm text-brand-gray">
              <span>Shipping</span>
              <span className={order.shipping === 0 ? 'text-green-600 font-semibold' : ''}>
                {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
              </span>
            </div>
            {order.discountAmount > 0 && (
              <div className="flex justify-between text-sm text-green-600 font-medium">
                <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                <span>-{formatPrice(order.discountAmount)}</span>
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
                <span className="font-medium text-brand-black">{order.customerName}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Phone className="w-3.5 h-3.5 text-brand-gray shrink-0" />
                <span className="text-brand-gray">{order.phone}</span>
              </div>
              {order.email && (
                <div className="flex items-center gap-2 text-sm">
                  <Mail className="w-3.5 h-3.5 text-brand-gray shrink-0" />
                  <span className="text-brand-gray">{order.email}</span>
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
              <p className="font-medium text-brand-black">{order.city}</p>
              <p>{order.street}</p>
              <p>Lebanon</p>
            </div>
            {order.notes && (
              <div className="mt-3 pt-3 border-t border-brand-silver">
                <p className="text-xs font-semibold text-brand-gray uppercase tracking-wide mb-1">Notes</p>
                <p className="text-sm text-brand-gray">{order.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* We will call you notice */}
        <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <Clock className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
          <p className="text-sm text-brand-gray leading-relaxed">
            We will contact you at{' '}
            <span className="font-bold text-brand-black">{order.phone}</span>{' '}
            shortly to confirm your order and arrange delivery.
          </p>
        </div>

        {/* CTA */}
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

export default function CheckoutPage() {
  const { items, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    city: '',
    notes: '',
  });

  // Look up customer by phone and pre-fill the form
  const lookupByPhone = useCallback(async (phone: string) => {
    const normalized = phone.trim().replace(/^(\+961|00961)/, '');
    if (!normalized) return;
    setIsLookingUp(true);
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(normalized)}`);
      const json = await res.json();
      if (json.found && json.customer) {
        const c = json.customer;
        const addr = (c.addresses ?? [])[0] ?? {};
        setFormData((prev) => ({
          ...prev,
          firstName: c.first_name || prev.firstName,
          lastName:  c.last_name  || prev.lastName,
          email:     c.email      || prev.email,
          street:    addr.street  || prev.street,
          city:      addr.city    || prev.city,
        }));
      }
    } catch { /* silent */ } finally {
      setIsLookingUp(false);
    }
  }, []);

  // On mount: if we have a saved phone in localStorage, auto-fill and look up customer
  useEffect(() => {
    const raw = localStorage.getItem('skmei-phone');
    if (raw) {
      const localPhone = raw.trim().replace(/^(\+961|00961)/, '');
      setFormData((prev) => ({ ...prev, phone: localPhone }));
      lookupByPhone(localPhone);
    }
  }, [lookupByPhone]);

  const handlePhoneBlur = () => lookupByPhone(formData.phone);

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 50 ? 0 : 4;
  const discountAmount = appliedCoupon ? Math.round(subtotal * appliedCoupon.discount) / 100 : 0;
  const total = subtotal + shipping - discountAmount;
  const totalItems = getTotalItems();

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
        setCouponError(data.error || 'Invalid coupon code. Please try again.');
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError('Failed to validate coupon. Please try again.');
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput('');
    setCouponError('');
  };

  const lebanonCities = [
    'Tripoli', 'Beirut', 'Saida', 'Tyre', 'Jounieh',
    'Byblos', 'Zahle', 'Baalbek', 'Nabatieh', 'Batroun', 'Other',
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => { const n = { ...prev }; delete n[name]; return n; });
    }
  };

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
    if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.street.trim()) newErrors.street = 'Street address is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const orderItems = items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.images[0] ?? null,
    }));

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer_name: `${formData.firstName} ${formData.lastName}`.trim(),
          customer_phone: formData.phone,
          customer_email: formData.email || null,
          items: orderItems,
          subtotal,
          shipping,
          discount: discountAmount,
          coupon_code: appliedCoupon?.code ?? null,
          total,
          address: { street: formData.street, city: formData.city },
          notes: formData.notes || null,
          status: 'pending',
        }),
      });
      const data = await res.json();
      clearCart();
      setPlacedOrder({
        orderId: data.orderId ?? 'unknown',
        orderNumber: data.orderNumber ?? null,
        customerName: `${formData.firstName} ${formData.lastName}`.trim(),
        phone: formData.phone,
        email: formData.email,
        street: formData.street,
        city: formData.city,
        notes: formData.notes,
        items: orderItems,
        subtotal,
        shipping,
        discountAmount,
        couponCode: appliedCoupon?.code ?? null,
        total,
        placedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Failed to save order:', err);
      setIsSubmitting(false);
    }
  };

  if (placedOrder) return <OrderConfirmation order={placedOrder} />;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-brand-gray" />
            </div>
            <h1 className="text-2xl font-bold text-brand-black mb-4">Your cart is empty</h1>
            <p className="text-brand-gray mb-8">Add items to your cart before checking out</p>
            <Link
              href="/store/products"
              className="inline-flex items-center justify-center bg-brand-red text-white px-8 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors"
            >
              <ShoppingBag className="w-5 h-5 mr-2" />
              Start Shopping
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <Link
            href="/store/products"
            className="inline-flex items-center text-brand-gray hover:text-brand-red transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Link>
          <h1 className="text-2xl md:text-3xl font-bold text-brand-black mb-2">Checkout</h1>
          <p className="text-brand-gray">Complete your order</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-white rounded-lg shadow-sm p-6 md:p-8">
                {/* Progress Steps */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${currentStep >= step ? 'bg-brand-red text-white' : 'bg-gray-200 text-brand-gray'}`}>
                          {step}
                        </div>
                        {step < 3 && <div className={`flex-1 h-1 mx-2 ${currentStep > step ? 'bg-brand-red' : 'bg-gray-200'}`} />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-brand-gray">
                    <span>Contact</span>
                    <span>Shipping</span>
                    <span>Payment</span>
                  </div>
                </div>

                {/* Step 1 */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-brand-black mb-4">Contact Information</h3>
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-2">Phone Number *</label>
                      <div className={`flex rounded-lg overflow-hidden border-2 ${errors.phone ? 'border-red-500' : 'border-gray-300 focus-within:border-brand-red'}`}>
                        <span className="flex items-center px-3 bg-gray-100 border-r-2 border-gray-300 text-brand-black font-semibold text-sm shrink-0 select-none">
                          +961
                        </span>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                          onBlur={handlePhoneBlur}
                          placeholder="XX XXX XXX"
                          className="flex-1 px-3 py-3 bg-white focus:outline-none text-sm" />
                        {isLookingUp && (
                          <span className="flex items-center pr-3">
                            <svg className="w-4 h-4 text-brand-red animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                      <p className="text-xs text-brand-gray mt-1">Enter your phone and we'll auto-fill your saved info.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-brand-black mb-2">First Name *</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red ${errors.firstName ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-brand-black mb-2">Last Name *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red ${errors.lastName ? 'border-red-500' : 'border-gray-300'}`} />
                        {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-2">Email Address *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />
                      {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <button type="button" onClick={handleNext} className="w-full bg-brand-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-4">
                      Continue to Shipping
                    </button>
                  </div>
                )}

                {/* Step 2 */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-brand-black mb-4">Shipping Address</h3>
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-2">Street Address *</label>
                      <input type="text" name="street" value={formData.street} onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red ${errors.street ? 'border-red-500' : 'border-gray-300'}`} />
                      {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-2">City *</label>
                      <select name="city" value={formData.city} onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red ${errors.city ? 'border-red-500' : 'border-gray-300'}`}>
                        <option value="">Select City</option>
                        {lebanonCities.map((city) => <option key={city} value={city}>{city}</option>)}
                      </select>
                      {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-2">Delivery Notes (Optional)</label>
                      <textarea name="notes" value={formData.notes} onChange={handleChange} rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
                        placeholder="Any special delivery instructions..." />
                    </div>
                    <button type="button" onClick={handleNext} className="w-full bg-brand-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-4">
                      Continue to Payment
                    </button>
                    <button type="button" onClick={() => setCurrentStep(1)} className="w-full border-2 border-gray-300 text-brand-gray px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                      Back to Contact Info
                    </button>
                  </div>
                )}

                {/* Step 3 */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-brand-black mb-4">Payment Method</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-4 p-4 border-2 border-brand-red rounded-lg cursor-pointer bg-red-50">
                        <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 text-brand-red" />
                        <Banknote className="w-6 h-6 text-brand-red" />
                        <div className="flex-1">
                          <p className="font-semibold text-brand-black">Cash on Delivery</p>
                          <p className="text-sm text-brand-gray">Pay when you receive your order</p>
                        </div>
                      </label>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg mt-6">
                      <h4 className="font-semibold text-brand-black mb-2">Order Summary</h4>
                      <p className="text-sm text-brand-gray mb-1">{formData.firstName} {formData.lastName}</p>
                      <p className="text-sm text-brand-gray mb-1">{formData.email}</p>
                      <p className="text-sm text-brand-gray mb-1">{formData.phone}</p>
                      <p className="text-sm text-brand-gray">{formData.street}, {formData.city}</p>
                    </div>
                    <button type="submit" disabled={isSubmitting}
                      className="w-full bg-brand-red text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed">
                      {isSubmitting ? 'Processing...' : `Place Order - ${formatPrice(total)}`}
                    </button>
                    <button type="button" onClick={() => setCurrentStep(2)} className="w-full border-2 border-gray-300 text-brand-gray px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors">
                      Back to Shipping
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold text-brand-black mb-6">Order Summary</h2>
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                        <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-brand-red text-white text-xs rounded-full flex items-center justify-center font-bold shadow">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-black line-clamp-2">{item.product.name}</p>
                        <p className="text-sm text-brand-gray">{formatPrice(item.product.price)} × {item.quantity}</p>
                      </div>
                      <p className="font-semibold text-brand-black text-sm">{formatPrice(item.product.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="border-t pt-4 mb-4">
                  <p className="text-sm font-semibold text-brand-black mb-2 flex items-center gap-1.5">
                    <Tag className="w-4 h-4 text-brand-red" /> Coupon Code
                  </p>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2.5">
                      <div>
                        <p className="text-sm font-bold text-green-700">{appliedCoupon.code}</p>
                        <p className="text-xs text-green-600">{appliedCoupon.discount}% discount applied</p>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon} className="text-green-600 hover:text-red-500 transition-colors p-1">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div>
                      <div className="flex gap-2">
                        <input type="text" value={couponInput}
                          onChange={(e) => { setCouponInput(e.target.value.toUpperCase()); setCouponError(''); }}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleApplyCoupon())}
                          placeholder="Enter code"
                          className={`flex-1 px-3 py-2 border-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-red uppercase tracking-wide ${couponError ? 'border-red-400' : 'border-gray-200'}`} />
                        <button type="button" onClick={handleApplyCoupon} className="px-4 py-2 bg-brand-black text-white rounded-lg text-sm font-semibold hover:bg-brand-gray-dark transition-colors">
                          Apply
                        </button>
                      </div>
                      {couponError && <p className="text-red-500 text-xs mt-1.5">{couponError}</p>}
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between text-brand-gray">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-brand-gray">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-green-600 font-medium">
                      <span>Discount ({appliedCoupon.discount}%)</span>
                      <span>-{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  {subtotal < 50 && (
                    <div className="text-xs text-brand-gray bg-gray-50 p-3 rounded">
                      Add {formatPrice(50 - subtotal)} more for free shipping
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-brand-black pt-3 border-t">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                <div className="mt-6 pt-6 border-t space-y-3">
                  <div className="flex items-start gap-3 text-sm">
                    <Truck className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-brand-black">Delivery in 2–4 days</p>
                      <p className="text-xs text-brand-gray mt-0.5">Fast & reliable across all Lebanon</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <CheckCircle2 className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-brand-black">Every order inspected</p>
                      <p className="text-xs text-brand-gray mt-0.5">We carefully check your order before shipping</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 text-sm">
                    <ShieldCheck className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-brand-black">Warranty against defects</p>
                      <p className="text-xs text-brand-gray mt-0.5">1-year warranty on all products</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
