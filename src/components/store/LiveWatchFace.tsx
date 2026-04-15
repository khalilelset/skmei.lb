'use client';

import { useEffect, useRef } from 'react';

export default function LiveWatchFace({ className = '' }: { className?: string }) {
  const hrRef   = useRef<SVGGElement>(null);
  const minRef  = useRef<SVGGElement>(null);
  const secRef  = useRef<SVGGElement>(null);
  const dayRef  = useRef<SVGTextElement>(null);
  const dateRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    let raf: number;
    const beirutFmt = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Beirut',
      hour: 'numeric',
      minute: 'numeric',
      second: 'numeric',
      hour12: false,
    });

    let lastDate = '';

    const tick = () => {
      const now   = new Date();
      const parts = beirutFmt.formatToParts(now);
      const get   = (type: string) => parseInt(parts.find(p => p.type === type)?.value ?? '0', 10);
      const h  = get('hour') % 12;
      const m  = get('minute');
      const s  = get('second');
      const ms = now.getMilliseconds();

      hrRef.current?.setAttribute ('transform', `rotate(${(h + m / 60) * 30},  200, 200)`);
      minRef.current?.setAttribute('transform', `rotate(${(m + s / 60) * 6},   200, 200)`);
      secRef.current?.setAttribute('transform', `rotate(${(s + ms / 1000) * 6}, 200, 200)`);

      const beirut  = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Beirut' }));
      const newDate = String(beirut.getDate()).padStart(2, '0');
      if (newDate !== lastDate) {
        lastDate = newDate;
        const newDay = beirut.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        if (dayRef.current)  dayRef.current.textContent  = newDay;
        if (dateRef.current) dateRef.current.textContent = newDate;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const D2R = Math.PI / 180;
  const r   = (n: number) => Math.round(n * 1000) / 1000;

  const beirutNow = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Beirut' }));
  const initDay   = beirutNow.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
  const initDate  = String(beirutNow.getDate()).padStart(2, '0');

  return (
    <svg viewBox="0 0 400 400" className={className} xmlns="http://www.w3.org/2000/svg">

      {/* ── 12 HOUR MARKERS (bright red) ── */}
      {Array.from({ length: 12 }, (_, i) => {
        const rad    = (i * 30 - 90) * D2R;
        const isQ    = i % 3 === 0;
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

      {/* ══════════════════════════════════════════
          DAY · DATE WINDOW — SKMEI 9288 style
          Single white rectangle, 3 o'clock
          Left: DAY (WED)  |  Right: DATE (24)
          ══════════════════════════════════════════ */}

      {/* White window background */}
      <rect x="255" y="190" width="56" height="21" rx="2"
        fill="#f0ede8" opacity="0.7" />

      {/* Vertical divider between day and date */}
      <line x1="283" y1="192" x2="283" y2="209"
        stroke="rgba(0,0,0,0.15)" strokeWidth="0.6" />

      {/* Outer hairline border */}
      <rect x="255" y="190" width="56" height="21" rx="2"
        fill="none" stroke="rgba(0,0,0,0.20)" strokeWidth="0.5" />

      {/* DAY — left cell */}
      <text
        ref={dayRef}
        x="269" y="204.5"
        textAnchor="middle"
        fill="#1a1a1a"
        fontSize="9.5"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="500"
        letterSpacing="0.3"
      >{initDay}</text>

      {/* DATE — right cell */}
      <text
        ref={dateRef}
        x="297" y="204.5"
        textAnchor="middle"
        fill="#1a1a1a"
        fontSize="10.5"
        fontFamily="'Helvetica Neue', Helvetica, Arial, sans-serif"
        fontWeight="600"
        letterSpacing="0.5"
      >{initDate}</text>

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
        <line x1="200" y1="50" x2="200" y2="200"
          stroke="#DC2626" strokeWidth="0.75" strokeLinecap="round" />
        <path d="M 200 96 L 202.8 112 L 200 128 L 197.2 112 Z" fill="#DC2626" />
        <line x1="200" y1="200" x2="200" y2="238"
          stroke="#DC2626" strokeWidth="2" strokeLinecap="round" />
        <circle cx="200" cy="235" r="3" fill="#DC2626" />
      </g>

      {/* ── CENTER CAP ── */}
      <circle cx="200" cy="200" r="9"   fill="#DC2626" />
      <circle cx="200" cy="200" r="5.5" fill="#111" />
      <circle cx="200" cy="200" r="2.5" fill="#DC2626" />
    </svg>
  );
}
