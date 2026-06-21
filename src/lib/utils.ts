import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const FREE_SHIPPING_THRESHOLD = Number(process.env.NEXT_PUBLIC_FREE_SHIPPING_THRESHOLD ?? 50);

/**
 * Rewrites a Cloudinary video URL to add server-side transformations.
 * Cloudinary resizes/re-encodes the video before delivery, so the browser
 * only downloads a file sized for the actual display width — not the original.
 *
 * q_auto   — automatic quality (removes unnecessary data without visible loss)
 * f_auto   — automatic format (WebM for Chrome/Firefox, MP4 for Safari)
 * w_{max}  — cap pixel width so mobile devices get a small file
 * vc_auto  — automatic video codec selection
 */
export function getOptimizedVideoUrl(url: string, maxWidth = 1280): string {
  if (!url || !url.includes('res.cloudinary.com')) return url;
  // Insert transformation params after /upload/
  return url.replace(
    '/video/upload/',
    `/video/upload/q_auto,f_auto,vc_auto,w_${maxWidth}/`,
  );
}
export const SHIPPING_COST = Number(process.env.NEXT_PUBLIC_SHIPPING_COST ?? 4);

export function formatPrice(price: number, currency: string = "USD"): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(price);
}

export function formatDate(date: string | Date): string {
  return new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(date));
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength).trim() + "...";
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/--+/g, "-")
    .trim();
}

export function generateProductSlug(name: string, brandName?: string | null): string {
  const slugify = (s: string) =>
    s.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();

  if (brandName) {
    const brandLower = brandName.toLowerCase();
    const nameLower = name.toLowerCase().trimStart();
    if (nameLower.startsWith(brandLower)) {
      const remainder = name.slice(brandName.length).trim();
      if (remainder) {
        const prefix = brandLower.slice(0, 2);
        return `${prefix}-${slugify(remainder)}`;
      }
    }
  }
  return slugify(name);
}

export function calculateDiscount(
  originalPrice: number,
  salePrice: number,
): number {
  return Math.round(((originalPrice - salePrice) / originalPrice) * 100);
}

export function getStockStatus(stock: number): {
  label: string;
  color: string;
} {
  if (stock === 0) {
    return { label: "Out of Stock", color: "text-red-600" };
  } else if (stock < 10) {
    return { label: "Low Stock", color: "text-orange-600" };
  } else if (stock < 50) {
    return { label: "Limited Stock", color: "text-red-600" };
  }
  return { label: "In Stock", color: "text-green-600" };
}

export function debounce<T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number,
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

export function getTierTotal(
  tiers: { qty: number; price: number }[] | null | undefined,
  basePrice: number,
  quantity: number,
): number {
  if (!tiers || tiers.length === 0) return basePrice * quantity;
  const sorted = [...tiers].sort((a, b) => b.qty - a.qty);
  let remaining = quantity;
  let total = 0;
  for (const tier of sorted) {
    const batches = Math.floor(remaining / tier.qty);
    total += batches * tier.price;
    remaining -= batches * tier.qty;
  }
  total += remaining * basePrice;
  return total;
}

export interface BrandWithTiers {
  name: string;
  defaults?: { priceTiers?: { qty: string; price: string }[] } | null;
}

export function getBrandBundleSavings(
  items: { product: { brand?: string | null; price: number; priceTiers?: { qty: number; price: number }[] | null }; quantity: number }[],
  brands: BrandWithTiers[],
): number {
  const groups = new Map<string, { totalQty: number; existingCost: number }>();
  for (const item of items) {
    const brandName = item.product.brand;
    if (!brandName) continue;
    const prev = groups.get(brandName) ?? { totalQty: 0, existingCost: 0 };
    const itemCost = getTierTotal(item.product.priceTiers, item.product.price, item.quantity);
    groups.set(brandName, { totalQty: prev.totalQty + item.quantity, existingCost: prev.existingCost + itemCost });
  }

  let savings = 0;
  for (const [brandName, group] of groups) {
    const brand = brands.find((b) => b.name === brandName);
    const rawTiers = brand?.defaults?.priceTiers;
    if (!rawTiers || rawTiers.length === 0) continue;
    const tiers = rawTiers
      .map((t) => ({ qty: parseInt(t.qty), price: parseFloat(t.price) }))
      .filter((t) => t.qty > 0 && t.price > 0);
    if (tiers.length === 0) continue;
    const avgPrice = group.existingCost / group.totalQty;
    const bundleCost = getTierTotal(tiers, avgPrice, group.totalQty);
    const saved = group.existingCost - bundleCost;
    if (saved > 0) savings += saved;
  }
  return savings;
}

// Format a phone for display — handles DB local format ("70683611") and E.164 ("+96170683611")
export function formatPhoneDisplay(phone: string): string {
  if (!phone) return '';
  const p = phone.trim();
  if (p.startsWith('+')) {
    // Insert space after the country code (1–3 digits after +)
    return p.replace(/^(\+\d{1,3})(\d)/, '$1 $2');
  }
  // Assume Lebanese local number stored without prefix
  return `+961 ${p}`;
}

// Returns the digits-only string needed for a wa.me link (no + or spaces)
export function phoneToWaNumber(phone: string): string {
  if (!phone) return '';
  const p = phone.trim();
  if (p.startsWith('+')) return p.slice(1).replace(/\D/g, '');
  return `961${p.replace(/\D/g, '')}`;
}

export function getOrderStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-red-100 text-red-800",
    confirmed: "bg-blue-100 text-blue-800",
    processing: "bg-purple-100 text-purple-800",
    shipped: "bg-indigo-100 text-indigo-800",
    delivered: "bg-green-100 text-green-800",
    cancelled: "bg-red-100 text-red-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

// Maps a Sunglasses item + selected variant into the Product shape so the
// existing cart, checkout, and order flow work with no changes.
import type { Sunglasses, Product } from '@/types';
export function sunglassesToProduct(sg: Sunglasses, variantId?: string): Product {
  const variant = (variantId ? sg.variants.find(v => v.id === variantId) : null) ?? sg.variants[0];
  return {
    id: sg.id,
    name: variant ? `${sg.name} – ${variant.colorName}` : sg.name,
    slug: sg.slug,
    description: sg.description,
    price: sg.price,
    originalPrice: sg.originalPrice,
    images: variant?.images ?? [],
    videoUrl: variant?.videoUrl ?? null,
    category: 'sunglasses',
    brand: sg.brand,
    stock: sg.stock,
    features: sg.features,
    specifications: sg.specifications as import('@/types').ProductSpecifications,
    gender: sg.gender,
    isNew: sg.isNew,
    onSale: sg.onSale,
    isBestseller: sg.isBestseller,
    colors: sg.variants.map(v => ({ name: v.colorName, hex: v.colorHex })),
    rating: sg.rating,
    reviewCount: sg.reviewCount,
    sku: '',
    createdAt: sg.createdAt,
    updatedAt: sg.updatedAt,
  };
}
