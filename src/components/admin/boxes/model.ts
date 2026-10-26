import { Gift, Package, type LucideIcon } from 'lucide-react';
import { formatPrice } from '@/lib/utils';

export type BoxType = 'standard' | 'gift';

/** Shape returned by GET /api/admin/boxes. */
export interface BoxItem {
  id: string;
  code: string;
  type: BoxType;
  price: number;
  image: string;
  brandId: string | null;
  brandName?: string | null;
  createdAt: string;
}

export interface BrandOption {
  id: string;
  name: string;
}

export type TypeFilter = 'all' | BoxType;
/** Brand filter: 'all', GLOBAL (boxes without a brand) or a brand id. */
export const GLOBAL = '__global__';

export const TYPE_META: Record<BoxType, { label: string; long: string; hint: string; icon: LucideIcon; badge: string; tile: string }> = {
  standard: {
    label: 'Standard',
    long: 'Standard box',
    hint: 'Default',
    icon: Package,
    badge: 'bg-[#EAF1FF] text-[#1D4ED8]',
    tile: 'bg-[#EAF1FF] text-[#1D4ED8]',
  },
  gift: {
    label: 'Gift box',
    long: 'Gift box',
    hint: 'Upgrade',
    icon: Gift,
    badge: 'bg-[#FDECF4] text-[#BE185D]',
    tile: 'bg-[#FDECF4] text-[#BE185D]',
  },
};

/** "Free" when 0, otherwise the amount added to the order, e.g. "+$5.00". */
export function priceLabel(price: number) {
  if (!price) return 'Free';
  return `${price > 0 ? '+' : '-'}${formatPrice(Math.abs(price))}`;
}

/** Same slug the old page sent to /api/admin/upload. */
export function uploadSlug(code: string) {
  return (code || 'box').toLowerCase().replace(/[^a-z0-9-]/g, '-');
}

export function fmtDay(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export type SortKey = 'code' | 'type' | 'price' | 'brandName';
export interface SortState {
  key: SortKey | '';
  dir: 'asc' | 'desc';
}
export const SORT_KEYS: SortKey[] = ['code', 'type', 'price', 'brandName'];
export const SORT_LABEL: Record<SortKey, string> = { code: 'Code', type: 'Type', price: 'Price', brandName: 'Brand' };

/** Click a column once for ascending, again for descending (same as the old DataTable). */
export function nextSort(sort: SortState, key: SortKey): SortState {
  return { key, dir: sort.key === key && sort.dir === 'asc' ? 'desc' : 'asc' };
}

export function sortBoxes(list: BoxItem[], sort: SortState) {
  const { key } = sort;
  if (!key) return list;
  const m = sort.dir === 'asc' ? 1 : -1;
  return [...list].sort((a, b) => {
    if (key === 'price') return (a.price - b.price) * m;
    const av = key === 'brandName' ? a.brandName ?? '' : a[key];
    const bv = key === 'brandName' ? b.brandName ?? '' : b[key];
    return String(av).localeCompare(String(bv), undefined, { numeric: true, sensitivity: 'base' }) * m;
  });
}

export function matchesBox(box: BoxItem, type: TypeFilter, brand: string, query: string) {
  if (type !== 'all' && box.type !== type) return false;
  if (brand === GLOBAL) {
    if (box.brandId) return false;
  } else if (brand !== 'all' && box.brandId !== brand) return false;
  const q = query.trim().toLowerCase();
  if (q && !box.code.toLowerCase().includes(q) && !(box.brandName ?? '').toLowerCase().includes(q)) return false;
  return true;
}
