'use client';

import { useState } from 'react';
import Link from 'next/link';
import { User, Phone, Mail, MapPin, Save, CheckCircle, Home, ChevronRight } from 'lucide-react';
import { useProfileStore } from '@/store/profileStore';

export default function AccountPage() {
  const { profile, setProfile } = useProfileStore();
  const [form, setForm] = useState({ ...profile, address: { ...profile.address } });
  const [saved, setSaved] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (name.startsWith('address.')) {
      const field = name.replace('address.', '') as keyof typeof form.address;
      setForm((f) => ({ ...f, address: { ...f.address, [field]: value } }));
    } else if (type === 'checkbox') {
      setForm((f) => ({ ...f, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setForm((f) => ({ ...f, [name]: value }));
    }
    setSaved(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const regions = [
    'Beirut', 'Mount Lebanon', 'North Lebanon', 'South Lebanon',
    'Bekaa', 'Nabatieh', 'Akkar', 'Baalbek-Hermel',
  ];

  const inputClass =
    'w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-brand-black placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all text-sm';

  const labelClass = 'block text-sm font-semibold text-brand-black mb-1.5';

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero ── */}
      <div className="relative bg-brand-black text-white py-12 sm:py-16 overflow-hidden">
        <div className="absolute -top-12 right-1/4 w-72 h-72 bg-brand-red/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-52 h-52 bg-brand-red/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.035] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '18px 18px' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-white/40 mb-5">
            <Link href="/" className="flex items-center gap-1 hover:text-white/70 transition-colors">
              <Home className="w-3 h-3" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/65">My Account</span>
          </nav>

          <div className="flex flex-wrap items-center gap-5">
            {/* Avatar circle */}
            <div className="w-16 h-16 rounded-2xl bg-brand-red/20 border border-brand-red/30 flex items-center justify-center shrink-0">
              <User className="w-8 h-8 text-brand-red" />
            </div>
            <div>
              <h1 className="text-4xl sm:text-5xl font-black text-white leading-none tracking-tight">
                My Account
              </h1>
              <div className="mt-2.5 h-1 w-14 bg-brand-red rounded-full" />
              <p className="mt-2 text-white/45 text-sm">
                Save your information to speed up ordering — no need to fill it in every time.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Form ── */}
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Personal Info Card */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="h-0.5 bg-brand-red w-full" />
            <div className="flex items-center gap-4 px-6 py-5 border-b border-gray-100">
              <div className="w-11 h-11 bg-brand-red/10 rounded-2xl flex items-center justify-center shrink-0">
                <User className="w-5 h-5 text-brand-red" />
              </div>
              <div>
                <p className="font-semibold text-brand-black text-base">Personal Information</p>
                <p className="text-xs text-brand-gray mt-0.5">Your name, email and phone number</p>
              </div>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className={labelClass}>
                  Full Name <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text" name="name"
                    value={form.name} onChange={handleChange} required
                    placeholder="Your full name"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Email Address <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email" name="email"
                    value={form.email} onChange={handleChange} required
                    placeholder="your@email.com"
                    className={`${inputClass} pl-10`}
                  />
                </div>
              </div>

              <div>
                <label className={labelClass}>
                  Phone Number <span className="text-brand-red">*</span>
                </label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="tel" name="phone"
                    value={form.phone} onChange={handleChange} required
                    placeholder="+961 XX XXX XXX"
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
              {/* Toggle only — no chevron */}
              <div className={`relative w-12 h-6 rounded-full transition-colors duration-200 shrink-0 ${form.saveAddress ? 'bg-brand-red' : 'bg-gray-200'}`}>
                <input
                  type="checkbox" name="saveAddress"
                  checked={form.saveAddress} onChange={handleChange}
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
                    <input
                      type="text" name="address.street"
                      value={form.address.street} onChange={handleChange}
                      placeholder="e.g. Hamra Street"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Building / Floor</label>
                    <input
                      type="text" name="address.building"
                      value={form.address.building} onChange={handleChange}
                      placeholder="e.g. Building 4, Floor 2"
                      className={inputClass}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className={labelClass}>City / Town</label>
                    <input
                      type="text" name="address.city"
                      value={form.address.city} onChange={handleChange}
                      placeholder="e.g. Beirut"
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label className={labelClass}>Region / Governorate</label>
                    <select
                      name="address.region"
                      value={form.address.region} onChange={handleChange}
                      className={inputClass}
                    >
                      <option value="">Select region</option>
                      {regions.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className={`relative w-full py-4 font-bold rounded-xl transition-all active:scale-95 shadow-lg flex items-center justify-center gap-2 overflow-hidden group text-sm sm:text-base ${
              saved
                ? 'bg-green-500 hover:bg-green-600 text-white shadow-green-500/30'
                : 'bg-brand-red hover:bg-brand-red-dark text-white shadow-brand-red/30 hover:scale-[1.01]'
            }`}
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none" />
            {saved ? (
              <>
                <CheckCircle className="w-5 h-5" />
                Information Saved!
              </>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save Information
              </>
            )}
          </button>

          {saved && (
            <p className="text-center text-sm text-green-600 font-medium">
              ✓ Your information has been saved and will be used on your next order.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
