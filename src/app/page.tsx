import HeroSection from "@/components/store/HeroSection";
import ProductCard from "@/components/store/ProductCard";
import BrandStorySection from "@/components/store/BrandStorySection";
import {
  getFeaturedProducts,
  getSaleProducts,
  categories,
} from "@/data/products";
import Link from "next/link";
import { ArrowRight, Timer, Clock, Activity, Watch, Gem, ChevronRight } from "lucide-react";

export default function HomePage() {
  const featuredProducts = getFeaturedProducts();
  const saleProducts = getSaleProducts();

  const categoryConfig: Record<string, { icon: React.ReactNode; count: number }> = {
    digital: { icon: <Timer className="w-7 h-7 sm:w-8 sm:h-8" />, count: 24 },
    analog:  { icon: <Clock className="w-7 h-7 sm:w-8 sm:h-8" />,  count: 18 },
    sports:  { icon: <Activity className="w-7 h-7 sm:w-8 sm:h-8" />, count: 32 },
    smart:   { icon: <Watch className="w-7 h-7 sm:w-8 sm:h-8" />,  count: 15 },
    luxury:  { icon: <Gem className="w-7 h-7 sm:w-8 sm:h-8" />,   count: 12 },
  };

  return (
    <>
      {/* Hero Section */}
      <HeroSection />

      {/* Shop by Category */}
      <section className="py-14 sm:py-20 bg-brand-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section header */}
          <div className="flex items-end justify-between mb-10 sm:mb-12">
            <div>
              <p className="text-brand-red text-xs sm:text-sm font-bold uppercase tracking-widest mb-2">
                Collections
              </p>
              <h2 className="text-2xl sm:text-4xl font-bold text-white leading-tight">
                Shop by Category
              </h2>
            </div>
            <Link
              href="/store/products"
              className="hidden sm:flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white transition-colors"
            >
              View All
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Category grid */}
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5">
            {categories.map((category) => {
              const cfg = categoryConfig[category.slug];
              return (
                <Link
                  key={category.id}
                  href={`/store/products?category=${category.slug}`}
                  className="group shrink-0 sm:shrink relative flex flex-col gap-4 p-5 sm:p-6 bg-white/5 border border-white/10 rounded-2xl hover:bg-brand-red hover:border-brand-red transition-all duration-300 hover:scale-[1.03] hover:shadow-2xl hover:shadow-brand-red/30 w-40 sm:w-auto overflow-hidden"
                >
                  {/* Subtle background accent */}
                  <div className="absolute -bottom-4 -right-4 w-20 h-20 bg-white/5 rounded-full group-hover:bg-white/10 transition-colors" />

                  {/* Icon */}
                  <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl bg-brand-red/20 group-hover:bg-white/20 flex items-center justify-center text-brand-red group-hover:text-white transition-all duration-300">
                    {cfg?.icon}
                  </div>

                  {/* Text */}
                  <div>
                    <p className="font-bold text-white text-sm sm:text-base leading-snug mb-1">
                      {category.name}
                    </p>
                    <p className="text-white/40 group-hover:text-white/70 text-xs font-medium transition-colors">
                      {cfg?.count} watches
                    </p>
                  </div>

                  {/* Arrow */}
                  <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-white/20 group-hover:text-white/80 transition-all duration-300 group-hover:translate-x-0.5" />
                </Link>
              );
            })}
          </div>

          {/* Mobile "View All" link */}
          <div className="mt-6 text-center sm:hidden">
            <Link
              href="/store/products"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-white/60 hover:text-white transition-colors"
            >
              View All Products
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-12 sm:py-16 bg-brand-silver-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-black mb-2">
                Featured Watches
              </h2>
              <p className="text-sm sm:text-base text-brand-gray">
                Handpicked selections from our best-selling collection
              </p>
            </div>
            <Link
              href="/store/products"
              className="hidden md:flex items-center gap-2 text-brand-red font-semibold hover:text-brand-red-dark transition-colors"
            >
              View All
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {featuredProducts.slice(0, 8).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          <div className="mt-6 sm:mt-8 text-center md:hidden">
            <Link
              href="/store/products"
              className="inline-flex items-center gap-2 text-brand-red font-semibold hover:text-brand-red-dark transition-colors"
            >
              View All Featured
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Sale */}
      <section className="py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 sm:mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-brand-red text-white px-3 py-1 rounded-full text-xs sm:text-sm font-bold mb-3">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse"></span>
                Limited Time
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-black mb-2">
                Sale
              </h2>
              <p className="text-sm sm:text-base text-brand-gray">
                Special discounts on selected SKMEI watches
              </p>
            </div>
            <Link
              href="/store/products?filter=sale"
              className="hidden md:flex items-center gap-2 text-brand-red font-semibold hover:text-brand-red-dark transition-colors"
            >
              View All
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-6">
            {saleProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* Brand Story */}
      <BrandStorySection />
    </>
  );
}
