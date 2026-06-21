'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import SunglassesCard from '@/components/store/SunglassesCard';
import type { Sunglasses } from '@/types';

const GENDER_OPTIONS = [
  { label: 'All', value: '' },
  { label: 'Men', value: 'men' },
  { label: 'Women', value: 'women' },
  { label: 'Unisex', value: 'unisex' },
] as const;

const SORT_OPTIONS = [
  { label: 'Newest', value: 'newest' },
  { label: 'Price: Low to High', value: 'price-asc' },
  { label: 'Price: High to Low', value: 'price-desc' },
  { label: 'Popular', value: 'popular' },
] as const;

interface Props {
  initialSunglasses: Sunglasses[];
}

export default function SunglassesCatalogClient({ initialSunglasses }: Props) {
  const [gender, setGender] = useState('');
  const [sort, setSort]     = useState('newest');
  const [filter, setFilter] = useState('');

  const filtered = useMemo(() => {
    let list = [...initialSunglasses];
    if (gender) list = list.filter(s => s.gender === gender);
    if (filter === 'new')        list = list.filter(s => s.isNew);
    if (filter === 'bestseller') list = list.filter(s => s.isBestseller);
    if (filter === 'sale')       list = list.filter(s => s.onSale);

    if (sort === 'price-asc')  list.sort((a, b) => a.price - b.price);
    if (sort === 'price-desc') list.sort((a, b) => b.price - a.price);
    if (sort === 'popular')    list.sort((a, b) => b.rating - a.rating);

    return list;
  }, [initialSunglasses, gender, sort, filter]);

  return (
    <div className="min-h-screen bg-brand-black">
      {/* Hero */}
      <div className="relative overflow-hidden bg-[#0a0a0a] border-b border-white/6">
        <div
          className="absolute inset-0 pointer-events-none select-none flex items-center justify-end pr-8 overflow-hidden"
          aria-hidden
        >
          <span
            className="text-[clamp(60px,12vw,120px)] font-black leading-none tracking-tight whitespace-nowrap"
            style={{ color: 'transparent', WebkitTextStroke: '1px rgba(255,255,255,0.05)' }}
          >
            SUNGLASSES
          </span>
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20">
          <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-brand-red mb-3">Collection</p>
          <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight mb-3">Sunglasses</h1>
          <p className="text-white/45 text-base max-w-md">
            Premium eyewear crafted for style and protection. UV400 lenses, lightweight frames.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filter bar */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          {/* Gender tabs */}
          <div className="flex bg-white/5 border border-white/8 rounded-xl p-1 gap-0.5">
            {GENDER_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setGender(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  gender === opt.value
                    ? 'bg-brand-red text-white'
                    : 'text-white/50 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Label filter */}
          <div className="flex gap-2">
            {[{ label: 'New', value: 'new' }, { label: 'Bestseller', value: 'bestseller' }, { label: 'Sale', value: 'sale' }].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilter(f => f === opt.value ? '' : opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                  filter === opt.value
                    ? 'bg-brand-red border-brand-red text-white'
                    : 'border-white/10 text-white/50 hover:border-white/30 hover:text-white'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* Sort */}
          <div className="ml-auto">
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-red/50 cursor-pointer"
            >
              {SORT_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value} className="bg-[#111]">{opt.label}</option>
              ))}
            </select>
          </div>

          <p className="text-white/30 text-sm w-full sm:w-auto sm:ml-2">
            {filtered.length} {filtered.length === 1 ? 'style' : 'styles'}
          </p>
        </div>

        {/* Grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-24 text-white/30">
            <div className="text-5xl mb-4">🕶️</div>
            <p className="text-lg font-semibold">No sunglasses found</p>
            <p className="text-sm mt-1">Try adjusting the filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5">
            {filtered.map((sg, i) => (
              <motion.div
                key={sg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              >
                <SunglassesCard sunglasses={sg} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
