'use client';

import * as React from 'react';
import Image from 'next/image';
import { Globe } from 'lucide-react';
import { Badge } from '@/components/admin/ui/badge';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { cn } from '@/lib/utils';
import { TYPE_META, type BoxItem, type BoxType } from './model';

/**
 * Hosts listed in next.config.ts `images.remotePatterns` go through the Next optimizer; anything
 * else (custom R2 domain, dead res.cloudinary.com links) loads directly so next/image never throws
 * on an unlisted host and dead links fail fast to the fallback.
 */
const OPTIMIZED = /^https:\/\/(?:images\.unsplash\.com|[a-z0-9-]+\.(?:r2\.dev|supabase\.co|supabase\.in))(?:\/|$)/i;

/** next/image (fill) that swaps to `fallback` when the file can't load. Parent must be `relative` and sized. */
export function BoxImage({
  src,
  alt = '',
  sizes,
  className,
  fallback,
}: {
  src: string | null | undefined;
  alt?: string;
  sizes: string;
  className?: string;
  fallback: React.ReactNode;
}) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  if (!src || failedSrc === src) return <>{fallback}</>;
  const optimize = src.startsWith('/') || OPTIMIZED.test(src);
  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      unoptimized={!optimize}
      className={cn('object-cover', className)}
      onError={() => setFailedSrc(src)}
    />
  );
}

export function BoxThumb({ box, className }: { box: Pick<BoxItem, 'image' | 'code' | 'type'>; className?: string }) {
  const Icon = TYPE_META[box.type]?.icon ?? TYPE_META.standard.icon;
  return (
    <span className={cn('relative grid size-12 shrink-0 place-items-center overflow-hidden rounded-[12px] border border-adm-line bg-adm-surface-2 text-adm-faint', className)}>
      <BoxImage src={box.image} alt={`${box.code} box`} sizes="56px" fallback={<Icon className="size-5" />} />
    </span>
  );
}

export function TypeBadge({ type, className }: { type: BoxType; className?: string }) {
  const meta = TYPE_META[type] ?? TYPE_META.standard;
  const Icon = meta.icon;
  return (
    <Badge className={cn(meta.badge, className)}>
      <Icon />
      {meta.label}
    </Badge>
  );
}

export function BrandCell({ box }: { box: BoxItem }) {
  if (box.brandName) return <Badge tone="outline">{box.brandName}</Badge>;
  if (box.brandId) return <Badge tone="amber">Removed brand</Badge>;
  return (
    <span className="inline-flex items-center gap-1.5 text-[13px] text-adm-muted">
      <Globe className="size-3.5" />
      All brands
    </span>
  );
}

export function Section({
  title,
  description,
  icon,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('min-w-0 rounded-[16px] bg-adm-surface p-4 shadow-adm-md sm:p-5', className)}>
      <header className="mb-4 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-adm-accent-soft text-adm-accent-hover [&_svg]:size-4">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-adm-display text-[15px] font-bold leading-tight tracking-[-0.01em] text-adm-ink">{title}</h3>
          {description && <p className="mt-0.5 text-[12.5px] leading-snug text-adm-muted">{description}</p>}
        </div>
      </header>
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string | false;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="gap-1">
        {label}
        {required && <span className="text-adm-accent">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-adm-accent-hover">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-adm-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Number input with a leading "$". */
export function MoneyInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13.5px] font-medium text-adm-muted">$</span>
      <Input type="number" inputMode="decimal" className="pl-6 tabular-nums" {...props} />
    </div>
  );
}
