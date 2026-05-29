"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Shield,
  Truck,
  Award,
  Clock,
  ImagePlay,
  Star,
  ArrowRight,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/utils";

const features = [
  { icon: Shield,     title: "100% Authentic",       desc: "Every watch we sell is genuine SKMEI. We are an authorized dealer with direct sourcing from the manufacturer." },
  { icon: Award,      title: "1-Year Warranty",       desc: "All our Skmei watches come with a full 1-year warranty. Your purchase is protected and we stand behind every product." },
  { icon: Truck,      title: "Free Shipping",         desc: `Enjoy free shipping on orders over $${FREE_SHIPPING_THRESHOLD}. We deliver across Lebanon with fast and reliable service.` },
  { icon: Clock,      title: "Fast Delivery",         desc: "Quick processing and delivery so you can enjoy your new watch as soon as possible." },
  { icon: ImagePlay,  title: "Real Photos & Videos",  desc: "We provide actual size information, real photos, and videos for any item — so you know exactly what you are getting before you buy." },
  { icon: Star,       title: "Best Prices",           desc: "Competitive pricing on all our watches. Get the best value for authentic SKMEI timepieces in Lebanon." },
];

const TIMELINE = [
  { year: "2023", event: "Founded in Lebanon",        desc: "SKMEI.LB launched as Lebanon's first official SKMEI dealer." },
  { year: "2024", event: "500 Orders Delivered",      desc: "Reached 500 satisfied customers across all of Lebanon." },
  { year: "Now",  event: "Growing Every Day",         desc: "Expanding our collection and serving watch enthusiasts nationwide." },
];

const ease = [0.22, 1, 0.36, 1] as const;

// Animated counter — same pattern as HeroSection
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1800;
    const step = 16;
    const increment = target / (duration / step);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(Math.floor(start));
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
}

function FadeIn({ children, delay = 0, direction = "up", className = "" }: {
  children: React.ReactNode; delay?: number; direction?: "up" | "left" | "right" | "none"; className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const initial =
    direction === "up"    ? { opacity: 0, y: 32 } :
    direction === "left"  ? { opacity: 0, x: -40 } :
    direction === "right" ? { opacity: 0, x: 40 } :
    { opacity: 0 };

  return (
    <motion.div ref={ref} initial={initial}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, ease, delay }} className={className}>
      {children}
    </motion.div>
  );
}

