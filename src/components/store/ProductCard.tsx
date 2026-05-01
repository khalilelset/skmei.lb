"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import { ShoppingCart, Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const { show } = useToastStore();
  const [imgLoaded, setImgLoaded] = useState(false);
  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    show({
      productName: product.name,
      productImage: product.images[0] ?? '',
      productPrice: product.price,
      quantity: 1,
    });
  };

  return (
    <Link href={`/store/products/${product.slug}`} className="group block">
      <div className="bg-[#111] rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-white/8 hover:border-brand-red/30">

        {/* Image Container */}
        <div className="relative aspect-square overflow-hidden bg-white/5">
          {!imgLoaded && <div className="skeleton-shimmer absolute inset-0 z-10" />}
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className={`object-cover group-hover:scale-110 transition-all duration-500 ${imgLoaded ? 'opacity-100' : 'opacity-0'}`}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            onLoad={() => setImgLoaded(true)}
          />

          {/* Badges */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5 sm:gap-2 z-20">
            {product.brand && product.brand.toUpperCase() !== 'SKMEI' && (
              <span className="bg-white/90 text-gray-900 text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg backdrop-blur-sm">
                {product.brand}
              </span>
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

          {/* Out of stock overlay */}
          {product.stock === 0 && (
            <div className="absolute inset-0 z-20 bg-black/50 flex items-center justify-center">
              <span className="bg-black/70 text-white/60 text-xs font-bold uppercase tracking-widest px-4 py-2 rounded-full border border-white/15">
                Out of Stock
              </span>
            </div>
          )}

        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <p className="text-[10px] sm:text-xs text-brand-red font-bold uppercase tracking-wide mb-1">
            {product.category}
          </p>
          <h3 className="font-semibold text-sm sm:text-base text-white group-hover:text-brand-red transition-colors line-clamp-2 mb-2 min-h-10 sm:min-h-12">
            {product.name}
          </h3>

          {/* Star Rating */}
          {product.rating > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex items-center gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className="w-3 h-3 sm:w-3.5 sm:h-3.5"
                    fill={s <= Math.round(product.rating) ? '#DC2626' : 'transparent'}
                    stroke={s <= Math.round(product.rating) ? '#DC2626' : '#d1d5db'}
                  />
                ))}
              </div>
              <span className="text-[10px] sm:text-xs text-gray-400">({product.reviewCount})</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-bold text-white">
                {formatPrice(product.price)}
              </span>
              {product.originalPrice && (
                <span className="text-xs sm:text-sm text-gray-400 line-through">
                  {formatPrice(product.originalPrice)}
                </span>
              )}
            </div>

            {/* Color dots */}
            {product.colors && product.colors.length > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                {product.colors.slice(0, 4).map((c, i) => (
                  <span
                    key={i}
                    title={c.name}
                    className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: c.hex }}
                  />
                ))}
                {product.colors.length > 4 && (
                  <span className="text-[10px] text-white/35 font-medium">+{product.colors.length - 4}</span>
                )}
              </div>
            )}
          </div>

          {/* Add to Cart */}
          {product.stock > 0 ? (
            <>
              <button
                onClick={handleAddToCart}
                className="w-full mt-3 bg-brand-red text-white py-2 rounded-lg font-medium hover:bg-brand-red-dark active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm text-sm"
                aria-label={`Add ${product.name} to cart`}
              >
                <ShoppingCart className="w-4 h-4" />
                Add to Cart
              </button>
              {product.stock < 10 && (
                <p className="text-[10px] sm:text-xs text-orange-400 font-medium mt-2">Only {product.stock} left!</p>
              )}
            </>
          ) : (
            <div className="w-full mt-3 bg-white/6 border border-white/10 text-white/40 py-2 rounded-lg text-sm font-medium flex items-center justify-center cursor-not-allowed">
              Out of Stock
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
