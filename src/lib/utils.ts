import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
