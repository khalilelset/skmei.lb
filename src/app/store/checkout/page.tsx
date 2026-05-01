'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { formatPrice } from '@/lib/utils';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
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
  Lock,
  Wallet,
} from 'lucide-react';

interface PlacedOrder {
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
}

function OrderConfirmation({ order }: { order: PlacedOrder }) {
  return (
    <div className="min-h-screen bg-brand-black py-8 px-4">
      <div className="max-w-2xl mx-auto">

        {/* Success hero — spring entrance */}
        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', damping: 20, stiffness: 200 }}
          className="text-center mb-8"
        >
          {/* Layered rings */}
          <div className="relative w-36 h-36 mx-auto mb-5 flex items-center justify-center">
            <div className="absolute w-36 h-36 rounded-full border border-brand-red/20" />
            <div className="absolute w-28 h-28 rounded-full border border-brand-red/10" />
            <div className="absolute w-20 h-20 bg-brand-red rounded-full flex items-center justify-center shadow-xl shadow-brand-red/30">
              <CheckCircle2 className="w-10 h-10 text-white" strokeWidth={2.5} />
            </div>
            {/* Ping runs only twice */}
            <div className="absolute w-36 h-36 rounded-full border border-brand-red/30 animate-ping" style={{ animationIterationCount: 2 }} />
          </div>
          <h1 className="text-4xl sm:text-5xl font-black text-white mb-2 tracking-tight">Order Confirmed!</h1>
          <p className="text-brand-red font-semibold mb-1">Your watch is on its way</p>
          <p className="text-white/45 text-sm">
            Thank you, <span className="font-bold text-white">{order.customerName.split(' ')[0]}</span>! Your order has been received.
          </p>

          {/* Animated fill bar — purely visual, satisfaction cue */}
          <div className="mt-5 h-0.5 max-w-xs mx-auto bg-brand-silver rounded-full overflow-hidden">
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 2, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
              className="h-full bg-brand-red origin-left"
            />
          </div>
        </motion.div>

        {/* Order number + date — dark card */}
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

        {/* Trust badges — red top border on each card */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {[
            { icon: Truck,       title: 'Delivery',  sub: '3–5 days' },
            { icon: Banknote,    title: 'Payment',   sub: 'Cash on delivery' },
            { icon: ShieldCheck, title: 'Warranty',  sub: '1-year included' },
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

        {/* Items ordered */}
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

          {/* Totals */}
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

        {/* Contact + Address */}
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

        {/* We will call you notice */}
        <div className="bg-brand-red/5 border border-brand-red/20 rounded-2xl p-4 flex items-start gap-3 mb-6">
          <Clock className="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
          <p className="text-sm text-white/55 leading-relaxed">
            We will contact you at{' '}
            <span className="font-bold text-white">{order.phone}</span>{' '}
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
  const router = useRouter();
  const { items, getTotalPrice, getTotalItems, clearCart } = useCartStore();
  const [currentStep, setCurrentStep] = useState(1);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [whishError, setWhishError] = useState('');
  const [placedOrder, setPlacedOrder] = useState<PlacedOrder | null>(null);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [couponInput, setCouponInput] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponError, setCouponError] = useState('');

  const LEBANON_AREAS: Record<string, string[]> = {
    'Beirut': [
      'Achrafieh', 'Badaro', 'Hamra', 'Verdun', 'Ras Beirut', 'Corniche El Mazraa',
      'Basta', 'Bourj Hammoud', 'Chiyah', 'Dekwaneh', 'Furn El Chebbak',
      'Geitawi', 'Jdeideh', 'Martyrs Square', 'Mar Elias', 'Mar Mikhael',
      'Msaytbeh', 'Qoreitem', 'Ramlet El Baida', 'Sanayeh', 'Sodeco',
      'Tallet El Khayat', 'Zarif',
    ],
    'Mount Lebanon': [
      // Matn
      'Antelias', 'Bsalim', 'Dbayeh', 'Dekwaneh', 'Fanar', 'Jdeideh', 'Mansourieh',
      'Metn (Naccache)', 'Mtayleb', 'Rabieh', 'Roumieh', 'Sed El Baouchrieh',
      'Sin El Fil', 'Zalka',
      // Metn highlands
      'Beit Mery', 'Broummana', 'Baskinta', 'Bikfaya', 'Ainab',
      // Kesrouane
      'Jounieh', 'Ghazir', 'Adma', 'Bouar', 'Faraya', 'Faqra', 'Jeita', 'Kfardebian', 'Sarba',
      // Jbeil (Byblos)
      'Byblos (Jbeil)', 'Amchit', 'Laqlouq',
      // Batroun
      'Batroun', 'Tannourine', 'Douma',
      // Chouf
      'Aley', 'Aramoun', 'Bhamdoun', 'Bchamoun', 'Choueifat', 'Deir El Qamar',
      'Doha', 'Hadath', 'Jdeideh El Metn', 'Khalde', 'Kfarhbab',
      'Sofar', 'Simone Abou Shakra', 'Yarze',
      // South Matn / Iqlim
      'Baabda', 'Beit El Chaar', 'Damour', 'Jieh', 'Naameh', 'Rmeil',
    ],
    'North Lebanon': [
      // Tripoli district
      'Tripoli', 'Mina', 'Beddawi', 'Qalamoun',
      // Koura
      'Amioun', 'Barsa', 'Btouratij', 'Kousba', 'Shekka',
      // Zgharta
      'Zgharta', 'Ehden', 'Miziara',
      // Bcharre
      'Bcharre', 'Bsharri', 'Hasroun', 'Qadisha Valley',
      // Miniyeh-Danniyeh
      'Miniyeh', 'Sir El Dinniyeh',
      // Batroun (North)
      'Enfeh', 'Chekka',
    ],
    'Akkar': [
      'Halba', 'Andket', 'Qobayat', 'Berkayel', 'Fnaydeq', 'Mhammara',
      'Akkar El Atika', 'Aarsal (border)', 'Rahbe', 'Tal Abbas', 'Wadi Khaled',
    ],
    'Bekaa': [
      'Zahle', 'Bar Elias', 'Taalabaya', 'Saadnayel',
      'Chtaura', 'Taanayel', 'Qabb Elias',
      'Anjar', 'Deir El Ahmar', 'Yohmor', 'Saghbine', 'Lala',
      'Rashaya', 'Yanta', 'Khirbet Qanafar',
    ],
    'Baalbek-Hermel': [
      // Baalbek district
      'Baalbek', 'Taalabaya', 'Britel', 'Nabi Othman', 'Nahleh', 'Iaat',
      'Qsarnaba', 'Sbouba', 'Kherbet Daoud',
      // Hermel district
      'Hermel', 'Yammouneh', 'Hawsh El Oumara', 'Aarsal',
    ],
    'South Lebanon': [
      // Saida district
      'Saida (Sidon)', 'Darb El Sim', 'Ghaziyeh', 'Hlaliyeh', 'Maghdouche',
      'Miyeh Miyeh', 'Sarafand',
      // Jezzine district
      'Jezzine', 'Ain Maarouf', 'Kfarhoune',
      // Tyre district
      'Tyre (Sour)', 'Abbasiyeh', 'Deir Qanoun', 'Qana',
      // Zahrani
      'Zahrani', 'Kafra', 'Adloun',
    ],
    'Nabatieh': [
      'Nabatieh', 'Arnoun', 'Deir Zahrani', 'Kfar Rommane', 'Majdel Selm',
      'Bint Jbeil', 'Aita El Chaab', 'Houla', 'Kfar Kila', 'Yarun',
      'Marjeyoun', 'Deir Mimas', 'Ebel El Saqi', 'Qlayaa',
      'Hasbaya', 'Chebaa', 'Rachaya El Wadi',
    ],
  };

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
          street:    [addr.street, addr.building].filter(Boolean).join(', ') || prev.street,
          area:      addr.area      || prev.area,
          city:      addr.city      || prev.city,
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
    if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setWhishError('');

    const orderItems = items.map((item) => ({
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      image: item.product.images[0] ?? null,
    }));

    const orderPayload = {
      customer_name:  `${formData.firstName} ${formData.lastName}`.trim(),
      customer_phone: formData.phone,
      customer_email: formData.email || null,
      items:          orderItems,
      subtotal,
      shipping,
      discount:       discountAmount,
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
        clearCart();
        window.location.href = data.collectUrl;
      } else {
        const res  = await fetch('/api/orders', {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({ ...orderPayload, status: 'pending' }),
        });
        const data = await res.json();
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
          items:         orderItems,
          subtotal,
          shipping,
          discountAmount,
          couponCode:    appliedCoupon?.code ?? null,
          total,
          placedAt:      new Date().toISOString(),
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
                      <div className={`flex rounded-xl overflow-hidden border ${errors.phone ? 'border-red-500' : 'border-white/12 focus-within:border-brand-red'}`}>
                        <span className="flex items-center px-3 bg-white/8 border-r border-white/10 text-white/50 font-semibold text-sm shrink-0 select-none">
                          +961
                        </span>
                        <input type="tel" name="phone" value={formData.phone} onChange={handleChange}
                          onBlur={handlePhoneBlur}
                          placeholder="XX XXX XXX"
                          className="flex-1 px-3 py-3 bg-white/6 focus:outline-none text-sm text-white placeholder-white/25" />
                        {isLookingUp && (
                          <span className="flex items-center pr-3">
                            <svg className="w-4 h-4 text-brand-red animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                            </svg>
                          </span>
                        )}
                      </div>
                      {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                      <p className="text-xs text-white/35 mt-1">Enter your phone and we&apos;ll auto-fill your saved info.</p>
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
                        <p className="text-xs text-white/40 mt-0.5">{formatPrice(item.product.price)} × {item.quantity}</p>
                      </div>
                      <p className="font-bold text-white text-sm shrink-0">{formatPrice(item.product.price * item.quantity)}</p>
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
                        <p className="text-xs text-white/50">{appliedCoupon.discount}% discount applied</p>
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
                  <div className="flex justify-between text-sm text-white/60">
                    <span>Shipping</span>
                    <span className={shipping === 0 ? 'text-brand-red font-bold' : ''}>{shipping === 0 ? 'FREE' : formatPrice(shipping)}</span>
                  </div>
                  {appliedCoupon && (
                    <div className="flex justify-between text-sm text-brand-red font-medium">
                      <span>Discount ({appliedCoupon.discount}%)</span>
                      <span>-{formatPrice(discountAmount)}</span>
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
