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
import { useRef } from "react";
import { motion, useInView } from "framer-motion";

const features = [
  {
    icon: Shield,
    title: "100% Authentic",
    desc: "Every watch we sell is genuine SKMEI. We are an authorized dealer with direct sourcing from the manufacturer.",
  },
  {
    icon: Award,
    title: "1-Year Warranty",
    desc: "All our watches come with a full 1-year warranty. Your purchase is protected and we stand behind every product.",
  },
  {
    icon: Truck,
    title: "Free Shipping",
    desc: "Enjoy free shipping on orders over $50. We deliver across Lebanon with fast and reliable service.",
  },
  {
    icon: Clock,
    title: "Fast Delivery",
    desc: "Quick processing and delivery so you can enjoy your new watch as soon as possible.",
  },
  {
    icon: ImagePlay,
    title: "Real Photos & Videos",
    desc: "We provide actual size information, real photos, and videos for any item — so you know exactly what you are getting before you buy.",
  },
  {
    icon: Star,
    title: "Best Prices",
    desc: "Competitive pricing on all our watches. Get the best value for authentic SKMEI timepieces in Lebanon.",
  },
];

function FadeIn({
  children,
  delay = 0,
  direction = "up",
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: "up" | "left" | "right" | "none";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  const initial =
    direction === "up"
      ? { opacity: 0, y: 32 }
      : direction === "left"
        ? { opacity: 0, x: -40 }
        : direction === "right"
          ? { opacity: 0, x: 40 }
          : { opacity: 0 };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={inView ? { opacity: 1, x: 0, y: 0 } : {}}
      transition={{ duration: 0.6, ease: "easeOut", delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export default function AboutPage() {
  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative bg-linear-to-br from-brand-black via-brand-gray-dark to-brand-black overflow-hidden py-20 sm:py-28">
        {/* Red line accents */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-0 w-2/3 h-px bg-linear-to-r from-transparent via-brand-red to-transparent opacity-40" />
          <div className="absolute bottom-1/3 left-0 w-2/3 h-px bg-linear-to-r from-brand-red via-transparent to-transparent opacity-30" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-brand-red/20 border border-brand-red/30 text-brand-red px-4 py-2 rounded-full text-sm font-medium mb-6"
          >
            <span className="w-2 h-2 bg-brand-red rounded-full animate-pulse" />
            Official Authorized Dealer · Lebanon
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-5 leading-tight"
          >
            About <span className="text-brand-red">SKMEI.LB</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-brand-gray-light text-base sm:text-lg max-w-2xl mx-auto leading-relaxed"
          >
            Your trusted official SKMEI watch dealer in Lebanon. Quality
            timepieces for every style and occasion.
          </motion.p>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="mt-12 grid grid-cols-3 gap-4 max-w-lg mx-auto"
          >
            {[
              { value: "500+", label: "Happy Customers" },
              { value: "100%", label: "Authentic" },
              { value: "400+", label: "Orders Delivered" },
            ].map((s) => (
              <div
                key={s.label}
                className="bg-white/5 border border-white/10 rounded-xl px-3 py-4"
              >
                <p className="text-2xl sm:text-3xl font-bold text-brand-red">
                  {s.value}
                </p>
                <p className="text-xs text-brand-gray-light mt-1">{s.label}</p>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 60" fill="none" className="w-full h-auto">
            <path
              d="M0 60L1440 60L1440 20C1200 50 960 60 720 50C480 40 240 10 0 20Z"
              fill="white"
            />
          </svg>
        </div>
      </section>

      {/* ── Our Story ── */}
      <section className="py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-8 lg:gap-14 items-center">
            <FadeIn direction="left">
              {/* Red accent bar */}
              <div className="flex items-center gap-3 mb-5">
                <span className="w-1 h-8 bg-brand-red rounded-full" />
                <span className="text-brand-red font-semibold text-sm uppercase tracking-widest">
                  Our Story
                </span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-brand-black mb-5 leading-tight">
                Lebanon&apos;s Premier
                <br />
                <span className="text-brand-red">SKMEI Dealer</span>
              </h2>
              <p className="text-brand-gray mb-4 leading-relaxed">
                SKMEI.LB is the official dealer of SKMEI watches in Lebanon. We
                are passionate about bringing high-quality, stylish, and
                affordable timepieces to watch enthusiasts across the country.
              </p>
              <p className="text-brand-gray mb-4 leading-relaxed">
                From digital sports watches to elegant analog designs, smart
                watches to luxury collections, we offer a wide range of
                authentic SKMEI products backed by our 1-year warranty and
                dedicated customer support.
              </p>
              <p className="text-brand-gray leading-relaxed">
                Our mission is simple: to provide genuine SKMEI watches at the
                best prices with exceptional service. Every watch we sell is
                100% authentic and comes with a full manufacturer warranty.
              </p>
            </FadeIn>

            <FadeIn direction="right" delay={0.15}>
              <div className="relative">
                {/* Decorative glow behind image */}
                <div className="absolute -inset-3 bg-brand-red/10 rounded-3xl blur-2xl" />
                <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border border-brand-silver">
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

      {/* ── Why Choose Us ── */}
      <section className="py-16 sm:py-20 bg-brand-silver-light">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn direction="up" className="text-center mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <span className="w-8 h-px bg-brand-red" />
              <span className="text-brand-red font-semibold text-sm uppercase tracking-widest">
                Why Us
              </span>
              <span className="w-8 h-px bg-brand-red" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-black mb-3">
              Why Choose <span className="text-brand-red">SKMEI.LB</span>
            </h2>
            <p className="text-brand-gray max-w-xl mx-auto">
              We are committed to delivering the best experience for our
              customers
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <FadeIn key={f.title} direction="up" delay={0.05 * i}>
                <div className="group bg-white rounded-2xl p-6 border border-brand-silver hover:border-brand-red/40 hover:shadow-lg transition-all duration-300 h-full">
                  <div className="w-12 h-12 bg-brand-red/10 group-hover:bg-brand-red rounded-xl flex items-center justify-center mb-4 transition-colors duration-300">
                    <f.icon className="h-6 w-6 text-brand-red group-hover:text-white transition-colors duration-300" />
                  </div>
                  <h3 className="font-bold text-brand-black mb-2 text-base">
                    {f.title}
                  </h3>
                  <p className="text-brand-gray text-sm leading-relaxed">
                    {f.desc}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="relative bg-linear-to-br from-brand-black via-brand-gray-dark to-brand-black overflow-hidden py-16 sm:py-20">
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <div className="absolute top-0 left-1/4 w-1/2 h-px bg-linear-to-r from-transparent via-brand-red to-transparent" />
          <div className="absolute bottom-0 right-1/4 w-1/2 h-px bg-linear-to-r from-transparent via-brand-red to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <FadeIn direction="up">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              Ready to Find Your{" "}
              <span className="text-brand-red">Perfect Watch?</span>
            </h2>
            <p className="text-brand-gray-light max-w-xl mx-auto mb-8 leading-relaxed">
              Browse our collection of authentic SKMEI watches and find the
              perfect timepiece for you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/store/products"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-red text-white font-semibold rounded-lg hover:bg-brand-red-dark transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-red/40"
              >
                Shop Now
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center justify-center gap-2 px-8 py-3.5 border border-white/20 text-white font-semibold rounded-lg hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                Contact Us
              </Link>
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  );
}
