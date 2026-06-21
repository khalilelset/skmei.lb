'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ShoppingCart, Star } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import { formatPrice, sunglassesToProduct, calculateDiscount } from '@/lib/utils';
import type { Sunglasses, SunglassesVariant } from '@/types';

interface Props {
  sunglasses: Sunglasses;
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className="w-3 h-3"
          fill={star <= Math.round(rating) ? '#DC2626' : 'transparent'}
          stroke={star <= Math.round(rating) ? '#DC2626' : '#6b7280'}
        />
      ))}
    </div>
  );
}

export default function SunglassesCard({ sunglasses }: Props) {
  const { addItem } = useCartStore();
  const showToast   = useToastStore((s) => s.show);
  const [activeVariant, setActiveVariant] = useState<SunglassesVariant>(
    sunglasses.variants[0] ?? { id: '', colorName: '', colorHex: '#000', images: [], videoUrl: null }
  );
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError]   = useState(false);

  const discount = sunglasses.originalPrice
    ? calculateDiscount(sunglasses.originalPrice, sunglasses.price)
    : 0;

  const badge = sunglasses.isNew
    ? { label: 'New', cls: 'bg-brand-red text-white' }
    : sunglasses.isBestseller
      ? { label: 'Bestseller', cls: 'bg-blue-500 text-white' }
      : sunglasses.onSale && discount > 0
        ? { label: `−${discount}%`, cls: 'bg-orange-400 text-white' }
        : null;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    const product = sunglassesToProduct(sunglasses, activeVariant.id);
    addItem(product, 1);
    showToast({
      productName:  product.name,
      productImage: activeVariant.images[0] ?? '',
      productPrice: sunglasses.price,
      quantity:     1,
    });
  };

  const img = activeVariant.images[0] ?? '';

  return (
    <Link
      href={`/store/sunglasses/${sunglasses.slug}?color=${activeVariant.id}`}
      className="group relative flex flex-col bg-[#111] border border-white/8 rounded-2xl overflow-hidden hover:border-brand-red/40 hover:shadow-lg transition-all duration-300 h-full"
    >
      {/* Badge */}
      {badge && (
        <span className={`absolute top-3 left-3 z-10 text-xs font-bold px-2.5 py-1 rounded-full ${badge.cls}`}>
          {badge.label}
        </span>
      )}

      {/* Image */}
      <div className="relative aspect-square bg-white/5 overflow-hidden shrink-0">
        {!imgLoaded && !imgError && <div className="skeleton-shimmer absolute inset-0 z-10" />}
        {img && !imgError ? (
          <Image
            src={img}
            alt={`${sunglasses.name} ${activeVariant.colorName}`}
            fill
            className={`object-cover group-hover:scale-105 transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={() => setImgLoaded(true)}
            onError={() => { setImgLoaded(true); setImgError(true); }}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-20">🕶️</span>
          </div>
        )}
      </div>

      {/* Color swatches */}
      {sunglasses.variants.length > 1 && (
        <div
          className="flex items-center gap-1.5 px-4 pt-3"
          onClick={(e) => e.preventDefault()}
        >
          {sunglasses.variants.map((v) => (
            <button
              key={v.id}
              onClick={(e) => { e.preventDefault(); setImgLoaded(false); setImgError(false); setActiveVariant(v); }}
              title={v.colorName}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                activeVariant.id === v.id
                  ? 'border-brand-red scale-110'
                  : 'border-white/20 hover:border-white/50'
              }`}
              style={{ backgroundColor: v.colorHex }}
            />
          ))}
        </div>
      )}

      {/* Content */}
      <div className="flex flex-col gap-1.5 p-4 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-gray">
          {sunglasses.brand}
        </p>
        <h3 className="font-semibold text-white text-sm leading-snug line-clamp-2 group-hover:text-brand-red transition-colors">
          {sunglasses.name}
        </h3>
        <p className="text-xs text-white/40">{activeVariant.colorName}</p>

        {sunglasses.rating > 0 && (
          <div className="flex items-center gap-1.5">
            <StarRating rating={sunglasses.rating} />
            <span className="text-xs text-gray-400">({sunglasses.reviewCount})</span>
          </div>
        )}

        <div className="flex items-center justify-between mt-auto pt-2">
          <div className="flex items-baseline gap-2">
            <span className="text-base font-bold text-white">{formatPrice(sunglasses.price)}</span>
            {sunglasses.originalPrice && (
              <span className="text-xs text-gray-400 line-through">{formatPrice(sunglasses.originalPrice)}</span>
            )}
          </div>
          <button
            onClick={handleAdd}
            disabled={sunglasses.stock === 0}
            className="flex items-center gap-1.5 bg-brand-red text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-brand-red-dark transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            {sunglasses.stock === 0 ? 'Sold Out' : 'Add'}
          </button>
        </div>
      </div>
    </Link>
  );
}
