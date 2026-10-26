import * as React from 'react';
import { Slot } from 'radix-ui';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-[10px] text-[13.5px] font-semibold outline-none transition-[background-color,border-color,color,box-shadow,transform] duration-150 active:translate-y-px focus-visible:ring-[3px] focus-visible:ring-adm-accent/25 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          'bg-adm-accent text-white shadow-[0_1px_2px_rgba(185,28,28,.35),0_4px_12px_-4px_rgba(220,38,38,.45),inset_0_1px_0_rgba(255,255,255,.16)] hover:bg-adm-accent-hover',
        outline:
          'border border-adm-line-2 bg-adm-surface text-adm-ink shadow-adm-sm hover:border-[#D5CAC7] hover:bg-adm-surface-2',
        soft: 'bg-adm-accent-soft text-adm-accent-hover hover:bg-[#FCE2DF]',
        ghost: 'text-adm-ink-2 hover:bg-[rgba(70,30,32,.06)] hover:text-adm-ink',
        destructive: 'bg-adm-accent-hover text-white hover:bg-[#991B1B]',
        'ghost-destructive': 'text-adm-accent-hover hover:bg-adm-accent-soft',
        dark: 'bg-adm-side text-white hover:bg-[#232327]',
        whatsapp: 'border border-[#BFE6CC] bg-adm-surface text-[#15803D] shadow-adm-sm hover:border-[#9FD9B3] hover:bg-[#F0FAF3]',
        link: 'px-0 text-adm-accent-hover underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-[38px] px-4',
        sm: 'h-8 rounded-[9px] px-3 text-[12.5px]',
        lg: 'h-11 px-5 text-[14px]',
        icon: 'size-9',
        'icon-sm': 'size-8 rounded-[8px]',
      },
    },
    defaultVariants: { variant: 'default', size: 'default' },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : 'button';
  return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}

export { Button, buttonVariants };
