'use client';

import { useState, useEffect, useCallback } from 'react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, getTierTotal, FREE_SHIPPING_THRESHOLD, SHIPPING_COST, getBrandBundleSavings, type BrandWithTiers } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import {
  ShoppingBag,
  ArrowLeft,
  ShieldCheck,
  Banknote,
  User,
  Tag,
  X,
  XCircle,
  Clock,
  Lock,
  Wallet,
} from 'lucide-react';
import { OrderConfirmation, PlacedOrder } from '@/components/store/OrderConfirmation';
import PhoneInputField, { isValidPhoneNumber } from '@/components/ui/PhoneInputField';
import { LEBANON_AREAS } from '@/lib/lebanon-areas';


export default function CheckoutPage() {
  const { items, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whishError, setWhishError] = useState('');
  const [paymentFailed, setPaymentFailed] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    maxDiscount: number | null;
    applyOnSale: boolean;
    brands: string[] | null;
  } | null>(null);
  const [couponError, setCouponError] = useState('');
  const [brands, setBrands] = useState<BrandWithTiers[]>([]);

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    street: '',
    area: '',
    city: '',
    notes: '',
  });

  // Look up customer by phone and pre-fill the form
  const lookupByPhone = useCallback(async (phone: string) => {
    // Only look up Lebanese numbers (+961); extract the local part for the API
    const isLebanese = phone.startsWith('+961') || phone.startsWith('00961');
    const normalized = phone.trim().replace(/^(\+961|00961)/, '').replace(/\D/g, '');
    if (!isLebanese || !normalized) return;
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
          street:    [addr.street, addr.building].filter(Boolean).join(', ') || prev.street,
          area:      addr.area      || prev.area,
          city:      addr.city      || prev.city,
        }));
      }
    } catch { /* silent */ } finally {
      setIsLookingUp(false);
    }
  }, []);

  useEffect(() => {
    fetch('/api/brands').then(r => r.json()).then(d => setBrands(Array.isArray(d) ? d : [])).catch(() => {});
  }, []);

  // On mount: restore saved profile then freshen via API lookup
  useEffect(() => {
    const raw = localStorage.getItem('skmei-phone');
    if (!raw) return;
    const phone = raw.startsWith('+') ? raw : `+961${raw.replace(/\D/g, '')}`;
    const savedName  = localStorage.getItem('skmei-name')  ?? '';
    const savedEmail = localStorage.getItem('skmei-email') ?? '';
    const nameParts  = savedName.trim().split(/\s+/);
    setFormData((prev) => ({
      ...prev,
      phone,
      firstName: nameParts[0] || prev.firstName,
      lastName:  nameParts.slice(1).join(' ') || prev.lastName,
      email:     savedEmail || prev.email,
    }));
    lookupByPhone(phone);
  }, [lookupByPhone]);

  // On mount: restore form if returning from a failed Whish payment
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('resume') !== '1') return;
    const saved = localStorage.getItem('skmei-pending-checkout');
    if (!saved) return;
    try {
      const { formData: savedForm, appliedCoupon: savedCoupon, paymentMethod: savedMethod } = JSON.parse(saved);
      if (savedForm) setFormData(savedForm);
      if (savedCoupon) setAppliedCoupon(savedCoupon);
      // ?method=cod forces cash, otherwise restore what was selected
      setPaymentMethod(params.get('method') === 'cod' ? 'cod' : (savedMethod ?? 'whish'));
      setCurrentStep(3);
      setPaymentFailed(true);
    } catch { /* ignore malformed data */ }
  }, []);

  const handlePhoneBlur = () => lookupByPhone(formData.phone);

  const handlePhoneChange = (phone: string) => {
    setFormData((prev) => ({ ...prev, phone }));
    if (errors.phone) setErrors((prev) => { const n = { ...prev }; delete n.phone; return n; });
  };

  const subtotal = getTotalPrice();
  const bundleSavings = getBrandBundleSavings(items, brands);
  const afterBundleSubtotal = subtotal - bundleSavings;
  const shipping = afterBundleSubtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

  // Coupon: filter by brand restriction and/or sale exclusion
  const applyableSubtotal = appliedCoupon
    ? items.reduce((sum, i) => {
        const inBrand = !appliedCoupon.brands || appliedCoupon.brands.includes(i.product.brand ?? '');
        const isSale = !!i.product.originalPrice;
        if (!inBrand) return sum;
        if (!appliedCoupon.applyOnSale && isSale) return sum;
        return sum + getTierTotal(i.product.priceTiers, i.product.price, i.quantity) + (i.selectedBox?.price ?? 0) * i.quantity;
      }, 0)
    : afterBundleSubtotal;

  const rawDiscount = appliedCoupon ? (Math.max(0, applyableSubtotal) * appliedCoupon.discount) / 100 : 0;
  const discountAmount = appliedCoupon
    ? appliedCoupon.maxDiscount != null
      ? Math.min(rawDiscount, appliedCoupon.maxDiscount)
      : rawDiscount
    : 0;

  const rawTotal = afterBundleSubtotal + shipping - discountAmount;
  const total = (appliedCoupon || bundleSavings > 0) ? Math.ceil(rawTotal * 2) / 2 : rawTotal;
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
        setAppliedCoupon({ code: data.code, discount: data.discount, maxDiscount: data.maxDiscount ?? null, applyOnSale: data.applyOnSale ?? true, brands: data.brands ?? null });
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


  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    if (name === 'area') {
      setFormData((prev) => ({ ...prev, area: value, city: '' }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
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
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!isValidPhoneNumber(formData.phone)) {
      newErrors.phone = 'Please enter a valid phone number for the selected country';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.area.trim()) newErrors.area = 'Region / Governorate is required';
    if (!formData.city.trim()) newErrors.city = 'City is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (currentStep === 1 && validateStep1()) setCurrentStep(2);
    else if (currentStep === 2 && validateStep2()) setCurrentStep(3);
  };

  const getWarrantyLabel = async (brandName: string): Promise<string> => {
    try {
      const res = await fetch('/api/brands');
      const brands: { name: string; warranty_value?: number; warranty_unit?: string }[] = await res.json();
      const brand = brands.find((b) => b.name.toLowerCase() === brandName.toLowerCase());
      if (brand?.warranty_value && brand?.warranty_unit) {
        return `${brand.warranty_value} ${brand.warranty_unit} included`;
      }
    } catch { /* fall through */ }
    return '1-year included';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setWhishError('');

    const orderItems = items.map((item) => {
      const productTotal = getTierTotal(item.product.priceTiers, item.product.price, item.quantity);
      const pricePerUnit = productTotal / item.quantity;
      return {
        id: item.product.id,
        name: item.product.name,
        price: pricePerUnit + (item.selectedBox?.price ?? 0),
        quantity: item.quantity,
        image: item.product.images[0] ?? null,
        box: item.selectedBox
          ? { code: item.selectedBox.code, type: item.selectedBox.type, price: item.selectedBox.price, image: item.selectedBox.image ?? null }
          : null,
      };
    });

    const orderPayload = {
      customer_name:  `${formData.firstName} ${formData.lastName}`.trim(),
      customer_phone: formData.phone,
      customer_email: formData.email || null,
      items:          orderItems,
      subtotal,
      shipping,
      discount:       discountAmount + bundleSavings,
      coupon_code:    appliedCoupon?.code ?? null,
      total,
      address:        { street: formData.street, area: formData.area, city: formData.city },
      notes:          formData.notes || null,
    };

    try {
      if (paymentMethod === 'whish') {
        const res  = await fetch('/api/whish/initiate', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify(orderPayload),
        });
        const data = await res.json();
        if (!res.ok || !data.collectUrl) {
          setWhishError(data.error ?? 'Payment initiation failed. Please try again.');
          setIsSubmitting(false);
          return;
        }
        localStorage.setItem('skmei-phone', formData.phone);
        localStorage.setItem('skmei-pending-checkout', JSON.stringify({ formData, appliedCoupon, paymentMethod: 'whish' }));
        window.location.href = data.collectUrl;
      } else {
        const res  = await fetch('/api/orders', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ...orderPayload, status: 'pending' }),
        });
        const data = await res.json();
        const primaryBrand = items[0]?.product.brand ?? '';
        const warrantyLabel = await getWarrantyLabel(primaryBrand);
        localStorage.setItem('skmei-phone', formData.phone);
        clearCart();
        setPlacedOrder({
          orderId:       data.orderId ?? 'unknown',
          orderNumber:   data.orderNumber ?? null,
          customerName:  `${formData.firstName} ${formData.lastName}`.trim(),
          phone:         formData.phone,
          email:         formData.email,
          street:        formData.street,
          area:          formData.area,
          city:          formData.city,
          notes:         formData.notes,
          items:         orderItems.map((i) => ({ ...i, image: i.image ?? null })),
          subtotal,
          shipping,
          discountAmount,
          couponCode:    appliedCoupon?.code ?? null,
          total,
          placedAt:      new Date().toISOString(),
          warrantyLabel,
        });
      }
    } catch (err) {
      console.error('Failed to save order:', err);
      if (paymentMethod === 'whish') {
        setWhishError('An unexpected error occurred. Please try again.');
      }
      setIsSubmitting(false);
    }
  };

  if (placedOrder) return <OrderConfirmation order={placedOrder} />;

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-brand-black">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-brand-red/10 border border-brand-red/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-brand-red/60" />
            </div>
            <h1 className="text-2xl font-black text-white mb-4">Your cart is empty</h1>
            <p className="text-white/40 mb-8">Add items to your cart before checking out</p>
            <Link
              href="/store/products"
              className="inline-flex items-center justify-center bg-brand-red text-white px-8 py-3 rounded-lg font-bold hover:bg-brand-red-dark transition-colors"
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
    <div className="min-h-screen bg-brand-black">
      {/* Sticky top secure checkout bar */}
      <div className="sticky top-0 z-40 bg-brand-black/95 backdrop-blur-md border-b border-white/8">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Link href="/store/products" className="inline-flex items-center gap-1.5 text-white/40 hover:text-white transition-colors text-sm">
            <ArrowLeft className="w-4 h-4" />
            Back
          </Link>
          <div className="flex items-center gap-2 text-xs font-bold text-white/60 tracking-wide">
            <Lock className="w-3.5 h-3.5 text-brand-red" />
            Secure Checkout
          </div>
          <div className="w-16" />
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-6 md:mb-8">
          <h1 className="text-2xl md:text-3xl font-black text-white mb-2 tracking-tight">Checkout</h1>
          <p className="text-white/40 text-sm">Complete your order</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
            {/* Checkout Form */}
            <div className="lg:col-span-2">
              <div className="bg-white/4 rounded-2xl border border-white/8 p-6 md:p-8">
                {/* Progress Steps */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-3">
                    {[1, 2, 3].map((step) => (
                      <div key={step} className="flex items-center flex-1">
                        <div className={`w-9 h-9 rounded-full flex items-center justify-center font-black text-sm transition-colors ${currentStep >= step ? 'bg-brand-red text-white shadow-md shadow-brand-red/30' : 'bg-white/8 text-white/35 border border-white/10'}`}>
                          {currentStep > step ? (
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                            </svg>
                          ) : step}
                        </div>
                        {step < 3 && <div className={`flex-1 h-0.5 mx-2 transition-colors duration-500 ${currentStep > step ? 'bg-brand-red' : 'bg-white/10'}`} />}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-white/40">
                    <span>Contact</span>
                    <span>Shipping</span>
                    <span>Payment</span>
                  </div>
                </div>

                {/* Step 1 */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-2">Phone Number *</label>
                      <PhoneInputField
                        value={formData.phone}
                        onChange={handlePhoneChange}
                        onBlur={handlePhoneBlur}
                        error={errors.phone}
                        variant="dark"
                      />
                      {isLookingUp && (
                        <p className="text-xs text-brand-red/70 mt-1 flex items-center gap-1.5">
                          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                          </svg>
                          Looking up saved info…
                        </p>
                      )}
                      {!isLookingUp && !errors.phone && (
                        <p className="text-xs text-white/35 mt-1">Enter your phone and we&apos;ll auto-fill your saved info.</p>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-2">First Name *</label>
                        <input type="text" name="firstName" value={formData.firstName} onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red text-white bg-white/6 border ${errors.firstName ? 'border-red-500' : 'border-white/12'} placeholder-white/25`} />
                        {errors.firstName && <p className="text-red-500 text-sm mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-2">Last Name *</label>
                        <input type="text" name="lastName" value={formData.lastName} onChange={handleChange}
                          className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red text-white bg-white/6 border ${errors.lastName ? 'border-red-500' : 'border-white/12'} placeholder-white/25`} />
                        {errors.lastName && <p className="text-red-500 text-sm mt-1">{errors.lastName}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-2">Email Address *</label>
                      <input type="email" name="email" value={formData.email} onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red text-white bg-white/6 border ${errors.email ? 'border-red-500' : 'border-white/12'} placeholder-white/25`} />
                      {errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <button type="button" onClick={handleNext} className="w-full bg-brand-red text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brand-red-dark transition-colors mt-4">
                      Continue to Shipping
                    </button>
                  </div>
                )}

                {/* Step 2 */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Shipping Address</h3>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-2">Region / Governorate *</label>
                      <select name="area" value={formData.area} onChange={handleChange}
                        className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red bg-white/6 border text-white ${errors.area ? 'border-red-500' : 'border-white/12'}`}>
                        <option value="" className="bg-[#1a1a1a]">Select Region / Governorate</option>
                        {Object.keys(LEBANON_AREAS).map((area) => (
                          <option key={area} value={area} className="bg-[#1a1a1a]">{area}</option>
                        ))}
                      </select>
                      {errors.area && <p className="text-red-500 text-sm mt-1">{errors.area}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-2">City *</label>
                      <select name="city" value={formData.city} onChange={handleChange}
                        disabled={!formData.area}
                        className={`w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red bg-white/6 border text-white disabled:opacity-40 disabled:cursor-not-allowed ${errors.city ? 'border-red-500' : 'border-white/12'}`}>
                        <option value="" className="bg-[#1a1a1a]">{formData.area ? 'Select City' : 'Select Region first'}</option>
                        {[...new Set(LEBANON_AREAS[formData.area] ?? [])].map((city, i) => (
                          <option key={`${city}-${i}`} value={city} className="bg-[#1a1a1a]">{city}</option>
                        ))}
                      </select>
                      {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-2">More Address <span className="font-normal text-white/30">(Optional)</span></label>
                      <input type="text" name="street" value={formData.street} onChange={handleChange}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red bg-white/6 border border-white/12 text-white placeholder-white/25"
                        placeholder="Street, Building, Floor..." />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase tracking-[0.18em] text-white/60 mb-2">Delivery Notes <span className="font-normal text-white/30">(Optional)</span></label>
                      <textarea name="notes" value={formData.notes} onChange={handleChange} rows={2}
                        className="w-full px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-red/20 focus:border-brand-red bg-white/6 border border-white/12 text-white placeholder-white/25 resize-none"
                        placeholder="Any special delivery instructions..." />
                    </div>
                    <button type="button" onClick={handleNext} className="w-full bg-brand-red text-white px-6 py-3.5 rounded-xl font-bold hover:bg-brand-red-dark transition-colors mt-4">
                      Continue to Payment
                    </button>
                    <button type="button" onClick={() => setCurrentStep(1)} className="w-full border border-white/12 text-white/40 px-6 py-3 rounded-xl font-semibold hover:bg-white/5 hover:text-white/60 transition-colors">
                      Back to Contact Info
                    </button>
                  </div>
                )}

                {/* Step 3 */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white mb-4">Payment Method</h3>

                    {paymentFailed && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-start gap-3">
                        <XCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                        <div>
                          <p className="text-red-400 font-semibold text-sm">Payment was not completed</p>
                          <p className="text-white/50 text-xs mt-0.5">Your cart is preserved. Try again or choose Cash on Delivery.</p>
                        </div>
                      </div>
                    )}

                    <div className="space-y-3">
                      {/* Cash on Delivery */}
                      <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'cod' ? 'border-brand-red bg-brand-red/8' : 'border-white/10 hover:border-white/25'}`}>
                        <input type="radio" name="payment" value="cod" checked={paymentMethod === 'cod'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 accent-brand-red" />
                        <Banknote className={`w-6 h-6 shrink-0 ${paymentMethod === 'cod' ? 'text-brand-red' : 'text-white/40'}`} />
                        <div className="flex-1">
                          <p className="font-semibold text-white">Cash on Delivery</p>
                          <p className="text-sm text-white/45">Pay when you receive your order</p>
                        </div>
                      </label>
                      {/* Whish Money */}
                      <label className={`flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-colors ${paymentMethod === 'whish' ? 'border-brand-red bg-brand-red/8' : 'border-white/10 hover:border-white/25'}`}>
                        <input type="radio" name="payment" value="whish" checked={paymentMethod === 'whish'} onChange={(e) => setPaymentMethod(e.target.value)} className="w-5 h-5 accent-brand-red" />
                        <Wallet className={`w-6 h-6 shrink-0 ${paymentMethod === 'whish' ? 'text-brand-red' : 'text-white/40'}`} />
                        <div className="flex-1">
                          <p className="font-semibold text-white">Whish Money</p>
                          <p className="text-sm text-white/45">Pay instantly with your Whish wallet</p>
                        </div>
                      </label>
                    </div>
                    <div className="bg-white/5 p-4 rounded-xl mt-6 border border-white/8">
                      <h4 className="font-semibold text-white mb-2 text-sm">Order Summary</h4>
                      <p className="text-sm text-white/50 mb-1">{formData.firstName} {formData.lastName}</p>
                      <p className="text-sm text-white/50 mb-1">{formData.email}</p>
                      <p className="text-sm text-white/50 mb-1">{formData.phone}</p>
                      <p className="text-sm text-white/50">{[formData.area, formData.city, formData.street].filter(Boolean).join(', ')}</p>
                    </div>
                    {/* Trust strip */}
                    <div className="flex items-center justify-center gap-6 py-4 border-t border-white/10 mt-4">
                      {[
                        { icon: ShieldCheck, label: 'Authentic' },
                        { icon: Clock,       label: 'Warranty' },
                        { icon: paymentMethod === 'whish' ? Wallet : Banknote, label: paymentMethod === 'whish' ? 'Whish Money' : 'Cash on Delivery' },
                      ].map(({ icon: Icon, label }) => (
                        <div key={label} className="flex items-center gap-1.5 text-white/40">
                          <Icon className="w-3.5 h-3.5 text-brand-red" />
                          <span className="text-[10px] font-bold uppercase tracking-wide">{label}</span>
                        </div>
                      ))}
                    </div>

                    {whishError && (
                      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                        {whishError}
                      </div>
                    )}

                    {/* Submit button — shimmer */}
                    <button type="submit" disabled={isSubmitting}
                      className="group relative w-full overflow-hidden bg-brand-red text-white px-6 py-5 rounded-xl font-black text-lg hover:bg-brand-red-dark transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-red/30">
                      <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none" />
                      {isSubmitting
                        ? (paymentMethod === 'whish' ? 'Redirecting to Whish...' : 'Processing...')
                        : (paymentMethod === 'whish' ? 'Pay with Whish →' : 'Place Order →')}
                    </button>
                    <button type="button" onClick={() => setCurrentStep(2)} className="w-full border border-white/12 text-white/40 px-6 py-3 rounded-xl font-semibold hover:bg-white/5 hover:text-white/60 transition-colors">
                      Back to Shipping
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary Sidebar — dark premium card */}
            <div className="lg:col-span-1">
              <div className="bg-brand-black rounded-2xl p-6 sticky top-20">
                <h2 className="text-lg font-black text-white mb-6 tracking-tight">Order Summary</h2>
                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden border border-white/20">
                        <Image src={item.product.images[0]} alt={item.product.name} fill className="object-cover" />
                        <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-brand-red text-white text-xs rounded-full flex items-center justify-center font-bold shadow">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-white line-clamp-2">{item.product.name}</p>
                        <p className="text-xs text-white/40 mt-0.5">{formatPrice(getTierTotal(item.product.priceTiers, item.product.price, item.quantity) / item.quantity)} × {item.quantity}</p>
                        {item.selectedBox && (
                          <p className="text-[10px] text-white/35 mt-0.5 flex items-center gap-1">
                            📦 {item.selectedBox.code}
                            {item.selectedBox.price > 0 && (
                              <span className="text-brand-red">+{formatPrice(item.selectedBox.price)}</span>
                            )}
                          </p>
                        )}
                      </div>
                      <p className="font-bold text-white text-sm shrink-0">
                        {formatPrice(getTierTotal(item.product.priceTiers, item.product.price, item.quantity) + (item.selectedBox?.price ?? 0) * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon */}
                <div className="border-t border-white/10 pt-4 mb-4">
                  <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-2 flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-brand-red" /> Coupon Code
                  </p>
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-white/10 border border-white/20 rounded-xl px-3 py-2.5">
                      <div>
                        <p className="text-sm font-bold text-brand-red">{appliedCoupon.code}</p>
                        <p className="text-xs text-white/50">
                          {appliedCoupon.discount}% off
                          {appliedCoupon.maxDiscount != null && ` (up to ${formatPrice(appliedCoupon.maxDiscount)})`}
                          {!appliedCoupon.applyOnSale && ' · excludes sale items'}
                        </p>
                      </div>
                      <button type="button" onClick={handleRemoveCoupon} className="text-white/40 hover:text-brand-red transition-colors p-1">
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
                          className={`flex-1 px-3 py-2.5 bg-white/10 border rounded-xl text-sm text-white placeholder-white/30 focus:outline-none focus:border-brand-red uppercase tracking-wide ${couponError ? 'border-red-400' : 'border-white/20'}`} />
                        <button type="button" onClick={handleApplyCoupon} className="px-4 py-2 bg-brand-red text-white rounded-xl text-sm font-bold hover:bg-brand-red-dark transition-colors">
                          Apply
                        </button>
                      </div>
                      {couponError && <p className="text-brand-red text-xs mt-1.5">{couponError}</p>}
                    </div>
                  )}
                </div>

                <div className="space-y-3 border-t border-white/10 pt-4">
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  {bundleSavings > 0 && (
                    <div className="flex justify-between text-sm text-green-400 font-medium">
                      <span>Bundle Offer</span>
                      <span>−{formatPrice(bundleSavings)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-brand-red font-bold' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-brand-red font-medium">
                      <span>
                        Discount ({appliedCoupon.discount}%
                        {appliedCoupon.maxDiscount != null && `, max ${formatPrice(appliedCoupon.maxDiscount)}`}
                        {appliedCoupon.brands && ` · ${appliedCoupon.brands.join(', ')} only`})
                      </span>
                      <span>−{formatPrice(discountAmount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-black text-white pt-3 border-t border-white/10">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </div>
                </div>

                {/* 100% Secure badge */}
                <div className="mt-5 pt-5 border-t border-white/10 flex items-center justify-center gap-2">
                  <Lock className="w-3.5 h-3.5 text-brand-red" />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/40">100% Secure Checkout</span>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
