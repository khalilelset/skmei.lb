'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';

interface FeedbackImage {
  id: string;
  image: string;
  alt: string;
  sort_order: number;
}

export default function FeedbackSection() {
  const [items, setItems] = useState<FeedbackImage[]>([]);

  useEffect(() => {
    fetch('/api/feedback')
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const preview = items.slice(0, 3);

  return (
    <section className="py-14 sm:py-20 bg-brand-silver-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8 sm:mb-12">
          <div>
            <p className="text-brand-red text-xs font-bold uppercase tracking-widest mb-2">
              Real Reviews
            </p>
            <h2 className="text-2xl sm:text-4xl font-black text-brand-black leading-tight">
              What Our Customers Say
            </h2>
            <div className="flex items-center gap-2 mt-3">
              <div className="flex items-center gap-0.5">
                {[1,2,3,4,5].map((s) => (
                  <Star key={s} className="w-4 h-4 fill-brand-red stroke-brand-red" />
                ))}
              </div>
              <span className="text-sm font-semibold text-brand-black">5.0</span>
              <span className="text-sm text-brand-gray">· {items.length}+ Happy Customers</span>
            </div>
          </div>

          <Link
            href="/feedback"
            className="group hidden sm:inline-flex items-center gap-3 bg-brand-black text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-brand-red transition-colors duration-300 shadow-lg shadow-brand-black/20 shrink-0"
          >
            See All Feedback
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>

        {/* Images grid — horizontal scroll on mobile */}
        {preview.length > 0 ? (
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {preview.map((item) => (
              <Link
                key={item.id}
                href="/feedback"
                className="group shrink-0 w-72 sm:w-auto relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
                style={{ aspectRatio: '16/9' }}
              >
                <Image
                  src={item.image}
                  alt={item.alt || 'Customer feedback'}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 72vw, (max-width: 1024px) 50vw, 33vw"
                />
                <div className="absolute inset-0 bg-brand-black/0 group-hover:bg-brand-black/10 transition-colors duration-300" />
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex items-center justify-center h-40 rounded-2xl bg-white/60 text-brand-gray text-sm">
            No feedback images yet.
          </div>
        )}

        {/* Mobile "See All" button */}
        <div className="mt-7 flex justify-center sm:hidden">
          <Link
            href="/feedback"
            className="group inline-flex items-center gap-3 bg-brand-black text-white px-8 py-4 rounded-full font-bold text-sm hover:bg-brand-red transition-colors duration-300 shadow-lg shadow-brand-black/20"
          >
            See All Feedback
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
