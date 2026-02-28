'use client';

import { useState, useEffect } from 'react';
import { Box, Typography, Grid, Button, Paper, Chip } from '@mui/material';
import {
  AttachMoney as RevenueIcon,
  ShoppingCart as OrdersIcon,
  People as CustomersIcon,
  Inventory as ProductsIcon,
  TrendingUp,
  ArrowForward,
} from '@mui/icons-material';
import Link from 'next/link';
import StatsCard from '@/components/admin/StatsCard';
import DataTable, { Column } from '@/components/admin/DataTable';
import { formatPrice, formatDate } from '@/lib/utils';

const statusColors: Record<string, { bg: string; text: string }> = {
  pending:    { bg: 'rgba(234, 179, 8, 0.1)',   text: '#CA8A04' },
  confirmed:  { bg: 'rgba(59, 130, 246, 0.1)',  text: '#3B82F6' },
  processing: { bg: 'rgba(168, 85, 247, 0.1)',  text: '#A855F7' },
  shipped:    { bg: 'rgba(99, 102, 241, 0.1)',  text: '#6366F1' },
  delivered:  { bg: 'rgba(34, 197, 94, 0.1)',   text: '#22C55E' },
  cancelled:  { bg: 'rgba(239, 68, 68, 0.1)',   text: '#EF4444' },
};

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  status: string;
  createdAt: string;
}

interface StatsData {
  totalRevenue: number;
  totalOrders: number;
  totalCustomers: number;
  totalProducts: number;
  recentOrders: RecentOrder[];
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<StatsData | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then(setStats)
      .catch(console.error);
  }, []);

  const recentOrdersColumns: Column[] = [
    {
      id: 'orderNumber',
      label: 'Order #',
      minWidth: 120,
      format: (value) => (
        <Typography sx={{ fontWeight: 600, color: '#DC2626' }}>{value}</Typography>
      ),
    },
    {
      id: 'customerName',
      label: 'Customer',
      minWidth: 160,
    },
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 120,
      format: (value) => formatDate(value),
    },
    {
      id: 'total',
      label: 'Total',
      minWidth: 100,
      align: 'right',
      format: (value) => (
        <Typography sx={{ fontWeight: 600 }}>{formatPrice(value)}</Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      align: 'center',
      sortable: false,
      format: (value) => {
        const sc = statusColors[value] ?? { bg: 'rgba(0,0,0,0.05)', text: '#6B7280' };
        return (
          <Chip
            label={value.charAt(0).toUpperCase() + value.slice(1)}
            size="small"
            sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 600, textTransform: 'capitalize' }}
          />
        );
      },
    },
  ];

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Dashboard Overview
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Welcome to your admin dashboard. Here&apos;s what&apos;s happening with your store.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Revenue"
            value={stats ? formatPrice(stats.totalRevenue) : '—'}
            change={0}
            icon={<RevenueIcon sx={{ fontSize: 28 }} />}
            iconBgColor="rgba(34, 197, 94, 0.1)"
            iconColor="#22C55E"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Orders"
            value={stats?.totalOrders ?? '—'}
            change={0}
            icon={<OrdersIcon sx={{ fontSize: 28 }} />}
            iconBgColor="rgba(59, 130, 246, 0.1)"
            iconColor="#3B82F6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Customers"
            value={stats?.totalCustomers ?? '—'}
            change={0}
            icon={<CustomersIcon sx={{ fontSize: 28 }} />}
            iconBgColor="rgba(168, 85, 247, 0.1)"
            iconColor="#A855F7"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Products"
            value={stats?.totalProducts ?? '—'}
            change={0}
            icon={<ProductsIcon sx={{ fontSize: 28 }} />}
            iconBgColor="rgba(220, 38, 38, 0.1)"
            iconColor="#DC2626"
          />
        </Grid>
      </Grid>

      {/* Recent Orders */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Recent Orders
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Latest orders from your store
            </Typography>
          </Box>
          <Button
            component={Link}
            href="/admin/orders"
            variant="outlined"
            endIcon={<ArrowForward />}
            sx={{
              borderColor: '#DC2626',
              color: '#DC2626',
              '&:hover': { borderColor: '#B91C1C', bgcolor: 'rgba(220, 38, 38, 0.04)' },
            }}
          >
            View All Orders
          </Button>
        </Box>
        <DataTable
          columns={recentOrdersColumns}
          data={stats?.recentOrders ?? []}
          emptyMessage="No orders yet."
        />
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              component={Link}
              href="/admin/orders"
              variant="contained"
              fullWidth
              startIcon={<OrdersIcon />}
              sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, py: 1.5 }}
            >
              Manage Orders
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              component={Link}
              href="/admin/products"
              variant="outlined"
              fullWidth
              startIcon={<ProductsIcon />}
              sx={{
                borderColor: '#DC2626',
                color: '#DC2626',
                '&:hover': { borderColor: '#B91C1C', bgcolor: 'rgba(220, 38, 38, 0.04)' },
                py: 1.5,
              }}
            >
              Manage Products
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              component={Link}
              href="/admin/customers"
              variant="outlined"
              fullWidth
              startIcon={<CustomersIcon />}
              sx={{
                borderColor: '#DC2626',
                color: '#DC2626',
                '&:hover': { borderColor: '#B91C1C', bgcolor: 'rgba(220, 38, 38, 0.04)' },
                py: 1.5,
              }}
            >
              View Customers
            </Button>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              component={Link}
              href="/admin/coupons"
              variant="outlined"
              fullWidth
              startIcon={<TrendingUp />}
              sx={{
                borderColor: 'rgba(0,0,0,0.23)',
                color: 'text.primary',
                '&:hover': { borderColor: 'rgba(0,0,0,0.4)', bgcolor: 'rgba(0,0,0,0.02)' },
                py: 1.5,
              }}
            >
              Manage Coupons
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
