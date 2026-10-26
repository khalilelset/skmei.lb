'use client';

import { Reorder, useDragControls } from 'framer-motion';
import { ArrowDown, ArrowUp, GripVertical, Watch } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import { cn } from '@/lib/utils';
import type { Product } from '@/types';
import { SafeImg } from './SafeImg';

/**
 * Store-order editor. Drag a row by its handle (mouse or touch; the page auto-scrolls near the
 * edges) or use the arrow buttons. Saving is done by the parent with the same
 * POST /api/admin/products/reorder call the old page made.
 */
export function ReorderList({ items, onChange }: { items: Product[]; onChange: (next: Product[]) => void }) {
  const move = (from: number, to: number) => {
    if (to < 0 || to >= items.length) return;
    const next = [...items];
    const [item] = next.splice(from, 1);
    next.splice(to, 0, item);
    onChange(next);
  };

  return (
    <Reorder.Group as="ol" axis="y" values={items} onReorder={onChange} className="relative">
      {items.map((product, i) => (
        <ReorderRow key={product.id} product={product} index={i} last={i === items.length - 1} onMove={move} />
      ))}
    </Reorder.Group>
  );
}

function ReorderRow({
  product,
  index,
  last,
  onMove,
}: {
  product: Product;
  index: number;
  last: boolean;
  onMove: (from: number, to: number) => void;
}) {
  const controls = useDragControls();
  const image = product.images?.[0];

  return (
    <Reorder.Item
      value={product}
      dragListener={false}
      dragControls={controls}
      className={cn('relative flex select-none items-center gap-2.5 bg-adm-surface py-2 pl-2 pr-2 sm:gap-3 sm:pl-3 sm:pr-3', !last && 'border-b border-adm-line')}
      whileDrag={{ scale: 1.012, zIndex: 20, boxShadow: '0 0 0 1px rgba(70,30,32,.06), 0 14px 28px -8px rgba(60,24,26,.22)', borderRadius: 12 }}
    >
      <button
        type="button"
        aria-label={`Drag ${product.name}`}
        onPointerDown={(e) => {
          e.preventDefault();
          controls.start(e);
        }}
        className="grid size-9 shrink-0 cursor-grab touch-none place-items-center rounded-[9px] text-adm-faint transition-colors hover:bg-adm-canvas-2 hover:text-adm-ink-2 active:cursor-grabbing"
      >
        <GripVertical className="size-[18px]" />
      </button>
      <span className="w-6 shrink-0 text-right font-adm-mono text-[11.5px] font-semibold tabular-nums text-adm-faint">{index + 1}</span>
      <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[10px] bg-adm-canvas-2">
        {image ? (
          <SafeImg src={image} loading="lazy" draggable={false} className="size-full object-cover" fallback={<Watch className="size-5 text-adm-faint" />} />
        ) : (
          <Watch className="size-5 text-adm-faint" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13.5px] font-semibold text-adm-ink">{product.name}</span>
        <span className="block truncate text-xs text-adm-muted">
          {product.brand}
          {product.isVisible === false && ' · Hidden'}
        </span>
      </span>
      <span className="flex shrink-0 gap-0.5">
        <Button variant="ghost" size="icon" disabled={index === 0} onClick={() => onMove(index, index - 1)} aria-label={`Move ${product.name} up`}>
          <ArrowUp />
        </Button>
        <Button variant="ghost" size="icon" disabled={last} onClick={() => onMove(index, index + 1)} aria-label={`Move ${product.name} down`}>
          <ArrowDown />
        </Button>
      </span>
    </Reorder.Item>
  );
}
