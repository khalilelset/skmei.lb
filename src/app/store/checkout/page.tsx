'use client';

import { useState } from 'react';
import { useCartStore } from '@/store/cartStore';
import { useProfileStore } from '@/store/profileStore';
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
} from 'lucide-react';

export default function CheckoutPage() {
  const { items, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const { profile } = useProfileStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Pre-fill from saved profile
  const nameParts = profile.name.trim().split(' ');
  const defaultFirst = nameParts[0] || '';
  const defaultLast = nameParts.slice(1).join(' ') || '';
  const hasProfileData = !!(profile.name || profile.email || profile.phone);

  const [formData, setFormData] = useState({
    firstName: defaultFirst,
    lastName: defaultLast,
    email: profile.email,
    phone: profile.phone,
    street: profile.saveAddress ? profile.address.street : '',
    city: profile.saveAddress ? profile.address.city : '',
    notes: '',
  });

  const subtotal = getTotalPrice();
  const shipping = subtotal >= 50 ? 0 : 5;
  const total = subtotal + shipping;
  const totalItems = getTotalItems();

  const lebanonCities = [
    'Tripoli',
    'Beirut',
    'Saida',
    'Tyre',
    'Jounieh',
    'Byblos',
    'Zahle',
    'Baalbek',
    'Nabatieh',
    'Batroun',
    'Other',
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
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
    }
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
    if (currentStep === 1 && validateStep1()) {
      setCurrentStep(2);
    } else if (currentStep === 2 && validateStep2()) {
      setCurrentStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setOrderPlaced(true);
      clearCart();
    }, 1500);
  };

  if (orderPlaced) {
    return (
      <div className="min-h-screen bg-brand-silver-light flex items-center justify-center px-4 py-16">
        <div className="max-w-md w-full text-center">
          {/* Animated checkmark circle */}
          <div className="relative w-28 h-28 mx-auto mb-8">
            <div className="absolute inset-0 bg-brand-red/10 rounded-full animate-ping opacity-40" />
            <div className="relative w-28 h-28 bg-brand-red rounded-full flex items-center justify-center shadow-xl shadow-brand-red/30">
              <svg className="w-14 h-14 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-3xl font-bold text-brand-black mb-3">Order Placed!</h1>
          <p className="text-brand-gray mb-2 text-base leading-relaxed">
            Thank you, <span className="font-semibold text-brand-black">{formData.firstName}</span>! Your order has been received.
          </p>
          <p className="text-brand-gray text-sm mb-8 leading-relaxed">
            We will contact you on{' '}
            <span className="font-semibold text-brand-black">{formData.phone}</span>{' '}
            to confirm your order and arrange delivery.
          </p>

          {/* Info cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white rounded-xl p-4 border border-brand-silver shadow-sm">
              <div className="w-9 h-9 bg-brand-red/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Truck className="w-5 h-5 text-brand-red" />
              </div>
              <p className="text-xs font-semibold text-brand-black">Delivery</p>
              <p className="text-xs text-brand-gray mt-0.5">2–4 days</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-brand-silver shadow-sm">
              <div className="w-9 h-9 bg-brand-red/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <Banknote className="w-5 h-5 text-brand-red" />
              </div>
              <p className="text-xs font-semibold text-brand-black">Payment</p>
              <p className="text-xs text-brand-gray mt-0.5">Cash on delivery</p>
            </div>
            <div className="bg-white rounded-xl p-4 border border-brand-silver shadow-sm">
              <div className="w-9 h-9 bg-brand-red/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                <ShieldCheck className="w-5 h-5 text-brand-red" />
              </div>
              <p className="text-xs font-semibold text-brand-black">Authentic</p>
              <p className="text-xs text-brand-gray mt-0.5">1-year warranty</p>
            </div>
          </div>

          <Link
            href="/store/products"
            className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-brand-red hover:bg-brand-red-dark text-white font-semibold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-brand-red/30"
          >
            <ShoppingBag className="w-5 h-5" />
            Continue Shopping
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-16 text-center">
          <div className="max-w-md mx-auto">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 text-brand-gray" />
            </div>
            <h1 className="text-2xl font-bold text-brand-black mb-4">
              Your cart is empty
            </h1>
            <p className="text-brand-gray mb-8">
              Add items to your cart before checking out
            </p>
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
            href="/store/cart"
            className="inline-flex items-center text-brand-gray hover:text-brand-red transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Cart
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
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                            currentStep >= step
                              ? 'bg-brand-red text-white'
                              : 'bg-gray-200 text-brand-gray'
                          }`}
                        >
                          {step}
                        </div>
                        {step < 3 && (
                          <div
                            className={`flex-1 h-1 mx-2 ${
                              currentStep > step ? 'bg-brand-red' : 'bg-gray-200'
                            }`}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-between text-xs text-brand-gray">
                    <span>Contact</span>
                    <span>Shipping</span>
                    <span>Payment</span>
                  </div>
                </div>

                {/* Step 1: Contact Information */}
                {currentStep === 1 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-brand-black mb-4">Contact Information</h3>

                    {hasProfileData && (
                      <div className="flex items-center gap-3 bg-brand-red/5 border border-brand-red/20 rounded-lg px-4 py-3 mb-2">
                        <User className="w-4 h-4 text-brand-red shrink-0" />
                        <p className="text-sm text-brand-gray">
                          Fields pre-filled from your{' '}
                          <Link href="/account" className="text-brand-red font-semibold hover:underline">
                            saved profile
                          </Link>
                          . You can edit them below.
                        </p>
                      </div>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-semibold text-brand-black mb-2">
                          First Name *
                        </label>
                        <input
                          type="text"
                          name="firstName"
                          value={formData.firstName}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red ${
                            errors.firstName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.firstName && <p className="text-red-600 text-sm mt-1">{errors.firstName}</p>}
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-brand-black mb-2">
                          Last Name *
                        </label>
                        <input
                          type="text"
                          name="lastName"
                          value={formData.lastName}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red ${
                            errors.lastName ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.lastName && <p className="text-red-600 text-sm mt-1">{errors.lastName}</p>}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-2">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red ${
                          errors.email ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-2">
                        Phone Number *
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        value={formData.phone}
                        onChange={handleChange}
                        placeholder="+961 XX XXX XXX"
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red ${
                          errors.phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.phone && <p className="text-red-600 text-sm mt-1">{errors.phone}</p>}
                    </div>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full bg-brand-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-4"
                    >
                      Continue to Shipping
                    </button>
                  </div>
                )}

                {/* Step 2: Shipping Address */}
                {currentStep === 2 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-brand-black mb-4">Shipping Address</h3>
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-2">
                        Street Address *
                      </label>
                      <input
                        type="text"
                        name="street"
                        value={formData.street}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red ${
                          errors.street ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.street && <p className="text-red-600 text-sm mt-1">{errors.street}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-2">
                        City *
                      </label>
                      <select
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red ${
                          errors.city ? 'border-red-500' : 'border-gray-300'
                        }`}
                      >
                        <option value="">Select City</option>
                        {lebanonCities.map((city) => (
                          <option key={city} value={city}>{city}</option>
                        ))}
                      </select>
                      {errors.city && <p className="text-red-600 text-sm mt-1">{errors.city}</p>}
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-brand-black mb-2">
                        Delivery Notes (Optional)
                      </label>
                      <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows={3}
                        className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-red resize-none"
                        placeholder="Any special delivery instructions..."
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleNext}
                      className="w-full bg-brand-red text-white px-6 py-3 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-4"
                    >
                      Continue to Payment
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="w-full border-2 border-gray-300 text-brand-gray px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Back to Contact Info
                    </button>
                  </div>
                )}

                {/* Step 3: Payment Method */}
                {currentStep === 3 && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-brand-black mb-4">Payment Method</h3>
                    <div className="space-y-3">
                      <label className="flex items-center gap-4 p-4 border-2 border-brand-red rounded-lg cursor-pointer bg-red-50">
                        <input
                          type="radio"
                          name="payment"
                          value="cod"
                          checked={paymentMethod === 'cod'}
                          onChange={(e) => setPaymentMethod(e.target.value)}
                          className="w-5 h-5 text-brand-red"
                        />
                        <Banknote className="w-6 h-6 text-brand-red" />
                        <div className="flex-1">
                          <p className="font-semibold text-brand-black">Cash on Delivery</p>
                          <p className="text-sm text-brand-gray">Pay when you receive your order</p>
                        </div>
                      </label>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg mt-6">
                      <h4 className="font-semibold text-brand-black mb-2">Order Summary</h4>
                      <p className="text-sm text-brand-gray mb-1">
                        {formData.firstName} {formData.lastName}
                      </p>
                      <p className="text-sm text-brand-gray mb-1">{formData.email}</p>
                      <p className="text-sm text-brand-gray mb-1">{formData.phone}</p>
                      <p className="text-sm text-brand-gray">{formData.street}, {formData.city}</p>
                    </div>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full bg-brand-red text-white px-6 py-4 rounded-lg font-semibold hover:bg-red-700 transition-colors mt-4 disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                      {isSubmitting ? 'Processing...' : `Place Order - ${formatPrice(total)}`}
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="w-full border-2 border-gray-300 text-brand-gray px-6 py-3 rounded-lg font-semibold hover:bg-gray-50 transition-colors"
                    >
                      Back to Shipping
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Order Summary - Sticky Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-lg shadow-sm p-6 sticky top-4">
                <h2 className="text-xl font-bold text-brand-black mb-6">Order Summary</h2>

                <div className="space-y-4 mb-6 max-h-64 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.product.id} className="flex gap-3">
                      <div className="relative w-16 h-16 shrink-0 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={item.product.images[0]}
                          alt={item.product.name}
                          fill
                          className="object-cover"
                        />
                        <span className="absolute top-0.5 right-0.5 w-5 h-5 bg-brand-red text-white text-xs rounded-full flex items-center justify-center font-bold shadow">
                          {item.quantity}
                        </span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-brand-black line-clamp-2">
                          {item.product.name}
                        </p>
                        <p className="text-sm text-brand-gray">
                          {formatPrice(item.product.price)} × {item.quantity}
                        </p>
                      </div>
                      <p className="font-semibold text-brand-black text-sm">
                        {formatPrice(item.product.price * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 border-t pt-4">
                  <div className="flex justify-between text-brand-gray">
                    <span>Subtotal ({totalItems} items)</span>
                    <span>{formatPrice(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-brand-gray">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-green-600 font-semibold' : ''}>
                      {shipping === 0 ? 'FREE' : formatPrice(shipping)}
                    </span>
                  </div>
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
