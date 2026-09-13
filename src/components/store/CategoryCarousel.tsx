'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import CategoryImage from '@/components/store/CategoryImage';

interface Category {
  id: string;
  name: string;
  slug: string;
  image: string;
  productCount: number;
}

const DESKTOP_PER_PAGE = 4;

export default function CategoryCarousel({ categories }: { categories: Category[] }) {
  const [page, setPage] = useState(0);
  const [dir, setDir] = useState<'left' | 'right'>('right');

  const totalPages = Math.ceil(categories.length / DESKTOP_PER_PAGE);
  const desktopItems = categories.slice(page * DESKTOP_PER_PAGE, page * DESKTOP_PER_PAGE + DESKTOP_PER_PAGE);

  const prev = useCallback(() => {
    setDir('left');
    setPage((p) => Math.max(0, p - 1));
  }, []);

  const next = useCallback(() => {
    setDir('right');
    setPage((p) => Math.min(totalPages - 1, p + 1));
  }, [totalPages]);

  const canPrev = page > 0;
  const canNext = page < totalPages - 1;

  return (
    <>
      {/* ── Mobile: horizontal scroll (all categories) ────────────────────── */}
      <div className="sm:hidden flex gap-3 overflow-x-auto pb-3 -mx-4 px-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {categories.map((cat, idx) => (
          <CategoryCard key={cat.id} category={cat} idx={idx} />
        ))}
      </div>

      {/* ── Desktop: 4-per-page carousel ──────────────────────────────────── */}
      <div className="hidden sm:block">
        {/* Cards row + arrows */}
        <div className="flex items-center gap-3">
          {/* Left arrow */}
          <button
            onClick={prev}
            disabled={!canPrev}
            aria-label="Previous"
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full border border-white/15 text-white/50 hover:border-brand-red hover:text-brand-red transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          {/* 4-col grid */}
          <div
            key={`page-${page}-${dir}`}
            className="flex-1 grid grid-cols-4 gap-4 animate-slide-in"
          >
            {desktopItems.map((cat, idx) => (
              <CategoryCard key={cat.id} category={cat} idx={idx} />
            ))}
          </div>

          {/* Right arrow */}
          <button
            onClick={next}
            disabled={!canNext}
            aria-label="Next"
            className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full border border-white/15 text-white/50 hover:border-brand-red hover:text-brand-red transition-all duration-200 disabled:opacity-20 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Dot indicators — only when more than 1 page */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button
                key={i}
                onClick={() => { setDir(i > page ? 'right' : 'left'); setPage(i); }}
                aria-label={`Go to page ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === page ? 'w-6 bg-brand-red' : 'w-1.5 bg-white/25 hover:bg-white/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function CategoryCard({ category, idx }: { category: Category; idx: number }) {
  return (
    <Link
      href={`/store/products?category=${category.slug}`}
      className="group relative shrink-0 w-52 sm:w-auto overflow-hidden rounded-2xl"
    >
      <div className="relative aspect-3/4 overflow-hidden bg-[#111]">
        {category.image && (
          <CategoryImage
            src={category.image}
            alt={category.name}
            sizes="(max-width: 640px) 208px, 25vw"
            priority={idx < 4}
          />
        )}

        {/* Base gradient */}
        <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-black/10" />

        {/* Hover red tint */}
        <div className="absolute inset-0 bg-linear-to-b from-brand-red/0 to-brand-red/0 group-hover:from-brand-red/25 group-hover:to-transparent transition-all duration-500" />

        {/* Border glow */}
        <div className="absolute inset-0 rounded-2xl border border-white/8 group-hover:border-brand-red/60 transition-colors duration-400" />

        {/* Text */}
        <div className="absolute bottom-0 left-0 right-0 p-5">
          <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] mb-1.5">
            {category.name.toUpperCase()} COLLECTION
          </p>
          <h3 className="text-white font-bold text-base sm:text-lg leading-tight group-hover:text-brand-red transition-colors duration-300">
            {category.name}
          </h3>
          {category.productCount > 0 && (
            <p className="text-white/40 text-xs mt-1">{category.productCount} Products</p>
          )}
          <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-white/0 group-hover:text-white translate-y-2 group-hover:translate-y-0 transition-all duration-300">
            Explore
            <ArrowRight className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
