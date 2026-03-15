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

const FALLBACK_FEEDBACK: FeedbackImage[] = [
  {
    id: 'fb1',
    image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&q=80&fit=crop',
    alt: 'Customer showing their SKMEI watch',
    sort_order: 1,
  },
  {
    id: 'fb2',
    image: 'https://images.unsplash.com/photo-1524592094714-0f0654e59cf?w=800&q=80&fit=crop',
    alt: 'Happy customer with SKMEI analog watch',
    sort_order: 2,
  },
  {
    id: 'fb3',
    image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=800&q=80&fit=crop',
    alt: 'Customer review photo with sports watch',
    sort_order: 3,
  },
  {
    id: 'fb4',
    image: 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=800&q=80&fit=crop',
    alt: 'Customer with SKMEI luxury watch',
    sort_order: 4,
  },
  {
    id: 'fb5',
    image: 'https://images.unsplash.com/photo-1508057198894-247b23fe5ade?w=800&q=80&fit=crop',
    alt: 'Happy customer new SKMEI watch',
    sort_order: 5,
  },
  {
    id: 'fb6',
    image: 'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=800&q=80&fit=crop',
    alt: 'Customer SKMEI digital sport watch',
    sort_order: 6,
  },
];

const PER_PAGE = 3;

export default function FeedbackSection() {
  const [items, setItems] = useState<FeedbackImage[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    fetch('/api/feedback')
      .then((r) => r.json())
      .then((data) => setItems(Array.isArray(data) && data.length > 0 ? data : FALLBACK_FEEDBACK))
      .catch(() => setItems(FALLBACK_FEEDBACK));
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
    <section id="feedback" className="py-10 sm:py-20 bg-brand-silver-light">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">

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
              <span className="text-sm text-brand-gray">500+ Happy Customers</span>
            </div>
          </div>

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
                className="flex shrink-0 items-center justify-center text-brand-gray hover:text-brand-red transition-colors duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
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
                className="flex shrink-0 items-center justify-center text-brand-gray hover:text-brand-red transition-colors duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
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
                        : 'bg-white text-brand-gray border border-gray-200 hover:border-brand-red hover:text-brand-red'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center justify-center h-40 rounded-2xl bg-white/60 text-brand-gray text-sm">
            No feedback images yet.
          </div>
        )}

      </div>
    </section>
  );
}
