import type { Metadata } from "next";
import HeroSection from "@/components/store/HeroSection";
import BrandStorySection from "@/components/store/BrandStorySection";
import InstagramFeed from "@/components/store/InstagramFeed";
import FeedbackSection from "@/components/store/FeedbackSection";
import BestsellingSection from "@/components/store/BestsellingSection";
import CategoryImage from "@/components/store/CategoryImage";
import HomeProductGrid from "@/components/store/HomeProductGrid";
import SectionHeader from "@/components/store/SectionHeader";
import { getFeaturedProducts, categories } from "@/data/products";
import Link from "next/link";
import { ChevronRight, ArrowRight } from "lucide-react";

const SITE_URL = "https://skmei.lb";

export const metadata: Metadata = {
  title: "SKMEI Watches Lebanon – Official Dealer | Best Prices & Free Delivery",
  description:
    "Buy authentic SKMEI watches in Lebanon. Largest collection of digital, sports, smart, analog & luxury SKMEI watches. Free delivery nationwide. 1-year warranty. Official authorized dealer.",
  keywords: [
    "SKMEI watches Lebanon",
    "buy SKMEI watch Lebanon",
    "watch store Lebanon",
    "online watch shop Lebanon",
    "SKMEI Lebanon official",
    "ساعات SKMEI لبنان",
    "متجر ساعات لبنان",
    "ساعات رياضية لبنان",
    "ساعات رخيصة لبنان",
    "digital watch Lebanon",
    "sports watch Lebanon",
    "smart watch Lebanon",
    "best watch Lebanon",
    "SKMEI official dealer Lebanon",
    "authentic SKMEI Lebanon",
    "free delivery watches Lebanon",
  ],
  openGraph: {
    title: "SKMEI.LB – Buy Authentic SKMEI Watches in Lebanon",
    description:
      "Lebanon's official SKMEI watch store. Digital, Sports, Smart, Analog & Luxury watches. Free nationwide delivery. 1-year warranty. Best prices guaranteed.",
    type: "website",
    url: SITE_URL,
    siteName: "SKMEI.LB",
    images: [{ url: "/images/og-image.jpg", width: 1200, height: 630, alt: "SKMEI.LB – Official Watch Store Lebanon" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "SKMEI.LB – Buy Authentic SKMEI Watches in Lebanon",
    description: "Lebanon's official SKMEI dealer. Best prices, free delivery, 1-year warranty.",
    images: ["/images/og-image.jpg"],
  },
  alternates: { canonical: SITE_URL },
};

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: [
    {
      "@type": "Question",
      name: "Are SKMEI watches sold at SKMEI.LB authentic?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. SKMEI.LB is the official authorized dealer of SKMEI watches in Lebanon. Every watch we sell is 100% genuine, sourced directly from the manufacturer with a 1-year warranty.",
      },
    },
    {
      "@type": "Question",
      name: "How long does watch delivery take in Lebanon?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "We deliver across all of Lebanon within 3 to 5 business days. Orders are processed quickly and shipped with fast, reliable couriers.",
      },
    },
    {
      "@type": "Question",
      name: "Do SKMEI watches come with warranty in Lebanon?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. All watches purchased from SKMEI.LB include a full 1-year manufacturer warranty covering defects and malfunctions.",
      },
    },
    {
      "@type": "Question",
      name: "What is the price range for SKMEI watches in Lebanon?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SKMEI watches at SKMEI.LB are priced between $15 and $80 USD depending on the model. We offer the best prices on authentic SKMEI timepieces in Lebanon.",
      },
    },
    {
      "@type": "Question",
      name: "Is cash on delivery available for watches in Lebanon?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. We offer cash on delivery (COD) for all orders across Lebanon. You pay only when you receive your watch.",
      },
    },
    {
      "@type": "Question",
      name: "Is there free shipping for watches in Lebanon?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "Yes. Orders above $50 USD qualify for free shipping anywhere in Lebanon. Standard shipping is $4 for smaller orders.",
      },
    },
    {
      "@type": "Question",
      name: "What types of SKMEI watches are available in Lebanon?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "SKMEI.LB offers five categories: Digital Watches, Analog Watches, Sports Watches, Smart Watches, and Luxury Watches. We carry over 100 models for men, women, and kids.",
      },
    },
    {
      "@type": "Question",
      name: "How can I contact SKMEI.LB in Lebanon?",
      acceptedAnswer: {
        "@type": "Answer",
        text: "You can reach us 24/7 via WhatsApp at +961 79 170 387 or by email at skmei.lb@gmail.com. We respond quickly to all inquiries.",
      },
    },
  ],
};

