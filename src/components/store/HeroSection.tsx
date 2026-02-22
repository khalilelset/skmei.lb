'use client';

import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, useInView } from "framer-motion";

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
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, step);
    return () => clearInterval(timer);
  }, [inView, target]);

  return (
    <span ref={ref}>
      {count}{suffix}
    </span>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-brand-black via-brand-gray-dark to-brand-black overflow-hidden">
      {/* Red Swoosh Background Accent */}
      <div className="absolute top-0 right-0 w-full h-full opacity-10">
        <div className="absolute top-1/4 right-0 w-3/4 h-1 bg-gradient-to-r from-transparent via-brand-red to-transparent transform rotate-12" />
        <div className="absolute top-1/2 right-0 w-2/3 h-1 bg-gradient-to-r from-transparent via-brand-red to-transparent transform -rotate-6" />
        <div className="absolute bottom-1/4 right-0 w-3/4 h-1 bg-gradient-to-r from-transparent via-brand-red to-transparent transform rotate-3" />
      </div>

      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-16 lg:py-24">
        <div className="grid lg:grid-cols-2 gap-4 lg:gap-12 items-center">

          {/* Content */}
          <div className="text-center lg:text-left order-2 lg:order-1">

            {/* Badge */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0 }}
              className="inline-flex items-center gap-2 bg-brand-red/20 text-brand-red px-3 sm:px-4 py-2 rounded-full text-xs sm:text-sm font-medium mb-3 sm:mb-6 border border-brand-red/30"
            >
              <span className="w-2 h-2 bg-brand-red rounded-full animate-pulse"></span>
              Official Authorized Dealer in Lebanon
            </motion.div>

            {/* Heading */}
            <motion.h1
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
              className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-3 sm:mb-6 leading-tight"
            >
              Discover Your
              <span className="text-brand-red block mt-1 sm:mt-2">
                Perfect Timepiece
              </span>
            </motion.h1>

            {/* Description */}
            <motion.p
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
              className="text-sm sm:text-lg text-brand-silver mb-4 sm:mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed"
            >
              Explore our exclusive collection of SKMEI watches. From sporty
              digital to elegant analog, find the watch that matches your style
              at unbeatable prices.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <Link
                href="/store/products"
                className="inline-flex items-center justify-center gap-2 bg-brand-red text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-semibold hover:bg-brand-red-dark transition-all hover:scale-105 active:scale-95 shadow-lg shadow-brand-red/50"
              >
                Shop Collection
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>

            {/* Stats with animated counters */}
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
              className="mt-5 sm:mt-12 grid grid-cols-3 gap-3 sm:gap-6 max-w-md mx-auto lg:mx-0"
            >
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-white/15 transition-all">
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-2xl sm:text-3xl font-bold text-brand-red mb-1">
                    <AnimatedCounter target={500} suffix="+" />
                  </p>
                  <p className="text-[10px] sm:text-xs text-brand-silver text-center leading-tight">Happy<br className="sm:hidden" /> Customers</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-white/15 transition-all">
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-2xl sm:text-3xl font-bold text-brand-red mb-1">
                    <AnimatedCounter target={100} suffix="%" />
                  </p>
                  <p className="text-[10px] sm:text-xs text-brand-silver text-center leading-tight">Authentic<br className="sm:hidden" /> Products</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:bg-white/15 transition-all">
                <div className="flex flex-col items-center justify-center h-full">
                  <p className="text-2xl sm:text-3xl font-bold text-brand-red mb-1">
                    <AnimatedCounter target={400} suffix="+" />
                  </p>
                  <p className="text-[10px] sm:text-xs text-brand-silver text-center leading-tight">Orders<br className="sm:hidden" /> Delivered</p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0 }}
            transition={{ duration: 0.6, ease: "easeOut", delay: 0.1 }}
            className="relative order-1 lg:order-2"
          >
            <div className="relative z-10">
              <div className="relative w-full aspect-square max-w-[180px] sm:max-w-md lg:max-w-lg mx-auto">
                <div className="absolute inset-0 bg-brand-red/30 rounded-full blur-3xl"></div>
                <div className="relative z-10">
                  <Image
                    src="https://images.unsplash.com/photo-1524592094714-0f0654e20314?w=600"
                    alt="SKMEI Watch"
                    fill
                    className="object-contain drop-shadow-2xl"
                    priority
                    sizes="(max-width: 640px) 320px, (max-width: 768px) 384px, 512px"
                  />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Bottom Wave */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto">
          <path d="M0 120L60 105C120 90 240 60 360 45C480 30 600 30 720 37.5C840 45 960 60 1080 67.5C1200 75 1320 75 1380 75L1440 75V120H1380C1320 120 1200 120 1080 120C960 120 840 120 720 120C600 120 480 120 360 120C240 120 120 120 60 120H0Z" fill="white" />
        </svg>
      </div>
    </section>
  );
}
