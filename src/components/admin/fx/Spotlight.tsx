'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

/** Card wrapper with a soft glow that follows the cursor (React Bits "SpotlightCard" effect). */
export function Spotlight({
  className,
  color = 'rgba(220,38,38,.07)',
  children,
  style,
  ...props
}: React.ComponentProps<'div'> & { color?: string }) {
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty('--mx', `${e.clientX - r.left}px`);
    e.currentTarget.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  return (
    <div onPointerMove={onPointerMove} className={cn('group/spot relative isolate overflow-hidden', className)} style={style} {...props}>
      <span
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-[1] opacity-0 transition-opacity duration-300 group-hover/spot:opacity-100"
        style={{ background: `radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), ${color}, transparent 65%)` }}
      />
      {children}
    </div>
  );
}