export default async function HomePage() {
  const featuredProducts = getFeaturedProducts();

  const categoryConfig: Record<string, { count: number; image: string }> = {
    digital: { count: 24, image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&q=80&fit=crop' },
    analog:  { count: 18, image: 'https://images.unsplash.com/photo-1524592094714-0f0654e359cf?w=600&q=80&fit=crop' },
    sports:  { count: 32, image: 'https://images.unsplash.com/photo-1547996160-81dfa63595aa?w=600&q=80&fit=crop' },
    smart:   { count: 15, image: 'https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=600&q=80&fit=crop' },
    luxury:  { count: 12, image: 'https://images.unsplash.com/photo-1548169874-53e85f753f1e?w=600&q=80&fit=crop' },
  };

  return (
    <>
      {/* FAQ Schema for rich results & AI citations */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />

      {/* Hero Section */}
      <HeroSection />

      {/* Shop by Category — near-black background for luxury editorial feel */}
      <section className="py-16 sm:py-24 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Section header */}
          <div className="mb-12 sm:mb-16">
            <SectionHeader
              label="Collections"
              title="Shop by Category"
              subtitle="From everyday essentials to statement pieces — find your perfect timepiece."
              align="center"
              light
            />
          </div>

          {/* Cards — horizontal scroll on mobile, 5-col grid on desktop */}
          <div className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
            {categories.map((category, idx) => {
              const cfg = categoryConfig[category.slug];
              return (
                <Link
                  key={category.id}
                  href={`/store/products?category=${category.slug}`}
                  className="group relative shrink-0 w-52 sm:w-auto overflow-hidden rounded-2xl"
                >
                  {/* Portrait image */}
                  <div className="relative aspect-3/4 overflow-hidden bg-[#111]">
                    <CategoryImage
                      src={cfg.image}
                      alt={category.name}
                      sizes="(max-width: 640px) 208px, 20vw"
                      priority={idx < 3}
                    />

                    {/* Base dark gradient — always visible */}
                    <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-black/10" />

                    {/* Hover red tint at top */}
                    <div className="absolute inset-0 bg-linear-to-b from-brand-red/0 to-brand-red/0 group-hover:from-brand-red/25 group-hover:to-transparent transition-all duration-500" />

                    {/* Border glow on hover */}
                    <div className="absolute inset-0 rounded-2xl border border-white/8 group-hover:border-brand-red/60 transition-colors duration-400" />

                    {/* Content pinned to bottom */}
                    <div className="absolute bottom-0 left-0 right-0 p-5">
                      {/* Category count — editorial uppercase */}
                      <p className="text-white/40 text-[9px] font-bold uppercase tracking-[0.3em] mb-1.5">
                        {category.name.toUpperCase()} COLLECTION
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
              className="inline-flex items-center gap-2 bg-white text-brand-black px-7 py-3 rounded-full font-semibold hover:bg-brand-red hover:text-white transition-colors duration-300 text-sm sm:text-base"
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
      <section className="py-12 sm:py-20 bg-[#0a0a0a]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="mb-8 sm:mb-12">
            <SectionHeader
              label="Just Arrived"
              title="New Arrivals"
              subtitle="The latest additions to our collection — fresh styles just in"
              align="left"
              light
            />
          </div>

          <HomeProductGrid type="newest" count={8} />

          <div className="mt-10 flex justify-center">
            <Link
              href="/store/products"
              className="group relative inline-flex items-center gap-3 overflow-hidden bg-brand-red text-white px-8 py-4 rounded-full font-bold text-sm sm:text-base hover:bg-brand-red-dark transition-colors duration-300 shadow-lg shadow-brand-red/30"
            >
              <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none" />
              View All Products
              <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
                <ChevronRight className="w-4 h-4" />
              </span>
            </Link>
          </div>
        </div>
      </section>

      {/* Sale — full-bleed dark section */}
      <section className="py-16 sm:py-24 bg-brand-black">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Sale Banner */}
          <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-white/5 border border-white/8 mb-10 sm:mb-14 p-7 sm:p-12">
            {/* Glowing orbs — slow pulse */}
            <div className="absolute -top-10 left-1/4 w-72 h-72 bg-brand-red/20 rounded-full blur-3xl pointer-events-none" style={{ animationDuration: '4s' }} />
            <div className="absolute -bottom-10 right-1/4 w-56 h-56 bg-brand-red/12 rounded-full blur-2xl pointer-events-none" style={{ animationDuration: '4s' }} />
            {/* Diagonal stripe texture */}
            <div className="absolute inset-0 opacity-[0.04] pointer-events-none" style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '18px 18px' }} />

            <div className="relative z-10">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 bg-brand-red/20 border border-brand-red/40 text-brand-red px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
                Limited Time Offer
              </div>

              {/* Animated letter-by-letter headline */}
              <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-none mb-3 tracking-tight flex flex-wrap gap-x-[0.3em]">
                {"HOT".split("").map((letter, i) => (
                  <span
                    key={`h${i}`}
                    className="inline-block animate-fade-in-up"
                    style={{ animationDelay: `${i * 0.04}s`, animationFillMode: 'both' }}
                  >
                    {letter}
                  </span>
                ))}
                <span className="text-brand-red">
                  {"SALE".split("").map((letter, i) => (
                    <span
                      key={`s${i}`}
                      className="inline-block animate-fade-in-up"
                      style={{ animationDelay: `${(i + 3) * 0.04}s`, animationFillMode: 'both' }}
                    >
                      {letter}
                    </span>
                  ))}
                </span>
              </h2>

              <p className="text-white/50 text-sm sm:text-base max-w-sm leading-relaxed">
                Exclusive deals on authentic SKMEI watches —{' '}
                <span className="text-brand-red font-bold">up to 40% OFF.</span>{' '}
                Don&apos;t miss out!
              </p>
            </div>
          </div>

          <HomeProductGrid type="sale" count={4} />
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
