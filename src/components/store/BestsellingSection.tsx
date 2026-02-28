'use client';

import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star, ChevronRight } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatPrice, calculateDiscount } from '@/lib/utils';
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
  const { addItem, openCart } = useCartStore();
  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    openCart();
  };

  const badge = product.isNew
    ? { label: 'New', className: 'bg-brand-red text-white' }
    : discount > 0
    ? { label: `−${discount}%`, className: 'bg-brand-black text-white' }
    : null;

  return (
    <Link
      href={`/store/products/${product.slug}`}
      className="group relative flex flex-col bg-white border border-brand-silver rounded-2xl overflow-hidden hover:border-brand-red/40 hover:shadow-lg transition-all duration-300 h-full"
    >
      {/* Badge */}
      {badge && (
        <span className={`absolute top-3 left-3 z-10 text-xs font-bold px-2.5 py-1 rounded-full ${badge.className}`}>
          {badge.label}
        </span>
      )}

      {/* Image */}
      <div className="relative aspect-square bg-brand-silver-light overflow-hidden shrink-0">
        <Image
          src={product.images[0]}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          sizes="(max-width: 640px) 70vw, (max-width: 1024px) 33vw, 25vw"
        />
      </div>

      {/* Content */}
      <div className="flex flex-col gap-2 p-4 flex-1">
        {/* Brand */}
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gray">
          {product.brand}
        </p>

        {/* Name */}
        <h3 className="font-semibold text-brand-black text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-brand-red transition-colors">
          {product.name}
        </h3>

        {/* Stars */}
        <div className="flex items-center gap-2">
          <StarRating rating={product.rating} />
          <span className="text-xs text-brand-gray">({product.reviewCount})</span>
        </div>

        {/* Price + Add to Cart */}
        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-bold text-brand-black">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs text-brand-gray line-through">
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

export default function BestsellingSection({ products }: Props) {
  return (
    <section className="py-16 sm:py-24 bg-brand-silver-light">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-10 sm:mb-14">
          <p className="text-brand-red text-xs font-bold uppercase tracking-widest mb-3">
            Featured Products
          </p>
          <h2 className="text-3xl sm:text-5xl font-black text-brand-black mb-4 leading-tight">
            Bestselling Timepieces
          </h2>
          <p className="text-brand-gray text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            Discover our most sought-after watches, chosen by collectors and enthusiasts worldwide.
          </p>
        </div>

        {/* Cards — horizontal scroll on mobile, grid on desktop */}
        <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] sm:items-stretch">
          {products.slice(0, 4).map((product) => (
            <div key={product.id} className="shrink-0 w-64 sm:w-auto sm:flex sm:flex-col">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* View All Button */}
        <div className="mt-10 flex justify-center">
          <Link
            href="/store/products?filter=bestselling"
            className="group inline-flex items-center gap-3 bg-brand-black text-white px-8 py-4 rounded-full font-bold text-sm sm:text-base hover:bg-brand-red transition-colors duration-300 shadow-lg shadow-brand-black/20"
          >
            View All Bestsellers
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
