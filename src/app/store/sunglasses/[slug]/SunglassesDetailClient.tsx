'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  ChevronRight, Home, ShoppingCart, Star, Play, Pause,
  Volume2, VolumeX, Maximize, X, Check,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';
import { useToastStore } from '@/store/toastStore';
import {
  formatPrice, calculateDiscount, sunglassesToProduct, getOptimizedVideoUrl,
} from '@/lib/utils';
import SunglassesCard from '@/components/store/SunglassesCard';
import type { Sunglasses, SunglassesVariant } from '@/types';

interface Props {
  sunglasses: Sunglasses;
  related: Sunglasses[];
  initialColorId?: string;
}

export default function SunglassesDetailClient({ sunglasses, related, initialColorId }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const { addItem }  = useCartStore();
  const showToast    = useToastStore((s) => s.show);

  const initialVariant =
    sunglasses.variants.find(v => v.id === initialColorId) ??
    sunglasses.variants[0] ??
    null;

  const [activeVariant, setActiveVariant] = useState<SunglassesVariant | null>(initialVariant);
  const [selectedImage, setSelectedImage] = useState(0);
  const [lightboxOpen, setLightboxOpen]   = useState(false);
  const [quantity, setQuantity]           = useState(1);
  const [justAdded, setJustAdded]         = useState(false);
  const [loadedImages, setLoadedImages]   = useState<Set<number>>(new Set());
  const [imgKeys, setImgKeys]             = useState<Map<number, number>>(new Map());
  const [imgRetries, setImgRetries]       = useState<Map<number, number>>(new Map());

  // Video state
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [isVideoMuted, setIsVideoMuted]     = useState(true);
  const [hasVideoStarted, setHasVideoStarted] = useState(false);
  const [videoProgress, setVideoProgress]   = useState(0);
  const [videoDuration, setVideoDuration]   = useState(0);
  const [videoCurrentTime, setVideoCurrentTime] = useState(0);
  const [controlsVisible, setControlsVisible] = useState(false);
  const [isFullscreen, setIsFullscreen]     = useState(false);

  const carouselRef     = useRef<HTMLDivElement>(null);
  const videoRef        = useRef<HTMLVideoElement>(null);
  const videoSectionRef = useRef<HTMLDivElement>(null);
  const controlsTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const images = activeVariant?.images ?? [];
  // Use variant video if set, otherwise fall back to the product-level video
  const videoUrl = activeVariant?.videoUrl || sunglasses.videoUrl || null;
  const discount = sunglasses.originalPrice ? calculateDiscount(sunglasses.originalPrice, sunglasses.price) : 0;

  // Sync URL when color changes
  const switchVariant = useCallback((variant: SunglassesVariant) => {
    setActiveVariant(variant);
    setSelectedImage(0);
    setLoadedImages(new Set());
    setImgKeys(new Map());
    setImgRetries(new Map());
    setHasVideoStarted(false);
    setIsVideoPlaying(false);
    if (videoRef.current) videoRef.current.pause();
    const params = new URLSearchParams(searchParams.toString());
    params.set('color', variant.id);
    router.replace(`/store/sunglasses/${sunglasses.slug}?${params.toString()}`, { scroll: false });
  }, [sunglasses.slug, router, searchParams]);

  // Fullscreen listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    document.addEventListener('webkitfullscreenchange', onFsChange);
    return () => {
      document.removeEventListener('fullscreenchange', onFsChange);
      document.removeEventListener('webkitfullscreenchange', onFsChange);
    };
  }, []);

  // Auto-play video on scroll
  useEffect(() => {
    const section = videoSectionRef.current;
    if (!section || !videoUrl) return;
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
  }, [videoUrl, hasVideoStarted]);

  const scrollToImage = useCallback((index: number) => {
    setSelectedImage(index);
    carouselRef.current?.scrollTo({ left: index * (carouselRef.current.clientWidth), behavior: 'smooth' });
  }, []);

  const handleImageLoad = (index: number) => setLoadedImages(prev => new Set(prev).add(index));
  const handleImageError = (index: number) => {
    const retries = imgRetries.get(index) ?? 0;
    if (retries >= 8) return;
    const delay = Math.min(2000 * Math.pow(1.5, retries), 30000);
    setImgRetries(prev => new Map(prev).set(index, retries + 1));
    setTimeout(() => setImgKeys(prev => new Map(prev).set(index, (prev.get(index) ?? 0) + 1)), delay);
  };

  const toggleVideoPlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().catch(() => {}); setIsVideoPlaying(true); }
    else          { v.pause(); setIsVideoPlaying(false); }
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
    else if ((v as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen) {
      (v as HTMLVideoElement & { webkitEnterFullscreen?: () => void }).webkitEnterFullscreen!();
    }
  };

  const showControls = () => {
    setControlsVisible(true);
    if (controlsTimerRef.current) clearTimeout(controlsTimerRef.current);
    controlsTimerRef.current = setTimeout(() => setControlsVisible(false), 3000);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;

  const handleAddToCart = () => {
    if (!activeVariant) return;
    const product = sunglassesToProduct(sunglasses, activeVariant.id);
    addItem(product, quantity);
    showToast({ productName: product.name, productImage: images[0] ?? '', productPrice: sunglasses.price, quantity });
    setJustAdded(true);
    setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <div className="min-h-screen bg-brand-black">
      {/* Lightbox */}
      <AnimatePresence>
        {lightboxOpen && images[selectedImage] && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center"
            onClick={() => setLightboxOpen(false)}
          >
            <div className="relative w-full max-w-lg aspect-square mx-4" onClick={e => e.stopPropagation()}>
              <Image src={images[selectedImage]} alt={sunglasses.name} fill className="object-contain" sizes="512px" />
            </div>
            <button onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition">
              <X className="w-5 h-5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="container mx-auto px-4 py-6">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-white/35 mb-8 flex-wrap">
          <Link href="/" className="hover:text-white transition flex items-center gap-1"><Home className="w-3.5 h-3.5" />Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/store/sunglasses" className="hover:text-white transition">Sunglasses</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-white/60 truncate max-w-[200px]">{sunglasses.name}</span>
        </nav>

        {/* Main grid */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-14">

          {/* ── Images ── */}
          <div className="flex flex-col gap-4">
            <div
              ref={carouselRef}
              className="flex overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden rounded-2xl"
              onScroll={() => {
                const el = carouselRef.current;
                if (!el) return;
                setSelectedImage(Math.round(el.scrollLeft / el.clientWidth));
              }}
            >
              {images.map((img, index) => (
                <div
                  key={imgKeys.get(index) ?? index}
                  className="relative shrink-0 w-full aspect-square snap-start cursor-zoom-in bg-white/5"
                  onClick={() => { setSelectedImage(index); setLightboxOpen(true); }}
                >
                  {!loadedImages.has(index) && <div className="absolute inset-0 bg-white/5 animate-pulse" />}
                  <Image
                    src={img}
                    alt={`${sunglasses.name} ${index + 1}`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 50vw"
                    className={`object-contain transition-opacity duration-300 ${loadedImages.has(index) ? 'opacity-100' : 'opacity-0'}`}
                    priority={index === 0}
                    onLoad={() => handleImageLoad(index)}
                    onError={() => handleImageError(index)}
                  />
                </div>
              ))}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto py-1">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => scrollToImage(index)}
                    className={`relative w-16 h-16 sm:w-20 sm:h-20 shrink-0 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      selectedImage === index
                        ? 'border-brand-red shadow-md shadow-brand-red/30 scale-105'
                        : 'border-white/15 hover:border-brand-red/50'
                    }`}
                  >
                    <Image src={img} alt={`${sunglasses.name} ${index + 1}`} fill className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Info ── */}
          <div className="flex flex-col gap-5">
            {/* Brand + badges */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-gray">{sunglasses.brand}</span>
              {sunglasses.isNew && <span className="bg-brand-red text-white text-xs font-bold px-2.5 py-1 rounded-full">New</span>}
              {sunglasses.isBestseller && <span className="bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">Bestseller</span>}
              {sunglasses.onSale && discount > 0 && <span className="bg-orange-400 text-white text-xs font-bold px-2.5 py-1 rounded-full">−{discount}% OFF</span>}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">{sunglasses.name}</h1>

            {/* Rating */}
            {sunglasses.rating > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className="w-4 h-4" fill={s <= Math.round(sunglasses.rating) ? '#DC2626' : 'transparent'} stroke={s <= Math.round(sunglasses.rating) ? '#DC2626' : '#6b7280'} />
                  ))}
                </div>
                <span className="text-sm text-white/50">({sunglasses.reviewCount} reviews)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-white">{formatPrice(sunglasses.price)}</span>
              {sunglasses.originalPrice && (
                <span className="text-lg text-white/35 line-through">{formatPrice(sunglasses.originalPrice)}</span>
              )}
            </div>

            {/* Color switcher */}
            {sunglasses.variants.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-white/50 mb-3">
                  Color — <span className="text-white normal-case tracking-normal font-semibold">{activeVariant?.colorName}</span>
                </p>
                <div className="flex items-center gap-3 flex-wrap">
                  {sunglasses.variants.map(variant => (
                    <button
                      key={variant.id}
                      onClick={() => switchVariant(variant)}
                      title={variant.colorName}
                      className={`relative w-9 h-9 rounded-full border-2 transition-all duration-200 ${
                        activeVariant?.id === variant.id
                          ? 'border-brand-red scale-110 shadow-lg shadow-brand-red/30'
                          : 'border-white/20 hover:border-white/60 hover:scale-105'
                      }`}
                      style={{ backgroundColor: variant.colorHex }}
                    >
                      {activeVariant?.id === variant.id && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <Check className="w-4 h-4 text-white drop-shadow" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Description */}
            {sunglasses.description && (
              <p className="text-white/55 leading-relaxed text-sm">{sunglasses.description}</p>
            )}

            {/* Features */}
            {sunglasses.features.length > 0 && (
              <div>
                <h3 className="font-bold text-white mb-3 text-[10px] uppercase tracking-[0.2em]">Key Features</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {sunglasses.features.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-white/65">
                      <svg className="w-4 h-4 text-brand-red shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Quantity + Add to Cart */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-white/6 border border-white/12 rounded-xl overflow-hidden">
                <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-3.5 hover:bg-white/10 transition text-white/50 hover:text-white text-lg font-bold">−</button>
                <span className="w-10 text-center text-white font-bold">{quantity}</span>
                <button onClick={() => setQuantity(q => Math.min(sunglasses.stock, q + 1))} className="px-4 py-3.5 hover:bg-white/10 transition text-white/50 hover:text-white text-lg font-bold">+</button>
              </div>
              <button
                onClick={handleAddToCart}
                disabled={sunglasses.stock === 0 || justAdded}
                className={`flex-1 flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl font-bold text-sm sm:text-base transition-all ${
                  justAdded ? 'bg-green-500 text-white' : sunglasses.stock === 0 ? 'bg-white/10 text-white/30 cursor-not-allowed' : 'bg-brand-red hover:bg-brand-red-dark text-white active:scale-[0.98]'
                }`}
              >
                {justAdded ? <><Check className="w-5 h-5" />Added!</> : <><ShoppingCart className="w-5 h-5" />Add to Cart</>}
              </button>
            </div>

            {sunglasses.stock === 0 && <p className="text-brand-red text-sm font-semibold">Out of stock</p>}
            {sunglasses.stock > 0 && sunglasses.stock <= 5 && (
              <p className="text-orange-400 text-sm font-semibold">Only {sunglasses.stock} left in stock</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Video Section ── */}
      {videoUrl && (
        <div ref={videoSectionRef} className="relative bg-black overflow-hidden mt-8">
          <div className="max-w-5xl mx-auto px-4 py-12 lg:py-16">
            <div className="relative rounded-2xl overflow-hidden bg-[#080808] cursor-pointer shadow-2xl"
              onMouseMove={showControls} onMouseEnter={showControls} onClick={toggleVideoPlay}
            >
              {/* Top bar */}
              <div className="absolute top-0 left-0 right-0 z-30 px-4 pt-4 pb-8 bg-linear-to-b from-black/80 to-transparent flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse" />
                  <span className="text-[9px] font-bold text-white/40 tracking-[0.3em] uppercase">Product Video</span>
                </div>
                <button className="pointer-events-auto w-8 h-8 rounded-full bg-black/40 border border-white/10 flex items-center justify-center hover:bg-black/70 transition" onClick={e => { e.stopPropagation(); toggleVideoMute(); }}>
                  {isVideoMuted ? <VolumeX className="w-3.5 h-3.5 text-white/60" /> : <Volume2 className="w-3.5 h-3.5 text-white/60" />}
                </button>
              </div>

              <div className="aspect-square">
                <video
                  ref={videoRef}
                  className={`w-full h-full ${isFullscreen ? 'object-contain bg-black' : 'object-cover'}`}
                  playsInline muted loop preload="auto"
                  onPlay={() => setIsVideoPlaying(true)}
                  onPause={() => setIsVideoPlaying(false)}
                  onTimeUpdate={() => { const v = videoRef.current; if (!v) return; setVideoCurrentTime(v.currentTime); if (v.duration) setVideoProgress((v.currentTime / v.duration) * 100); }}
                  onLoadedMetadata={() => { const v = videoRef.current; if (v?.duration) setVideoDuration(v.duration); }}
                >
                  <source src={getOptimizedVideoUrl(videoUrl, 480)} media="(max-width: 480px)" />
                  <source src={getOptimizedVideoUrl(videoUrl, 768)} media="(max-width: 768px)" />
                  <source src={getOptimizedVideoUrl(videoUrl, 1280)} />
                </video>
              </div>

              {/* Controls */}
              <div className={`absolute bottom-0 left-0 right-0 z-30 transition-all duration-300 ${hasVideoStarted && controlsVisible ? 'opacity-100 translate-y-0' : hasVideoStarted ? 'opacity-0 translate-y-1' : 'opacity-0'}`}>
                <div className="bg-linear-to-t from-black/90 to-transparent px-4 pb-4 pt-8">
                  <div className="w-full h-1 bg-white/20 rounded-full mb-3 cursor-pointer" onClick={e => { e.stopPropagation(); const v = videoRef.current; if (!v) return; const rect = e.currentTarget.getBoundingClientRect(); v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration; }}>
                    <div className="h-full bg-brand-red rounded-full transition-all" style={{ width: `${videoProgress}%` }} />
                  </div>
                  <div className="flex items-center gap-3">
                    <button onClick={e => { e.stopPropagation(); toggleVideoPlay(); }} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25">
                      {isVideoPlaying ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white" />}
                    </button>
                    <span className="text-xs text-white/50">{formatTime(videoCurrentTime)} / {formatTime(videoDuration)}</span>
                    <button onClick={e => { e.stopPropagation(); toggleVideoMute(); }} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25 ml-auto">
                      {isVideoMuted ? <VolumeX className="w-4 h-4 text-white" /> : <Volume2 className="w-4 h-4 text-white" />}
                    </button>
                    <button onClick={e => { e.stopPropagation(); enterFullscreen(); }} className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center hover:bg-white/25">
                      <Maximize className="w-4 h-4 text-white" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Specifications ── */}
      {Object.keys(sunglasses.specifications).length > 0 && (() => {
        const SPEC_LABELS: Record<string, string> = {
          frameMaterial:  'Frame Material',
          lensType:       'Lens Type',
          uvProtection:   'UV Protection',
          frameShape:     'Frame Shape',
          frameSize:      'Frame Size',
          lensWidth:      'Lens Width',
          bridgeWidth:    'Bridge Width',
          templeLength:   'Temple Length',
        };
        const entries = Object.entries(sunglasses.specifications).filter(([, v]) => v != null && String(v).trim() !== '');
        if (entries.length === 0) return null;
        return (
          <section className="py-14 bg-[#0d0d0d]">
            <div className="container mx-auto px-4">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-red mb-2">Details</p>
              <h2 className="text-2xl font-black text-white mb-1 tracking-tight">Specifications</h2>
              <div className="h-px w-10 bg-brand-red mb-8" />
              <div className="rounded-2xl border border-white/8 overflow-hidden max-w-2xl">
                <dl>
                  {entries.map(([key, value], index, arr) => (
                    <div key={key} className={`flex gap-2 px-6 py-4 ${index % 2 === 0 ? 'bg-white/3' : 'bg-transparent'} ${index < arr.length - 1 ? 'border-b border-white/6' : ''}`}>
                      <dt className="font-bold text-sm text-white/55 w-1/3 border-l-2 border-brand-red/30 pl-3">
                        {SPEC_LABELS[key] ?? key.replace(/([A-Z])/g, ' $1').replace(/^./, c => c.toUpperCase())}
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

      {/* ── Related ── */}
      {related.length > 0 && (
        <section className="py-14 bg-[#080808]">
          <div className="container mx-auto px-4">
            <div className="mb-8">
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-red mb-2">You May Also Like</p>
              <h2 className="text-2xl font-black text-white tracking-tight">Related Styles</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {related.map((sg, i) => (
                <motion.div key={sg.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07, duration: 0.4 }}>
                  <SunglassesCard sunglasses={sg} />
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
