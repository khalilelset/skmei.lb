export { money, int, parseDay } from '@/components/admin/dashboard/types';

// ─── API shapes (GET /api/admin/analytics, /range, /visitors) ───────────────
export interface ChartPoint { label: string; revenue: number; orders: number; grossProfit?: number }
export interface CategoryPoint { category: string; count: number; revenue: number }
export interface StatusPoint { status: string; count: number }
export interface ProductPoint { name: string; fullName: string; quantity: number; revenue: number; category: string }
export interface RegionPoint { region: string; count: number; revenue: number }
export interface UnitProfitPoint {
  name: string; fullName: string; salePrice: number; costPrice: number;
  unitProfit: number; margin: number; category: string;
}
export interface OrderProfitPoint {
  name: string; fullName: string; quantity: number; grossProfit: number; revenue: number; category: string;
}

export interface KPIs {
  totalRevenue: number; totalOrders: number; totalGrossProfit: number;
  grossMargin: number; avgOrderValue: number; deliveryRate: number; topCategory: string;
  thisWeekRevenue: number; lastWeekRevenue: number; weekRevenueChange: number | null;
  thisWeekOrders: number; lastWeekOrders: number; weekOrdersChange: number | null;
  thisWeekGrossProfit: number; lastWeekGrossProfit: number; weekGPChange: number | null;
  thisMonthRevenue: number; lastMonthRevenue: number; revenueChange: number | null;
  thisMonthOrders: number; lastMonthOrders: number; ordersChange: number | null;
  thisMonthGrossProfit: number; lastMonthGrossProfit: number; monthGPChange: number | null;
  thisYearRevenue: number; lastYearRevenue: number; yearRevenueChange: number | null;
  thisYearOrders: number; lastYearOrders: number; yearOrdersChange: number | null;
  thisYearGrossProfit: number; lastYearGrossProfit: number; yearGPChange: number | null;
}

export interface CustomRangeKpis {
  totalRevenue: number; totalOrders: number; totalGrossProfit: number;
  grossMargin: number; avgOrderValue: number; deliveryRate: number;
}

export interface AnalyticsData {
  annualRevenue: ChartPoint[]; monthlyRevenue: ChartPoint[];
  weeklyRevenue: ChartPoint[]; dailyRevenue: ChartPoint[];
  categoryBreakdown: CategoryPoint[]; topProducts: ProductPoint[];
  statusBreakdown: StatusPoint[]; regionBreakdown: RegionPoint[];
  productUnitProfit: UnitProfitPoint[];
  productOrderProfit: OrderProfitPoint[];
  productWebsiteProfit: OrderProfitPoint[];
  kpis: KPIs;
}

export type VsPeriod = 'today' | 'this_week' | 'last_week' | 'this_month' | 'last_30_days';

export const VS_PERIODS: { value: VsPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This week' },
  { value: 'last_week', label: 'Last week' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_30_days', label: 'Last 30 days' },
];

export interface VisitorStats {
  total: number;
  todayVisits: number;
  daily: { date: string; pageviews: number }[];
  countries: { key: string; count: number }[];
  devices: { key: string; count: number }[];
  browsers: { key: string; count: number }[];
  pages: { key: string; count: number }[];
}

// ─── Formatting ──────────────────────────────────────────────────────────────
/** Percent with at most one decimal; the API already rounds to one decimal. */
export const pct = (n: number) => `${Math.round(n * 10) / 10}%`;
/** Axis ticks: $1.2k above a thousand, plain dollars below (same as before). */
export const fmtK = (n: number) => (n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`);

export const EASE = [0.2, 0.8, 0.2, 1] as const;

/** A round axis maximum split into four even steps (0, ¼, ½, ¾, max). */
export function niceScale(peak: number, fallback = 40): { max: number; ticks: number[] } {
  const p = peak > 0 ? peak : fallback;
  const raw = p / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const n = raw / mag;
  const step = ([1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10].find((s) => n <= s) ?? 10) * mag;
  const max = step * 4;
  return { max, ticks: [0, 1, 2, 3, 4].map((i) => Math.round(step * i * 100) / 100) };
}

// ─── Colors ──────────────────────────────────────────────────────────────────
export const CHART = {
  grid: '#EFE9E7',
  axis: '#E2D9D6',
  tick: '#6F6567',
  red: '#DC2626',
  green: '#16A34A',
  blue: '#2563EB',
  ordersBar: '#F5C987',
} as const;

/** Categorical palette (category / device shares), tuned to the admin warm canvas. */
export const PALETTE = ['#DC2626', '#2563EB', '#16A34A', '#D97706', '#7C3AED', '#DB2777', '#0891B2', '#65A30D'];

export type ToneName = 'red' | 'green' | 'amber' | 'blue' | 'violet' | 'teal';

export const TONES: Record<ToneName, { tone: string; ink: string; tint: string; glow: string }> = {
  red: { tone: '#DC2626', ink: '#B91C1C', tint: '#FFF1EF', glow: 'rgba(220,38,38,.14)' },
  green: { tone: '#16A34A', ink: '#15803D', tint: '#ECFAF1', glow: 'rgba(22,163,74,.14)' },
  amber: { tone: '#D97706', ink: '#B45309', tint: '#FFF6E5', glow: 'rgba(217,119,6,.15)' },
  blue: { tone: '#2563EB', ink: '#1D4ED8', tint: '#EEF4FF', glow: 'rgba(37,99,235,.13)' },
  violet: { tone: '#7C3AED', ink: '#6D28D9', tint: '#F4EFFF', glow: 'rgba(124,58,237,.13)' },
  teal: { tone: '#0F766E', ink: '#0F766E', tint: '#E9F7F5', glow: 'rgba(15,118,110,.14)' },
};
