'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { EyeOff, Pencil, Trash2, Watch } from 'lucide-react';
import { Badge } from '@/components/admin/ui/badge';
import { Button } from '@/components/admin/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/admin/ui/tooltip';
import { Spotlight } from '@/components/admin/fx/Spotlight';
import { cn, formatPrice } from '@/lib/utils';
import type { Product } from '@/types';
import { discountPercent, stockLevel } from './model';
import { SafeImg } from './SafeImg';

export function StockBadge({ product }: { product: Product }) {
  if (product.isVisible === false) {
    return (
      <Badge tone="neutral" className="h-[22px] bg-white/90 px-2 text-[11.5px] shadow-adm-sm backdrop-blur">
        <EyeOff className="size-3" />
        Hidden
      </Badge>
    );
  }
  const level = stockLevel(product.stock);
  const cfg = {
    'out-of-stock': { tone: 'red' as const, dot: '#EF4444', label: 'Out of stock' },
    'low-stock': { tone: 'amber' as const, dot: '#F59E0B', label: 'Low stock' },
    'in-stock': { tone: 'green' as const, dot: '#22C55E', label: 'In stock' },
  }[level];
  return (
    <Badge tone={cfg.tone} dot={cfg.dot} className="h-[22px] px-2 text-[11.5px] shadow-adm-sm">
      {cfg.label}
    </Badge>
  );
}

const LABELS = [
  { key: 'isNew', label: 'New', className: 'bg-adm-accent-soft text-adm-accent-hover' },
  { key: 'onSale', label: 'Sale', className: 'bg-[#FEF3E2] text-[#B45309]' },
  { key: 'isBestseller', label: 'Bestseller', className: 'bg-[#EAF1FF] text-[#1D4ED8]' },
  { key: 'isCouple', label: 'Couple Set', className: 'bg-[#FDECF5] text-[#BE185D]' },
] as const;

