'use client';

import { useState } from 'react';
import { Mail, Clock, MessageCircle, Truck } from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
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

  return (
    <div>
      {/* Hero Banner */}
      <section className="bg-brand-black text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Get In Touch
          </h1>
          <p className="text-brand-gray-light text-base sm:text-lg max-w-2xl mx-auto">
            Have a question about our watches or need help with an order? We&apos;d love to hear from you.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">

          {/* Contact Information */}
          <div className="lg:col-span-1">
            <div className="bg-brand-black rounded-2xl overflow-hidden h-full">
              {/* Panel header */}
              <div className="px-7 pt-8 pb-6 border-b border-white/10">
                <h2 className="text-xl font-bold text-white mb-1">Contact Information</h2>
                <p className="text-brand-gray-light text-sm">Reach us anytime — we never close.</p>
              </div>

              {/* Info items */}
              <div className="px-7 py-6 space-y-4">
                <a
                  href="mailto:skmei.lb@gmail.com"
                  className="group flex items-center gap-4 p-4 rounded-xl bg-white/5 hover:bg-brand-red/20 border border-white/10 hover:border-brand-red/50 transition-all duration-300"
                >
                  <div className="w-11 h-11 rounded-xl bg-brand-red/20 group-hover:bg-brand-red flex items-center justify-center shrink-0 transition-colors duration-300">
                    <Mail className="h-5 w-5 text-brand-red group-hover:text-white transition-colors duration-300" />
                  </div>
                  <div>
                    <p className="text-xs text-brand-gray-light font-medium uppercase tracking-wider mb-0.5">Email</p>
                    <p className="text-white font-semibold text-sm">skmei.lb@gmail.com</p>
                  </div>
                </a>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-11 h-11 rounded-xl bg-brand-red/20 flex items-center justify-center shrink-0">
                    <Clock className="h-5 w-5 text-brand-red" />
                  </div>
                  <div>
                    <p className="text-xs text-brand-gray-light font-medium uppercase tracking-wider mb-0.5">Working Hours</p>
                    <p className="text-white font-semibold text-sm">24/7 — Always Available</p>
                    <p className="text-brand-gray-light text-xs mt-0.5">Chat with us on WhatsApp anytime</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-11 h-11 rounded-xl bg-brand-red/20 flex items-center justify-center shrink-0">
                    <Truck className="h-5 w-5 text-brand-red" />
                  </div>
                  <div>
                    <p className="text-xs text-brand-gray-light font-medium uppercase tracking-wider mb-0.5">Delivery</p>
                    <p className="text-white font-semibold text-sm">We deliver to all Lebanon</p>
                    <p className="text-brand-gray-light text-xs mt-0.5">Fast &amp; reliable shipping nationwide</p>
                  </div>
                </div>
              </div>

              {/* WhatsApp CTA */}
              <div className="px-7 pb-8">
                <a
                  href="https://wa.me/96179170387"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="relative flex items-center justify-center gap-3 w-full py-4 px-6 bg-brand-red text-white font-bold rounded-xl transition-all hover:scale-[1.03] active:scale-95 shadow-lg shadow-brand-red/40 overflow-hidden group"
                >
                  {/* shine sweep on hover */}
                  <span className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-700 bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12 pointer-events-none" />
                  <svg className="h-5 w-5 fill-current shrink-0 relative z-10" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                  <span className="relative z-10">Chat on WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-bold text-brand-black mb-6">Send Us a Message</h2>

            {submitted ? (
              <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">Message Sent!</h3>
                <p className="text-green-700 mb-4">
                  Your message has been forwarded to our WhatsApp. We&apos;ll get back to you as soon as possible.
                </p>
                <button
                  onClick={() => setSubmitted(false)}
                  className="px-6 py-2 bg-brand-gray-dark hover:bg-gray-700 text-brand-red rounded-lg transition-colors font-semibold"
                >
                  Send Another Message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-brand-black mb-1.5">
                      Full Name *
                    </label>
                    <input
                      type="text" id="name" name="name"
                      value={formData.name} onChange={handleChange} required
                      className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black placeholder:text-brand-gray-light"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-brand-black mb-1.5">
                      Email *
                    </label>
                    <input
                      type="email" id="email" name="email"
                      value={formData.email} onChange={handleChange} required
                      className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black placeholder:text-brand-gray-light"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-brand-black mb-1.5">
                      Phone Number
                    </label>
                    <input
                      type="tel" id="phone" name="phone"
                      value={formData.phone} onChange={handleChange}
                      className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black placeholder:text-brand-gray-light"
                      placeholder="+961 XX XXX XXX"
                    />
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-brand-black mb-1.5">
                      Subject *
                    </label>
                    <select
                      id="subject" name="subject"
                      value={formData.subject} onChange={handleChange} required
                      className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black"
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
                  <label htmlFor="message" className="block text-sm font-medium text-brand-black mb-1.5">
                    Message *
                  </label>
                  <textarea
                    id="message" name="message"
                    value={formData.message} onChange={handleChange} required
                    rows={5}
                    className="w-full px-4 py-3 border border-brand-silver rounded-lg focus:outline-none focus:border-brand-red text-brand-black placeholder:text-brand-gray-light resize-none"
                    placeholder="How can we help you?"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full sm:w-auto px-8 py-3 bg-brand-red hover:bg-brand-red-dark text-white font-semibold rounded-lg transition-all hover:scale-[1.02] active:scale-95 shadow-md shadow-brand-red/30"
                >
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
