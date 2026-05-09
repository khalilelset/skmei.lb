'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { ChevronRight, ChevronLeft } from 'lucide-react';

interface FeedbackImage {
  id: string;
  image: string;
  alt: string;
  sort_order: number;
}

const PER_PAGE = 3;

export default function FeedbackSection() {
  const [items, setItems] = useState<FeedbackImage[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch('/api/feedback')
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) ? data : []))
      .catch(() => setItems([]));
  }, []);

  const totalPages = Math.ceil(items.length / PER_PAGE);
  const pageItems = items.slice(page * PER_PAGE, page * PER_PAGE + PER_PAGE);

  const prev = () => setPage((p) => Math.max(0, p - 1));
  const next = () => setPage((p) => Math.min(totalPages - 1, p + 1));

  // Swipe support
  const touchStartX = useRef<number | null>(null);
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 40) diff > 0 ? next() : prev();
    touchStartX.current = null;
  };

  return (
    <section id="feedback" className="py-14 sm:py-20 bg-brand-black">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-8 sm:mb-12">
          <p className="text-brand-red text-[10px] font-bold uppercase tracking-[0.3em] mb-3">
            Real Reviews
          </p>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight leading-tight mb-3">
            What Our Customers Say
          </h2>
          <div className="h-0.5 w-12 bg-brand-red mb-3" />
          <span className="text-white/40 text-sm">500+ Happy Customers</span>
        </div>

        {/* Carousel */}
        {items.length > 0 ? (
          <>
            {/* Grid + side arrows */}
            <div className="flex items-center gap-2 sm:gap-6">
              {/* Left arrow */}
              <button
                onClick={prev}
                disabled={!totalPages || page === 0}
                className="flex shrink-0 items-center justify-center text-white/40 hover:text-brand-red transition-colors duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>

              {/* Grid — swipeable on mobile */}
              <div
                className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4"
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
              >
                {pageItems.map((item) => (
                  <div
                    key={item.id}
                    className="relative rounded-2xl overflow-hidden bg-white shadow-sm aspect-4/3"
                  >
                    <Image
                      src={item.image}
                      alt={item.alt || 'Customer feedback'}
                      fill
                      className="object-cover"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                  </div>
                ))}
              </div>

              {/* Right arrow — desktop only */}
              <button
                onClick={next}
                disabled={!totalPages || page === totalPages - 1}
                className="flex shrink-0 items-center justify-center text-white/40 hover:text-brand-red transition-colors duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
              </button>
            </div>

            {/* Page numbers */}
            {totalPages > 1 && (
              <div className="mt-6 flex items-center justify-center gap-1.5">
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-8 h-8 rounded-lg text-sm font-semibold transition-all duration-200 ${
                      i === page
                        ? 'bg-brand-red text-white shadow-md shadow-brand-red/30'
                        : 'bg-white/10 text-white/50 border border-white/15 hover:border-brand-red hover:text-brand-red'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-40 rounded-2xl bg-white/5 border border-white/10 text-white/40 text-sm">
            No feedback images yet.
          </div>
        )}

      </div>
    </section>
  );
}
