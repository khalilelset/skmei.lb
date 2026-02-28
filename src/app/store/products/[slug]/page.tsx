"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { formatPrice, calculateDiscount, getStockStatus } from "@/lib/utils";
import ProductCard from "@/components/store/ProductCard";
import ReviewSection from "@/components/store/ReviewSection";
import type { Product } from "@/types";

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { addItem, openCart } = useCartStore();
  const carouselRef = useRef<HTMLDivElement>(null);

  const scrollToImage = useCallback((index: number) => {
    setSelectedImage(index);
    carouselRef.current?.scrollTo({ left: index * carouselRef.current.clientWidth, behavior: "smooth" });
  }, []);

  const handleCarouselScroll = useCallback(() => {
    const el = carouselRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.clientWidth);
    setSelectedImage(index);
  }, []);

  useEffect(() => {
    fetch(`/api/products/${slug}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.product) {
          setProduct(data.product);
          setRelatedProducts(data.related ?? []);
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white">
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-2xl" />
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-1/4" />
              <div className="h-8 bg-gray-200 rounded w-3/4" />
              <div className="h-10 bg-gray-200 rounded w-1/3" />
              <div className="h-20 bg-gray-200 rounded" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Product Not Found
          </h1>
          <Link
            href="/store/products"
            className="text-brand-red hover:text-brand-red-dark"
          >
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  const discount = product.originalPrice
    ? calculateDiscount(product.originalPrice, product.price)
    : 0;
  const stockStatus = getStockStatus(product.stock);

  const handleAddToCart = () => {
    addItem(product, quantity);
    openCart();
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Breadcrumb */}
      <div className="container mx-auto px-4 pt-5 pb-2">
        <nav className="flex items-center gap-1 text-sm min-w-0">
          <Link
            href="/"
            className="flex items-center gap-1 text-brand-gray hover:text-brand-black transition-colors shrink-0"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link
            href="/store/products"
            className="text-brand-gray hover:text-brand-black transition-colors shrink-0"
          >
            Products
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <Link
            href={`/store/products?category=${product.category}`}
            className="text-brand-gray hover:text-brand-black transition-colors capitalize shrink-0"
          >
            {product.category}
          </Link>
          <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
          <span className="text-brand-red font-medium truncate">
            {product.name}
          </span>
        </nav>
      </div>

      {/* Product Details */}
      <section className="py-8 lg:py-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images Carousel */}
            <div className="flex flex-col gap-3">
              {/* Swipeable Carousel */}
              <div className="relative rounded-2xl overflow-hidden bg-brand-silver-light border border-brand-silver shadow-lg">
                <div
                  ref={carouselRef}
                  onScroll={handleCarouselScroll}
                  className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth aspect-square"
                  style={{ scrollbarWidth: "none" }}
                >
                  {product.images.map((image, index) => (
                    <div key={index} className="relative shrink-0 w-full aspect-square">
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                        priority={index === 0}
                      />
                    </div>
                  ))}
                </div>

                {/* Badges */}
                <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                  {product.isNew && (
                    <span className="bg-emerald-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
                      NEW
                    </span>
                  )}
                  {discount > 0 && (
                    <span className="bg-brand-red text-white text-sm font-semibold px-3 py-1 rounded-full shadow-sm">
                      -{discount}% OFF
                    </span>
                  )}
                </div>

                {/* Dot Indicators */}
                {product.images.length > 1 && (
                  <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                    {product.images.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => scrollToImage(index)}
                        className={`h-2 rounded-full transition-all duration-300 ${
                          selectedImage === index
                            ? "bg-white w-5"
                            : "bg-white/50 w-2 hover:bg-white/80"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Thumbnails */}
              {product.images.length > 1 && (
                <div className="flex gap-2.5 overflow-x-auto py-1">
                  {product.images.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => scrollToImage(index)}
                      className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                        selectedImage === index
                          ? "border-brand-red shadow-md shadow-brand-red/30 scale-105"
                          : "border-brand-silver hover:border-brand-red/50 hover:scale-105"
                      }`}
                    >
                      <Image
                        src={image}
                        alt={`${product.name} ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div>
              {/* Category */}
              <Link
                href={`/store/products?category=${product.category}`}
                className="text-sm text-brand-red font-medium uppercase tracking-wide hover:text-brand-red-dark"
              >
                {product.category}
              </Link>

              {/* Name */}
              <h1 className="text-2xl lg:text-3xl font-bold text-slate-900 mt-2 mb-4">
                {product.name}
              </h1>


              {/* Price */}
              <div className="flex items-center gap-3 mb-6">
                <span className="text-3xl font-bold text-slate-900">
                  {formatPrice(product.price)}
                </span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-slate-400 line-through">
                      {formatPrice(product.originalPrice)}
                    </span>
                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded text-sm font-medium">
                      Save {formatPrice(product.originalPrice - product.price)}
                    </span>
                  </>
                )}
              </div>

              {/* Add to Cart — mobile only, right under price */}
              <div className="flex lg:hidden items-center gap-3 mb-6">
                <div className="flex items-center border border-brand-silver rounded-lg shrink-0">
                  <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="px-3 py-2.5 hover:bg-slate-100 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
                  </button>
                  <span className="px-3 py-2.5 font-semibold min-w-8 text-center">{quantity}</span>
                  <button onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))} className="px-3 py-2.5 hover:bg-slate-100 transition">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-brand-red text-white py-2.5 rounded-lg font-semibold hover:bg-brand-red-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-brand-red/30"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></svg>
                  {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                </button>
              </div>

              {/* Stock Status */}
              <div className="flex items-center gap-2 mb-6">
                <span className={`${stockStatus.color} font-medium`}>
                  {stockStatus.label}
                </span>
                {product.stock > 0 && product.stock < 50 && (
                  <span className="text-slate-500">
                    - Only {product.stock} left
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-slate-600 mb-6">{product.description}</p>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">
                  Key Features
                </h3>
                <ul className="grid grid-cols-2 gap-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm">
                      <svg
                        className="w-4 h-4 text-brand-red"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Add to Cart — desktop only (mobile uses sticky bottom bar) */}
              <div className="hidden lg:flex items-center gap-4 mb-6">
                {/* Quantity */}
                <div className="flex items-center border rounded-lg">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="px-4 py-3 hover:bg-slate-100 transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M20 12H4"
                      />
                    </svg>
                  </button>
                  <span className="px-4 py-3 font-medium">{quantity}</span>
                  <button
                    onClick={() =>
                      setQuantity((q) => Math.min(product.stock, q + 1))
                    }
                    className="px-4 py-3 hover:bg-slate-100 transition"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 4v16m8-8H4"
                      />
                    </svg>
                  </button>
                </div>

                {/* Add Button */}
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock === 0}
                  className="flex-1 bg-brand-red text-white py-3 rounded-lg font-semibold hover:bg-brand-red-dark transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-brand-red/30"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                    />
                  </svg>
                  Add to Cart
                </button>
              </div>

              {/* Trust Badges */}
              <div className="border border-brand-silver rounded-xl overflow-hidden mt-2 mb-4">
                <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-silver">
                  <svg className="w-5 h-5 text-brand-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Secure Checkout</p>
                    <p className="text-xs text-slate-500">Cash on delivery — pay when you receive</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 border-b border-brand-silver">
                  <svg className="w-5 h-5 text-brand-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Fast Delivery Across Lebanon</p>
                    <p className="text-xs text-slate-500">Delivered in 2–4 days · Every order inspected before shipping</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 px-4 py-3">
                  <svg className="w-5 h-5 text-brand-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">100% Authentic Products</p>
                    <p className="text-xs text-slate-500">Official SKMEI dealer · 1-year warranty included</p>
                  </div>
                </div>
              </div>

              {/* SKU */}
              <p className="text-sm text-slate-500">
                SKU: <span className="text-slate-700">{product.sku}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Specifications */}
      <section className="py-12 bg-slate-50">
        <div className="container mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">
            Specifications
          </h2>
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <tbody>
                {Object.entries(product.specifications).map(
                  ([key, value], index) => (
                    <tr
                      key={key}
                      className={index % 2 === 0 ? "bg-white" : "bg-slate-50"}
                    >
                      <td className="px-6 py-4 font-medium text-slate-900 capitalize w-1/3">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </td>
                      <td className="px-6 py-4 text-slate-600">{value}</td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Reviews */}
      <ReviewSection
        slug={slug}
        initialRating={product.rating}
        initialCount={product.reviewCount}
      />

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="py-12">
          <div className="container mx-auto px-4">
            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Related Products
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 snap-x snap-mandatory">
              {relatedProducts.map((product) => (
                <div key={product.id} className="shrink-0 w-64 snap-start">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

    </div>
  );
}
