import Image from 'next/image';

/**
 * Global Next.js loading UI — shown automatically between route navigations.
 * Branded with SKMEI logo, red spinning ring, and animated progress bar.
 */
export default function Loading() {
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-brand-black overflow-hidden">

      {/* ── Animated red progress bar at top ── */}
      <div className="absolute top-0 left-0 right-0 h-[3px] overflow-hidden">
        <div className="h-full w-1/2 bg-gradient-to-r from-transparent via-brand-red to-transparent animate-loader-bar" />
      </div>

      {/* ── Subtle diagonal stripe texture (brand style) ── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage:
            'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)',
          backgroundSize: '18px 18px',
        }}
      />

      {/* ── Glowing red orbs ── */}
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-brand-red/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-brand-red/8 rounded-full blur-3xl pointer-events-none" />

      {/* ── Main content ── */}
      <div className="relative flex flex-col items-center gap-10 animate-fade-in-up">

        {/* Spinning rings + logo */}
        <div className="relative flex items-center justify-center">
          {/* Outer slow ring */}
          <div className="absolute w-36 h-36 rounded-full border border-white/5" />
          <div className="absolute w-36 h-36 rounded-full border border-brand-red/20 border-t-brand-red animate-spin-slow" />

          {/* Inner faster ring */}
          <div
            className="absolute w-24 h-24 rounded-full border border-brand-red/30 border-b-brand-red"
            style={{ animation: 'spin-slow 1.2s linear infinite reverse' }}
          />

          {/* Logo bubble */}
          <div className="relative w-20 h-20 flex items-center justify-center rounded-full">
            <Image
              src="/images/logo/black.png"
              alt="SKMEI"
              width={64}
              height={64}
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* Animated dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="block w-1.5 h-1.5 rounded-full bg-brand-red"
              style={{ animation: `ping-custom 1.2s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
      </div>

      {/* ── Bottom bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-brand-red/40 to-transparent" />
    </div>
  );
}
