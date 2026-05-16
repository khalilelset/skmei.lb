'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  User, Mail, MapPin, Save, CheckCircle,
  Home, ChevronRight, Loader2, Info,
} from 'lucide-react';
import PhoneInputField, { isValidPhoneNumber } from '@/components/ui/PhoneInputField';
import { LEBANON_AREAS } from '@/lib/lebanon-areas';

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';
type LookupStatus = 'idle' | 'found' | 'not-found';

export default function AccountPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    saveAddress: false,
    address: { street: '', building: '', city: '', region: '' },
  });
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lookupStatus, setLookupStatus] = useState<LookupStatus>('idle');
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isDirty, setIsDirty] = useState(false);

  const [phoneError, setPhoneError] = useState('');

  // Look up customer by phone and pre-fill the form
  const lookupByPhone = useCallback(async (raw: string) => {
    // Only look up Lebanese numbers
    const isLebanese = raw.startsWith('+961') || raw.startsWith('00961');
    const phone = raw.trim().replace(/^(\+961|00961)/, '').replace(/\D/g, '');
    if (!isLebanese || !phone) return;
    setIsLookingUp(true);
    setLookupStatus('idle');
    try {
      const res = await fetch(`/api/customers/${encodeURIComponent(phone)}`);
      const json = await res.json();
      if (json.found && json.customer) {
        const c = json.customer;
        const addresses: Record<string, string>[] = c.addresses ?? [];
        const addr = addresses[0] ?? {};
        const storedPhone = raw.startsWith('+') ? raw : `+961${phone}`;
        const resolvedName  = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim();
        const resolvedEmail = c.email ?? '';
        // Sync fresh data from DB to localStorage
        if (resolvedName)  localStorage.setItem('skmei-name',  resolvedName);
        if (resolvedEmail) localStorage.setItem('skmei-email', resolvedEmail);
        setForm((prev) => ({
          ...prev,
          name:  resolvedName  || prev.name,
          email: resolvedEmail || prev.email,
          phone: storedPhone,
          saveAddress: addresses.length > 0,
          address: {
            street:   addr.street   ?? '',
            building: addr.building ?? '',
            city:     addr.city     ?? '',
            region:   addr.region   ?? '',
          },
        }));
        setLookupStatus('found');
        // Keep save button visible if email is missing — prompt user to add it
        setIsDirty(!resolvedEmail);
      } else {
        setLookupStatus('not-found');
        setIsDirty(true);
      }
    } catch { /* silent */ } finally {
      setIsLookingUp(false);
    }
  }, []);

  // On mount: restore saved profile then do API lookup to freshen data
  useEffect(() => {
    const raw = localStorage.getItem('skmei-phone');
    if (!raw) return;
    const phone = raw.startsWith('+') ? raw : `+961${raw.replace(/\D/g, '')}`;
    const savedName  = localStorage.getItem('skmei-name')  ?? '';
    const savedEmail = localStorage.getItem('skmei-email') ?? '';
    setForm((f) => ({ ...f, phone, name: savedName, email: savedEmail }));
    lookupByPhone(phone);
  }, [lookupByPhone]);

  const inputClass =
    'w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-brand-black placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all text-sm';
  const labelClass = 'block text-sm font-semibold text-brand-black mb-1.5';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('address.')) {
      const field = name.replace('address.', '');
      setForm((f) => ({
        ...f,
        address: {
          ...f.address,
          [field]: value,
          // Reset city when region changes
          ...(field === 'region' ? { city: '' } : {}),
        },
      }));
    } else if (type === 'checkbox') {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
    setSaveStatus('idle');
    setIsDirty(true);
  };

  const handlePhoneChange = (phone: string) => {
    setForm((f) => ({ ...f, phone }));
    setSaveStatus('idle');
    setIsDirty(true);
    setPhoneError('');
  };

  const handlePhoneBlur = () => {
    if (form.phone && !isValidPhoneNumber(form.phone)) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    setPhoneError('');
    lookupByPhone(form.phone);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.phone.trim() || !form.name.trim()) return;
    if (!isValidPhoneNumber(form.phone)) {
      setPhoneError('Please enter a valid phone number');
      return;
    }
    setSaveStatus('saving');

    const nameParts = form.name.trim().split(/\s+/);
    const firstName = nameParts[0];
    const lastName  = nameParts.slice(1).join(' ') || '';

    const addresses = form.saveAddress
      ? [{ street: form.address.street, building: form.address.building, city: form.address.city, region: form.address.region, isDefault: true }]
      : [];

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name:  lastName,
          email:      form.email || null,
          phone:      form.phone.trim(),
          addresses,
        }),
      });
      if (res.ok) {
        localStorage.setItem('skmei-phone', form.phone.trim());
        localStorage.setItem('skmei-name',  form.name.trim());
        localStorage.setItem('skmei-email', form.email.trim());
        setSaveStatus('saved');
        setLookupStatus('found');
        setIsDirty(false);
        setTimeout(() => setSaveStatus('idle'), 4000);
      } else {
        setSaveStatus('error');
        setTimeout(() => setSaveStatus('idle'), 3000);
      }
    } catch {
      setSaveStatus('error');
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* Hero */}
      <div className="relative bg-brand-black text-white py-12 sm:py-16 overflow-hidden">
        <div className="absolute -top-12 right-1/4 w-72 h-72 bg-brand-red/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-52 h-52 bg-brand-red/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '18px 18px' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex items-center gap-1.5 text-xs text-white/40 mb-5">
            <Link href="/" className="flex items-center gap-1 hover:text-white/70 transition-colors">
              <Home className="w-3 h-3" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/65">My Account</span>
          </nav>
          <div className="flex flex-wrap items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-brand-red/20 border border-brand-red/30 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-brand-red" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight">My Account</h1>
              <div className="mt-2.5 h-1 w-14 bg-brand-red rounded-full" />
              <p className="mt-2 text-white/45 text-sm">
                Enter your phone number to load your saved info, or fill in your details to save them for faster checkout.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Lookup banner */}
          {lookupStatus === 'found' && (
            <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl px-4 py-3">
              <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
              <p className="text-sm text-green-700 font-medium">Your saved information has been loaded. Update and save if needed.</p>
            </div>
          )}
          {lookupStatus === 'not-found' && (
            <div className="flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
              <Info className="w-5 h-5 text-blue-500 shrink-0" />
              <p className="text-sm text-blue-700">No account found for this number. Fill in your details below to create one.</p>
            </div>
          )}

          {/* Personal Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-0.5 bg-brand-red w-full" />
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
              <div className="w-11 h-11 bg-brand-red/10 rounded-2xl flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-brand-red" />
              </div>
              <div>
                <p className="font-semibold text-brand-black text-base">Personal Information</p>
                <p className="text-xs text-brand-gray mt-0.5">Your name, phone and email</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Phone first — it's the lookup key */}
              <div>
                <label className={labelClass}>
                  Phone Number <span className="text-brand-red">*</span>
                </label>
                <PhoneInputField
                  value={form.phone}
                  onChange={handlePhoneChange}
                  onBlur={handlePhoneBlur}
                  error={phoneError}
                  variant="light"
                />
                {isLookingUp && (
                  <p className="text-xs text-brand-red/70 mt-1.5 flex items-center gap-1.5">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Looking up saved info…
                  </p>
                )}
                {!isLookingUp && !phoneError && (
                  <p className="text-xs text-brand-gray mt-1">
                    Your phone number is your account ID — we use it to load your saved info.
                  </p>
                )}
              </div>

              <div>
                <label className={labelClass}>
                  Full Name <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    placeholder="Your full name"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    placeholder="your@email.com (optional)"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Delivery Address Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-0.5 bg-brand-red w-full" />
            <label className="flex items-center justify-between gap-3 px-6 py-5 cursor-pointer select-none border-b border-gray-100">
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 bg-brand-red/10 rounded-2xl flex items-center justify-center shrink-0">
                  <MapPin className="w-5 h-5 text-brand-red" />
                </div>
                <div>
                  <p className="font-semibold text-brand-black text-base">Save Delivery Address</p>
                  <p className="text-xs text-brand-gray mt-0.5">Optional — pre-fills your address at checkout</p>
                </div>
              </div>
              <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.saveAddress ? 'bg-brand-red' : 'bg-gray-200'}`}>
                <input
                  type="checkbox"
                  name="saveAddress"
                  checked={form.saveAddress}
                  onChange={handleChange}
                  className="sr-only"
                />
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${form.saveAddress ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            {form.saveAddress && (
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Street / Area</label>
                    <input type="text" name="address.street" value={form.address.street} onChange={handleChange}
                      placeholder="e.g. Hamra Street" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass}>Building / Floor</label>
                    <input type="text" name="address.building" value={form.address.building} onChange={handleChange}
                      placeholder="e.g. Building 4, Floor 2" className={inputClass} />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>Region / Governorate</label>
                    <select name="address.region" value={form.address.region} onChange={handleChange} className={inputClass}>
                      <option value="">Select region</option>
                      {Object.keys(LEBANON_AREAS).map((r) => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>City / Town</label>
                    <select
                      name="address.city"
                      value={form.address.city}
                      onChange={handleChange}
                      disabled={!form.address.region}
                      className={`${inputClass} ${!form.address.region ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="">{form.address.region ? 'Select city' : 'Select region first'}</option>
                      {(LEBANON_AREAS[form.address.region] ?? []).map((city) => (
                        <option key={city} value={city}>{city}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button — only shown when there are unsaved changes */}
          {isDirty && (
            <>
              <button
                type="submit"
                disabled={saveStatus === 'saving'}
                className={`relative w-full py-4 font-bold rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 overflow-hidden group text-sm sm:text-base disabled:cursor-not-allowed ${
                  saveStatus === 'saved'
                    ? 'bg-green-500 text-white shadow-green-500/30'
                    : saveStatus === 'error'
                    ? 'bg-red-500 text-white'
                    : 'bg-brand-red hover:bg-brand-red-dark text-white shadow-brand-red/30 hover:scale-[1.01]'
                }`}
              >
                <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none" />
                {saveStatus === 'saving' ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Saving...</>
                ) : saveStatus === 'saved' ? (
                  <><CheckCircle className="w-5 h-5" /> Information Saved Successfully!</>
                ) : saveStatus === 'error' ? (
                  <>Something went wrong — please try again</>
                ) : (
                  <><Save className="w-5 h-5" /> Save Information</>
                )}
              </button>

              {saveStatus === 'saved' && (
                <p className="text-center text-sm text-green-600 font-medium">
                  Your information has been saved and will be used on your next order.
                </p>
              )}
            </>
          )}
        </form>
      </div>
    </div>
  );
}
