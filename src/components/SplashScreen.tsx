'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Cinematic 3-act splash screen.
 * Act 1 (0–400ms)  : Pure black silence.
 * Act 2 (400–900ms): Logo fades in.
 * Act 3 (900–1400ms): Brand name sweeps in with clipPath + red underline draws.
 * Exit: scale(1.02) + fade out — curtain rising into content.
 */

// Particles scattered at fixed positions — constellation feel
const PARTICLES = [
  { top: "12%", left: "8%",  delay: 0.3 },
  { top: "22%", left: "88%", delay: 0.7 },
  { top: "68%", left: "5%",  delay: 0.5 },
  { top: "78%", left: "92%", delay: 0.9 },
  { top: "35%", left: "15%", delay: 0.4 },
  { top: "55%", left: "82%", delay: 0.6 },
  { top: "15%", left: "60%", delay: 1.0 },
  { top: "88%", left: "45%", delay: 0.8 },
  { top: "42%", left: "72%", delay: 1.1 },
  { top: "65%", left: "30%", delay: 0.2 },
];

const ease = [0.22, 1, 0.36, 1] as const;

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);
  const [act, setAct] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (sessionStorage.getItem('splash_done')) {
      setVisible(false);
      return;
    }

    const MIN_MS = 1400;
    const startTime = Date.now();

    // Progress through acts
    const t1 = setTimeout(() => setAct(2), 400);
    const t2 = setTimeout(() => setAct(3), 900);

    const hide = () => {
      const elapsed = Date.now() - startTime;
      const wait = Math.max(0, MIN_MS - elapsed);
      setTimeout(() => {
        setFading(true);
        setTimeout(() => {
          setVisible(false);
          sessionStorage.setItem('splash_done', '1');
        }, 500);
      }, wait);
    };

    if (document.readyState === 'complete') {
      hide();
    } else {
      window.addEventListener('load', hide, { once: true });
      const fallback = setTimeout(hide, 3000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
        window.removeEventListener('load', hide);
        clearTimeout(fallback);
      };
    }

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (!visible) return null;

  return (
    <AnimatePresence>
      {!fading ? (
        <motion.div
          key="splash"
          exit={{ opacity: 0, scale: 1.03 }}
          transition={{ duration: 0.5, ease }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-black overflow-hidden pointer-events-none"
        >
          {/* Progress bar — glowing red line at top */}
          <div className="absolute top-0 left-0 right-0 h-[2px] overflow-hidden">
            <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-brand-red to-transparent animate-loader-bar loader-bar-glow" />
          </div>

          {/* Subtle diagonal stripe texture */}
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage:
                'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
              backgroundSize: '18px 18px',
            }}
          />

          {/* Deep red glow orbs */}
          <div className="absolute top-1/3 -left-40 w-[500px] h-[500px] bg-brand-red/8 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-1/3 -right-40 w-[500px] h-[500px] bg-brand-red/6 rounded-full blur-3xl pointer-events-none" />

          {/* Constellation particles */}
          {PARTICLES.map((p, i) => (
            <motion.span
              key={i}
              initial={{ opacity: 0 }}
              animate={act >= 2 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ delay: p.delay, duration: 0.8 }}
              className="absolute w-0.5 h-0.5 rounded-full bg-brand-red/50 pointer-events-none"
              style={{ top: p.top, left: p.left }}
            />
          ))}

          {/* Main content */}
          <div className="relative flex flex-col items-center">

            {/* Gossamer spatial circle — non-spinning */}
            <div className="absolute w-52 h-52 rounded-full border border-white/5 pointer-events-none" />

            {/* Subtle red radial glow behind logo */}
            <div
              className="absolute w-40 h-40 rounded-full pointer-events-none"
              style={{
                background: 'radial-gradient(circle, rgba(220,38,38,0.14) 0%, transparent 70%)',
              }}
            />

            {/* Act 2: Logo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={act >= 2 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, ease }}
              className="relative w-20 h-20 flex items-center justify-center"
            >
              <Image
                src="/images/logo/white.png"
                alt="SKMEI"
                width={64}
                height={64}
                className="object-contain"
                priority
              />
            </motion.div>

            {/* Act 3: Brand name + red underline */}
            <div className="mt-6 flex flex-col items-center gap-2 overflow-hidden">
              <motion.span
                initial={{ clipPath: 'inset(0 100% 0 0)', opacity: 1 }}
                animate={act >= 3
                  ? { clipPath: 'inset(0 0% 0 0)', opacity: 1 }
                  : { clipPath: 'inset(0 100% 0 0)', opacity: 1 }
                }
                transition={{ duration: 0.6, ease }}
                className="text-[11px] font-black tracking-[0.45em] text-white uppercase whitespace-nowrap"
              >
                SKMEI.LB
              </motion.span>

              {/* Drawing red underline */}
              <motion.span
                initial={{ scaleX: 0 }}
                animate={act >= 3 ? { scaleX: 1 } : { scaleX: 0 }}
                transition={{ duration: 0.5, delay: 0.25, ease }}
                className="block h-px w-16 bg-brand-red origin-left"
              />
            </div>

            {/* Brand tagline — fades in at the very end */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={act >= 3 ? { opacity: 1 } : { opacity: 0 }}
              transition={{ duration: 0.5, delay: 0.55 }}
              className="mt-4 text-[9px] tracking-[0.4em] text-white/25 uppercase"
            >
              Lebanon&apos;s Official SKMEI Dealer
            </motion.p>
          </div>

          {/* Bottom gradient bar */}
          <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-red/35 to-transparent" />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
