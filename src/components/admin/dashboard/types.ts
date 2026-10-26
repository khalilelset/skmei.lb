export interface DashboardStats {
  totalRevenue: number;
  totalGrossProfit: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: { id: string; orderNumber: string; customerName: string; total: number; status: string; createdAt: string }[];
  daily: { date: string; revenue: number; orders: number; profit: number }[];
  previous: { revenue: number; orders: number; profit: number };
  newCustomers30: number;
  newProducts30: number;
  customersWeekly: number[];
  productsWeekly: number[];
  statusCounts: Record<string, number>;
}

/** "YYYY-MM-DD" → Date at local noon, so formatting never shifts the day. */
export function parseDay(date: string) {
  const [y, m, d] = date.split('-').map(Number);
  return new Date(y, m - 1, d, 12);
}

export const money = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const int = (n: number) => Math.round(n).toLocaleString('en-US');

export function pctChange(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}
