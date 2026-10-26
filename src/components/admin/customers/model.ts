import { phoneKey } from '@/lib/phoneKey';

/** One person, exactly as GET /api/admin/customers returns it (accounts and orders merged by phone). */
export interface CustomerOrder {
  id: string;
  total: number;
  status: string;
  createdAt: string;
}

export interface Customer {
  phone: string;
  name: string;
  email: string | null;
  hasAccount: boolean;
  accountId: string | null;
  accountCreatedAt: string | null;
  addresses: unknown[];
  orderCount: number;
  totalSpent: number;
  firstOrderAt: string | null;
  lastOrderAt: string | null;
  orders: CustomerOrder[];
}

export type CustomerFilter = 'all' | 'account' | 'order-only';

export function matchesFilter(c: Customer, filter: CustomerFilter) {
  if (filter === 'account') return c.hasAccount;
  if (filter === 'order-only') return !c.hasAccount && c.orderCount > 0;
  return true;
}

/** Name, phone or email (same fields as before), plus phone digits typed in any format ("71 867", "03 123 456"). */
export function matchesSearch(c: Customer, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  if (c.name.toLowerCase().includes(q) || c.phone.includes(q) || (c.email ?? '').toLowerCase().includes(q)) return true;
  if (/^[\d\s+()./-]+$/.test(q)) {
    const key = phoneKey(q);
    return key.length >= 2 && phoneKey(c.phone).includes(key);
  }
  return false;
}

export type SortKey = 'name' | 'phone' | 'orderCount' | 'totalSpent' | 'firstOrderAt' | 'lastOrderAt';
export type SortState = { key: SortKey | ''; dir: 'asc' | 'desc' };

export const SORT_LABEL: Record<SortKey, string> = {
  name: 'Customer',
  phone: 'Contact',
  orderCount: 'Orders',
  totalSpent: 'Total spent',
  firstOrderAt: 'First order',
  lastOrderAt: 'Last order',
};
export const SORT_KEYS = Object.keys(SORT_LABEL) as SortKey[];

/** Date of the first real order (the API falls back to the account date when there are none). */
export const firstOrderOf = (c: Customer) => (c.orderCount > 0 ? c.firstOrderAt : null);

function sortValue(c: Customer, key: SortKey): string | number | null {
  switch (key) {
    case 'name':
      return c.name.trim().toLowerCase() || null;
    case 'phone':
      return phoneKey(c.phone) || null;
    case 'orderCount':
      return c.orderCount;
    case 'totalSpent':
      return c.totalSpent;
    case 'firstOrderAt':
      return firstOrderOf(c);
    case 'lastOrderAt':
      return c.lastOrderAt;
  }
}

/** Empty values always go last, whichever direction is picked. */
export function sortCustomers(list: Customer[], { key, dir }: SortState) {
  if (!key) return list;
  return [...list].sort((a, b) => {
    const av = sortValue(a, key);
    const bv = sortValue(b, key);
    if (av === null || bv === null) return av === bv ? 0 : av === null ? 1 : -1;
    if (av < bv) return dir === 'asc' ? -1 : 1;
    if (av > bv) return dir === 'asc' ? 1 : -1;
    return 0;
  });
}

/** Same label the old page used; this endpoint doesn't return order numbers. */
export const orderLabel = (id: string) => `SK-${id.slice(0, 6).toUpperCase()}`;

/** Earliest of the account date and the first order. */
export function customerSince(c: Customer): string | null {
  const dates = [c.accountCreatedAt, c.firstOrderAt].filter((d): d is string => !!d);
  return dates.length ? dates.reduce((a, b) => (a < b ? a : b)) : null;
}

export function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function timeAgo(iso: string, now: number) {
  const days = Math.floor((now - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  const plural = (n: number, unit: string) => `${n} ${unit}${n === 1 ? '' : 's'} ago`;
  if (days < 30) return plural(Math.floor(days / 7), 'week');
  if (days < 365) return plural(Math.floor(days / 30), 'month');
  return plural(Math.floor(days / 365), 'year');
}

export interface SavedAddress {
  line: string;
  isDefault: boolean;
}

/**
 * Saved addresses use street/building/city plus area or region depending on where they were saved;
 * some checkouts store a single free-text `full` line instead.
 */
export function savedAddresses(c: Customer): SavedAddress[] {
  return c.addresses.map((raw) => {
    const a = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
    const parts: string[] = [];
    for (const k of ['full', 'street', 'building', 'city', 'area', 'region']) {
      const v = typeof a[k] === 'string' ? (a[k] as string).trim() : '';
      if (v && !parts.some((p) => p.toLowerCase() === v.toLowerCase())) parts.push(v);
    }
    return { line: parts.join(', '), isDefault: a.isDefault === true };
  });
}

export function deleteUrl(c: Customer) {
  return `/api/admin/customers/${encodeURIComponent(c.phone)}${c.accountId ? '?accountId=' + encodeURIComponent(c.accountId) : ''}`;
}
