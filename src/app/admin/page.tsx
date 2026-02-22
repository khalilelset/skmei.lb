'use client';

import { Box, Typography, Grid, Button, Paper } from '@mui/material';
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
import { getDashboardStats } from '@/data/mockData';
import { formatPrice } from '@/lib/utils';

export default function AdminDashboard() {
  const stats = getDashboardStats();

  const topProductsColumns: Column[] = [
    {
      id: 'rank',
      label: '#',
      minWidth: 50,
      align: 'center',
      format: (_, row) => (
        <Box
          sx={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            bgcolor: row.rank <= 3 ? 'rgba(220, 38, 38, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            color: row.rank <= 3 ? '#DC2626' : 'text.secondary',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 600,
          }}
        >
          {row.rank}
        </Box>
      ),
    },
    {
      id: 'name',
      label: 'Product Name',
      minWidth: 200,
    },
    {
      id: 'sales',
      label: 'Units Sold',
      minWidth: 100,
      align: 'center',
      format: (value) => <strong>{value}</strong>,
    },
    {
      id: 'revenue',
      label: 'Revenue',
      minWidth: 120,
      align: 'right',
      format: (value) => (
        <Typography sx={{ fontWeight: 600, color: '#DC2626' }}>
          {formatPrice(value)}
        </Typography>
      ),
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
          Welcome to your admin dashboard. Here's what's happening with your store.
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Revenue"
            value={formatPrice(stats.totalRevenue)}
            change={stats.revenueChange}
            icon={<RevenueIcon sx={{ fontSize: 28 }} />}
            iconBgColor="rgba(34, 197, 94, 0.1)"
            iconColor="#22C55E"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Orders"
            value={stats.totalOrders}
            change={stats.ordersChange}
            icon={<OrdersIcon sx={{ fontSize: 28 }} />}
            iconBgColor="rgba(59, 130, 246, 0.1)"
            iconColor="#3B82F6"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Customers"
            value={stats.totalCustomers}
            change={stats.customersChange}
            icon={<CustomersIcon sx={{ fontSize: 28 }} />}
            iconBgColor="rgba(168, 85, 247, 0.1)"
            iconColor="#A855F7"
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatsCard
            title="Total Products"
            value={stats.totalProducts}
            change={stats.productsChange}
            icon={<ProductsIcon sx={{ fontSize: 28 }} />}
            iconBgColor="rgba(220, 38, 38, 0.1)"
            iconColor="#DC2626"
          />
        </Grid>
      </Grid>

      {/* Top Products Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 0.5 }}>
              Top Performing Products
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Best-selling products this month
            </Typography>
          </Box>
          <Link href="/admin/products" passHref legacyBehavior>
            <Button
              component="a"
              variant="outlined"
              endIcon={<ArrowForward />}
              sx={{
                borderColor: '#DC2626',
                color: '#DC2626',
                '&:hover': {
                  borderColor: '#B91C1C',
                  bgcolor: 'rgba(220, 38, 38, 0.04)',
                },
              }}
            >
              View All Products
            </Button>
          </Link>
        </Box>
        <DataTable columns={topProductsColumns} data={stats.topProducts} />
      </Paper>

      {/* Quick Actions */}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
          Quick Actions
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Link href="/admin/orders" passHref legacyBehavior>
              <Button
                component="a"
                variant="contained"
                fullWidth
                startIcon={<OrdersIcon />}
                sx={{
                  bgcolor: '#DC2626',
                  '&:hover': { bgcolor: '#B91C1C' },
                  py: 1.5,
                }}
              >
                Manage Orders
              </Button>
            </Link>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Link href="/admin/products" passHref legacyBehavior>
              <Button
                component="a"
                variant="outlined"
                fullWidth
                startIcon={<ProductsIcon />}
                sx={{
                  borderColor: '#DC2626',
                  color: '#DC2626',
                  '&:hover': {
                    borderColor: '#B91C1C',
                    bgcolor: 'rgba(220, 38, 38, 0.04)',
                  },
                  py: 1.5,
                }}
              >
                Manage Products
              </Button>
            </Link>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Link href="/admin/customers" passHref legacyBehavior>
              <Button
                component="a"
                variant="outlined"
                fullWidth
                startIcon={<CustomersIcon />}
                sx={{
                  borderColor: '#DC2626',
                  color: '#DC2626',
                  '&:hover': {
                    borderColor: '#B91C1C',
                    bgcolor: 'rgba(220, 38, 38, 0.04)',
                  },
                  py: 1.5,
                }}
              >
                View Customers
              </Button>
            </Link>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Button
              variant="outlined"
              fullWidth
              startIcon={<TrendingUp />}
              sx={{
                borderColor: 'rgba(0, 0, 0, 0.23)',
                color: 'text.primary',
                '&:hover': {
                  borderColor: 'rgba(0, 0, 0, 0.4)',
                  bgcolor: 'rgba(0, 0, 0, 0.02)',
                },
                py: 1.5,
              }}
            >
              View Reports
            </Button>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}
