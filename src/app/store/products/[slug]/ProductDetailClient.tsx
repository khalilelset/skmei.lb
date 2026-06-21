"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ChevronRight,
  Home,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  X,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCartStore } from "@/store/cartStore";
import { useToastStore } from "@/store/toastStore";
import {
  formatPrice,
  calculateDiscount,
  getStockStatus,
  getTierTotal,
  getOptimizedVideoUrl,
} from "@/lib/utils";
import ProductCard from "@/components/store/ProductCard";
import ReviewSection from "@/components/store/ReviewSection";
import SectionHeader from "@/components/store/SectionHeader";
import type { Product, Box } from "@/types";

interface Props {
  slug: string;
}

export default function ProductDetailClient({ slug }: Props) {
  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [brandWarranty, setBrandWarranty] = useState<{
    value: number;
    unit: string;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<number | null>(null);
  const [availableBoxes, setAvailableBoxes] = useState<Box[]>([]);
  const [selectedBox, setSelectedBox] = useState<Box | undefined>(undefined);
  const [boxImageLightbox, setBoxImageLightbox] = useState<string | null>(null);
  const [imgRetries, setImgRetries] = useState<Map<number, number>>(new Map());
  const [imgKeys, setImgKeys] = useState<Map<number, number>>(new Map());
  const [stickyVisible, setStickyVisible] = useState(false);
  const [justAdded, setJustAdded] = useState(false);
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(true);
  const [hasVideoStarted, setHasVideoStarted] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoDuration, setVideoDuration] = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { addItem } = useCartStore();
  const showToast = useToastStore((s) => s.show);
  const carouselRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scrollToImage = useCallback((index: number) => {
    setSelectedImage(index);
    carouselRef.current?.scrollTo({
      left: index * carouselRef.current.clientWidth,
      behavior: "smooth",
    });
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
          setBrandWarranty(data.brandWarranty ?? null);

          // Fetch boxes for this product's brand
          const brand = data.product.brand ?? "";
          fetch(`/api/boxes?brand=${encodeURIComponent(brand)}`)
            .then((r) => r.json())
            .then((boxes: Box[]) => {
              if (Array.isArray(boxes) && boxes.length > 0) {
                // Standard box always first
                const sorted = [...boxes].sort((a, b) =>
                  a.type === "standard" ? -1 : b.type === "standard" ? 1 : 0,
                );
                setAvailableBoxes(sorted);
                const std =
                  sorted.find((b) => b.type === "standard") ?? sorted[0];
                setSelectedBox(std);
              }
            })
            .catch(() => {});
        }
        setIsLoading(false);
      })
      .catch(() => setIsLoading(false));
  }, [slug]);

  useEffect(() => {
    const el = titleRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { rootMargin: "-112px 0px 0px 0px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [product]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  useEffect(() => {
    const section = videoSectionRef.current;
    if (!section || !product?.videoUrl) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && videoRef.current && !hasVideoStarted) {
          videoRef.current.muted = true;
          videoRef.current.play().catch(() => {});
          setIsVideoPlaying(true);
          setHasVideoStarted(true);
        } else if (!entry.isIntersecting && videoRef.current) {
          videoRef.current.pause();
          setIsVideoPlaying(false);
        }
      },
      { threshold: 0.5 },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, [product, hasVideoStarted]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-black">
        <div className="container mx-auto px-4 py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            <div className="aspect-square rounded-2xl bg-white/5 animate-pulse" />
            <div className="space-y-5 pt-2">
              <div className="h-3 rounded-full w-24 bg-white/10 animate-pulse" />
              <div className="h-10 rounded-lg w-3/4 bg-white/10 animate-pulse" />
              <div className="h-12 rounded-lg w-1/3 bg-white/10 animate-pulse" />
              <div className="h-4 rounded w-full bg-white/6 animate-pulse" />
              <div className="h-4 rounded w-5/6 bg-white/6 animate-pulse" />
              <div className="h-4 rounded w-4/6 bg-white/6 animate-pulse" />
              <div className="h-14 rounded-xl w-full bg-brand-red/20 animate-pulse mt-4" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-black text-white mb-4">
            Product Not Found
          </h1>
          <Link
            href="/store/products"
            className="text-brand-red hover:text-brand-red-dark font-semibold"
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

  const toggleVideoPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().catch(() => {});
      setIsVideoPlaying(true);
    } else {
      v.pause();
      setIsVideoPlaying(false);
    }
    setHasVideoStarted(true);
  };

  const toggleVideoMute = () => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = !v.muted;
    setIsVideoMuted(v.muted);
  };

  const enterFullscreen = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.requestFullscreen) v.requestFullscreen();
    else if (
      (v as HTMLVideoElement & { webkitEnterFullscreen?: () => void })
        .webkitEnterFullscreen
    ) {
      (v as HTMLVideoElement & { webkitEnterFullscreen?: () => void })
        .webkitEnterFullscreen!();
    }
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v) return;
    setVideoCurrentTime(v.currentTime);
    if (v.duration) setVideoProgress((v.currentTime / v.duration) * 100);
  };

  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (!v) return;
    setVideoDuration(v.duration);
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const v = videoRef.current;
    const bar = progressBarRef.current;
    if (!v || !bar || !v.duration) return;
    const rect = bar.getBoundingClientRect();
    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    v.currentTime = pct * v.duration;
  };

  const showControls = () => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(
      () => setControlsVisible(false),
      3000,
    );
  };

  const handleImageError = (index: number) => {
    const retries = imgRetries.get(index) ?? 0;
    if (retries >= 8) return;
    const delay = Math.min(2000 * Math.pow(1.5, retries), 30000);
    setImgRetries((prev) => new Map(prev).set(index, retries + 1));
    setTimeout(() => {
      setImgKeys((prev) => new Map(prev).set(index, (prev.get(index) ?? 0) + 1));
    }, delay);
  };

  const handleAddToCart = () => {
    addItem(product, quantity, selectedBox);
    showToast({
      productName: product.name,
      productImage: product.images[0] ?? "",
      productPrice: product.price,
      quantity,
    });
    setJustAdded(true);
    setTimeout(() => {
      setJustAdded(false);
      setStickyVisible(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-brand-black">
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="fixed inset-0 z-200 bg-black/95 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <motion.div
              layoutId={`product-img-${selectedImage}`}
              className="relative w-full max-w-lg aspect-square mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-contain"
                sizes="(max-width: 768px) 100vw, 512px"
              />
            </motion.div>
            <button
              onClick={() => setLightboxOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sticky Product Bar */}
      <div
        className={`fixed top-[88px] sm:top-[104px] left-0 right-0 z-49 bg-brand-black border-b border-white/10 shadow-lg shadow-black/50 transition-all duration-300 ${
          stickyVisible
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-full pointer-events-none"
        }`}
      >
        <div className="container mx-auto px-4 py-2.5 flex items-center gap-4">
          <div className="relative w-10 h-10 shrink-0 rounded-lg overflow-hidden bg-white/10 border border-white/15">
            <Image
              src={product.images[0]}
              alt={product.name}
              fill
              sizes="40px"
              className="object-cover"
            />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">
              {product.name}
            </p>
            <p className="text-sm font-semibold text-brand-red">
              {formatPrice(product.price)}
            </p>
          </div>
          <button
            onClick={handleAddToCart}
            disabled={product.stock === 0 || justAdded}
            className={`shrink-0 px-4 py-2 rounded-lg text-sm font-bold text-white transition-all flex items-center gap-2 shadow-sm ${
              justAdded
                ? "bg-green-500 cursor-default"
                : product.stock === 0
                  ? "bg-white/20 cursor-not-allowed"
                  : "bg-brand-red hover:bg-brand-red-dark active:scale-95"
            }`}
          >
            {justAdded ? (
              <>
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Added!
              </>
            ) : (
              <>
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
                    d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                  />
                </svg>
                {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
              </>
            )}
          </button>
          <button
            onClick={() => setStickyVisible(false)}
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition text-white/50 hover:text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* ── Main Dark Section: Breadcrumb + Product ── */}
      <div className="relative overflow-hidden">
        {/* Radial glow — gold for SKMEI, red for others */}
        {product.brand?.toUpperCase() === "SKMEI" ? (
          <>
            <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-red/5 blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-brand-red/3 blur-3xl pointer-events-none" />
          </>
        ) : (
          <div className="absolute top-0 right-0 w-1/2 h-full bg-brand-red/5 blur-3xl pointer-events-none" />
        )}
        {/* Diagonal stripe texture */}
        <div
          className="absolute inset-0 opacity-[0.02] pointer-events-none"
          style={{
            backgroundImage:
              "repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)",
            backgroundSize: "18px 18px",
          }}
        />

        {/* Breadcrumb */}
        <div className="relative z-10 container mx-auto px-4 pt-6 pb-2">
          <nav className="flex items-center gap-1.5 text-xs text-white/35 flex-wrap">
            <Link
              href="/"
              className="flex items-center gap-1 hover:text-white/60 transition-colors"
            >
              <Home className="w-3 h-3" />
              <span>Home</span>
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link
              href="/store/products"
              className="hover:text-white/60 transition-colors shrink-0"
            >
              Products
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <Link
              href={`/store/products?category=${product.category}`}
              className="hover:text-white/60 transition-colors capitalize shrink-0"
            >
              {product.category}
            </Link>
            <ChevronRight className="w-3 h-3 shrink-0" />
            <span className="text-brand-red font-medium truncate">
              {product.name}
            </span>
          </nav>
        </div>

        {/* Product Details Grid */}
        <section className="relative z-10 py-8 lg:py-12">
          <div className="container mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">
              {/* Images Carousel */}
              <div className="flex flex-col gap-3">
                <div
                  className={`relative rounded-2xl overflow-hidden bg-[#0d0d0d] shadow-2xl aspect-square ${
                    product.brand?.toUpperCase() === "SKMEI"
                      ? "border border-brand-red/20 shadow-brand-red/10"
                      : "border border-white/8 shadow-black/60"
                  }`}
                >
                  <div
                    ref={carouselRef}
                    onScroll={handleCarouselScroll}
                    className="absolute inset-0 flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
                    style={{ scrollbarWidth: "none" }}
                  >
                    {product.images.filter(Boolean).map((image, index) => (
                      <motion.div
                        key={index}
                        layoutId={`product-img-${index}`}
                        className="relative shrink-0 w-full aspect-square cursor-zoom-in"
                        onClick={() => {
                          setSelectedImage(index);
                          setLightboxOpen(true);
                        }}
                      >
                        <Image
                          key={imgKeys.get(index) ?? 0}
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          sizes="(max-width: 1024px) calc(100vw - 2rem), (max-width: 1280px) calc(50vw - 3rem), 600px"
                          className="object-contain"
                          priority={index === 0}
                          onError={() => handleImageError(index)}
                        />
                      </motion.div>
                    ))}
                  </div>

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
                    {product.isCouple && (
                      <span className="bg-pink-500 text-white text-sm font-semibold px-3 py-1 rounded-full shadow-sm flex items-center gap-1.5">
                        <Heart className="w-3.5 h-3.5 fill-white" /> SET OF 2
                      </span>
                    )}
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
                              : "bg-white/40 w-2 hover:bg-white/70"
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* Thumbnails */}
                {product.images.length > 1 && (
                  <div className="flex gap-2.5 overflow-x-auto py-1">
                    {product.images.filter(Boolean).map((image, index) => (
                      <button
                        key={index}
                        onClick={() => scrollToImage(index)}
                        className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                          selectedImage === index
                            ? "border-brand-red shadow-md shadow-brand-red/30 scale-105"
                            : "border-white/15 hover:border-brand-red/50 hover:scale-105"
                        }`}
                      >
                        <Image
                          key={imgKeys.get(index) ?? 0}
                          src={image}
                          alt={`${product.name} ${index + 1}`}
                          fill
                          sizes="80px"
                          className="object-cover"
                          onError={() => handleImageError(index)}
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div>
                {/* Category + Brand */}
                <div className="flex items-center gap-3 flex-wrap">
                  <Link
                    href={`/store/products?category=${product.category}`}
                    className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-red hover:text-brand-red-dark transition-colors"
                  >
                    {product.category}
                  </Link>
                  {product.brand && (
                    <Link
                      href={`/store/products?brands=${encodeURIComponent(product.brand)}`}
                      className="text-[10px] font-bold uppercase tracking-[0.3em] text-white/35 hover:text-white/60 transition-colors"
                    >
                      {product.brand}
                    </Link>
                  )}
                </div>

                <div className="h-px w-8 bg-brand-red mt-2 mb-3" />

                {/* Name */}
                <h1
                  ref={titleRef}
                  className="text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight mb-4"
                >
                  {product.name}
                </h1>

                {/* Price */}
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-black text-white">
                    {formatPrice(
                      getTierTotal(
                        product.priceTiers,
                        product.price,
                        quantity,
                      ) / quantity,
                    )}
                  </span>
                  {product.originalPrice && (
                    <>
                      <span className="text-xl text-white/30 line-through">
                        {formatPrice(product.originalPrice)}
                      </span>
                      <span className="bg-brand-red/15 text-brand-red border border-brand-red/25 rounded-sm px-2 py-0.5 text-xs font-bold">
                        Save{" "}
                        {formatPrice(product.originalPrice - product.price)}
                      </span>
                    </>
                  )}
                </div>

                {/* Bundle deal labels */}
                {product.priceTiers &&
                  product.priceTiers.filter((t) => t.qty > 1).length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-5">
                      {[...product.priceTiers]
                        .filter((t) => t.qty > 1)
                        .sort((a, b) => a.qty - b.qty)
                        .map((tier) => {
                          const active = quantity === tier.qty;
                          return (
                            <button
                              key={tier.qty}
                              type="button"
                              onClick={() => setQuantity(active ? 1 : tier.qty)}
                              className={`group flex items-center gap-2 px-4 py-2 rounded-full border-2 font-bold text-sm transition-all duration-200 active:scale-95 ${
                                active
                                  ? "border-orange-400 bg-orange-400/15 text-orange-300"
                                  : "border-orange-400/35 bg-orange-400/6 text-orange-400 hover:border-orange-400 hover:bg-orange-400/12"
                              }`}
                            >
                              {active && (
                                <svg
                                  className="w-3.5 h-3.5 shrink-0"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2.5}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              )}
                              <span>
                                Get {tier.qty} for {formatPrice(tier.price)}
                              </span>
                              {!active && (
                                <span className="text-[10px] font-medium text-orange-400/60">
                                  ({formatPrice(tier.price / tier.qty)} each)
                                </span>
                              )}
                            </button>
                          );
                        })}
                    </div>
                  )}

                {/* Color Combination Display */}
                {product.colors && product.colors.length > 0 && (
                  <div className="mb-6">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50 block mb-3">
                      Color
                    </span>
                    <div className="inline-flex items-center gap-3 bg-white/5 border border-white/10 rounded-full pl-1 pr-4 py-1">
                      {/* Split swatch */}
                      <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-md flex">
                        {product.colors.length === 1 ? (
                          <div
                            className="w-full h-full"
                            style={{ backgroundColor: product.colors[0].hex }}
                          />
                        ) : (
                          product.colors
                            .slice(0, 3)
                            .map((c, i, arr) => (
                              <div
                                key={i}
                                className="h-full"
                                style={{
                                  backgroundColor: c.hex,
                                  width: `${100 / arr.length}%`,
                                }}
                              />
                            ))
                        )}
                      </div>
                      {/* Combined label */}
                      <span className="text-sm font-semibold text-white/80">
                        {product.colors.map((c) => c.name).join(" / ")}
                      </span>
                    </div>
                  </div>
                )}

                {/* Add to Cart — mobile only */}
                <div className="flex lg:hidden items-center gap-3 mb-5">
                  <div className="flex items-center border border-white/15 rounded-lg shrink-0 bg-white/5">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-3 py-2.5 hover:bg-white/10 transition text-white/60 hover:text-white"
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
                    <span className="px-3 py-2.5 font-semibold min-w-8 text-center text-white">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock, q + 1))
                      }
                      className="px-3 py-2.5 hover:bg-white/10 transition text-white/60 hover:text-white"
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
                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="group relative flex-1 overflow-hidden bg-brand-red text-white py-2.5 rounded-lg font-semibold hover:bg-brand-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-brand-red/30"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none"
                    />
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
                    {product.stock === 0 ? "Out of Stock" : "Add to Cart"}
                  </button>
                </div>

                {/* Stock Status */}
                {(() => {
                  const maxStock =
                    product.brand?.toUpperCase() === "SKMEI" ? 10 : 20;
                  const pct =
                    product.stock === 0
                      ? 0
                      : Math.round(
                          (Math.min(product.stock, maxStock) / maxStock) * 100,
                        );
                  const isOut = product.stock === 0;
                  const isLow = !isOut && product.stock < 3;
                  const fillColor = isOut ? "bg-white/15" : "bg-green-500";
                  const labelColor = isOut
                    ? "text-white/35"
                    : isLow
                      ? "text-orange-400"
                      : "text-white/70";
                  return (
                    <div className="relative inline-flex items-center justify-center h-10 rounded-full border border-white/10 bg-white/5 overflow-hidden mb-5 px-8 min-w-[160px]">
                      {/* fill bar — slides from left */}
                      <div
                        className={`absolute left-0 top-0 h-full transition-all duration-700 ${fillColor}`}
                        style={{ width: `${pct}%` }}
                      />
                      {/* label always centered on top */}
                      <span
                        className={`relative z-10 text-sm font-bold tracking-widest whitespace-nowrap ${isOut ? "text-white/35" : "text-white"}`}
                        style={{
                          textShadow: isOut
                            ? "none"
                            : "0 1px 4px rgba(0,0,0,0.4)",
                        }}
                      >
                        {isOut ? "OUT OF STOCK" : "IN STOCK"}
                      </span>
                    </div>
                  );
                })()}

                {/* Box Selector */}
                {availableBoxes.length > 0 && (
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-white/50">
                        Box Option
                      </span>
                      <span
                        className={`text-[10px] font-bold text-brand-red bg-brand-red/10 border border-brand-red/20 px-2 py-0.5 rounded-full transition-opacity ${selectedBox && selectedBox.price > 0 ? "opacity-100" : "opacity-0"}`}
                      >
                        +{formatPrice(selectedBox?.price ?? 0)} added
                      </span>
                    </div>
                    <div className="flex gap-2 flex-wrap">
                      {availableBoxes.map((box) => (
                        <button
                          key={box.id}
                          type="button"
                          onClick={() => setSelectedBox(box)}
                          className={`group relative flex flex-col items-center gap-1.5 p-1.5 rounded-xl border-2 transition-all duration-200 w-[116px] ${
                            selectedBox?.id === box.id
                              ? "border-brand-red bg-brand-red/8 shadow-md shadow-brand-red/20"
                              : "border-white/12 bg-white/4 hover:border-white/30"
                          }`}
                        >
                          {/* 1:1 image */}
                          <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-white/8 flex items-center justify-center">
                            {box.image ? (
                              <>
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={box.image}
                                  alt={box.code}
                                  className="w-full h-full object-cover"
                                />
                                {/* Fullscreen trigger — corner icon */}
                                <div
                                  role="button"
                                  aria-label="View full screen"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setBoxImageLightbox(box.image);
                                  }}
                                  className="absolute bottom-1 right-1 w-6 h-6 rounded-md bg-black/60 backdrop-blur-sm flex items-center justify-center opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity cursor-pointer hover:bg-black/80"
                                >
                                  <svg
                                    className="w-3 h-3 text-white"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                    />
                                  </svg>
                                </div>
                              </>
                            ) : (
                              <svg
                                className="w-7 h-7 text-white/25"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={1.5}
                                  d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                                />
                              </svg>
                            )}
                            {selectedBox?.id === box.id && (
                              <div className="absolute top-1 right-1 w-4 h-4 bg-brand-red rounded-full flex items-center justify-center shadow pointer-events-none">
                                <svg
                                  className="w-2.5 h-2.5 text-white"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={3}
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                              </div>
                            )}
                          </div>
                          {/* Code */}
                          <span
                            className={`text-[10px] font-semibold text-center leading-tight font-mono ${selectedBox?.id === box.id ? "text-brand-red" : "text-white/60"}`}
                          >
                            {box.code}
                          </span>
                          {/* Price badge */}
                          <span
                            className={`text-[9px] font-bold ${box.type === "standard" ? "text-white/35" : "text-brand-red"}`}
                          >
                            {box.price === 0
                              ? "Free"
                              : `+${formatPrice(box.price)}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Box image fullscreen lightbox */}
                {boxImageLightbox && (
                  <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
                    onClick={() => setBoxImageLightbox(null)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={boxImageLightbox}
                      alt="Box"
                      className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl"
                      onClick={(e) => e.stopPropagation()}
                    />
                    <button
                      className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
                      onClick={() => setBoxImageLightbox(null)}
                    >
                      <svg
                        className="w-5 h-5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                )}

                {/* Couple Set callout */}
                {product.isCouple && (
                  <div className="flex items-center gap-3 bg-pink-500/10 border border-pink-500/25 rounded-xl px-4 py-3 mb-5">
                    <Heart className="w-5 h-5 text-pink-400 shrink-0 fill-pink-400" />
                    <div>
                      <p className="text-sm font-bold text-pink-300">
                        His &amp; Hers Couple Set
                      </p>
                      <p className="text-xs text-white/45">
                        Includes 2 matching watches — one for each
                      </p>
                    </div>
                  </div>
                )}

                {/* Description */}
                <p className="text-white/55 mb-6 leading-relaxed text-sm sm:text-base">
                  {product.description}
                </p>

                {/* Features */}
                <div className="mb-6">
                  <h3 className="font-bold text-white mb-3 text-[10px] uppercase tracking-[0.2em]">
                    Key Features
                  </h3>
                  <ul className="grid grid-cols-2 gap-2">
                    {product.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 text-sm text-white/65"
                      >
                        <svg
                          className="w-4 h-4 text-brand-red shrink-0"
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

                {/* Add to Cart — desktop */}
                <div className="hidden lg:flex items-center gap-4 mb-6">
                  <div className="flex items-center bg-white/6 border border-white/12 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                      className="px-4 py-3.5 hover:bg-white/10 transition text-white/50 hover:text-white"
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
                    <span className="px-4 py-3.5 font-bold text-lg text-white min-w-[3rem] text-center">
                      {quantity}
                    </span>
                    <button
                      onClick={() =>
                        setQuantity((q) => Math.min(product.stock, q + 1))
                      }
                      className="px-4 py-3.5 hover:bg-white/10 transition text-white/50 hover:text-white"
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

                  <button
                    onClick={handleAddToCart}
                    disabled={product.stock === 0}
                    className="group relative flex-1 overflow-hidden bg-brand-red text-white py-4 rounded-xl font-bold text-base hover:bg-brand-red-dark transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-brand-red/40 active:scale-95"
                  >
                    <span
                      aria-hidden
                      className="absolute inset-0 -translate-x-full skew-x-[-12deg] bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none"
                    />
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

                {/* Trust Badges — brand-aware */}
                {(() => {
                  const isSKMEI = product.brand?.toUpperCase() === "SKMEI";
                  const warrantyLabel = brandWarranty
                    ? `${brandWarranty.value} ${brandWarranty.unit} warranty included`
                    : isSKMEI
                      ? "Authorized dealer · 1-year manufacturer warranty"
                      : "Seller warranty included";
                  const badges = [
                    {
                      icon: "M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z",
                      title: isSKMEI
                        ? "100% Authentic SKMEI"
                        : `${product.brand} Product`,
                      desc: warrantyLabel,
                      highlight: isSKMEI,
                    },
                    {
                      icon: "M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z",
                      title: "Secure Checkout",
                      desc: "Cash on delivery · Whish payment accepted",
                      highlight: false,
                    },
                    {
                      icon: "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4",
                      title: "Every Order Inspected",
                      desc: "Quality checked and verified before it reaches you",
                      highlight: false,
                    },
                    {
                      icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z",
                      title: "Check Before You Accept",
                      desc: "Open & inspect your order in front of delivery — refuse if not satisfied",
                      highlight: false,
                    },
                  ];
                  return (
                    <div className="rounded-2xl border border-white/8 overflow-hidden bg-white/3">
                      {badges.map((badge, i) => (
                        <div
                          key={i}
                          className={`flex items-center gap-3 px-4 py-3.5 ml-4 border-l-2 ${
                            badge.highlight
                              ? "border-amber-400/60"
                              : "border-brand-red/40"
                          } ${i < badges.length - 1 ? "border-b border-white/6" : ""}`}
                        >
                          <svg
                            className={`w-5 h-5 shrink-0 ${badge.highlight ? "text-amber-400" : "text-brand-red"}`}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d={badge.icon}
                            />
                          </svg>
                          <div>
                            <p
                              className={`text-sm font-bold ${badge.highlight ? "text-amber-300" : "text-white"}`}
                            >
                              {badge.title}
                            </p>
                            <p className="text-xs text-white/45">
                              {badge.desc}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}

                {/* Warranty badge */}
                {brandWarranty && (
                  <div className="flex items-center gap-2 mt-4 text-sm text-emerald-400">
                    <svg
                      className="w-4 h-4 shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                      />
                    </svg>
                    <span className="font-semibold">
                      {brandWarranty.value} {brandWarranty.unit} warranty
                    </span>
                  </div>
                )}

                {/* SKU */}
                <p className="text-sm text-white/30 mt-3">
                  SKU:{" "}
                  <span className="text-white/60 font-medium">
                    {product.sku}
                  </span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* ── Video Section — Cinematic ── */}
      {product.videoUrl && (
        <section
          ref={videoSectionRef}
          className="relative bg-black overflow-hidden"
        >
          {/* Architectural watermark */}
          <div className="absolute inset-0 flex items-center pointer-events-none select-none overflow-hidden">
            <span
              className="text-[clamp(60px,14vw,160px)] font-black leading-none tracking-[-0.04em] whitespace-nowrap pl-6 lg:pl-16"
              style={{ color: "rgba(255,255,255,0.022)" }}
            >
              IN MOTION
            </span>
          </div>

          {/* Red ambient glow — right side behind video */}
          <div
            className="absolute top-0 right-0 w-2/3 h-full pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 50% 70% at 85% 50%, rgba(220,38,38,0.09) 0%, transparent 65%)",
            }}
          />

          <div className="relative z-10 container mx-auto px-4 py-16 lg:py-24">
            <div className="grid lg:grid-cols-[1fr_420px] xl:grid-cols-[1fr_480px] gap-12 lg:gap-20 items-center">
              {/* ── Left: Copy ── */}
              <motion.div
                className="order-2 lg:order-1"
                initial={{ opacity: 0, x: -24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Badge */}
                <div className="inline-flex items-center gap-2.5 border-l-2 border-brand-red pl-3 mb-6">
                  <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse shrink-0" />
                  <span className="text-[10px] font-bold tracking-[0.3em] text-brand-red uppercase">
                    Product Video
                  </span>
                </div>

                <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-none mb-5">
                  Watch It
                  <br />
                  <span className="text-brand-red">In Motion</span>
                </h2>
                <div className="h-px w-12 bg-brand-red mb-6" />

                <p className="text-white/45 text-base leading-relaxed mb-8 max-w-sm">
                  Experience every angle, every detail — exactly as it looks and
                  moves on your wrist. No filters, no tricks. Just the watch.
                </p>

                {/* Feature points */}
                <div className="space-y-3 mb-10">
                  {[
                    "True-to-life colors & finish",
                    "Real movement and weight feel",
                    "See every detail up close",
                  ].map((point, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-5 h-5 rounded-full bg-brand-red/12 border border-brand-red/25 flex items-center justify-center shrink-0">
                        <svg
                          className="w-2.5 h-2.5 text-brand-red"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={3}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                      <span className="text-sm text-white/55">{point}</span>
                    </div>
                  ))}
                </div>

                {/* Product tag */}
                <div className="inline-flex items-center gap-3 bg-white/4 border border-white/8 rounded-xl px-4 py-3">
                  <div className="w-2 h-2 rounded-full bg-brand-red" />
                  <span className="text-sm font-bold text-white/70 tracking-wide">
                    {product.name}
                  </span>
                </div>

                {/* Watermark line */}
                <p className="text-white/15 text-xs tracking-[0.4em] uppercase mt-10 font-semibold">
                  SKMEI · Lebanon
                </p>
              </motion.div>

              {/* ── Right: Video Player ── */}
              <motion.div
                className="order-1 lg:order-2 relative"
                initial={{ opacity: 0, x: 24, scale: 1.02 }}
                whileInView={{ opacity: 1, x: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              >
                {/* Outer ambient glow ring */}
                <div
                  className="absolute -inset-6 rounded-[2rem] pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse at center, rgba(220,38,38,0.15) 0%, transparent 65%)",
                  }}
                />

                {/* Thin red border glow */}
                <div
                  className="absolute -inset-px rounded-2xl pointer-events-none z-10"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(220,38,38,0.3) 0%, transparent 50%, rgba(220,38,38,0.1) 100%)",
                  }}
                />

                {/* Player wrapper */}
                <div
                  className="relative rounded-2xl overflow-hidden bg-[#080808] cursor-pointer"
                  style={{
                    boxShadow:
                      "0 0 0 1px rgba(220,38,38,0.12), 0 40px 80px rgba(0,0,0,0.9), 0 0 60px rgba(220,38,38,0.07)",
                  }}
                  onMouseMove={showControls}
                  onMouseEnter={showControls}
                  onClick={toggleVideoPlay}
                >
                  {/* Top bar: Live badge + mute */}
                  <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pb-8 bg-linear-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                      <span className="text-[9px] font-bold text-white/40 tracking-[0.3em] uppercase">
                        Product Video
                      </span>
                    </div>
                    <button
                      className="pointer-events-auto w-8 h-8 rounded-full bg-black/40 border border-white/10 backdrop-blur-sm flex items-center justify-center hover:bg-black/70 transition"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVideoMute();
                      }}
                    >
                      {isVideoMuted ? (
                        <VolumeX className="w-3.5 h-3.5 text-white/60" />
                      ) : (
                        <Volume2 className="w-3.5 h-3.5 text-white/60" />
                      )}
                    </button>
                  </div>

                  {/* Video */}
                  <div className="aspect-[3/4]">
                    <video
                      ref={videoRef}
                      className={`w-full h-full ${isFullscreen ? 'object-contain bg-black' : 'object-cover'}`}
                      playsInline
                      muted
                      loop
                      preload="auto"
                      onPlay={() => setIsVideoPlaying(true)}
                      onPause={() => setIsVideoPlaying(false)}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                    >
                      {/* Cloudinary serves the right format (WebM/MP4) per browser via f_auto.
                          Each source targets a viewport breakpoint so mobile gets a small file. */}
                      <source src={getOptimizedVideoUrl(product.videoUrl!, 480)}  media="(max-width: 480px)" />
                      <source src={getOptimizedVideoUrl(product.videoUrl!, 768)}  media="(max-width: 768px)" />
                      <source src={getOptimizedVideoUrl(product.videoUrl!, 1280)} />
                    </video>
                  </div>

                  {/* Center play button — shows before start */}
                  <AnimatePresence>
                    {!hasVideoStarted && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.85 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center z-20"
                        style={{
                          background:
                            "radial-gradient(ellipse 60% 60% at center, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 100%)",
                        }}
                      >
                        <div className="relative flex items-center justify-center">
                          {/* Rings */}
                          <div
                            className="absolute w-28 h-28 rounded-full border border-white/6 animate-ping"
                            style={{ animationDuration: "3s" }}
                          />
                          <div className="absolute w-20 h-20 rounded-full border border-white/10" />
                          {/* Button */}
                          <div className="relative w-14 h-14 rounded-full bg-brand-red flex items-center justify-center shadow-xl shadow-brand-red/50 hover:scale-110 hover:bg-brand-red-dark transition-all duration-200">
                            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Controls — fade on hover/activity */}
                  <div
                    className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ${hasVideoStarted && controlsVisible ? "opacity-100 translate-y-0" : hasVideoStarted ? "opacity-0 translate-y-1" : "opacity-0"}`}
                  >
                    {/* Progress bar */}
                    <div
                      ref={progressBarRef}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleProgressClick(e);
                      }}
                      className="group/bar h-5 flex items-end px-0 cursor-pointer"
                    >
                      <div className="w-full h-0.5 group-hover/bar:h-1 bg-white/15 transition-all duration-150 relative overflow-visible">
                        <div
                          className="h-full bg-brand-red relative transition-none"
                          style={{ width: `${videoProgress}%` }}
                        >
                          <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-3 h-3 rounded-full bg-brand-red opacity-0 group-hover/bar:opacity-100 transition-opacity shadow-sm shadow-brand-red/60" />
                        </div>
                      </div>
                    </div>

                    {/* Controls row */}
                    <div
                      className="flex items-center gap-3 px-4 pb-4 pt-1"
                      style={{
                        background:
                          "linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 100%)",
                      }}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Play/Pause */}
                      <button
                        onClick={toggleVideoPlay}
                        className="w-8 h-8 rounded-full bg-white/10 border border-white/12 backdrop-blur-sm flex items-center justify-center hover:bg-brand-red hover:border-brand-red transition-all"
                      >
                        {isVideoPlaying ? (
                          <Pause className="w-3.5 h-3.5 text-white fill-white" />
                        ) : (
                          <Play className="w-3.5 h-3.5 text-white fill-white ml-0.5" />
                        )}
                      </button>

                      {/* Time */}
                      <span className="text-[10px] font-mono text-white/40 tabular-nums">
                        {formatTime(videoCurrentTime)}
                      </span>
                      <span className="text-[10px] text-white/20">/</span>
                      <span className="text-[10px] font-mono text-white/25 tabular-nums">
                        {formatTime(videoDuration)}
                      </span>

                      <div className="flex-1" />

                      {/* Mute */}
                      <button
                        onClick={toggleVideoMute}
                        className="w-8 h-8 rounded-full bg-white/10 border border-white/12 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition"
                      >
                        {isVideoMuted ? (
                          <VolumeX className="w-3.5 h-3.5 text-white" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5 text-white" />
                        )}
                      </button>

                      {/* Fullscreen */}
                      <button
                        onClick={enterFullscreen}
                        className="w-8 h-8 rounded-full bg-white/10 border border-white/12 backdrop-blur-sm flex items-center justify-center hover:bg-white/20 transition"
                      >
                        <Maximize className="w-3.5 h-3.5 text-white" />
                      </button>
                    </div>
                  </div>

                  {/* Pause indicator — brief flash */}
                  <AnimatePresence>
                    {hasVideoStarted && !isVideoPlaying && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.7 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.2 }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none z-20"
                      >
                        <div className="w-12 h-12 rounded-full bg-black/60 backdrop-blur-sm border border-white/10 flex items-center justify-center">
                          <Pause className="w-5 h-5 text-white/80 fill-white/80" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      )}

      {/* ── Specifications — Dark ── */}
      {(() => {
        const SPEC_LABELS: Record<string, string> = {
          movement:           'Movement',
          caseMaterial:       'Case Material',
          bandMaterial:       'Band Material',
          caseSize:           'Case Size',
          caseThickness:      'Case Thickness',
          bandWidth:          'Band Width',
          bandLength:         'Band Length',
          waterResistance:    'Water Resistance',
          displayType:        'Display Type',
          features:           'Features',
          caseShape:          'Case Shape',
          dialWindowMaterial: 'Dial Window Material',
          warranty:           'Warranty',
        };
        const specEntries = Object.entries(product.specifications ?? {}).filter(
          ([, v]) => v != null && String(v).trim() !== ''
        );
        if (specEntries.length === 0) return null;
        return (
          <section className="py-14 bg-[#0d0d0d] relative overflow-hidden">
            <div
              className="absolute top-0 left-0 w-72 h-72 pointer-events-none"
              style={{ background: 'radial-gradient(ellipse at top left, rgba(220,38,38,0.06) 0%, transparent 60%)' }}
            />
            <div className="relative z-10 container mx-auto px-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-red mb-2">Details</p>
              <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Specifications</h2>
              <div className="h-px w-10 bg-brand-red mb-8" />
              <div className="rounded-2xl border border-white/8 overflow-hidden">
                <dl>
                  {specEntries.map(([key, value], index, arr) => (
                    <div
                      key={key}
                      className={`flex gap-2 px-6 py-4 ${index % 2 === 0 ? 'bg-white/3' : 'bg-transparent'} ${index < arr.length - 1 ? 'border-b border-white/6' : ''}`}
                    >
                      <dt className="font-bold text-sm text-white/55 w-1/3 border-l-2 border-brand-red/30 pl-3">
                        {SPEC_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                      </dt>
                      <dd className="text-sm text-white/85 flex-1 font-medium text-center">{String(value)}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            </div>
          </section>
        );
      })()}

      {/* ── Reviews ── */}
      <ReviewSection
        slug={slug}
        initialRating={product.rating}
        initialCount={product.reviewCount}
      />

      {/* ── Related Products — Dark ── */}
      {relatedProducts.length > 0 && (
        <section className="py-14 bg-[#080808]">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <SectionHeader
                label="You May Also Like"
                title="Related Products"
                align="left"
                light
              />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {relatedProducts.map((p, i) => (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{
                    delay: i * 0.06,
                    duration: 0.5,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                >
                  <ProductCard product={p} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
