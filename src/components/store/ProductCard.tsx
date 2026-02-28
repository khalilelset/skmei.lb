"use client";

import Image from "next/image";
import Link from "next/link";
import { Product } from "@/types";
import { formatPrice, calculateDiscount } from "@/lib/utils";
import { useCartStore } from "@/store/cartStore";
import { ShoppingCart, Star } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addItem, openCart } = useCartStore();
  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    addItem(product, 1);
    openCart();
  };

  return (
    <Link href={`/store/products/${product.slug}`} className="group block">
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-brand-silver hover:border-brand-red/30">

        {/* Image Container - Mobile Optimized */}
        <div className="relative aspect-square overflow-hidden bg-brand-silver-light">
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-cover group-hover:scale-110 transition-transform duration-500"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />

          {/* Badges - Mobile Friendly Size */}
          <div className="absolute top-2 sm:top-3 left-2 sm:left-3 flex flex-col gap-1.5 sm:gap-2">
            {product.isNew && (
              <span className="bg-brand-red text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                NEW
              </span>
            )}
            {discount > 0 && (
              <span className="bg-brand-black text-white text-[10px] sm:text-xs font-bold px-2 py-1 rounded-full shadow-lg">
                -{discount}%
              </span>
            )}
          </div>

          {/* Quick Add — desktop hover overlay only */}
          <div className="hidden lg:block absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
            <button
              onClick={handleAddToCart}
              className="w-full bg-brand-red text-white py-2.5 rounded-lg font-medium hover:bg-brand-red-dark active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg text-sm"
              aria-label={`Add ${product.name} to cart`}
            >
              <ShoppingCart className="w-4 h-4" />
              Add to Cart
            </button>
          </div>
        </div>

        {/* Content - Mobile Optimized Padding */}
        <div className="p-3 sm:p-4">

          {/* Category */}
          <p className="text-[10px] sm:text-xs text-brand-red font-bold uppercase tracking-wide mb-1">
            {product.category}
          </p>

          {/* Name - Proper line clamp for mobile */}
          <h3 className="font-semibold text-sm sm:text-base text-brand-black group-hover:text-brand-red transition-colors line-clamp-2 mb-2 min-h-10 sm:min-h-12">
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
              <span className="text-[10px] sm:text-xs text-brand-gray">
                ({product.reviewCount})
              </span>
            </div>
          )}

          {/* Price - Mobile Friendly Size */}
          <div className="flex items-baseline gap-2">
            <span className="text-base sm:text-lg font-bold text-brand-black">
              {formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <span className="text-xs sm:text-sm text-brand-gray line-through">
                {formatPrice(product.originalPrice)}
              </span>
            )}
          </div>

          {/* Add to Cart Button — mobile only */}
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0}
            className="lg:hidden w-full mt-3 bg-brand-red text-white py-2 rounded-lg font-medium hover:bg-brand-red-dark active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            aria-label={`Add ${product.name} to cart`}
          >
            <ShoppingCart className="w-4 h-4" />
            Add to Cart
          </button>

          {/* Stock Indicator - Mobile */}
          {product.stock < 10 && product.stock > 0 && (
            <p className="text-[10px] sm:text-xs text-brand-red font-medium mt-2">
              Only {product.stock} left!
            </p>
          )}
          {product.stock === 0 && (
            <p className="text-[10px] sm:text-xs text-brand-gray font-medium mt-2">
              Out of Stock
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
