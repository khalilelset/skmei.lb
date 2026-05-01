'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Divider, LinearProgress, Select, MenuItem, TextField,
} from '@mui/material';
import {
  TrendingUp, TrendingDown, AttachMoney, LocalShipping,
  ShoppingCart, Inventory2, ArrowUpward, ArrowDownward,
} from '@mui/icons-material';
import {
  ComposedChart, Area, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, LabelList,
} from 'recharts';

// ─── Design tokens ────────────────────────────────────────────────────────────
const T = {
  red:     '#DC2626',
  redSoft: 'rgba(220,38,38,0.10)',
  blue:    '#3B82F6',
  blueSoft:'rgba(59,130,246,0.10)',
  green:   '#10B981',
  amber:   '#F59E0B',
  purple:  '#8B5CF6',
  pink:    '#EC4899',
  cyan:    '#06B6D4',
  lime:    '#84CC16',
  grid:    'rgba(0,0,0,0.05)',
  border:  'rgba(0,0,0,0.08)',
  shadow:  '0 1px 4px rgba(0,0,0,0.07), 0 0 1px rgba(0,0,0,0.05)',
  shadowMd:'0 4px 16px rgba(0,0,0,0.09), 0 0 1px rgba(0,0,0,0.06)',
  radius:  3,         // MUI units = 12px
  radiusSm:2,         // 8px
};

const PIE_COLORS  = [T.red, T.blue, T.green, T.amber, T.purple, T.pink, T.cyan, T.lime];
const STATUS_COLOR: Record<string,string> = {
  pending:    T.amber,
  confirmed:  T.blue,
  processing: T.purple,
  shipped:    T.cyan,
  delivered:  T.green,
  cancelled:  '#EF4444',
};

// ─── Types ────────────────────────────────────────────────────────────────────
interface ChartPoint    { label: string; revenue: number; orders: number; grossProfit?: number }
interface CategoryPoint { category: string; count: number; revenue: number }
interface StatusPoint   { status: string; count: number }
interface ProductPoint  { name: string; fullName: string; quantity: number; revenue: number; category: string }
interface RegionPoint   { region: string; count: number; revenue: number }
interface UnitProfitPoint {
  name: string; fullName: string; salePrice: number; costPrice: number;
  unitProfit: number; margin: number; category: string;
}
interface OrderProfitPoint {
  name: string; fullName: string; quantity: number; grossProfit: number; revenue: number; category: string;
}

interface KPIs {
  totalRevenue: number; totalOrders: number; totalGrossProfit: number;
  grossMargin: number; avgOrderValue: number; deliveryRate: number; topCategory: string;
  // week
  thisWeekRevenue: number; lastWeekRevenue: number; weekRevenueChange: number | null;
  thisWeekOrders: number;  lastWeekOrders: number;  weekOrdersChange: number | null;
  thisWeekGrossProfit: number; lastWeekGrossProfit: number; weekGPChange: number | null;
  // month
  thisMonthRevenue: number; lastMonthRevenue: number; revenueChange: number | null;
  thisMonthOrders: number;  lastMonthOrders: number;  ordersChange: number | null;
  thisMonthGrossProfit: number; lastMonthGrossProfit: number; monthGPChange: number | null;
  // year
  thisYearRevenue: number; lastYearRevenue: number; yearRevenueChange: number | null;
  thisYearOrders: number;  lastYearOrders: number;  yearOrdersChange: number | null;
  thisYearGrossProfit: number; lastYearGrossProfit: number; yearGPChange: number | null;
}

interface CustomRangeKpis {
  totalRevenue: number; totalOrders: number; totalGrossProfit: number;
  grossMargin: number; avgOrderValue: number; deliveryRate: number;
}

interface AnalyticsData {
  annualRevenue: ChartPoint[]; monthlyRevenue: ChartPoint[];
  weeklyRevenue: ChartPoint[];  dailyRevenue: ChartPoint[];
  categoryBreakdown: CategoryPoint[]; topProducts: ProductPoint[];
  statusBreakdown: StatusPoint[];     regionBreakdown: RegionPoint[];
  productUnitProfit: UnitProfitPoint[];
  productOrderProfit: OrderProfitPoint[];
  productWebsiteProfit: OrderProfitPoint[];
  kpis: KPIs;
}

