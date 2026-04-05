'use client';

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import LiveWatchFace from "./LiveWatchFace";

const ease = [0.22, 1, 0.36, 1] as const;

function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setInView(true); }, { threshold: 0.1 });
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

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

const WORDS_LINE1 = ["Discover", "Your"];
const WORDS_LINE2 = ["Perfect", "Timepiece"];

export default function HeroSection() {
  return (
    <section className="relative bg-brand-black overflow-hidden min-h-[90vh] flex flex-col justify-center">

      {/* Background radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 70% at 70% 50%, #3d0a0a 0%, transparent 65%)' }}
      />

      {/* Diagonal stripe texture */}
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '18px 18px' }} />

      {/* Red line accents — desktop only to avoid crossing watch on mobile */}
      <div className="absolute inset-0 pointer-events-none hidden lg:block">
        <div className="absolute top-[22%] left-0 w-2/3 h-px bg-linear-to-r from-brand-red via-transparent to-transparent opacity-30" />
        <div className="absolute top-[90%] right-0 w-1/2 h-px bg-linear-to-l from-transparent via-brand-red to-transparent opacity-20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">

          {/* ── Left: Copy ── */}
          <div className="order-2 lg:order-1">

            {/* Editorial badge */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, ease }}
              className="inline-flex items-center gap-3 border-l-2 border-brand-red pl-3 mb-5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-brand-red animate-pulse shrink-0" />
              <span className="text-[10px] font-bold tracking-[0.3em] text-brand-red uppercase">Official Authorized Dealer · Lebanon</span>
            </motion.div>

            {/* Red rule */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.5, delay: 0.15, ease }}
              style={{ originX: 0 }}
              className="h-px w-10 bg-brand-red mb-5"
            />

            {/* Headline — per-word clip reveal */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-none tracking-[-0.03em] mb-6">
              <div className="overflow-hidden flex flex-wrap gap-x-3 mb-1">
                {WORDS_LINE1.map((word, i) => (
                  <motion.span
                    key={word}
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    transition={{ duration: 0.6, delay: 0.2 + i * 0.1, ease }}
                    className="text-white/70 inline-block"
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
              <div className="overflow-hidden flex flex-wrap gap-x-3">
                {WORDS_LINE2.map((word, i) => (
                  <motion.span
                    key={word}
                    initial={{ clipPath: 'inset(0 100% 0 0)' }}
                    animate={{ clipPath: 'inset(0 0% 0 0)' }}
                    transition={{ duration: 0.6, delay: 0.4 + i * 0.1, ease }}
                    className="text-white inline-block"
                  >
                    {word}
                  </motion.span>
                ))}
              </div>
            </h1>

            {/* Description */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.55, ease }}
              className="text-sm sm:text-base text-white/50 mb-8 max-w-md leading-relaxed"
            >
              Explore our exclusive collection of SKMEI watches. From sporty
              digital to elegant analog, find the watch that matches your style
              at unbeatable prices.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.65, ease }}
            >
              <Link
                href="/store/products"
                className="group relative inline-flex items-center justify-center gap-2 overflow-hidden bg-brand-red text-white px-8 py-4 rounded-lg font-bold hover:bg-brand-red-dark transition-colors active:scale-95 shadow-lg shadow-brand-red/40"
              >
                <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none" />
                Shop Collection
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </motion.div>

            {/* Stats cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.75, ease }}
              className="mt-10 grid grid-cols-3 gap-3 sm:gap-6 max-w-md"
            >
              {[
                { target: 500, suffix: "+", label: "Happy\nCustomers" },
                { target: 100, suffix: "%", label: "Authentic\nProducts" },
                { target: 400, suffix: "+", label: "Orders\nDelivered" },
              ].map(({ target, suffix, label }) => (
                <div key={label} className="relative flex flex-col items-center justify-center text-center p-3 sm:p-4 rounded-xl border border-white/8 bg-white/3 hover:bg-white/6 transition-colors duration-300 overflow-hidden group">
                  {/* Top red accent */}
                  <div className="absolute top-0 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-brand-red to-transparent opacity-60 group-hover:opacity-100 transition-opacity duration-300" />
                  <p className="text-2xl sm:text-3xl font-semibold text-white mb-1">
                    <AnimatedCounter target={target} suffix={suffix} />
                  </p>
                  <p className="text-[10px] sm:text-xs text-brand-red/80 font-semibold tracking-[0.15em] uppercase leading-tight">
                    {label.split('\n').map((line, i) => (
                      <span key={i}>{line}{i === 0 && <br className="sm:hidden" />}{i === 0 && <span className="hidden sm:inline"> </span>}</span>
                    ))}
                  </p>
                </div>
              ))}
            </motion.div>
          </div>

          {/* ── Right: Live Analog Watch ── */}
          <motion.div
            initial={{ opacity: 0, x: 40, scale: 1.05 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease }}
            className="relative order-1 lg:order-2 flex items-center justify-center"
          >
            {/* Outer radial glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-4/5 h-4/5 rounded-full bg-brand-red/18 blur-3xl" />
            </div>
            {/* Secondary warm glow */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-3/5 h-3/5 rounded-full bg-brand-red/10 blur-2xl" />
            </div>

            <div className="relative w-full max-w-[320px] sm:max-w-sm lg:max-w-[440px] xl:max-w-[480px]">
              <LiveWatchFace className="w-full h-auto drop-shadow-2xl" />
            </div>
          </motion.div>

        </div>
      </div>

    </section>
  );
}
