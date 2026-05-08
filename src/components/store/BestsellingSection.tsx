'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { formatPrice, calculateDiscount } from '@/lib/utils';
import SectionHeader from './SectionHeader';
import type { Product } from '@/types';

interface Props {
  products: Product[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-3.5 h-3.5"
          fill={star <= Math.round(rating) ? '#DC2626' : 'transparent'}
          stroke={star <= Math.round(rating) ? '#DC2626' : '#d1d5db'}
        />
      ))}
    </div>
  );
}

function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore();
  const showToast = useToastStore((s) => s.show);
  const [imgLoaded, setImgLoaded] = useState(false);
  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    showToast({
      productName: product.name,
      productImage: product.images[0] ?? '',
      productPrice: product.price,
      quantity: 1,
    });
  };

  const badge = product.isNew
    ? { label: 'New', className: 'bg-brand-red text-white' }
    : product.isBestseller
    ? { label: 'Bestseller', className: 'bg-blue-500 text-white' }
    : product.onSale
    ? { label: 'Sale', className: 'bg-orange-400 text-white' }
    : discount > 0
    ? { label: `−${discount}%`, className: 'bg-brand-black text-white' }
    : null;

  return (
    <Link
      href={`/store/products/${product.slug}`}
      className="group relative flex flex-col bg-[#111] border border-white/8 rounded-2xl overflow-hidden hover:border-brand-red/40 hover:shadow-lg transition-all duration-300 h-full"
    >
      {/* Badge */}
      {badge && (
        <span className={`absolute top-3 left-3 z-10 text-xs font-bold px-2.5 py-1 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      )}

      {/* Image */}
      <div className="relative aspect-square bg-white/5 overflow-hidden shrink-0">
        {!imgLoaded && <div className="skeleton-shimmer absolute inset-0 z-10" />}
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className={`object-cover group-hover:scale-105 transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 25vw"
          onLoad={() => setImgLoaded(true)}
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Brand */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gray">
          {product.brand}
        </p>

        {/* Name */}
        <h3 className="font-semibold text-white text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-brand-red transition-colors">
          {product.name}
        </h3>

        {/* Stars */}
        <div className="flex items-center gap-2">
          <StarRating rating={product.rating} />
          <span className="text-xs text-gray-400">({product.reviewCount})</span>
        </div>

        {/* Price + Add to Cart */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-bold text-white">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={product.stock === 0}
            className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-brand-red-dark transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            Add to Cart
          </button>
        </div>
      </div>
    </Link>
  );
}

const cardVariants = {
  hidden: { opacity: 0, y: 32 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] as [number, number, number, number], delay: i * 0.08 },
  }),
};

export default function BestsellingSection({ products }: Props) {
  return (
    <section className="relative py-16 sm:py-24 bg-brand-black overflow-hidden">

      {/* Architectural background watermark */}
      <div
        aria-hidden
        className="absolute inset-0 flex items-center justify-start pointer-events-none select-none overflow-hidden"
      >
        <span className="text-[clamp(80px,15vw,140px)] font-black text-white/[0.028] leading-none whitespace-nowrap tracking-tight">
          BESTSELLERS&nbsp;•&nbsp;BESTSELLERS&nbsp;•&nbsp;BESTSELLERS
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="mb-10 sm:mb-14">
          <SectionHeader
            label="Featured Products"
            title="Bestselling Timepieces"
            subtitle="Discover our most sought-after watches, chosen by collectors and enthusiasts worldwide."
            align="center"
            light
          />
        </div>

        {/* Cards — horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sm:items-stretch">
          {products.slice(0, 4).map((product, i) => (
            <motion.div
              key={product.id}
              custom={i}
              variants={cardVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.1 }}
              className="shrink-0 w-64 sm:w-auto sm:flex sm:flex-col"
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/store/products"
            className="group inline-flex items-center gap-3 bg-white text-brand-black px-8 py-4 rounded-full font-bold text-sm sm:text-base hover:bg-brand-red hover:text-white transition-colors duration-300 shadow-lg"
          >
            View All Products
            <span className="w-7 h-7 rounded-full bg-brand-black/10 group-hover:bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-all duration-300">
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
