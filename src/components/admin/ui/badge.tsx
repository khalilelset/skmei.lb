import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  "inline-flex h-6 items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-3.5",
  {
    variants: {
      tone: {
        neutral: 'bg-[#F1EEED] text-[#57534E]',
        red: 'bg-adm-accent-soft text-adm-accent-hover',
        green: 'bg-[#E6F6EC] text-[#15803D]',
        amber: 'bg-[#FEF3E2] text-[#B45309]',
        blue: 'bg-[#EAF1FF] text-[#1D4ED8]',
        violet: 'bg-[#F3EDFF] text-[#6D28D9]',
        indigo: 'bg-[#ECEEFF] text-[#4338CA]',
        outline: 'bg-adm-surface text-adm-ink-2 ring-1 ring-inset ring-adm-line-2',
        whatsapp: 'bg-[#F5FCF7] text-[#15803D] ring-1 ring-inset ring-[#BFE6CC]',
        solid: 'bg-adm-accent text-white',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
);

function Badge({
  className,
  tone,
  dot,
  children,
  ...props
}: React.ComponentProps<'span'> & VariantProps<typeof badgeVariants> & { dot?: string }) {
  return (
    <span data-slot="badge" className={cn(badgeVariants({ tone }), className)} {...props}>
      {dot && <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: dot }} />}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
