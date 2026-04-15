'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Clock, Truck, ChevronRight, Home, ArrowRight, MessageCircle, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const ease = [0.22, 1, 0.36, 1] as const;

const WA_SVG = (
  <svg className="h-5 w-5 fill-current shrink-0" viewBox="0 0 24 24">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const FAQS = [
  { q: "How long does delivery take?", a: "We deliver across all of Lebanon, typically within 2–4 business days depending on your location." },
  { q: "Do you offer a warranty?", a: "Yes — every SKMEI watch comes with a full 1-year manufacturer warranty covering defects in materials and workmanship. Other brands we carry include a 1-month warranty." },
  { q: "Are all your watches authentic?", a: "All SKMEI watches are 100% authentic — we are Lebanon's official authorized SKMEI dealer, sourcing directly from the manufacturer." },
  { q: "What payment methods do you accept?", a: "We accept Cash on Delivery (COD) and Whish payment across Lebanon." },
  { q: "Can I exchange or return a watch?", a: "Yes — exchanges are available. We take full responsibility for any defect or issue with your order. Contact us and we will make it right." },
];

function FAQItem({ q, a, open, onToggle }: { q: string; a: string; open: boolean; onToggle: () => void }) {
  return (
    <div className={`border-b border-brand-silver last:border-0 transition-colors duration-300 ${open ? 'border-l-2 border-l-brand-red pl-4' : ''}`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between py-4 text-left gap-4"
      >
        <span className="text-sm font-bold text-brand-black">{q}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.3, ease }} className="shrink-0">
          <ChevronDown className="w-4 h-4 text-brand-gray" />
        </motion.span>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="answer"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease }}
            className="overflow-hidden"
          >
            <p className="text-brand-gray text-sm pb-4 leading-relaxed">{a}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '', email: '', subject: '', message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = `New Contact Form Message:\n\nName: ${formData.name}\nEmail: ${formData.email}\nSubject: ${formData.subject}\n\nMessage:\n${formData.message}`;
    window.open(`https://wa.me/96179170387?text=${encodeURIComponent(text)}`, '_blank');
    setSubmitted(true);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const inputClass =
    'w-full px-4 py-3.5 bg-brand-silver-light border border-brand-silver rounded-xl text-brand-black placeholder:text-brand-gray/60 focus:outline-none focus:bg-white focus:border-brand-red focus:ring-2 focus:ring-brand-red/10 transition-all text-sm';

  const labelClass = 'block text-[10px] font-bold uppercase tracking-[0.18em] text-brand-black/70 mb-2';

  return (
    <div className="bg-white min-h-screen">

      {/* ── Hero Banner ── */}
      <div className="relative bg-brand-black text-white py-14 sm:py-20 overflow-hidden">
        {/* Architectural watermark */}
        <div aria-hidden className="absolute right-0 bottom-0 select-none pointer-events-none overflow-hidden leading-none">
          <span className="text-[clamp(60px,14vw,140px)] font-black text-white/[0.028] tracking-tight whitespace-nowrap">
            CONTACT
          </span>
        </div>

        {/* Red line accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-0 w-2/3 h-px bg-linear-to-r from-transparent via-brand-red to-transparent opacity-40" />
          <div className="absolute bottom-1/3 left-0 w-2/3 h-px bg-linear-to-r from-brand-red via-transparent to-transparent opacity-30" />
        </div>

        {/* Diagonal stripe texture */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '18px 18px' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <motion.nav
            initial={{ opacity: 0, x: -16 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, ease }}
            className="flex items-center gap-1.5 text-xs text-white/40 mb-6"
          >
            <Link href="/" className="flex items-center gap-1 hover:text-white/70 transition-colors">
              <Home className="w-3 h-3" /> Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/65">Contact</span>
          </motion.nav>

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 border-l-2 border-brand-red pl-3 mb-5"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse flex-shrink-0" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-brand-red uppercase">We Reply Within 2 Hours</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1, ease }}
            className="text-4xl sm:text-5xl lg:text-7xl font-black text-white leading-none tracking-[-0.03em] mb-4"
          >
            Get In Touch
          </motion.h1>

          {/* Animated red underline */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.6, delay: 0.4, ease }}
            style={{ originX: 0 }}
            className="h-0.5 w-16 bg-brand-red mb-5"
          />

          {/* Count strip */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.25, ease }}
            className="flex items-center gap-4 sm:gap-6 flex-wrap"
          >
            {[
              "Avg. Reply Time: Under 2 Hours",
              "24/7 WhatsApp",
              "All Lebanon",
            ].map((item, i) => (
              <span key={i} className="flex items-center gap-2 text-[10px] sm:text-xs font-bold uppercase tracking-[0.18em] text-white/45">
                {i > 0 && <span className="w-1 h-1 rounded-full bg-brand-red/60" />}
                {item}
              </span>
            ))}
          </motion.div>
        </div>

        {/* Gradient transition */}
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-linear-to-b from-transparent to-white pointer-events-none" />
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 lg:gap-10 items-start">

          {/* ── Left: Contact Info Panel ── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease }}
            className="lg:col-span-2"
          >
            <div className="bg-brand-black rounded-2xl overflow-hidden sticky top-24">

              {/* Panel top accent */}
              <div className="h-1 bg-brand-red w-full" />

              <div className="p-7 sm:p-8">
                <p className="text-[10px] font-bold text-brand-red uppercase tracking-[0.3em] mb-2">Contact Details</p>
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
                  <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none" />
                  {WA_SVG}
                  <span className="relative z-10">Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </motion.div>

          {/* ── Right: Contact Form + FAQ ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3, ease }}
            className="lg:col-span-3 space-y-6"
          >
            {/* Form Card */}
            <div className="bg-white rounded-2xl border border-brand-silver overflow-hidden">

              {/* Form header */}
              <div className="px-7 sm:px-8 pt-7 sm:pt-8 pb-6 border-b border-brand-silver">
                <p className="text-[10px] font-bold text-brand-red uppercase tracking-[0.3em] mb-1">Message Us</p>
                <h2 className="text-2xl font-black text-brand-black">Send Us a Message</h2>
                <p className="text-brand-gray text-sm mt-1">Fill the form below and we&apos;ll reply via WhatsApp.</p>
              </div>

              <div className="px-7 sm:px-8 py-7 sm:py-8">
                <AnimatePresence mode="wait">
                  {submitted ? (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease }}
                      className="flex flex-col items-center justify-center py-10 text-center"
                    >
                      {/* Success circle */}
                      <motion.div
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ type: 'spring', damping: 12, stiffness: 200, delay: 0.1 }}
                        className="w-20 h-20 rounded-full bg-brand-red flex items-center justify-center mb-5 shadow-lg shadow-brand-red/30"
                      >
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                          <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 0.5, delay: 0.3, ease: 'easeOut' }}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </motion.div>
                      <motion.h3
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.3, ease }}
                        className="text-xl font-black text-brand-black mb-2"
                      >
                        Message Sent!
                      </motion.h3>
                      <motion.p
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.4, ease }}
                        className="text-brand-gray text-sm max-w-sm mb-7"
                      >
                        Your message has been forwarded to our WhatsApp. We&apos;ll get back to you within 2 hours.
                      </motion.p>
                      <motion.button
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: 0.5, ease }}
                        onClick={() => { setSubmitted(false); setFormData({ name: '', email: '', subject: '', message: '' }); }}
                        className="inline-flex items-center gap-2 px-7 py-3.5 bg-brand-black text-white rounded-xl font-bold hover:bg-brand-red transition-colors active:scale-95 text-sm"
                      >
                        <MessageCircle className="w-4 h-4" />
                        Send Another Message
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.form
                      key="form"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      onSubmit={handleSubmit}
                      className="space-y-5"
                    >
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
                        className="group relative w-full flex items-center justify-center gap-2 py-4 bg-brand-red hover:bg-brand-red-dark text-white font-black rounded-xl transition-all hover:scale-[1.01] active:scale-95 shadow-lg shadow-brand-red/30 text-base overflow-hidden"
                      >
                        <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none" />
                        Send Message
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                      </button>

                      <p className="text-center text-xs text-brand-gray">
                        Your message will be sent via WhatsApp for a faster response.
                      </p>
                    </motion.form>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* FAQ Accordion */}
            <div className="bg-brand-silver-light rounded-2xl border border-brand-silver overflow-hidden">
              <div className="px-7 sm:px-8 pt-7 pb-3">
                <p className="text-[10px] font-bold text-brand-red uppercase tracking-[0.3em] mb-1">FAQ</p>
                <h2 className="text-xl font-black text-brand-black">Frequently Asked Questions</h2>
              </div>
              <div className="px-7 sm:px-8 pb-4">
                {FAQS.map((faq, i) => (
                  <FAQItem
                    key={i}
                    q={faq.q}
                    a={faq.a}
                    open={openFaq === i}
                    onToggle={() => setOpenFaq(openFaq === i ? null : i)}
                  />
                ))}
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
