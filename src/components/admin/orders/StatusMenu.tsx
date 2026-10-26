'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ChevronDown, Loader2 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/admin/ui/dropdown-menu';
import { ORDER_STATUS, ORDER_STATUSES, isOrderStatus, type OrderStatus } from '@/components/admin/status';
import { cn } from '@/lib/utils';

/** Badge-tinted classes per status, matching the kit's Badge tones. */
export const STATUS_TINT: Record<OrderStatus, string> = {
  pending: 'bg-[#FEF3E2] text-[#B45309]',
  confirmed: 'bg-[#EAF1FF] text-[#1D4ED8]',
  processing: 'bg-[#F3EDFF] text-[#6D28D9]',
  shipped: 'bg-[#ECEEFF] text-[#4338CA]',
  delivered: 'bg-[#E6F6EC] text-[#15803D]',
  cancelled: 'bg-[#F1EEED] text-[#57534E]',
};

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

/**
 * Inline status picker shown in the orders table. The trigger looks like the status badge.
 * Events are stopped so choosing a status never opens the row's detail sheet
 * (React events bubble through the menu's portal to the row).
 */
export function StatusMenu({
  status,
  orderNumber,
  disabled,
  onChange,
  className,
}: {
  status: string;
  orderNumber: string;
  disabled?: boolean;
  onChange: (status: OrderStatus) => void;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const cfg = isOrderStatus(status) ? ORDER_STATUS[status] : null;
  const tint = isOrderStatus(status) ? STATUS_TINT[status] : STATUS_TINT.cancelled;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={disabled}
        onClick={stop}
        onKeyDown={stop}
        aria-label={`Status for ${orderNumber}: ${cfg?.label ?? status}. Change status`}
        className={cn(
          // after: pseudo-element widens the touch target to 40px without changing the look
          'relative inline-flex h-7 items-center gap-[7px] whitespace-nowrap rounded-full pl-2.5 pr-2 text-xs font-semibold outline-none transition-[box-shadow,background-color,color] duration-300 after:absolute after:-inset-y-1.5 after:inset-x-0 hover:shadow-[inset_0_0_0_1px_currentColor] focus-visible:ring-2 focus-visible:ring-adm-accent/40 disabled:cursor-progress data-[state=open]:shadow-[inset_0_0_0_1px_currentColor]',
          tint,
          className,
        )}
      >
        <motion.span
          key={status}
          className="inline-flex items-center gap-[7px]"
          initial={reduce ? false : { scale: 0.82 }}
          animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 520, damping: 18 }}
        >
          <span aria-hidden className="size-1.5 shrink-0 rounded-full" style={{ background: cfg?.dot ?? '#BDB3B1' }} />
          {cfg?.label ?? status}
        </motion.span>
        {disabled ? <Loader2 className="size-3.5 animate-spin opacity-70" /> : <ChevronDown className="size-3.5 opacity-70" />}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="min-w-[190px]" onClick={stop} onKeyDown={stop}>
        <DropdownMenuLabel>Change status</DropdownMenuLabel>
        <DropdownMenuRadioGroup
          value={status}
          onValueChange={(v) => {
            if (v !== status && isOrderStatus(v)) onChange(v);
          }}
        >
          {ORDER_STATUSES.map((s) => (
            <DropdownMenuRadioItem key={s} value={s}>
              <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: ORDER_STATUS[s].dot }} />
              {ORDER_STATUS[s].label}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