// ─── Formatters ───────────────────────────────────────────────────────────────
const fmtUSD  = (n: number) => '$' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtK    = (n: number) => n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`;

// ─── Shared card wrapper ──────────────────────────────────────────────────────
function Card({ children, sx = {} }: { children: React.ReactNode; sx?: object }) {
  return (
    <Paper elevation={0} sx={{ borderRadius: T.radius, border: `1px solid ${T.border}`, boxShadow: T.shadow, overflow: 'hidden', ...sx }}>
      {children}
    </Paper>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 1.5, borderBottom: `1px solid ${T.border}` }}>
      <Typography fontWeight={600} fontSize={14} letterSpacing={0.1}>{title}</Typography>
      {sub && <Typography variant="caption" color="text.secondary">{sub}</Typography>}
    </Box>
  );
}

// ─── Trend badge ──────────────────────────────────────────────────────────────
function TrendBadge({ value }: { value: number | null }) {
  if (value === null) return <Typography variant="caption" color="text.disabled">No prior data</Typography>;
  const up = value >= 0;
  return (
    <Box sx={{ display: 'inline-flex', alignItems: 'center', gap: 0.4,
      px: 1, py: 0.25, borderRadius: 5,
      bgcolor: up ? 'rgba(16,185,129,0.10)' : 'rgba(239,68,68,0.10)',
    }}>
      {up
        ? <ArrowUpward sx={{ fontSize: 11, color: T.green }} />
        : <ArrowDownward sx={{ fontSize: 11, color: '#EF4444' }} />}
      <Typography variant="caption" fontWeight={600} sx={{ color: up ? T.green : '#EF4444', fontVariantNumeric: 'tabular-nums' }}>
        {up ? '+' : ''}{value}%
      </Typography>
    </Box>
  );
}

// ─── KPI Card ─────────────────────────────────────────────────────────────────
function KpiCard({ icon, label, value, sub, change, accent = T.red }:
  { icon: React.ReactNode; label: string; value: string; sub?: string; change?: number | null; accent?: string }) {
  return (
    <Card sx={{ height: '100%', borderLeft: `3px solid ${accent}` }}>
      <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: { xs: 1, sm: 2 } }}>
          <Box sx={{ p: 0.75, borderRadius: T.radiusSm, bgcolor: `${accent}18`, color: accent, display: 'flex', lineHeight: 0 }}>
            {icon}
          </Box>
          {change !== undefined && <TrendBadge value={change ?? null} />}
        </Box>
        <Typography fontWeight={800} fontSize={{ xs: 18, sm: 24 }} lineHeight={1} sx={{ fontVariantNumeric: 'tabular-nums', mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500} sx={{ fontSize: { xs: 10, sm: 12 } }}>{label}</Typography>
        {sub && (
          <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 0.5, fontSize: 10, display: { xs: 'none', sm: 'block' } }}>{sub}</Typography>
        )}
      </Box>
    </Card>
  );
}

// ─── Revenue tooltip ──────────────────────────────────────────────────────────
function RevenueTooltip({ active, payload, label }:
  { active?: boolean; payload?: { name: string; value: number; color: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <Box sx={{ bgcolor: 'background.paper', border: `1px solid ${T.border}`, borderRadius: 2,
      boxShadow: T.shadowMd, p: 1.5, minWidth: 148 }}>
      <Typography variant="caption" fontWeight={700} color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5, display: 'block', mb: 1 }}>
        {label}
      </Typography>
      {payload.map((p) => (
        <Box key={p.name} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 0.5 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: p.color, flexShrink: 0 }} />
            <Typography variant="caption" color="text.secondary">{p.name}</Typography>
          </Box>
          <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
            {p.name === 'Revenue' ? fmtUSD(p.value) : p.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

// ─── Pie tooltip ─────────────────────────────────────────────────────────────
function PieTooltip({ active, payload, total, unit }:
  { active?: boolean; payload?: { name: string; value: number }[]; total: number; unit: string }) {
  if (!active || !payload?.length) return null;
  const { name, value } = payload[0];
  const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0.0';
  return (
    <Box sx={{ bgcolor: 'background.paper', border: `1px solid ${T.border}`, borderRadius: 2,
      boxShadow: T.shadowMd, p: 1.5, minWidth: 120 }}>
      <Typography variant="caption" fontWeight={700} sx={{ textTransform: 'capitalize', display: 'block', mb: 0.5 }}>{name}</Typography>
      <Typography fontWeight={800} fontSize={20} sx={{ fontVariantNumeric: 'tabular-nums', lineHeight: 1.2 }}>{pct}%</Typography>
      <Typography variant="caption" color="text.secondary">{value} {unit}</Typography>
    </Box>
  );
}

// ─── Donut center label ───────────────────────────────────────────────────────
function DonutLabel({ total, label }: { total: number; label: string }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-6" style={{ fontSize: 22, fontWeight: 800, fill: '#111' }}>{total}</tspan>
      <tspan x="50%" dy="18" style={{ fontSize: 11, fill: '#888' }}>{label}</tspan>
    </text>
  );
}

// ─── Chart view toggle tabs ───────────────────────────────────────────────────
type ChartView = 'annual' | 'monthly' | 'weekly' | 'daily';
const VIEWS: { value: ChartView; label: string }[] = [
  { value: 'annual',  label: 'Annual'  },
  { value: 'monthly', label: 'Monthly' },
  { value: 'weekly',  label: 'Weekly'  },
  { value: 'daily',   label: 'Daily'   },
];

function ViewTabs({ value, onChange }: { value: ChartView; onChange: (v: ChartView) => void }) {
  return (
    <Box sx={{ display: 'inline-flex', bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 2, p: 0.4, gap: 0.25 }}>
      {VIEWS.map((v) => {
        const active = v.value === value;
        return (
          <Box key={v.value} component="button" onClick={() => onChange(v.value)}
            sx={{
              border: 'none', cursor: 'pointer', px: 1.5, py: 0.5, borderRadius: 1.5,
              fontSize: 12, fontWeight: active ? 600 : 400, transition: 'all 0.15s ease',
              bgcolor: active ? 'background.paper' : 'transparent',
              color: active ? T.red : 'text.secondary',
              boxShadow: active ? T.shadow : 'none',
            }}>
            {v.label}
          </Box>
        );
      })}
    </Box>
  );
}

// ─── Progress legend row ─────────────────────────────────────────────────────
function LegendRow({ label, value, total, color, extra }:
  { label: string; value: number; total: number; color: string; extra?: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <Box sx={{ mb: 1.5 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
          <Typography variant="caption" sx={{ textTransform: 'capitalize', fontWeight: 500 }}>{label}</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          {extra && <Typography variant="caption" color="text.disabled">{extra}</Typography>}
          <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', minWidth: 24, textAlign: 'right' }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 38, textAlign: 'right' }}>{pct.toFixed(0)}%</Typography>
        </Box>
      </Box>
      <LinearProgress variant="determinate" value={pct}
        sx={{ height: 4, borderRadius: 2, bgcolor: `${color}18`,
          '& .MuiLinearProgress-bar': { bgcolor: color, borderRadius: 2 } }} />
    </Box>
  );
}

// ─── Loading skeleton ─────────────────────────────────────────────────────────
function Skeleton({ h = 120 }: { h?: number }) {
  return <Box sx={{ height: h, borderRadius: T.radius, bgcolor: 'rgba(0,0,0,0.05)',
    '@keyframes pulse': { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.4 } },
    animation: 'pulse 1.6s ease-in-out infinite' }} />;
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function AnalyticsPage() {
  const [data, setData]         = useState<AnalyticsData | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [chartView, setChartView] = useState<ChartView>('monthly');
  const [gpView, setGpView] = useState<'total' | 'week' | 'month' | 'year' | 'custom'>('total');
  const [profitView, setProfitView] = useState<'unit' | 'all' | 'website'>('unit');
  const [customFrom, setCustomFrom]   = useState('');
  const [customTo,   setCustomTo]     = useState('');
  const [customKpis, setCustomKpis]   = useState<CustomRangeKpis | null>(null);
  const [customLoading, setCustomLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load analytics'); setLoading(false); });
  }, []);

  useEffect(() => {
    if (gpView !== 'custom' || !customFrom || !customTo || customFrom > customTo) return;
    setCustomLoading(true);
    setCustomKpis(null);
    fetch(`/api/admin/analytics/range?from=${customFrom}&to=${customTo}`)
      .then((r) => r.json())
      .then((d) => { setCustomKpis(d); setCustomLoading(false); })
      .catch(() => setCustomLoading(false));
  }, [gpView, customFrom, customTo]);

  // ── Loading skeleton layout ─────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400 }}>
        <Box sx={{ mb: 2 }}><Skeleton h={24} /></Box>
        <Skeleton h={100} />
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={1.5} sx={{ mb: 2 }}>
            {[0,1,2,3].map((i) => <Grid key={i} size={{ xs: 6, md: 3 }}><Skeleton h={90} /></Grid>)}
          </Grid>
        </Box>
        <Skeleton h={220} />
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}><Skeleton h={220} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Skeleton h={220} /></Grid>
          </Grid>
        </Box>
      </Box>
    );
  }

  if (error || !data) {
    return (
      <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
        <Typography color="error" fontWeight={500}>{error || 'No data available'}</Typography>
      </Box>
    );
  }

  const { kpis, annualRevenue, monthlyRevenue, weeklyRevenue, dailyRevenue,
          categoryBreakdown, statusBreakdown, topProducts, regionBreakdown,
          productUnitProfit, productOrderProfit, productWebsiteProfit } = data;

  const catTotal    = categoryBreakdown.reduce((s, c) => s + c.count, 0);
  const statusTotal = statusBreakdown.reduce((s, c) => s + c.count, 0);
  const maxProductQty = Math.max(...topProducts.map((p) => p.quantity), 1);

  const weekMargin  = kpis.thisWeekRevenue  > 0 ? Math.round(kpis.thisWeekGrossProfit  / kpis.thisWeekRevenue  * 1000) / 10 : 0;
  const monthMargin = kpis.thisMonthRevenue > 0 ? Math.round(kpis.thisMonthGrossProfit / kpis.thisMonthRevenue * 1000) / 10 : 0;
  const yearMargin  = kpis.thisYearRevenue  > 0 ? Math.round(kpis.thisYearGrossProfit  / kpis.thisYearRevenue  * 1000) / 10 : 0;

  const chartData: ChartPoint[] =
    chartView === 'annual'  ? annualRevenue  :
    chartView === 'monthly' ? monthlyRevenue :
    chartView === 'weekly'  ? weeklyRevenue  : dailyRevenue;

  const isDense    = chartView === 'daily' || chartView === 'weekly';
  const chartSub   =
    chartView === 'annual'  ? 'All-time by year'                                   :
    chartView === 'monthly' ? `Jan – Dec ${new Date().getFullYear()}`               :
    chartView === 'weekly'  ? 'Last 12 weeks'                                      :
                              `${new Date().toLocaleString('en-US',{month:'long'})} ${new Date().getFullYear()}`;

  const now = new Date().getMonth(); // current month index for table highlight

  return (
    <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400, mx: 'auto' }}>

      {/* ── Page header ─────────────────────────────────────────────────────── */}
      <Box sx={{ mb: 3 }}>
        <Typography fontWeight={800} fontSize={22} lineHeight={1.2}>Analytics</Typography>
        <Typography variant="caption" color="text.secondary">
          {new Date().toLocaleString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </Typography>
      </Box>

      {/* ── KPI Section (all periods) ─────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 1.5, borderBottom: `1px solid ${T.border}`,
          display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between', gap: 1.5 }}>
          <Box>
            <Typography fontWeight={600} fontSize={14}>Performance Overview</Typography>
            <Typography variant="caption" color="text.secondary">
              {gpView === 'total'  ? 'All-time totals' :
               gpView === 'week'   ? 'This week vs last week' :
               gpView === 'month'  ? 'This month vs last month' :
               gpView === 'year'   ? `${new Date().getFullYear()} vs ${new Date().getFullYear() - 1}` :
               customFrom && customTo && customFrom <= customTo
                 ? `${customFrom} – ${customTo}`
                 : 'Select a date range'}
            </Typography>
          </Box>
          <Select
            value={gpView}
            size="small"
            onChange={(e) => setGpView(e.target.value as typeof gpView)}
            sx={{ fontSize: 13, minWidth: { xs: '100%', sm: 170 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border } }}
          >
            <MenuItem value="total">Total (All-time)</MenuItem>
            <MenuItem value="week">This Week</MenuItem>
            <MenuItem value="month">This Month</MenuItem>
            <MenuItem value="year">This Year</MenuItem>
            <MenuItem value="custom">Custom Range</MenuItem>
          </Select>
        </Box>
        <Box sx={{ p: { xs: 1.5, sm: 2.5 } }}>
          <Grid container spacing={{ xs: 1.5, sm: 2 }}>
            {gpView === 'total' && (<>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<AttachMoney fontSize="small" />} accent={T.red}
                  label="Total Revenue" value={fmtUSD(kpis.totalRevenue)}
                  sub={`${kpis.totalOrders} orders all-time`} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<ShoppingCart fontSize="small" />} accent={T.blue}
                  label="Total Orders" value={String(kpis.totalOrders)}
                  sub="All orders ever placed" />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<TrendingUp fontSize="small" />} accent={T.green}
                  label="Total Gross Profit" value={fmtUSD(kpis.totalGrossProfit)}
                  sub={`${kpis.grossMargin}% margin`} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<Inventory2 fontSize="small" />} accent={T.purple}
                  label="Gross Margin" value={`${kpis.grossMargin}%`}
                  sub={`Avg order: ${fmtUSD(kpis.avgOrderValue)}`} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<TrendingUp fontSize="small" />} accent={T.amber}
                  label="Avg Order Value" value={fmtUSD(kpis.avgOrderValue)}
                  sub={`${kpis.totalOrders} total orders`} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<LocalShipping fontSize="small" />} accent={T.cyan}
                  label="Delivery Rate" value={`${kpis.deliveryRate}%`}
                  sub={`Top category: ${kpis.topCategory}`} />
              </Grid>
            </>)}

            {gpView === 'week' && (<>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<AttachMoney fontSize="small" />} accent={T.red}
                  label="This Week Revenue" value={fmtUSD(kpis.thisWeekRevenue)}
                  sub={`Last week: ${fmtUSD(kpis.lastWeekRevenue)}`} change={kpis.weekRevenueChange} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<ShoppingCart fontSize="small" />} accent={T.blue}
                  label="This Week Orders" value={String(kpis.thisWeekOrders)}
                  sub={`Last week: ${kpis.lastWeekOrders} orders`} change={kpis.weekOrdersChange} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<TrendingUp fontSize="small" />} accent={T.green}
                  label="This Week Gross Profit" value={fmtUSD(kpis.thisWeekGrossProfit)}
                  sub={`Last week: ${fmtUSD(kpis.lastWeekGrossProfit)}`} change={kpis.weekGPChange} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<Inventory2 fontSize="small" />} accent={T.purple}
                  label="Gross Margin" value={`${weekMargin}%`}
                  sub={`Revenue: ${fmtUSD(kpis.thisWeekRevenue)}`} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<TrendingUp fontSize="small" />} accent={T.amber}
                  label="Avg Order Value" value={fmtUSD(kpis.thisWeekOrders > 0 ? kpis.thisWeekRevenue / kpis.thisWeekOrders : 0)}
                  sub={`${kpis.thisWeekOrders} orders this week`} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<LocalShipping fontSize="small" />} accent={T.cyan}
                  label="Delivery Rate" value={`${kpis.deliveryRate}%`}
                  sub={`Top category: ${kpis.topCategory}`} />
              </Grid>
            </>)}

            {gpView === 'month' && (<>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<AttachMoney fontSize="small" />} accent={T.red}
                  label="This Month Revenue" value={fmtUSD(kpis.thisMonthRevenue)}
                  sub={`Last month: ${fmtUSD(kpis.lastMonthRevenue)}`} change={kpis.revenueChange} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<ShoppingCart fontSize="small" />} accent={T.blue}
                  label="This Month Orders" value={String(kpis.thisMonthOrders)}
                  sub={`Last month: ${kpis.lastMonthOrders} orders`} change={kpis.ordersChange} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<TrendingUp fontSize="small" />} accent={T.green}
                  label="This Month Gross Profit" value={fmtUSD(kpis.thisMonthGrossProfit)}
                  sub={`Last month: ${fmtUSD(kpis.lastMonthGrossProfit)}`} change={kpis.monthGPChange} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<Inventory2 fontSize="small" />} accent={T.purple}
                  label="Gross Margin" value={`${monthMargin}%`}
                  sub={`Revenue: ${fmtUSD(kpis.thisMonthRevenue)}`} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<TrendingUp fontSize="small" />} accent={T.amber}
                  label="Avg Order Value" value={fmtUSD(kpis.thisMonthOrders > 0 ? kpis.thisMonthRevenue / kpis.thisMonthOrders : 0)}
                  sub={`${kpis.thisMonthOrders} orders this month`} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<LocalShipping fontSize="small" />} accent={T.cyan}
                  label="Delivery Rate" value={`${kpis.deliveryRate}%`}
                  sub={`Top category: ${kpis.topCategory}`} />
              </Grid>
            </>)}

            {gpView === 'year' && (<>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<AttachMoney fontSize="small" />} accent={T.red}
                  label={`${new Date().getFullYear()} Revenue`} value={fmtUSD(kpis.thisYearRevenue)}
                  sub={`Last year: ${fmtUSD(kpis.lastYearRevenue)}`} change={kpis.yearRevenueChange} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<ShoppingCart fontSize="small" />} accent={T.blue}
                  label={`${new Date().getFullYear()} Orders`} value={String(kpis.thisYearOrders)}
                  sub={`Last year: ${kpis.lastYearOrders} orders`} change={kpis.yearOrdersChange} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<TrendingUp fontSize="small" />} accent={T.green}
                  label={`${new Date().getFullYear()} Gross Profit`} value={fmtUSD(kpis.thisYearGrossProfit)}
                  sub={`Last year: ${fmtUSD(kpis.lastYearGrossProfit)}`} change={kpis.yearGPChange} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<Inventory2 fontSize="small" />} accent={T.purple}
                  label="Gross Margin" value={`${yearMargin}%`}
                  sub={`Revenue: ${fmtUSD(kpis.thisYearRevenue)}`} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<TrendingUp fontSize="small" />} accent={T.amber}
                  label="Avg Order Value" value={fmtUSD(kpis.thisYearOrders > 0 ? kpis.thisYearRevenue / kpis.thisYearOrders : 0)}
                  sub={`${kpis.thisYearOrders} orders this year`} />
              </Grid>
              <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                <KpiCard icon={<LocalShipping fontSize="small" />} accent={T.cyan}
                  label="Delivery Rate" value={`${kpis.deliveryRate}%`}
                  sub={`Top category: ${kpis.topCategory}`} />
              </Grid>
            </>)}

            {gpView === 'custom' && (
              <>
                <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
                  <TextField
                    type="date" label="From" size="small" value={customFrom}
                    onChange={(e) => setCustomFrom(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 140, flex: { xs: 1, sm: 'none' } }}
                  />
                  <TextField
                    type="date" label="To" size="small" value={customTo}
                    onChange={(e) => setCustomTo(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    sx={{ minWidth: 140, flex: { xs: 1, sm: 'none' } }}
                    inputProps={{ min: customFrom || undefined }}
                  />
                </Box>
                {customLoading && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
                    <CircularProgress size={28} sx={{ color: T.red }} />
                  </Box>
                )}
                {!customLoading && !customKpis && (
                  <Typography variant="caption" color="text.disabled"
                    sx={{ display: 'block', textAlign: 'center', py: 3 }}>
                    {!customFrom || !customTo
                      ? 'Pick a start and end date above.'
                      : customFrom > customTo
                      ? 'End date must be on or after start date.'
                      : 'Loading…'}
                  </Typography>
                )}
                {!customLoading && customKpis && (
                  <Grid container spacing={2}>
                    <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                      <KpiCard icon={<AttachMoney fontSize="small" />} accent={T.red}
                        label="Revenue" value={fmtUSD(customKpis.totalRevenue)}
                        sub={`${customKpis.totalOrders} orders in range`} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                      <KpiCard icon={<ShoppingCart fontSize="small" />} accent={T.blue}
                        label="Orders" value={String(customKpis.totalOrders)}
                        sub={`${customFrom} – ${customTo}`} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                      <KpiCard icon={<TrendingUp fontSize="small" />} accent={T.green}
                        label="Gross Profit" value={fmtUSD(customKpis.totalGrossProfit)}
                        sub={`${customKpis.grossMargin}% margin`} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                      <KpiCard icon={<Inventory2 fontSize="small" />} accent={T.purple}
                        label="Gross Margin" value={`${customKpis.grossMargin}%`}
                        sub={`Revenue: ${fmtUSD(customKpis.totalRevenue)}`} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                      <KpiCard icon={<TrendingUp fontSize="small" />} accent={T.amber}
                        label="Avg Order Value" value={fmtUSD(customKpis.avgOrderValue)}
                        sub={`${customKpis.totalOrders} orders`} />
                    </Grid>
                    <Grid size={{ xs: 6, sm: 6, md: 3 }}>
                      <KpiCard icon={<LocalShipping fontSize="small" />} accent={T.cyan}
                        label="Delivery Rate" value={`${customKpis.deliveryRate}%`}
                        sub="Delivered vs total" />
                    </Grid>
                  </Grid>
                )}
              </>
            )}
          </Grid>
        </Box>
      </Card>

      {/* ── Revenue & Orders Chart ──────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 1.5, borderBottom: `1px solid ${T.border}`,
          display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between', gap: 1.5 }}>
          <Box>
            <Typography fontWeight={600} fontSize={14}>Revenue &amp; Orders</Typography>
            <Typography variant="caption" color="text.secondary">{chartSub}</Typography>
          </Box>
          <ViewTabs value={chartView} onChange={setChartView} />
        </Box>
        <Box sx={{ px: { xs: 0.5, sm: 2 }, pt: 2, pb: 1 }}>
          <Box sx={{ height: { xs: 200, sm: 300 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: isDense ? 16 : 4 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.red} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={T.red} stopOpacity={0}    />
                </linearGradient>
                <linearGradient id="profitGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.green} stopOpacity={0.12} />
                  <stop offset="95%" stopColor={T.green} stopOpacity={0}    />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke={T.grid} vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false}
                interval={0} angle={isDense ? -35 : 0}
                textAnchor={isDense ? 'end' : 'middle'}
                height={isDense ? 52 : 24} tickMargin={isDense ? 4 : 2} />
              <YAxis yAxisId="rev" orientation="left" tickFormatter={fmtK}
                tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} width={52} />
              <YAxis yAxisId="ord" orientation="right"
                tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<RevenueTooltip />} cursor={{ stroke: T.border, strokeWidth: 1 }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
                formatter={(v) => <span style={{ color: '#555', fontWeight: 500 }}>{v}</span>} />
              <Area yAxisId="rev" type="monotone" dataKey="revenue" name="Revenue"
                fill="url(#revenueGrad)" stroke={T.red} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: T.red }} />
              <Area yAxisId="rev" type="monotone" dataKey="grossProfit" name="Gross Profit"
                fill="url(#profitGrad)" stroke={T.green} strokeWidth={2} dot={false} strokeDasharray="4 2" activeDot={{ r: 4, fill: T.green }} />
              <Bar yAxisId="ord" dataKey="orders" name="Orders"
                fill={T.blue} fillOpacity={0.65} radius={[3, 3, 0, 0]} barSize={14} />
            </ComposedChart>
          </ResponsiveContainer>
          </Box>
        </Box>
      </Card>

      {/* ── Donut charts row ────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>

        {/* Category */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <SectionHeader title="Sales by Category" sub={`${catTotal} units total`} />
            <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: 2 }}>
              <Box sx={{ flexShrink: 0 }}>
                <ResponsiveContainer width={148} height={148}>
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="count" nameKey="category"
                      innerRadius={44} outerRadius={70} paddingAngle={3} startAngle={90} endAngle={-270}>
                      {categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <DonutLabel total={catTotal} label="units" />
                    <Tooltip content={<PieTooltip total={catTotal} unit="units" />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
                {categoryBreakdown.map((c, i) => (
                  <LegendRow key={c.category} label={c.category} value={c.count}
                    total={catTotal} color={PIE_COLORS[i % PIE_COLORS.length]}
                    extra={fmtUSD(c.revenue)} />
                ))}
              </Box>
            </Box>
          </Card>
        </Grid>

        {/* Status */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <SectionHeader title="Order Status" sub={`${statusTotal} orders total`} />
            <Box sx={{ p: { xs: 2, sm: 3 }, display: 'flex',
              flexDirection: { xs: 'column', sm: 'row' }, alignItems: { xs: 'center', sm: 'flex-start' }, gap: 2 }}>
              <Box sx={{ flexShrink: 0 }}>
                <ResponsiveContainer width={148} height={148}>
                  <PieChart>
                    <Pie data={statusBreakdown} dataKey="count" nameKey="status"
                      innerRadius={44} outerRadius={70} paddingAngle={3} startAngle={90} endAngle={-270}>
                      {statusBreakdown.map((s, i) => (
                        <Cell key={i} fill={STATUS_COLOR[s.status] ?? PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <DonutLabel total={statusTotal} label="orders" />
                    <Tooltip content={<PieTooltip total={statusTotal} unit="orders" />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ flex: 1, width: '100%', minWidth: 0 }}>
                {statusBreakdown.map((s, i) => (
                  <LegendRow key={s.status} label={s.status} value={s.count}
                    total={statusTotal} color={STATUS_COLOR[s.status] ?? PIE_COLORS[i % PIE_COLORS.length]} />
                ))}
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* ── Top Products ─────────────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <SectionHeader title="Top 10 Products" sub="Ranked by units sold" />
        <Box sx={{ p: { xs: 2, sm: 3 } }}>
          {topProducts.map((p, i) => (
            <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: i < topProducts.length - 1 ? 1.5 : 0 }}>
              <Typography sx={{ minWidth: 20, fontSize: 11, fontWeight: 700, color: i < 3 ? T.red : 'text.disabled',
                fontVariantNumeric: 'tabular-nums', textAlign: 'right', flexShrink: 0 }}>
                #{i + 1}
              </Typography>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={500} noWrap sx={{ maxWidth: '65%', fontSize: { xs: 11, sm: 12 } }}
                    title={p.fullName}>{p.name}</Typography>
                  <Box sx={{ display: 'flex', gap: { xs: 1, sm: 2 }, flexShrink: 0 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums', fontSize: { xs: 11, sm: 12 } }}>
                      {p.quantity} units
                    </Typography>
                    <Typography variant="caption" color="text.secondary"
                      sx={{ fontVariantNumeric: 'tabular-nums', display: { xs: 'none', sm: 'block' } }}>
                      {fmtUSD(p.revenue)}
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress variant="determinate" value={(p.quantity / maxProductQty) * 100}
                  sx={{ height: 5, borderRadius: 3, bgcolor: `${T.red}12`,
                    '& .MuiLinearProgress-bar': { bgcolor: i < 3 ? T.red : T.blue, borderRadius: 3 } }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Card>

      {/* ── Product Profitability ────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ px: { xs: 2, sm: 3 }, pt: 2, pb: 1.5, borderBottom: `1px solid ${T.border}`,
          display: 'flex', flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'flex-start', sm: 'center' },
          justifyContent: 'space-between', gap: 1.5 }}>
          <Box>
            <Typography fontWeight={600} fontSize={14}>Product Profitability</Typography>
            <Typography variant="caption" color="text.secondary">
              {profitView === 'unit'    ? 'Gross profit per unit sold — current prices' :
               profitView === 'all'    ? 'Total gross profit generated across all orders' :
                                         'Total gross profit from website orders only'}
            </Typography>
          </Box>
          <Select value={profitView} size="small"
            onChange={(e) => setProfitView(e.target.value as typeof profitView)}
            sx={{ fontSize: 13, minWidth: { xs: '100%', sm: 210 }, '& .MuiOutlinedInput-notchedOutline': { borderColor: T.border } }}>
            <MenuItem value="unit">Per Unit Profit</MenuItem>
            <MenuItem value="all">Total — All Orders</MenuItem>
            <MenuItem value="website">Total — Website Orders</MenuItem>
          </Select>
        </Box>
        <Box sx={{ overflowX: 'auto' }}>
          {profitView === 'unit' ? (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  {['#', 'Product', 'My Cost', 'Sale Price', 'Profit / Unit', 'Margin'].map((h, i) => (
                    <TableCell key={h} align={i === 0 ? 'center' : i > 1 ? 'right' : 'left'}
                      sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.5, color: 'text.secondary',
                        textTransform: 'uppercase', py: 1.5, borderColor: T.border, whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {productUnitProfit.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center"
                      sx={{ py: 4, color: 'text.disabled', fontSize: 13, borderColor: T.border }}>
                      No products with cost price set. Add cost prices to your products to see profitability.
                    </TableCell>
                  </TableRow>
                ) : productUnitProfit.map((p, i) => (
                  <TableRow key={p.fullName} hover sx={{ '&:last-child td': { border: 0 } }}>
                    <TableCell align="center"
                      sx={{ fontSize: 12, fontWeight: 700, color: i < 3 ? T.red : 'text.disabled', borderColor: T.border, width: 40 }}>
                      {i + 1}
                    </TableCell>
                    <TableCell sx={{ fontSize: 13, borderColor: T.border, maxWidth: 220 }}>
                      <Typography variant="caption" fontWeight={500} noWrap title={p.fullName}>{p.name}</Typography>
                      <Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: 10, textTransform: 'capitalize' }}>{p.category}</Typography>
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 13, color: 'text.secondary', fontVariantNumeric: 'tabular-nums', borderColor: T.border }}>
                      {fmtUSD(p.costPrice)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', borderColor: T.border }}>
                      {fmtUSD(p.salePrice)}
                    </TableCell>
                    <TableCell align="right"
                      sx={{ fontSize: 13, fontWeight: 700, color: T.green, fontVariantNumeric: 'tabular-nums', borderColor: T.border }}>
                      +{fmtUSD(p.unitProfit)}
                    </TableCell>
                    <TableCell align="right" sx={{ borderColor: T.border }}>
                      <Chip label={`${p.margin}%`} size="small"
                        sx={{ bgcolor: `${T.green}18`, color: T.green, fontWeight: 700, fontSize: 11, height: 20 }} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                  {['#', 'Product', 'Units Sold', 'Revenue', 'Gross Profit'].map((h, i) => (
                    <TableCell key={h} align={i === 0 ? 'center' : i > 1 ? 'right' : 'left'}
                      sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.5, color: 'text.secondary',
                        textTransform: 'uppercase', py: 1.5, borderColor: T.border, whiteSpace: 'nowrap' }}>
                      {h}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {(() => {
                  const rows = profitView === 'all' ? productOrderProfit : productWebsiteProfit;
                  if (rows.length === 0) return (
                    <TableRow>
                      <TableCell colSpan={5} align="center"
                        sx={{ py: 4, color: 'text.disabled', fontSize: 13, borderColor: T.border }}>
                        No gross profit data yet. Make sure products have cost prices set.
                      </TableCell>
                    </TableRow>
                  );
                  return rows.map((p, i) => (
                    <TableRow key={p.fullName} hover sx={{ '&:last-child td': { border: 0 } }}>
                      <TableCell align="center"
                        sx={{ fontSize: 12, fontWeight: 700, color: i < 3 ? T.red : 'text.disabled', borderColor: T.border, width: 40 }}>
                        {i + 1}
                      </TableCell>
                      <TableCell sx={{ fontSize: 13, borderColor: T.border, maxWidth: 220 }}>
                        <Typography variant="caption" fontWeight={500} noWrap title={p.fullName}>{p.name}</Typography>
                        <Typography variant="caption" display="block" color="text.disabled" sx={{ fontSize: 10, textTransform: 'capitalize' }}>{p.category}</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', borderColor: T.border }}>
                        {p.quantity}
                      </TableCell>
                      <TableCell align="right" sx={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'text.secondary', borderColor: T.border }}>
                        {fmtUSD(p.revenue)}
                      </TableCell>
                      <TableCell align="right"
                        sx={{ fontSize: 13, fontWeight: 700, color: T.green, fontVariantNumeric: 'tabular-nums', borderColor: T.border }}>
                        {fmtUSD(p.grossProfit)}
                      </TableCell>
                    </TableRow>
                  ));
                })()}
              </TableBody>
            </Table>
          )}
        </Box>
      </Card>

      {/* ── Region chart ─────────────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <SectionHeader title="Orders by Region" sub="Top 10 delivery areas" />
        <Box sx={{ px: { xs: 0.5, sm: 2 }, pt: 2, pb: 1 }}>
          <Box sx={{ height: { xs: 180, sm: 240 } }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={regionBreakdown} margin={{ top: 4, right: 16, left: 0, bottom: 28 }}>
              <defs>
                <linearGradient id="regionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%"   stopColor={T.red} stopOpacity={0.9} />
                  <stop offset="100%" stopColor={T.red} stopOpacity={0.5} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="0" stroke={T.grid} vertical={false} />
              <XAxis dataKey="region" tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false}
                angle={-28} textAnchor="end" interval={0} height={44} />
              <YAxis tick={{ fontSize: 11, fill: '#888' }} axisLine={false} tickLine={false} width={28} />
              <Tooltip
                formatter={(v, name) => [v, name === 'count' ? 'Orders' : 'Revenue']}
                contentStyle={{ borderRadius: 8, border: `1px solid ${T.border}`, boxShadow: T.shadowMd, fontSize: 12 }}
                cursor={{ fill: 'rgba(0,0,0,0.03)' }}
              />
              <Bar dataKey="count" name="Orders" fill="url(#regionGrad)" radius={[4, 4, 0, 0]} barSize={32}>
                <LabelList dataKey="count" position="top" style={{ fontSize: 10, fill: '#666', fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          </Box>
        </Box>
      </Card>

      {/* ── Monthly summary table ─────────────────────────────────────────────── */}
      <Card>
        <SectionHeader title="Monthly Summary" sub={`${new Date().getFullYear()} breakdown`} />
        <Box sx={{ overflowX: 'auto' }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: 'rgba(0,0,0,0.02)' }}>
                {['Month','Revenue','Orders','Avg / Order'].map((h, i) => (
                  <TableCell key={h} align={i > 0 ? 'right' : 'left'}
                    sx={{ fontWeight: 700, fontSize: 11, letterSpacing: 0.5, color: 'text.secondary',
                      textTransform: 'uppercase', py: { xs: 1, sm: 1.5 }, px: { xs: 1.5, sm: 2 }, borderColor: T.border,
                      display: h === 'Avg / Order' ? { xs: 'none', sm: 'table-cell' } : undefined }}>
                    {h}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {[...monthlyRevenue].reverse().map((row, i) => {
                const isCurrentMonth = (11 - i) === now;
                return (
                  <TableRow key={row.label} hover
                    sx={{ bgcolor: isCurrentMonth ? `${T.red}06` : undefined,
                      '&:last-child td': { border: 0 } }}>
                    <TableCell sx={{ fontSize: { xs: 12, sm: 13 }, fontWeight: isCurrentMonth ? 700 : 400,
                      borderColor: T.border, color: isCurrentMonth ? T.red : undefined,
                      px: { xs: 1.5, sm: 2 }, py: { xs: 1, sm: 1.25 } }}>
                      {row.label}
                      {isCurrentMonth && (
                        <Chip label="now" size="small"
                          sx={{ ml: 1, height: 16, fontSize: 10, bgcolor: T.redSoft, color: T.red }} />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: 12, sm: 13 }, fontWeight: 600,
                      fontVariantNumeric: 'tabular-nums', borderColor: T.border, px: { xs: 1.5, sm: 2 } }}>
                      {fmtUSD(row.revenue)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: 12, sm: 13 },
                      fontVariantNumeric: 'tabular-nums', borderColor: T.border, px: { xs: 1.5, sm: 2 } }}>
                      {row.orders}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: { xs: 12, sm: 13 },
                      fontVariantNumeric: 'tabular-nums', color: 'text.secondary', borderColor: T.border,
                      px: { xs: 1.5, sm: 2 }, display: { xs: 'none', sm: 'table-cell' } }}>
                      {row.orders > 0 ? fmtUSD(row.revenue / row.orders) : '—'}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Box>
      </Card>

    </Box>
  );
}
