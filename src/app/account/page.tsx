'use client';

import { useState } from 'react';
import { User, Phone, Mail, MapPin, Save, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
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

  return (
    <div>
      {/* Hero */}
      <section className="bg-brand-black text-white py-14 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="w-16 h-16 bg-brand-red/20 border border-brand-red/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <User className="w-8 h-8 text-brand-red" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">My Account</h1>
          <p className="text-brand-gray-light text-sm sm:text-base max-w-md mx-auto">
            Save your information to speed up ordering — no need to fill it in every time.
          </p>
        </div>
      </section>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-12">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Personal Info */}
          <div className="bg-white border border-brand-silver rounded-2xl overflow-hidden shadow-sm">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-brand-silver bg-brand-silver-light">
              <div className="w-8 h-8 bg-brand-red/10 rounded-lg flex items-center justify-center">
                <User className="w-4 h-4 text-brand-red" />
              </div>
              <h2 className="font-bold text-brand-black">Personal Information</h2>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-brand-black mb-1.5">
                  Full Name <span className="text-brand-red">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  placeholder="Your full name"
                  className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black placeholder:text-brand-gray-light transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-black mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-brand-red" />
                    Email Address <span className="text-brand-red">*</span>
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black placeholder:text-brand-gray-light transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-brand-black mb-1.5">
                  <span className="flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-brand-red" />
                    Phone Number <span className="text-brand-red">*</span>
                  </span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  required
                  placeholder="+961 XX XXX XXX"
                  className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black placeholder:text-brand-gray-light transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Delivery Address — optional toggle */}
          <div className="bg-white border border-brand-silver rounded-2xl overflow-hidden shadow-sm">
            <label className="flex items-center justify-between gap-3 px-6 py-4 cursor-pointer select-none border-b border-brand-silver bg-brand-silver-light">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-brand-red/10 rounded-lg flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-brand-red" />
                </div>
                <div>
                  <p className="font-bold text-brand-black text-sm">Save Delivery Address</p>
                  <p className="text-xs text-brand-gray-light">Optional — pre-fills your address at checkout</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {form.saveAddress
                  ? <ChevronUp className="w-4 h-4 text-brand-gray" />
                  : <ChevronDown className="w-4 h-4 text-brand-gray" />
                }
                {/* Toggle switch */}
                <div
                  className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${form.saveAddress ? 'bg-brand-red' : 'bg-brand-silver'}`}
                >
                  <input
                    type="checkbox"
                    name="saveAddress"
                    checked={form.saveAddress}
                    onChange={handleChange}
                    className="sr-only"
                  />
                  <span
                    className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${form.saveAddress ? 'translate-x-5' : 'translate-x-0'}`}
                  />
                </div>
              </div>
            </label>

            {form.saveAddress && (
              <div className="px-6 py-5 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-black mb-1.5">Street / Area</label>
                    <input
                      type="text"
                      name="address.street"
                      value={form.address.street}
                      onChange={handleChange}
                      placeholder="e.g. Hamra Street"
                      className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black placeholder:text-brand-gray-light transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-black mb-1.5">Building / Floor</label>
                    <input
                      type="text"
                      name="address.building"
                      value={form.address.building}
                      onChange={handleChange}
                      placeholder="e.g. Building 4, Floor 2"
                      className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black placeholder:text-brand-gray-light transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-brand-black mb-1.5">City / Town</label>
                    <input
                      type="text"
                      name="address.city"
                      value={form.address.city}
                      onChange={handleChange}
                      placeholder="e.g. Beirut"
                      className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black placeholder:text-brand-gray-light transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-black mb-1.5">Region / Governorate</label>
                    <select
                      name="address.region"
                      value={form.address.region}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black transition-colors"
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
            className="relative w-full py-3.5 bg-brand-red hover:bg-brand-red-dark text-white font-semibold rounded-xl transition-all hover:scale-[1.01] active:scale-95 shadow-md shadow-brand-red/30 flex items-center justify-center gap-2 overflow-hidden group"
          >
            <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />
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
              Your information has been saved and will be used on your next order.
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
