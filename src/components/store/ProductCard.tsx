"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import { ShoppingCart, Star, BellRing } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, items } = useCartStore();
  const { show } = useToastStore();
  const [imgLoaded, setImgLoaded] = useState(false);
  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  const cartQty = items.find((i) => i.product.id === product.id)?.quantity ?? 0;
  const atStockLimit = product.stock === 0 || cartQty >= product.stock;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (atStockLimit) return;
    addItem(product, 1);
    show({
      productName: product.name,
      productImage: product.images[0] ?? '',
      productPrice: product.price,
      quantity: 1,
    });
  };

  const isOOS = product.stock === 0;

  return (
    <Link href={`/store/products/${product.slug}`} className="group block">
      <div className={`rounded-xl sm:rounded-2xl shadow-sm transition-all duration-300 overflow-hidden border ${
        isOOS
          ? 'bg-[#0e0e0e] border-white/5 hover:border-white/12'
          : 'bg-[#111] border-white/8 hover:shadow-xl hover:border-brand-red/30'
      }`}>

        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-white/5">
          {product.images[0] ? (
            <>
              {!imgLoaded && <div className="skeleton-shimmer absolute inset-0 z-10" />}
              <Image
                src={product.images[0]}
                alt={product.name}
                fill
                className={`object-cover transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'} ${
                  isOOS ? 'grayscale opacity-40' : 'group-hover:scale-110'
                }`}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onLoad={() => setImgLoaded(true)}
              />
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ShoppingCart className="w-10 h-10 text-white/10" />
            </div>
          )}

          {/* Badges — hidden when OOS */}
          {!isOOS && (
            <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5 sm:gap-2 z-20">
              {product.isCouple && (
                <span className="bg-pink-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg">SET OF 2</span>
              )}
              {product.isNew && (
                <span className="bg-brand-red text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg">NEW</span>
              )}
              {product.onSale && (
                <span className="bg-orange-400 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg">SALE</span>
              )}
              {product.isBestseller && (
                <span className="bg-blue-500 text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg">BESTSELLER</span>
              )}
              {discount > 0 && (
                <span className="bg-gray-900 dark:bg-brand-black text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg">-{discount}%</span>
              )}
            </div>
          )}

          {/* Out of stock — diagonal ribbon */}
          {isOOS && (
            <div className="absolute inset-0 z-20 flex items-end justify-center pb-3">
              <div className="flex items-center gap-1.5 bg-black/80 backdrop-blur-sm border border-white/10 rounded-full px-3 py-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse shrink-0" />
                <span className="text-[10px] sm:text-xs font-bold uppercase tracking-widest text-white/70">Sold Out</span>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <p className={`text-[10px] sm:text-xs font-bold uppercase tracking-wide mb-1 ${isOOS ? 'text-white/30' : 'text-brand-red'}`}>
            {product.category}
          </p>
          <h3 className={`font-semibold text-sm sm:text-base transition-colors line-clamp-2 mb-2 min-h-10 sm:min-h-12 ${
            isOOS ? 'text-white/40' : 'text-white group-hover:text-brand-red'
          }`}>
            {product.name}
          </h3>

          {/* Star Rating */}
          <div className="flex items-center gap-1.5 mb-2">
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <Star
                  key={s}
                  className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                  fill={s <= Math.round(product.rating ?? 0) ? (isOOS ? '#444' : '#DC2626') : 'transparent'}
                  stroke={s <= Math.round(product.rating ?? 0) ? (isOOS ? '#444' : '#DC2626') : (isOOS ? '#333' : '#d1d5db')}
                />
              ))}
            </div>
            <span className={`text-[10px] sm:text-xs ${isOOS ? 'text-white/20' : 'text-gray-400'}`}>({product.reviewCount ?? 0})</span>
          </div>

          {/* Price */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-base sm:text-lg font-bold ${isOOS ? 'text-white/25 line-through' : 'text-white'}`}>
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && !isOOS && (
                  <span className="text-xs sm:text-sm text-gray-400 line-through">
                    {formatPrice(product.originalPrice)}
                  </span>
                )}
              </div>
              {/* Bundle deal badge */}
              {!isOOS && (() => {
                const tier = product.priceTiers?.filter((t) => t.qty > 1).sort((a, b) => a.qty - b.qty)[0];
                if (!tier) return null;
                return (
                  <span className="text-[9px] sm:text-[10px] font-black text-orange-400 bg-orange-400/10 border border-orange-400/25 px-1.5 py-0.5 rounded-full whitespace-nowrap leading-none">
                    {tier.qty} for {formatPrice(tier.price)}
                  </span>
                );
              })()}
            </div>

            {/* Color dots — dimmed when OOS */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                {product.colors.slice(0, 4).map((c, i) => (
                  <span
                    key={i}
                    title={c.name}
                    className={`w-3.5 h-3.5 rounded-full border shrink-0 ${isOOS ? 'border-white/10 opacity-30' : 'border-white/20'}`}
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                {product.colors.length > 4 && (
                  <span className={`text-[10px] font-medium ${isOOS ? 'text-white/15' : 'text-white/35'}`}>+{product.colors.length - 4}</span>
                )}
              </div>
            )}
          </div>

          {/* Add to Cart / OOS */}
          {!isOOS ? (
            <>
              <p className={`text-[10px] sm:text-xs text-orange-400 font-medium mt-2 ${product.stock <= 3 ? 'visible' : 'invisible'}`}>
                Only {product.stock} left!
              </p>
              <button
                onClick={handleAddToCart}
                disabled={atStockLimit}
                className="w-full mt-2 bg-brand-red text-white py-2 rounded-lg font-medium hover:bg-brand-red-dark active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label={`Add ${product.name} to cart`}
              >
                <ShoppingCart className="w-4 h-4" />
                {cartQty > 0 && cartQty >= product.stock ? 'Max in Cart' : 'Add to Cart'}
              </button>
            </>
          ) : (
            <div className="mt-4 rounded-lg border border-white/8 bg-white/3 px-3 py-2.5 flex items-center gap-2.5">
              <BellRing className="w-3.5 h-3.5 text-white/30 shrink-0" />
              <div className="min-w-0">
                <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wide leading-none">Currently unavailable</p>
                <p className="text-[10px] text-white/20 mt-0.5 leading-none">Check back later</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
