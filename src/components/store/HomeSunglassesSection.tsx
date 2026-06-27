'use client';

import { useRef, useState, useEffect } from 'react';
import { motion, useInView, useScroll, useTransform } from 'framer-motion';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import SunglassesCard from './SunglassesCard';
import type { Sunglasses } from '@/types';

const TITLE = 'Sunglasses'.split('');

const TICKER_ITEMS = [
  { type: 'main', text: 'Summer Mood' },
  { type: 'sub',  text: 'UV400 Protection' },
  { type: 'main', text: 'Summer Mood' },
  { type: 'sub',  text: 'Premium Eyewear' },
  { type: 'main', text: 'Summer Mood' },
  { type: 'sub',  text: 'SKMEI Collection' },
  { type: 'main', text: 'Summer Mood' },
  { type: 'sub',  text: 'Style Meets Function' },
] as const;

const TRACK = [...TICKER_ITEMS, ...TICKER_ITEMS]; // doubled for seamless loop

export default function HomeSunglassesSection({ sunglasses }: { sunglasses: Sunglasses[] }) {
  const sectionRef  = useRef<HTMLElement>(null);
  const isInView    = useInView(sectionRef, { once: true, amount: 0.1 });
  const [mouse, setMouse]           = useState({ x: 0.5, y: 0.5 });
  const [tickerPaused, setPaused]   = useState(false);
  const [tickerDuration, setTickerDuration] = useState(36);

  useEffect(() => {
    const update = () => setTickerDuration(window.innerWidth < 640 ? 10 : 36);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start end', 'end start'] });
  const watermarkX       = useTransform(scrollYProgress, [0, 1], ['8%', '-18%']);
  const watermarkOpacity = useTransform(scrollYProgress, [0, 0.15, 0.85, 1], [0, 0.045, 0.045, 0]);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    setMouse({ x: (e.clientX - r.left) / r.width, y: (e.clientY - r.top) / r.height });
  };

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="bg-[#080808] overflow-hidden relative"
    >

      {/* ── Ticker strip ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={isInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-30 w-full overflow-hidden bg-[#0d0d0d] border-y border-brand-red/25"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {/* Left/right fade vignette */}
        <div className="absolute inset-y-0 left-0 w-16 bg-linear-to-r from-[#0d0d0d] to-transparent z-10 pointer-events-none" />
        <div className="absolute inset-y-0 right-0 w-16 bg-linear-to-l from-[#0d0d0d] to-transparent z-10 pointer-events-none" />

        <motion.div
          key={tickerDuration}
          animate={{ x: tickerPaused ? undefined : ['0%', '-50%'] }}
          transition={{ duration: tickerDuration, ease: 'linear', repeat: Infinity, repeatType: 'loop' }}
          className="flex items-center whitespace-nowrap py-4"
        >
          {TRACK.map((item, i) => (
            <span key={i} className="inline-flex items-center">
              {item.type === 'main' ? (
                <span
                  className="text-xl sm:text-2xl text-white px-8"
                  style={{ fontFamily: 'var(--font-pacifico)' }}
                >
                  {item.text}
                </span>
              ) : (
                <span className="text-[9px] sm:text-[10px] font-medium text-white/35 uppercase tracking-[0.5em] px-6">
                  {item.text}
                </span>
              )}
              {/* Thin vertical red divider */}
              <span className="w-px h-5 bg-brand-red/45 shrink-0" />
            </span>
          ))}
        </motion.div>
      </motion.div>

      {/* ── Decorative layer ── */}

      {/* Mouse spotlight */}
      <div
        className="absolute inset-0 pointer-events-none hidden sm:block"
        style={{ background: `radial-gradient(650px circle at ${mouse.x * 100}% ${mouse.y * 100}%, rgba(230,57,70,0.08), transparent 60%)` }}
      />

      {/* Pulsing orbs */}
      <motion.div
        className="absolute -top-40 left-1/4 w-[550px] h-[550px] bg-brand-red/7 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1, 1.18, 1], opacity: [0.35, 0.65, 0.35] }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-40 right-1/3 w-[420px] h-[420px] bg-brand-red/5 rounded-full blur-3xl pointer-events-none"
        animate={{ scale: [1.15, 1, 1.15], opacity: [0.25, 0.55, 0.25] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 2.5 }}
      />

      {/* Grid texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.018]"
        style={{ backgroundImage: 'linear-gradient(rgba(230,57,70,1) 1px,transparent 1px),linear-gradient(90deg,rgba(230,57,70,1) 1px,transparent 1px)', backgroundSize: '72px 72px' }}
      />

      {/* Scan line sweep */}
      {isInView && (
        <motion.div
          initial={{ top: '0%' }}
          animate={{ top: '100%' }}
          transition={{ duration: 2.2, delay: 0.5, ease: [0.4, 0, 0.6, 1] }}
          className="absolute left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-brand-red/50 to-transparent pointer-events-none z-20"
        />
      )}

      {/* Parallax watermark */}
      <motion.div
        style={{ x: watermarkX, opacity: watermarkOpacity }}
        className="absolute inset-0 flex items-center justify-end overflow-hidden pointer-events-none select-none"
        aria-hidden
      >
        <span className="text-[clamp(70px,15vw,140px)] font-black leading-none tracking-tighter whitespace-nowrap pr-4 text-white">
          SUNGLASSES
        </span>
      </motion.div>

      {/* ── Main content ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-14 sm:pt-20 pb-16 sm:pb-24">

        {/* Header */}
        <div className="mb-10 sm:mb-14 text-center">

          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.85 }}
            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
            transition={{ duration: 0.55, ease: [0.34, 1.56, 0.64, 1], delay: 0.15 }}
            className="inline-flex items-center gap-2 bg-brand-red/12 border border-brand-red/35 text-brand-red px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.35em] mb-5"
          >
            <span className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
            Eyewear
          </motion.div>

          {/* Title — letter-by-letter reveal */}
          <div className="overflow-hidden mb-5">
            <h2 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-tight">
              {TITLE.map((char, i) => (
                <motion.span
                  key={i}
                  initial={{ y: '115%', opacity: 0 }}
                  animate={isInView ? { y: 0, opacity: 1 } : {}}
                  transition={{ duration: 0.6, delay: 0.25 + i * 0.05, ease: [0.22, 1, 0.36, 1] }}
                  className={`inline-block ${i < 3 ? 'text-white' : 'text-brand-red'}`}
                >
                  {char}
                </motion.span>
              ))}
            </h2>
          </div>

          {/* Red underline — center draw */}
          <div className="flex justify-center">
            <motion.div
              initial={{ scaleX: 0, opacity: 0 }}
              animate={isInView ? { scaleX: 1, opacity: 1 } : {}}
              transition={{ duration: 0.9, delay: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ transformOrigin: 'center' }}
              className="h-px w-28 bg-linear-to-r from-transparent via-brand-red to-transparent"
            />
          </div>
        </div>

        {/* Cards */}
        <div className="flex gap-3 sm:gap-5 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 lg:grid-cols-4 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
          {sunglasses.map((sg, i) => (
            <motion.div
              key={sg.id}
              initial={{ opacity: 0, y: 48, scale: 0.92 }}
              animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
              transition={{ duration: 0.72, delay: 0.42 + i * 0.14, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -6, boxShadow: '0 24px 48px -8px rgba(230,57,70,0.28)', transition: { duration: 0.22 } }}
              className="shrink-0 w-[72vw] sm:w-auto"
            >
              <SunglassesCard sunglasses={sg} />
            </motion.div>
          ))}
        </div>

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 22 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.65, delay: 1.0 }}
          className="mt-10 flex justify-center"
        >
          <Link
            href="/store/sunglasses"
            className="group relative inline-flex items-center gap-3 overflow-hidden bg-brand-red text-white px-8 py-4 rounded-full font-bold text-sm sm:text-base hover:bg-brand-red-dark transition-colors duration-300 shadow-lg shadow-brand-red/30"
          >
            <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none" />
            View All Sunglasses
            <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center group-hover:translate-x-0.5 transition-transform duration-300">
              <ChevronRight className="w-4 h-4" />
            </span>
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
