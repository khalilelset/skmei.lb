import HeroSection from "@/components/store/HeroSection";
import ProductCard from "@/components/store/ProductCard";
import BrandStorySection from "@/components/store/BrandStorySection";
import InstagramFeed from "@/components/store/InstagramFeed";
import FeedbackSection from "@/components/store/FeedbackSection";
import BestsellingSection from "@/components/store/BestsellingSection";
import {
  getFeaturedProducts,
  getSaleProducts,
  categories,
} from "@/data/products";
import Image from "next/image";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";

export default function HomePage() {
  const featuredProducts = getFeaturedProducts();
  const saleProducts = getSaleProducts();

  const categoryConfig: Record<string, { count: number; image: string }> = {
    digital: { count: 24, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&fit=crop' },
    analog:  { count: 18, image: 'https://images.unsplash.com/photo-1524592094714-0f0654e359cf?w=600&q=80&fit=crop' },
    sports:  { count: 32, image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80&fit=crop' },
    smart:   { count: 15, image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80&fit=crop' },
    luxury:  { count: 12, image: 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=600&q=80&fit=crop' },
  };

  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Shop by Category */}
      <section className="py-16 sm:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="text-center mb-12 sm:mb-16">
            <p className="text-brand-red text-[10px] font-bold uppercase tracking-[0.25em] mb-3">
              Collections
            </p>
            <h2 className="text-3xl sm:text-5xl font-black text-brand-black mb-4 leading-tight">
              Shop by Category
            </h2>
            <p className="text-brand-gray text-sm max-w-sm mx-auto leading-relaxed">
              From everyday essentials to statement pieces — find your perfect timepiece.
            </p>
          </div>

          {/* Cards — horizontal scroll on mobile, 5-col grid on desktop */}
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((category) => {
              const cfg = categoryConfig[category.slug];
              return (
                <Link
                  key={category.id}
                  href={`/store/products?category=${category.slug}`}
                  className="group relative shrink-0 w-52 sm:w-auto overflow-hidden rounded-2xl"
                >
                  {/* Portrait image */}
                  <div className="relative aspect-[3/4] overflow-hidden">
                    <Image
                      src={cfg.image}
                      alt={category.name}
                      fill
                      className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                      sizes="(max-width: 640px) 208px, 20vw"
                    />

                    {/* Base dark gradient — always visible */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10" />

                    {/* Hover red tint at top */}
                    <div className="absolute inset-0 bg-gradient-to-b from-brand-red/0 to-brand-red/0 group-hover:from-brand-red/20 group-hover:to-transparent transition-all duration-500" />

                    {/* Border glow on hover */}
                    <div className="absolute inset-0 rounded-2xl border border-white/10 group-hover:border-brand-red/60 transition-colors duration-400" />

                    {/* Content pinned to bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      {/* Count */}
                      <p className="text-white/50 text-[10px] font-bold uppercase tracking-[0.2em] mb-1.5">
                        {cfg.count} watches
                      </p>

                      {/* Name */}
                      <h3 className="text-white font-bold text-base sm:text-lg leading-tight group-hover:text-brand-red transition-colors duration-300">
                        {category.name}
                      </h3>

                      {/* "Explore" cta — slides up on hover */}
                      <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-white/0 group-hover:text-white translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        Explore
                        <ArrowRight className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>

          {/* View All */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/store/products"
              className="inline-flex items-center gap-2 bg-brand-black text-white px-7 py-3 rounded-full font-semibold hover:bg-brand-red transition-colors duration-300 text-sm sm:text-base"
            >
              View All Collections
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

        </div>
      </section>

      {/* Bestselling Timepieces */}
      <BestsellingSection products={featuredProducts} />

      {/* Featured Products */}
      <section className="py-12 sm:py-16 bg-brand-silver-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 sm:mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-black mb-2">
              Featured Watches
            </h2>
            <p className="text-sm sm:text-base text-brand-gray">
              Handpicked selections from our best-selling collection
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-10 flex justify-center">
            <Link
              href="/store/products"
              className="group inline-flex items-center gap-3 bg-brand-black text-white px-8 py-4 rounded-full font-bold text-sm sm:text-base hover:bg-brand-red transition-colors duration-300 shadow-lg shadow-brand-black/20"
            >
              View All Products
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
                <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Sale */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Sale Banner */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-brand-black mb-10 sm:mb-14 p-7 sm:p-12">
            {/* Glowing orbs */}
            <div className="absolute -top-10 left-1/4 w-72 h-72 bg-brand-red/25 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-10 right-1/4 w-56 h-56 bg-brand-red/15 rounded-full blur-2xl pointer-events-none" />
            {/* Diagonal stripe texture */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '18px 18px' }} />

            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-brand-red/20 border border-brand-red/40 text-brand-red px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
                Limited Time Offer
              </div>
              {/* Headline */}
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-none mb-3 tracking-tight">
                HOT <span className="text-brand-red">SALE</span>
              </h2>
              <p className="text-white/55 text-sm sm:text-base max-w-sm leading-relaxed">
                Exclusive deals on authentic SKMEI watches —{' '}
                <span className="text-brand-red font-bold">up to 40% OFF.</span>{' '}
                Don&apos;t miss out!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {saleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Instagram Feed */}
      <InstagramFeed />

      {/* Brand Story */}
      <BrandStorySection />

      {/* Customer Feedback */}
      <FeedbackSection />
    </>
  );
}