export default function AboutPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative bg-brand-black overflow-hidden py-20 sm:py-28">
        {/* Architectural watermark */}
        <div aria-hidden className="absolute bottom-0 right-0 select-none pointer-events-none overflow-hidden leading-none">
          <span className="text-[clamp(60px,12vw,120px)] font-black text-white/[0.028] tracking-tight whitespace-nowrap">
            SINCE&nbsp;2023
          </span>
        </div>

        {/* Red line accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-0 w-2/3 h-px bg-linear-to-r from-transparent via-brand-red to-transparent opacity-40" />
          <div className="absolute bottom-1/3 left-0 w-2/3 h-px bg-linear-to-r from-brand-red via-transparent to-transparent opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          {/* Badge */}
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease }}
            className="inline-flex items-center gap-3 border-l-2 border-brand-red pl-3 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse flex-shrink-0" />
            <span className="text-[10px] font-bold tracking-[0.3em] text-brand-red uppercase">Official Authorized Dealer · Lebanon</span>
          </motion.div>

          <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1, ease }}
            className="text-4xl sm:text-5xl lg:text-7xl font-black text-white mb-5 leading-tight tracking-[-0.03em]">
            About <span className="text-brand-red">SKMEI.LB</span>
          </motion.h1>

          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease }}
            className="text-white/45 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed tracking-wide">
            Your trusted official SKMEI watch dealer in Lebanon. Quality timepieces for every style and occasion.
          </motion.p>

          {/* Animated stats strip */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35, ease }}
            className="mt-12 flex items-stretch justify-center divide-x divide-white/10 max-w-sm mx-auto">
            {[
              { target: 500, suffix: "+", label: "Customers" },
              { target: 100, suffix: "%", label: "Authentic" },
              { target: 400, suffix: "+", label: "Orders" },
            ].map(({ target, suffix, label }) => (
              <div key={label} className="flex-1 px-5 py-3 first:pl-0 last:pr-0">
                <p className="text-2xl sm:text-3xl font-black text-white tabular-nums">
                  <AnimatedCounter target={target} suffix={suffix} />
                </p>
                <p className="text-[10px] uppercase tracking-[0.15em] text-white/35 mt-1">{label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Gradient transition */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-linear-to-b from-transparent to-white pointer-events-none" />
      </section>

      {/* ── Our Story ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Horizontal rule */}
          <div className="h-px bg-linear-to-r from-transparent via-brand-silver to-transparent mb-12" />

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            <FadeIn direction="left">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-8 bg-brand-red rounded-full" />
                <span className="text-brand-red font-semibold text-sm uppercase tracking-widest">Our Story</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black text-brand-black mb-5 leading-tight tracking-tight">
                Lebanon&apos;s Premier<br />
                <span className="text-brand-red">SKMEI Dealer</span>
              </h2>
              <p className="text-brand-gray mb-4 leading-relaxed">
                SKMEI.LB is the official dealer of SKMEI watches in Lebanon. We are passionate about bringing high-quality, stylish, and affordable timepieces to watch enthusiasts across the country.
              </p>
              <p className="text-brand-gray mb-4 leading-relaxed">
                From digital sports watches to elegant analog designs, smart watches to luxury collections, we offer a wide range of authentic SKMEI products backed by our 1-year warranty and dedicated customer support.
              </p>
              <p className="text-brand-gray leading-relaxed">
                Our mission is simple: to provide genuine SKMEI watches at the best prices with exceptional service. Every Skmei watch we sell is 100% authentic and comes with a full manufacturer warranty.
              </p>
            </FadeIn>

            <FadeIn direction="right" delay={0.15}>
              <div className="relative">
                {/* Decorative glow */}
                <div className="absolute -inset-3 bg-brand-red/8 rounded-3xl blur-2xl" />
                {/* Red corner frames — editorial photo framing */}
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-brand-silver">
                  <span className="absolute top-3 left-3 w-8 h-8 border-t-2 border-l-2 border-brand-red z-10 pointer-events-none rounded-tl-sm" />
                  <span className="absolute bottom-3 right-3 w-8 h-8 border-b-2 border-r-2 border-brand-red z-10 pointer-events-none rounded-br-sm" />
                  <Image
                    src="/images/Company/company1.avif"
                    alt="SKMEI Headquarters — Guangdong Skmei Watch Manufacture Co., Ltd."
                    width={2312}
                    height={1080}
                    className="w-full h-auto object-cover"
                  />
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ── Timeline ── */}
      <section className="py-16 sm:py-20 bg-brand-silver-light">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" className="text-center mb-12">
            <p className="text-brand-red text-[10px] font-bold uppercase tracking-[0.3em] mb-3">Journey</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-black tracking-tight">Our Milestones</h2>
            <div className="h-0.5 w-12 bg-brand-red mx-auto mt-4" />
          </FadeIn>

          <div className="relative">
            {/* Vertical line */}
            <div className="absolute left-4 top-2 bottom-2 w-px bg-brand-silver" />

            <div className="space-y-10 pl-12">
              {TIMELINE.map(({ year, event, desc }, i) => (
                <FadeIn key={year} direction="left" delay={i * 0.12}>
                  <div className="relative">
                    {/* Dot */}
                    <div className="absolute -left-[2.85rem] top-1 w-3 h-3 bg-brand-red rounded-full border-2 border-white shadow-sm" />
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-red mb-1">{year}</p>
                    <h3 className="font-black text-brand-black text-base mb-1">{event}</h3>
                    <p className="text-brand-gray text-sm leading-relaxed">{desc}</p>
                  </div>
                </FadeIn>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Why Choose Us ── */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" className="text-center mb-12">
            <p className="text-brand-red text-[10px] font-bold uppercase tracking-[0.3em] mb-3">Why Us</p>
            <h2 className="text-3xl sm:text-4xl font-black text-brand-black tracking-tight mb-4">
              Why Choose <span className="text-brand-red">SKMEI.LB</span>
            </h2>
            <div className="h-0.5 w-12 bg-brand-red mx-auto mb-4" />
            <p className="text-brand-gray max-w-xl mx-auto">We are committed to delivering the best experience for our customers</p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FadeIn key={f.title} direction="up" delay={0.05 * i}>
                {/* Full card color invert on hover — dark background, white text */}
                <div className="group bg-white rounded-2xl p-6 border border-brand-silver hover:bg-brand-black hover:border-transparent hover:shadow-2xl transition-all duration-500 h-full">
                  <div className="w-12 h-12 bg-brand-red/10 group-hover:bg-brand-red/20 rounded-xl flex items-center justify-center mb-4 transition-colors duration-500">
                    <f.icon className="h-6 w-6 text-brand-red transition-colors duration-500" />
                  </div>
                  <h3 className="font-black text-brand-black group-hover:text-white mb-2 text-base transition-colors duration-500">
                    {f.title}
                  </h3>
                  <p className="text-brand-gray group-hover:text-white/50 text-sm leading-relaxed transition-colors duration-500">
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA — full-width brand-red banner ── */}
      <section className="bg-brand-red py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <FadeIn direction="up">
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-[0.3em] mb-4">Lebanon&apos;s Official Dealer</p>
            <h2 className="text-3xl sm:text-4xl font-black text-white mb-4 tracking-tight">
              Ready to Find Your Perfect Watch?
            </h2>
            <p className="text-white/70 max-w-xl mx-auto mb-8 leading-relaxed">
              Browse our collection of authentic SKMEI watches and find the perfect timepiece for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/store/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-brand-red font-bold rounded-lg hover:bg-brand-silver-light transition-all hover:scale-105 active:scale-95 shadow-xl">
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 border-2 border-white/30 text-white font-bold rounded-lg hover:bg-white/10 transition-all backdrop-blur-sm">
                Contact Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
