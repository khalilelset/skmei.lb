'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Globe, MessageCircle, Watch } from 'lucide-react';
import { Badge } from '@/components/admin/ui/badge';
import { avatarStyle, initials } from '@/components/admin/dashboard/RecentOrders';
import { cn, formatPhoneDisplay } from '@/lib/utils';
import type { Order } from '@/types';

export type OrderSource = 'website' | 'whatsapp';

export const sourceOf = (o: Order): OrderSource => (o.source ?? 'website') as OrderSource;

export const customerName = (o: Order) => `${o.customer.firstName} ${o.customer.lastName}`;

/** Total units in the order (sum of quantities). */
export const unitCount = (o: Order) => o.items.reduce((n, i) => n + (Number(i.quantity) || 0), 0);

export function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
}

/** Lebanese numbers get the "+961 " spacing; foreign numbers are shown exactly as stored. */
export function displayPhone(phone: string | null | undefined) {
  const p = (phone ?? '').trim();
  if (!p) return '';
  return !p.startsWith('+') || p.startsWith('+961') ? formatPhoneDisplay(p) : p;
}

/** Second line under the customer name: city (or area) and phone. */
export function customerSubline(o: Order) {
  return [o.shippingAddress.city || o.shippingAddress.area, displayPhone(o.customer.phone)].filter(Boolean).join(' · ');
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden className={className}>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

export function SourceBadge({ source, className }: { source: OrderSource; className?: string }) {
  return source === 'whatsapp' ? (
    <Badge tone="whatsapp" className={className}>
      <MessageCircle className="size-3" />
      WhatsApp
    </Badge>
  ) : (
    <Badge tone="outline" className={className}>
      <Globe className="size-3" />
      Website
    </Badge>
  );
}

export function CustomerAvatar({ name, className }: { name: string; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn('grid size-[30px] shrink-0 place-items-center rounded-full text-[11px] font-bold tracking-[.02em]', className)}
      style={avatarStyle(name.trim())}
    >
      {initials(name.trim())}
    </span>
  );
}

/**
 * Product photo that falls back to a placeholder when there is no image or it fails to load
 * (older orders still point at image hosts that no longer serve the file).
 */
export function ProductImage({ src, alt, sizes, className, fallback }: { src: string; alt: string; sizes: string; className?: string; fallback: React.ReactNode }) {
  const [failed, setFailed] = useState(false);
  if (!src || failed) return <>{fallback}</>;
  return <Image src={src} alt={alt} fill sizes={sizes} className={className} onError={() => setFailed(true)} />;
}

/** Up to two overlapping product thumbnails followed by "N items". */
export function ItemThumbs({ order }: { order: Order }) {
  const units = unitCount(order);
  return (
    <div className="flex items-center gap-2">
      <span className="flex">
        {order.items.slice(0, 2).map((item, i) => (
          <span
            key={i}
            className={cn(
              'relative grid size-7 place-items-center overflow-hidden rounded-[9px] bg-[#F6F2F1] ring-2 ring-adm-surface',
              i > 0 && '-ml-2',
            )}
          >
            <ProductImage
              key={item.image}
              src={item.image}
              alt=""
              sizes="28px"
              className="object-contain p-0.5"
              fallback={<Watch className="size-3.5 text-adm-faint" />}
            />
          </span>
        ))}
      </span>
      <span className="tabular-nums">
        {units} {units === 1 ? 'item' : 'items'}
      </span>
    </div>
  );
}
