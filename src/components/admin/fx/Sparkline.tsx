'use client';

import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/** Monotone cubic path through the points, so curves never overshoot the data. */
export function monotonePath(pts: [number, number][]): string {
  const n = pts.length;
  if (n === 0) return '';
  if (n === 1) return `M${pts[0][0]},${pts[0][1]}`;
  const dx: number[] = [];
  const m: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    dx[i] = pts[i + 1][0] - pts[i][0];
    m[i] = (pts[i + 1][1] - pts[i][1]) / dx[i];
  }
  const t: number[] = new Array(n);
  t[0] = m[0];
  t[n - 1] = m[n - 2];
  for (let i = 1; i < n - 1; i++) t[i] = m[i - 1] * m[i] <= 0 ? 0 : (m[i - 1] + m[i]) / 2;
  for (let i = 0; i < n - 1; i++) {
    if (m[i] === 0) {
      t[i] = 0;
      t[i + 1] = 0;
      continue;
    }
    const a = t[i] / m[i];
    const b = t[i + 1] / m[i];
    const s = a * a + b * b;
    if (s > 9) {
      const k = 3 / Math.sqrt(s);
      t[i] = k * a * m[i];
      t[i + 1] = k * b * m[i];
    }
  }
  const f = (v: number) => Math.round(v * 100) / 100;
  let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
  for (let i = 0; i < n - 1; i++) {
    const h = dx[i] / 3;
    d += ` C${f(pts[i][0] + h)},${f(pts[i][1] + t[i] * h)} ${f(pts[i + 1][0] - h)},${f(pts[i + 1][1] - t[i + 1] * h)} ${f(pts[i + 1][0])},${f(pts[i + 1][1])}`;
  }
  return d;
}

export function Sparkline({ data, color, height = 34 }: { data: number[]; color: string; height?: number }) {
  const gid = useId();
  const reduce = useReducedMotion();
  const w = 120;
  const pad = 3;
  const values = data.length > 1 ? data : [0, ...(data.length ? data : [0])];
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;
  const pts = values.map((v, i): [number, number] => [(i * w) / (values.length - 1), pad + (height - 2 * pad) * (1 - (v - min) / span)]);
  const line = monotonePath(pts);
  const area = `${line} L${w},${height} L0,${height} Z`;
  const lastY = (pts[pts.length - 1][1] / height) * 100;

  return (
    <div className="relative mt-2.5" style={{ height }}>
      <motion.div
        className="h-full w-full"
        initial={reduce ? false : { clipPath: 'inset(0 100% 0 0)' }}
        animate={{ clipPath: 'inset(0 0% 0 0)' }}
        transition={{ duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
      >
        <svg viewBox={`0 0 ${w} ${height}`} preserveAspectRatio="none" className="block h-full w-full overflow-visible" aria-hidden>
          <defs>
            <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor={color} stopOpacity={0.22} />
              <stop offset="1" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gid})`} />
          <path d={line} fill="none" stroke={color} strokeWidth={2} vectorEffect="non-scaling-stroke" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </motion.div>
      <motion.span
        aria-hidden
        className="absolute -right-[3px] -mt-[3.5px] size-[7px] rounded-full shadow-[0_0_0_2px_rgba(255,255,255,.95)]"
        style={{ top: `${lastY}%`, background: color }}
        initial={reduce ? false : { scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1, type: 'spring', stiffness: 500, damping: 18 }}
      />
    </div>
  );
}
