'use client';

import { useEffect, useRef } from 'react';

export default function LiveWatchFace({ className = '' }: { className?: string }) {
  const hrRef  = useRef<SVGGElement>(null);
  const minRef = useRef<SVGGElement>(null);
  const secRef = useRef<SVGGElement>(null);

  useEffect(() => {
    let raf: number;
    const beirutFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Beirut',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });
    const tick = () => {
      const now = new Date();
      const parts = beirutFmt.formatToParts(now);
      const get = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0', 10);
      const h  = get('hour') % 12;
      const m  = get('minute');
      const s  = get('second');
      const ms = now.getMilliseconds();

      hrRef.current?.setAttribute ('transform', `rotate(${(h + m / 60) * 30},  200, 200)`);
      minRef.current?.setAttribute('transform', `rotate(${(m + s / 60) * 6},   200, 200)`);
      secRef.current?.setAttribute('transform', `rotate(${(s + ms / 1000) * 6}, 200, 200)`);

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const D2R = Math.PI / 180;
  const r = (n: number) => Math.round(n * 1000) / 1000;

  return (
    <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">

      {/* ── 12 HOUR MARKERS (bright red) ── */}
      {Array.from({ length: 12 }, (_, i) => {
        const rad  = (i * 30 - 90) * D2R;
        const isQ  = i % 3 === 0;
        const outerR = 188;
        const innerR = isQ ? 166 : 172;
        return (
          <line key={i}
            x1={r(200 + Math.cos(rad) * outerR)} y1={r(200 + Math.sin(rad) * outerR)}
            x2={r(200 + Math.cos(rad) * innerR)} y2={r(200 + Math.sin(rad) * innerR)}
            stroke="#DC2626"
            strokeWidth={isQ ? 4 : 2.5}
            strokeLinecap="round"
          />
        );
      })}

      {/* ── HOUR HAND ── */}
      <g ref={hrRef} transform="rotate(0, 200, 200)">
        <path d="M 196.5 200 L 195.5 130 L 200 94 L 204.5 130 L 203.5 200 Z" fill="white" />
        <line x1="200" y1="200" x2="200" y2="94" stroke="rgba(255,255,255,0.3)" strokeWidth="1" />
        <rect x="198.5" y="200" width="3" height="15" rx="1.5" fill="rgba(255,255,255,0.45)" />
      </g>

      {/* ── MINUTE HAND ── */}
      <g ref={minRef} transform="rotate(0, 200, 200)">
        <path d="M 197.5 200 L 196.5 112 L 200 56 L 203.5 112 L 202.5 200 Z" fill="rgba(255,255,255,0.88)" />
        <line x1="200" y1="200" x2="200" y2="56" stroke="rgba(255,255,255,0.25)" strokeWidth="1" />
        <rect x="199" y="200" width="2" height="18" rx="1" fill="rgba(255,255,255,0.38)" />
      </g>

      {/* ── SECOND HAND — luxury needle ── */}
      <g ref={secRef} transform="rotate(0, 200, 200)" style={{ filter: 'drop-shadow(0 0 5px #DC2626)' }}>
        {/* Ultra-thin shaft: tip → center */}
        <line x1="200" y1="50" x2="200" y2="200"
          stroke="#DC2626" strokeWidth="0.75" strokeLinecap="round" />
        {/* Lozenge accent — classic luxury pip at ~1/3 from tip */}
        <path d="M 200 96 L 202.8 112 L 200 128 L 197.2 112 Z" fill="#DC2626" />
        {/* Counterweight tail — slightly thicker */}
        <line x1="200" y1="200" x2="200" y2="238"
          stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
        {/* Tail pip */}
        <circle cx="200" cy="235" r="3" fill="#DC2626" />
      </g>

      {/* ── CENTER CAP ── */}
      <circle cx="200" cy="200" r="9"   fill="#DC2626" />
      <circle cx="200" cy="200" r="5.5" fill="#111" />
      <circle cx="200" cy="200" r="2.5" fill="#DC2626" />
    </svg>
  );
}
