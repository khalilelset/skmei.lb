'use client';

import { useState, useEffect } from 'react';
import {
  Box, Typography, Grid, Paper, CircularProgress,
  Table, TableHead, TableBody, TableRow, TableCell,
  Chip, Divider, LinearProgress,
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
interface ChartPoint    { label: string; revenue: number; orders: number }
interface CategoryPoint { category: string; count: number; revenue: number }
interface StatusPoint   { status: string; count: number }
interface ProductPoint  { name: string; fullName: string; quantity: number; revenue: number; category: string }
interface RegionPoint   { region: string; count: number; revenue: number }

interface KPIs {
  totalRevenue: number; avgOrderValue: number; topCategory: string;
  deliveryRate: number; totalOrders: number;
  thisMonthRevenue: number; thisMonthOrders: number;
  lastMonthRevenue: number; lastMonthOrders: number;
  revenueChange: number | null; ordersChange: number | null;
}

interface AnalyticsData {
  annualRevenue: ChartPoint[]; monthlyRevenue: ChartPoint[];
  weeklyRevenue: ChartPoint[];  dailyRevenue: ChartPoint[];
  categoryBreakdown: CategoryPoint[]; topProducts: ProductPoint[];
  statusBreakdown: StatusPoint[];     regionBreakdown: RegionPoint[];
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
    <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${T.border}` }}>
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
      <Box sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ p: 1, borderRadius: T.radiusSm, bgcolor: `${accent}18`, color: accent, display: 'flex', lineHeight: 0 }}>
            {icon}
          </Box>
          {change !== undefined && <TrendBadge value={change ?? null} />}
        </Box>
        <Typography fontWeight={800} fontSize={26} lineHeight={1} sx={{ fontVariantNumeric: 'tabular-nums', mb: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
        {sub && (
          <Typography variant="caption" display="block" color="text.disabled" sx={{ mt: 0.5, fontSize: 11 }}>{sub}</Typography>
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

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setError('Failed to load analytics'); setLoading(false); });
  }, []);

  // ── Loading skeleton layout ─────────────────────────────────────────────────
  if (loading) {
    return (
      <Box sx={{ p: { xs: 2, sm: 3 }, maxWidth: 1400 }}>
        <Box sx={{ mb: 1 }}><Skeleton h={28} /></Box>
        <Grid container spacing={2} sx={{ mb: 3 }}>
          {[0,1,2,3].map((i) => <Grid key={i} size={{ xs: 12, sm: 6, md: 3 }}><Skeleton h={120} /></Grid>)}
        </Grid>
        <Skeleton h={320} />
        <Box sx={{ mt: 2 }}>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, md: 6 }}><Skeleton h={260} /></Grid>
            <Grid size={{ xs: 12, md: 6 }}><Skeleton h={260} /></Grid>
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
          categoryBreakdown, statusBreakdown, topProducts, regionBreakdown } = data;

  const catTotal    = categoryBreakdown.reduce((s, c) => s + c.count, 0);
  const statusTotal = statusBreakdown.reduce((s, c) => s + c.count, 0);
  const maxProductQty = Math.max(...topProducts.map((p) => p.quantity), 1);

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

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            icon={<AttachMoney fontSize="small" />}
            accent={T.red}
            label="This Month Revenue"
            value={fmtUSD(kpis.thisMonthRevenue)}
            sub={`Last month: ${fmtUSD(kpis.lastMonthRevenue)}`}
            change={kpis.revenueChange}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            icon={<ShoppingCart fontSize="small" />}
            accent={T.blue}
            label="This Month Orders"
            value={String(kpis.thisMonthOrders)}
            sub={`Last month: ${kpis.lastMonthOrders} orders`}
            change={kpis.ordersChange}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            icon={<TrendingUp fontSize="small" />}
            accent={T.green}
            label="Avg Order Value"
            value={fmtUSD(kpis.avgOrderValue)}
            sub={`${kpis.totalOrders} total orders all-time`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <KpiCard
            icon={<LocalShipping fontSize="small" />}
            accent={T.amber}
            label="Delivery Rate"
            value={`${kpis.deliveryRate}%`}
            sub={`Top category: ${kpis.topCategory}`}
          />
        </Grid>
      </Grid>

      {/* ── Revenue & Orders Chart ──────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <Box sx={{ px: 3, pt: 2.5, pb: 2, borderBottom: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 1.5 }}>
          <Box>
            <Typography fontWeight={600} fontSize={14}>Revenue &amp; Orders</Typography>
            <Typography variant="caption" color="text.secondary">{chartSub}</Typography>
          </Box>
          <ViewTabs value={chartView} onChange={setChartView} />
        </Box>
        <Box sx={{ px: 2, pt: 2.5, pb: 1.5 }}>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: isDense ? 16 : 4 }}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={T.red} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={T.red} stopOpacity={0}    />
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
              <Bar yAxisId="ord" dataKey="orders" name="Orders"
                fill={T.blue} fillOpacity={0.65} radius={[3, 3, 0, 0]} barSize={14} />
            </ComposedChart>
          </ResponsiveContainer>
        </Box>
      </Card>

      {/* ── Donut charts row ────────────────────────────────────────────────── */}
      <Grid container spacing={2} sx={{ mb: 3 }}>

        {/* Category */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ height: '100%' }}>
            <SectionHeader title="Sales by Category" sub={`${catTotal} units total`} />
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flexShrink: 0 }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={categoryBreakdown} dataKey="count" nameKey="category"
                      innerRadius={48} outerRadius={76} paddingAngle={3} startAngle={90} endAngle={-270}>
                      {categoryBreakdown.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <DonutLabel total={catTotal} label="units" />
                    <Tooltip content={<PieTooltip total={catTotal} unit="units" />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ flex: 1, minWidth: 160 }}>
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
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
              <Box sx={{ flexShrink: 0 }}>
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie data={statusBreakdown} dataKey="count" nameKey="status"
                      innerRadius={48} outerRadius={76} paddingAngle={3} startAngle={90} endAngle={-270}>
                      {statusBreakdown.map((s, i) => (
                        <Cell key={i} fill={STATUS_COLOR[s.status] ?? PIE_COLORS[i % PIE_COLORS.length]} stroke="none" />
                      ))}
                    </Pie>
                    <DonutLabel total={statusTotal} label="orders" />
                    <Tooltip content={<PieTooltip total={statusTotal} unit="orders" />} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
              <Box sx={{ flex: 1, minWidth: 160 }}>
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
        <Box sx={{ p: 3 }}>
          {topProducts.map((p, i) => (
            <Box key={p.name} sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: i < topProducts.length - 1 ? 2 : 0 }}>
              {/* Rank */}
              <Typography sx={{ minWidth: 22, fontSize: 12, fontWeight: 700, color: i < 3 ? T.red : 'text.disabled',
                fontVariantNumeric: 'tabular-nums', textAlign: 'right' }}>
                #{i + 1}
              </Typography>
              {/* Name + bar */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="caption" fontWeight={500} noWrap sx={{ maxWidth: '70%' }}
                    title={p.fullName}>{p.name}</Typography>
                  <Box sx={{ display: 'flex', gap: 2, flexShrink: 0 }}>
                    <Typography variant="caption" fontWeight={700} sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {p.quantity} units
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: 'tabular-nums' }}>
                      {fmtUSD(p.revenue)}
                    </Typography>
                  </Box>
                </Box>
                <LinearProgress variant="determinate" value={(p.quantity / maxProductQty) * 100}
                  sx={{ height: 6, borderRadius: 3, bgcolor: `${T.red}12`,
                    '& .MuiLinearProgress-bar': { bgcolor: i < 3 ? T.red : T.blue, borderRadius: 3 } }} />
              </Box>
            </Box>
          ))}
        </Box>
      </Card>

      {/* ── Region chart ─────────────────────────────────────────────────────── */}
      <Card sx={{ mb: 3 }}>
        <SectionHeader title="Orders by Region" sub="Top 10 delivery areas" />
        <Box sx={{ px: 2, pt: 2, pb: 1 }}>
          <ResponsiveContainer width="100%" height={240}>
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
                      textTransform: 'uppercase', py: 1.5, borderColor: T.border }}>
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
                    <TableCell sx={{ fontSize: 13, fontWeight: isCurrentMonth ? 700 : 400,
                      borderColor: T.border, color: isCurrentMonth ? T.red : undefined }}>
                      {row.label}
                      {isCurrentMonth && (
                        <Chip label="current" size="small"
                          sx={{ ml: 1, height: 16, fontSize: 10, bgcolor: T.redSoft, color: T.red }} />
                      )}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 13, fontWeight: 600, fontVariantNumeric: 'tabular-nums', borderColor: T.border }}>
                      {fmtUSD(row.revenue)}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', borderColor: T.border }}>
                      {row.orders}
                    </TableCell>
                    <TableCell align="right" sx={{ fontSize: 13, fontVariantNumeric: 'tabular-nums', color: 'text.secondary', borderColor: T.border }}>
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
