'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { ImageIcon, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/admin/ui/tooltip';
import { Spotlight } from '@/components/admin/fx/Spotlight';
import { cn } from '@/lib/utils';
import { CategoryIcon } from './CategoryIcon';
import { type Category, iconFor } from './model';
import { SafeImg } from './SafeImg';

export function CategoryCard({
  category,
  index,
  position,
  productCount,
  onEdit,
  onDelete,
}: {
  category: Category;
  /** Index in the visible grid (drives the stagger). */
  index: number;
  /** 1-based position in the store order. */
  position: number;
  productCount?: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const reduce = useReducedMotion();
  const hasIcon = !!iconFor(category.icon);
  const bigIcon = 'size-12 transition-transform duration-500 ease-adm-spring group-hover:-rotate-6 group-hover:scale-110';
  const placeholder = (
    <span className="flex flex-col items-center gap-2 text-[#C9BDBA]">
      <CategoryIcon icon={category.icon} strokeWidth={1.4} className={bigIcon} fallback={<ImageIcon strokeWidth={1.4} className={bigIcon} />} />
      <span className="text-[11.5px] font-semibold text-adm-faint">{category.image ? 'Image unavailable' : 'No image'}</span>
    </span>
  );

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: Math.min(index, 16) * 0.04, ease: [0.2, 0.8, 0.2, 1] }}
      className="min-w-0"
    >
      <Spotlight
        className={cn(
          'group flex h-full flex-col rounded-[18px] border border-adm-line bg-adm-surface shadow-adm-sm',
          'transition-[translate,box-shadow,border-color] duration-300 ease-adm-out hover:-translate-y-[3px] hover:border-adm-line-2 hover:shadow-adm-md',
          'has-[[data-card-open]:focus-visible]:ring-[3px] has-[[data-card-open]:focus-visible]:ring-adm-accent/25',
        )}
      >
        {/* The whole card opens the editor. */}
        <button
          type="button"
          data-card-open
          onClick={onEdit}
          aria-label={`Edit ${category.name}`}
          className="absolute inset-0 z-[1] cursor-pointer rounded-[18px] outline-none"
        />

        <div
          className="relative grid aspect-[3/4] place-items-center overflow-hidden rounded-t-[18px] border-b border-adm-line"
          style={{ background: 'radial-gradient(circle at 50% 40%, #FFFFFF 0%, #F1ECEA 78%)' }}
        >
          {category.image ? (
            <SafeImg
              src={category.image}
              loading="lazy"
              decoding="async"
              fallback={placeholder}
              className="absolute inset-0 size-full object-cover transition-transform duration-500 ease-adm-spring group-hover:scale-[1.04]"
            />
          ) : (
            placeholder
          )}
          <span className="absolute left-2.5 top-2.5 inline-flex h-[22px] items-center rounded-[7px] bg-white/90 px-2 font-adm-mono text-[11px] font-bold tabular-nums text-adm-ink-2 shadow-adm-sm backdrop-blur">
            #{position}
          </span>
          {hasIcon && (
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="absolute right-2.5 top-2.5 z-[2] grid size-8 place-items-center rounded-full bg-white/90 text-adm-accent shadow-adm-sm backdrop-blur">
                  <CategoryIcon icon={category.icon} className="size-4" />
                </span>
              </TooltipTrigger>
              <TooltipContent>Nav icon · {category.icon}</TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="flex flex-1 flex-col px-3.5 pb-1 pt-3 sm:px-4">
          <h3 className="line-clamp-2 font-adm-display text-[15.5px] font-bold leading-snug tracking-[-0.01em] text-adm-ink sm:text-[16px]">{category.name}</h3>
          <div className="mt-0.5 truncate font-adm-mono text-[11px] text-adm-faint">{category.slug}</div>
          <p className={cn('mt-1.5 line-clamp-2 text-[12.5px] leading-snug', category.description ? 'text-adm-muted' : 'italic text-adm-faint')}>
            {category.description || 'No description'}
          </p>
        </div>

        <div className="flex items-center justify-between gap-1 pb-2 pl-3.5 pr-1.5 pt-1 text-[12px] text-adm-muted sm:pl-4 sm:pr-2.5">
          <span className="truncate tabular-nums">
            {productCount === undefined ? '' : productCount === 1 ? '1 product' : `${productCount} products`}
          </span>
          <span className="relative z-[2] flex shrink-0 gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${category.name}`} className="text-adm-muted hover:text-adm-ink">
                  <Pencil />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Edit</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onDelete}
                  aria-label={`Delete ${category.name}`}
                  className="text-adm-muted hover:bg-adm-accent-soft hover:text-adm-accent-hover"
                >
                  <Trash2 />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Delete</TooltipContent>
            </Tooltip>
          </span>
        </div>
      </Spotlight>
    </motion.div>
  );
}

export function CategoryCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-adm-line bg-adm-surface shadow-adm-sm">
      <div className="aspect-[3/4] animate-pulse bg-adm-canvas-2" />
      <div className="space-y-2.5 px-4 py-4">
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-adm-canvas-2" />
        <div className="h-3 w-20 animate-pulse rounded-full bg-adm-canvas-2" />
        <div className="h-3 w-full animate-pulse rounded-full bg-adm-canvas-2" />
        <div className="flex items-center justify-between pt-1">
          <div className="h-3 w-16 animate-pulse rounded-full bg-adm-canvas-2" />
          <div className="h-8 w-16 animate-pulse rounded-[8px] bg-adm-canvas-2" />
        </div>
      </div>
    </div>
  );
}
