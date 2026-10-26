/** Row shape returned by GET /api/admin/coupons (select '*'). */
export interface Coupon {
  id: string;
  code: string;
  /** Percent off (the store only supports percentage coupons). */
  discount: number;
  active: boolean;
  expires_at: string | null;
  /** Cap in dollars; null = no cap. */
  max_discount: number | null;
  apply_on_sale: boolean;
  /** Brand names the coupon is limited to; null (or empty) = every brand. */
  brands: string[] | null;
  created_at: string;
}

export type CouponStatus = 'active' | 'disabled' | 'expired';
export type CouponFilter = 'all' | CouponStatus;
export type SortKey = 'newest' | 'oldest' | 'code' | 'discount' | 'expires';

export const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  code: 'Code A-Z',
  discount: 'Biggest discount',
  expires: 'Expires soonest',
};

export const STATUS_LABEL: Record<CouponStatus, string> = {
  active: 'Active',
  disabled: 'Disabled',
  expired: 'Expired',
};

const DAY = 86_400_000;

export function isExpired(c: Pick<Coupon, 'expires_at'>, now: number): boolean {
  return !!c.expires_at && new Date(c.expires_at).getTime() < now;
}

/** Expired wins over the on/off switch, exactly like the checkout validator. */
export function statusOf(c: Coupon, now: number): CouponStatus {
  if (isExpired(c, now)) return 'expired';
  return c.active ? 'active' : 'disabled';
}

export function brandList(c: Pick<Coupon, 'brands'>): string[] {
  return Array.isArray(c.brands) ? c.brands : [];
}

export function matchesSearch(c: Coupon, q: string): boolean {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return c.code.toLowerCase().includes(s) || brandList(c).some((b) => b.toLowerCase().includes(s));
}

export function sortCoupons(list: Coupon[], key: SortKey): Coupon[] {
  const out = [...list];
  const time = (iso: string | null) => (iso ? new Date(iso).getTime() : Number.POSITIVE_INFINITY);
  switch (key) {
    case 'oldest':
      return out.sort((a, b) => time(a.created_at) - time(b.created_at));
    case 'code':
      return out.sort((a, b) => a.code.localeCompare(b.code));
    case 'discount':
      return out.sort((a, b) => Number(b.discount) - Number(a.discount));
    case 'expires':
      // No-expiry coupons go last.
      return out.sort((a, b) => time(a.expires_at) - time(b.expires_at));
    default:
      return out.sort((a, b) => time(b.created_at) - time(a.created_at));
  }
}

/** Expiry dates are saved as midnight UTC of the picked day, so show them in UTC to read back the same day. */
export function fmtExpiry(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function fmtDay(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** "in 5 days", "tomorrow", "2 days ago"... relative to `now`. */
export function expiryHint(iso: string, now: number): string {
  const diff = new Date(iso).getTime() - now;
  const days = Math.round(Math.abs(diff) / DAY);
  if (diff >= 0) {
    if (diff < DAY) return 'Ends within a day';
    return days <= 1 ? 'Ends tomorrow' : `Ends in ${days} days`;
  }
  if (days < 1) return 'Ended today';
  return days === 1 ? 'Ended yesterday' : `Ended ${days} days ago`;
}

/* ------------------------------ editor form ------------------------------ */

export interface CouponForm {
  code: string;
  discount: string;
  max_discount: string;
  /** yyyy-mm-dd from <input type="date">, '' = never expires. */
  expires_at: string;
  apply_on_sale: boolean;
  brands: string[];
}

export const EMPTY_FORM: CouponForm = {
  code: '',
  discount: '',
  max_discount: '',
  expires_at: '',
  apply_on_sale: true,
  brands: [],
};

/** Stored ISO -> yyyy-mm-dd (UTC date, matching how the old page saved it). */
export function toDateInput(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 10);
}

/** Local yyyy-mm-dd for `ms` (used for the date picker's min and the quick presets). */
export function localDateInput(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function formFromCoupon(c: Coupon): CouponForm {
  return {
    code: c.code,
    discount: c.discount != null ? String(c.discount) : '',
    max_discount: c.max_discount != null ? String(c.max_discount) : '',
    expires_at: toDateInput(c.expires_at),
    apply_on_sale: c.apply_on_sale ?? true,
    brands: brandList(c),
  };
}

export interface FormErrors {
  code?: string;
  discount?: string;
  max_discount?: string;
}

export function validateForm(form: CouponForm, coupons: Coupon[], editingId: string | null): FormErrors {
  const errors: FormErrors = {};
  const code = form.code.trim().toUpperCase();
  if (code && coupons.some((c) => c.id !== editingId && c.code.trim().toUpperCase() === code)) {
    errors.code = 'Another coupon already uses this code.';
  }
  if (form.discount !== '') {
    const d = Number(form.discount);
    if (!Number.isFinite(d) || d <= 0 || d > 100) errors.discount = 'Enter a percentage between 1 and 100.';
  }
  if (form.max_discount !== '') {
    const m = Number(form.max_discount);
    if (!Number.isFinite(m) || m < 0) errors.max_discount = 'The cap can’t be negative.';
  }
  return errors;
}

/**
 * Body for POST /api/admin/coupons and PATCH /api/admin/coupons/:id — the same fields and
 * conversions the old page sent. An empty brand list is sent as null (= all brands).
 * When editing, an unchanged expiry day keeps the stored timestamp untouched.
 */
export function buildPayload(form: CouponForm, original: Coupon | null) {
  const expires_at =
    original && form.expires_at === toDateInput(original.expires_at)
      ? original.expires_at
      : form.expires_at
        ? new Date(form.expires_at).toISOString()
        : null;
  return {
    code: form.code,
    discount: Number(form.discount),
    expires_at,
    max_discount: form.max_discount !== '' ? Number(form.max_discount) : null,
    apply_on_sale: form.apply_on_sale,
    brands: form.brands.length > 0 ? form.brands : null,
  };
}

/** One-line human summary, e.g. "15% off · up to $12.00 · SKMEI only · excludes sale items". */
export function summaryParts(
  f: { discount: string | number; max_discount: string | number | null; brands: string[]; apply_on_sale: boolean; expiresLabel?: string | null },
  money: (n: number) => string,
): string[] {
  const parts: string[] = [];
  if (f.discount !== '' && f.discount != null) parts.push(`${f.discount}% off`);
  if (f.max_discount !== '' && f.max_discount != null) parts.push(`up to ${money(Number(f.max_discount))}`);
  parts.push(f.brands.length > 0 ? `${f.brands.join(', ')} only` : 'all brands');
  if (!f.apply_on_sale) parts.push('excludes sale items');
  if (f.expiresLabel) parts.push(`expires ${f.expiresLabel}`);
  return parts;
}
