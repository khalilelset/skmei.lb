'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Clock, Truck, ChevronRight, Home, ArrowRight, CheckCircle2, MessageCircle } from 'lucide-react';

const WA_SVG = (
  <svg className="h-5 w-5 fill-current shrink-0" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', subject: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `New Contact Form Message:\n\nName: ${formData.name}\nEmail: ${formData.email}\nPhone: ${formData.phone}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`;
    window.open(`https://wa.me/96179170387?text=${encodeURIComponent(text)}`, '_blank');
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClass =
    'w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-xl text-brand-black placeholder:text-gray-400 focus:outline-none focus:bg-white focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all text-sm';

  const labelClass = 'block text-sm font-semibold text-brand-black mb-1.5';

  return (
    <div className="bg-gray-50 min-h-screen">

      {/* ── Hero Banner ── */}
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
            <span className="text-white/65">Contact</span>
          </nav>

          <div className="flex flex-wrap items-end gap-4">
            <div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight">
                Get In Touch
              </h1>
              <div className="mt-3 h-1 w-14 bg-brand-red rounded-full" />
            </div>
            <p className="mb-1 text-white/50 text-sm sm:text-base max-w-md">
              Have a question about our watches or need help with an order? We&apos;d love to hear from you.
            </p>
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-start">

          {/* ── Left: Contact Info Panel ── */}
          <div className="lg:col-span-2">
            <div className="bg-brand-black rounded-2xl overflow-hidden sticky top-24">

              {/* Panel top accent */}
              <div className="h-1 bg-brand-red w-full" />

              <div className="p-7 sm:p-8">
                <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest mb-2">Contact Details</p>
                <h2 className="text-2xl font-black text-white mb-1">We&apos;re Here For You</h2>
                <p className="text-white/45 text-sm mb-7">Reach us anytime — we never close.</p>

                <div className="space-y-3">
                  <a
                    href="mailto:skmei.lb@gmail.com"
                    className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-brand-red/15 border border-white/8 hover:border-brand-red/40 transition-all duration-300"
                  >
                    <div className="w-11 h-11 rounded-xl bg-brand-red/20 group-hover:bg-brand-red flex items-center justify-center shrink-0 transition-colors duration-300">
                      <Mail className="h-5 w-5 text-brand-red group-hover:text-white transition-colors duration-300" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Email</p>
                      <p className="text-white font-semibold text-sm">skmei.lb@gmail.com</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 ml-auto transition-colors" />
                  </a>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8">
                    <div className="w-11 h-11 rounded-xl bg-brand-red/20 flex items-center justify-center shrink-0">
                      <Clock className="h-5 w-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Availability</p>
                      <p className="text-white font-semibold text-sm">24 / 7 — Always Available</p>
                      <p className="text-white/35 text-xs mt-0.5">Chat with us on WhatsApp anytime</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/8">
                    <div className="w-11 h-11 rounded-xl bg-brand-red/20 flex items-center justify-center shrink-0">
                      <Truck className="h-5 w-5 text-brand-red" />
                    </div>
                    <div>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-wider mb-0.5">Delivery</p>
                      <p className="text-white font-semibold text-sm">All Lebanon</p>
                      <p className="text-white/35 text-xs mt-0.5">Fast &amp; reliable shipping nationwide</p>
                    </div>
                  </div>
                </div>

                {/* WhatsApp CTA */}
                <a
                  href="https://wa.me/96179170387"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative mt-7 flex items-center justify-center gap-3 w-full py-4 px-6 bg-brand-red hover:bg-brand-red-dark text-white font-bold rounded-xl transition-all hover:scale-[1.02] active:scale-95 shadow-lg shadow-brand-red/40 overflow-hidden group"
                >
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-12 pointer-events-none" />
                  {WA_SVG}
                  <span className="relative z-10">Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* ── Right: Contact Form ── */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">

              {/* Form header */}
              <div className="px-7 sm:px-8 pt-7 sm:pt-8 pb-6 border-b border-gray-100">
                <p className="text-[10px] font-bold text-brand-red uppercase tracking-widest mb-1">Message Us</p>
                <h2 className="text-2xl font-black text-brand-black">Send Us a Message</h2>
                <p className="text-brand-gray text-sm mt-1">Fill the form below and we&apos;ll reply via WhatsApp.</p>
              </div>

              <div className="px-7 sm:px-8 py-7 sm:py-8">
                {submitted ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 rounded-full bg-green-50 border-2 border-green-200 flex items-center justify-center mb-5">
                      <CheckCircle2 className="w-10 h-10 text-green-500" />
                    </div>
                    <h3 className="text-xl font-black text-brand-black mb-2">Message Sent!</h3>
                    <p className="text-brand-gray text-sm max-w-sm mb-7">
                      Your message has been forwarded to our WhatsApp. We&apos;ll get back to you as soon as possible.
                    </p>
                    <button
                      onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', phone: '', subject: '', message: '' }); }}
                      className="inline-flex items-center gap-2 px-7 py-3 bg-brand-black text-white rounded-xl font-semibold hover:bg-brand-red transition-colors active:scale-95"
                    >
                      <MessageCircle className="w-4 h-4" />
                      Send Another Message
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="name" className={labelClass}>
                          Full Name <span className="text-brand-red">*</span>
                        </label>
                        <input
                          type="text" id="name" name="name"
                          value={formData.name} onChange={handleChange} required
                          className={inputClass} placeholder="Your name"
                        />
                      </div>
                      <div>
                        <label htmlFor="email" className={labelClass}>
                          Email <span className="text-brand-red">*</span>
                        </label>
                        <input
                          type="email" id="email" name="email"
                          value={formData.email} onChange={handleChange} required
                          className={inputClass} placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <div>
                        <label htmlFor="phone" className={labelClass}>Phone Number</label>
                        <input
                          type="tel" id="phone" name="phone"
                          value={formData.phone} onChange={handleChange}
                          className={inputClass} placeholder="+961 XX XXX XXX"
                        />
                      </div>
                      <div>
                        <label htmlFor="subject" className={labelClass}>
                          Subject <span className="text-brand-red">*</span>
                        </label>
                        <select
                          id="subject" name="subject"
                          value={formData.subject} onChange={handleChange} required
                          className={inputClass}
                        >
                          <option value="">Select a topic</option>
                          <option value="Order Inquiry">Order Inquiry</option>
                          <option value="Product Question">Product Question</option>
                          <option value="Shipping & Delivery">Shipping &amp; Delivery</option>
                          <option value="Returns & Exchanges">Returns &amp; Exchanges</option>
                          <option value="Warranty">Warranty</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label htmlFor="message" className={labelClass}>
                        Message <span className="text-brand-red">*</span>
                      </label>
                      <textarea
                        id="message" name="message"
                        value={formData.message} onChange={handleChange} required
                        rows={5}
                        className={`${inputClass} resize-none`}
                        placeholder="How can we help you?"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full flex items-center justify-center gap-2 py-4 bg-brand-red hover:bg-brand-red-dark text-white font-bold rounded-xl transition-all hover:scale-[1.01] active:scale-95 shadow-lg shadow-brand-red/30 text-sm sm:text-base"
                    >
                      Send Message
                      <ArrowRight className="w-5 h-5" />
                    </button>

                    <p className="text-center text-xs text-brand-gray">
                      Your message will be sent via WhatsApp for a faster response.
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