export function ProductCard({
  product,
  categoryName,
  index,
  onEdit,
  onDelete,
}: {
  product: Product;
  categoryName: string;
  index: number;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const reduce = useReducedMotion();
  const image = product.images?.[0];
  const off = discountPercent(product.price, product.originalPrice);
  const hidden = product.isVisible === false;
  const labels = LABELS.filter((l) => product[l.key]);
  const colors = product.colors ?? [];
  const fallbackIcon = (
    <Watch
      strokeWidth={1.4}
      className={cn('size-14 text-[#C9BDBA] transition-transform duration-500 ease-adm-spring group-hover:-rotate-6 group-hover:scale-110', hidden && 'opacity-50')}
    />
  );

  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index, 16) * 0.03, ease: [0.2, 0.8, 0.2, 1] }}
      className="min-w-0"
    >
      <Spotlight
        className={cn(
          'group flex h-full flex-col rounded-[18px] border border-adm-line bg-adm-surface shadow-adm-sm',
          'transition-[translate,box-shadow,border-color] duration-300 ease-adm-out hover:-translate-y-[3px] hover:border-adm-line-2 hover:shadow-adm-md',
          'has-[[data-card-open]:focus-visible]:ring-[3px] has-[[data-card-open]:focus-visible]:ring-adm-accent/25',
        )}
      >
        {/* The whole card opens the editor, like a row click in the old table. */}
        <button
          type="button"
          data-card-open
          onClick={onEdit}
          aria-label={`Edit ${product.name}`}
          className="absolute inset-0 z-[1] cursor-pointer rounded-[18px] outline-none"
        />

        <div
          className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-t-[18px] border-b border-adm-line"
          style={{ background: 'radial-gradient(circle at 50% 42%, #FFFFFF 0%, #F1ECEA 74%)' }}
        >
          {image ? (
            <SafeImg
              src={image}
              loading="lazy"
              decoding="async"
              fallback={fallbackIcon}
              className={cn(
                'absolute inset-0 size-full object-contain p-2 mix-blend-multiply transition-transform duration-500 ease-adm-spring group-hover:scale-[1.05]',
                hidden && 'opacity-45 grayscale-[.7]',
              )}
            />
          ) : (
            fallbackIcon
          )}
          {off > 0 && (
            <span className="absolute left-3 top-3 inline-flex h-[22px] items-center rounded-[6px] bg-adm-accent px-2 text-[11.5px] font-bold tabular-nums text-white shadow-[0_2px_6px_-1px_rgba(220,38,38,.45)]">
              −{off}%
            </span>
          )}
          <span className="absolute right-3 top-3">
            <StockBadge product={product} />
          </span>
        </div>

        <div className="flex flex-1 flex-col px-4 pb-1 pt-3.5">
          <div className="truncate text-xs text-adm-muted">
            {product.brand || 'No brand'} · {categoryName}
          </div>
          <h3 className="mt-0.5 line-clamp-2 font-adm-display text-[16px] font-bold leading-snug tracking-[-0.01em] text-adm-ink">{product.name}</h3>
          {product.sku && <div className="mt-0.5 truncate font-adm-mono text-[11px] text-adm-faint">{product.sku}</div>}
          <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="flex items-baseline gap-2 tabular-nums">
              <b className={cn('font-adm-display text-[19px] font-extrabold tracking-[-0.01em]', off > 0 ? 'text-adm-accent' : 'text-adm-ink')}>
                {formatPrice(product.price)}
              </b>
              {off > 0 && <s className="text-[13px] text-adm-muted">{formatPrice(product.originalPrice!)}</s>}
            </span>
            {colors.length > 0 && (
              <span role="img" className="ml-auto flex items-center gap-1" aria-label={`Colors: ${colors.map((c) => c.name).join(', ')}`}>
                {colors.slice(0, 6).map((c, i) => (
                  <span
                    key={`${c.name}-${i}`}
                    className="size-3 rounded-full shadow-[0_0_0_1.5px_rgba(0,0,0,.12),0_1px_2px_rgba(0,0,0,.12)]"
                    style={{ background: c.hex }}
                  />
                ))}
                {colors.length > 6 && <span className="text-[10.5px] font-semibold text-adm-muted">+{colors.length - 6}</span>}
              </span>
            )}
          </div>
          {labels.length > 0 && (
            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {labels.map((l) => (
                <span key={l.key} className={cn('inline-flex h-5 items-center rounded-full px-2 text-[11px] font-semibold', l.className)}>
                  {l.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pb-2.5 pl-4 pr-2.5 pt-1.5 text-[12.5px] text-adm-muted">
          <span className={cn('tabular-nums', product.stock === 0 && 'font-semibold text-adm-accent-hover')}>
            {product.stock > 0 ? `${product.stock} in stock` : 'None left'}
          </span>
          <span className="relative z-[2] flex gap-0.5">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" onClick={onEdit} aria-label={`Edit ${product.name}`} className="text-adm-muted hover:text-adm-ink">
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
                  aria-label={`Delete ${product.name}`}
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

export function ProductCardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[18px] border border-adm-line bg-adm-surface shadow-adm-sm">
      <div className="aspect-[4/3] animate-pulse bg-adm-canvas-2" />
      <div className="space-y-2.5 px-4 py-4">
        <div className="h-3 w-24 animate-pulse rounded-full bg-adm-canvas-2" />
        <div className="h-4 w-3/4 animate-pulse rounded-full bg-adm-canvas-2" />
        <div className="h-5 w-16 animate-pulse rounded-full bg-adm-canvas-2" />
        <div className="flex items-center justify-between pt-2">
          <div className="h-3 w-16 animate-pulse rounded-full bg-adm-canvas-2" />
          <div className="h-8 w-16 animate-pulse rounded-[8px] bg-adm-canvas-2" />
        </div>
      </div>
    </div>
  );
}
