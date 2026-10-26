'use client';

import * as React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: React.ReactNode;
  count?: number;
  icon?: React.ReactNode;
  /** Optional colors for the active count pill, e.g. per order status. */
  countClassName?: string;
}

/** Pill-style filter with a sliding white indicator (Framer Motion layout animation). */
function Segmented<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  const id = React.useId();
  return (
    <div className={cn('-m-0.5 max-w-[calc(100%+4px)] overflow-x-auto p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
      <div role="tablist" aria-label={ariaLabel} className="relative inline-flex gap-0.5 rounded-[12px] bg-adm-canvas-2 p-1">
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => onChange(opt.value)}
              className={cn(
                'relative inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-[9px] px-3 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-adm-accent/40 [&_svg]:size-3.5',
                active ? 'text-adm-ink' : 'text-adm-muted hover:text-adm-ink',
              )}
            >
              {active && (
                <motion.span
                  layoutId={`${id}-seg`}
                  className="absolute inset-0 rounded-[9px] bg-adm-surface shadow-[0_1px_2px_rgba(60,24,26,.08),0_0_0_1px_rgba(70,30,32,.05)]"
                  transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                />
              )}
              <span className="relative z-[1] inline-flex items-center gap-1.5">
                {opt.icon}
                {opt.label}
                {opt.count !== undefined && (
                  <span
                    className={cn(
                      'inline-grid h-[18px] min-w-5 place-items-center rounded-full px-1.5 font-adm-mono text-[11px] font-semibold tabular-nums transition-colors',
                      active ? opt.countClassName ?? 'bg-adm-accent-soft text-adm-accent-hover' : 'bg-[rgba(70,30,32,.07)] text-adm-muted',
                    )}
                  >
                    {opt.count}
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Category chips (dark when selected), used on catalog pages. */
function Chips<T extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: {
  options: SegmentedOption<T>[];
  value: T;
  onChange: (value: T) => void;
  ariaLabel: string;
  className?: string;
}) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn('-m-0.5 flex max-w-full gap-1.5 overflow-x-auto p-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden', className)}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              'inline-flex h-[34px] shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-adm-accent/40',
              active ? 'border-adm-side bg-adm-side text-white' : 'border-adm-line-2 bg-adm-surface text-adm-ink-2 hover:border-[#D5CAC7]',
            )}
          >
            {opt.icon}
            {opt.label}
            {opt.count !== undefined && (
              <em className={cn('font-adm-mono text-[11px] font-semibold not-italic', active ? 'text-[#F87171]' : 'text-adm-muted')}>{opt.count}</em>
            )}
          </button>
        );
      })}
    </div>
  );
}

export { Segmented, Chips };
