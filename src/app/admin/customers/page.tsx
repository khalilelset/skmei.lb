'use client';

import { useState, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Stack,
  CircularProgress,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  ShoppingBag as OrderIcon,
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';
import { formatDate, formatPrice } from '@/lib/utils';
import MobileDialog from '@/components/admin/MobileDialog';

interface RealCustomer {
  phone: string;
  name: string;
  email: string | null;
  orderCount: number;
  totalSpent: number;
  firstOrderAt: string;
  lastOrderAt: string;
  orders: { id: string; total: number; status: string; createdAt: string }[];
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<RealCustomer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selected, setSelected] = useState<RealCustomer | null>(null);

  useEffect(() => {
    fetch('/api/admin/customers')
      .then((r) => r.json())
      .then((data) => { setCustomers(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() =>
    customers.filter((c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      (c.email ?? '').toLowerCase().includes(searchQuery.toLowerCase())
    ), [customers, searchQuery]);

  const columns: Column[] = [
    {
      id: 'name',
      label: 'Customer',
      minWidth: 220,
      format: (_, c: RealCustomer) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: '#DC2626', fontWeight: 600, fontSize: 15 }}>
            {c.name.charAt(0).toUpperCase()}
          </Avatar>
          <Box>
            <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{c.name}</Typography>
            {c.email && <Typography variant="caption" color="text.secondary">{c.email}</Typography>}
          </Box>
        </Box>
      ),
    },
    {
      id: 'phone',
      label: 'Phone',
      minWidth: 140,
      format: (value) => <Typography variant="body2">{value}</Typography>,
    },
    {
      id: 'orderCount',
      label: 'Orders',
      minWidth: 100,
      align: 'center',
      format: (value) => (
        <Chip label={value} size="small" sx={{ bgcolor: 'rgba(220,38,38,0.1)', color: '#DC2626', fontWeight: 600 }} />
      ),
    },
    {
      id: 'totalSpent',
      label: 'Total Spent',
      minWidth: 120,
      align: 'right',
      format: (value) => <Typography sx={{ fontWeight: 600, color: '#DC2626' }}>{formatPrice(value)}</Typography>,
    },
    {
      id: 'lastOrderAt',
      label: 'Last Order',
      minWidth: 140,
      format: (value) => <Typography variant="body2" color="text.secondary">{formatDate(value)}</Typography>,
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Customers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Unique customers aggregated from orders
        </Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name, phone, or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
        />
      </Paper>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Customers', value: customers.length, color: '#DC2626' },
          { label: 'Total Orders', value: customers.reduce((s, c) => s + c.orderCount, 0), color: '#3B82F6' },
          { label: 'Total Revenue', value: `$${customers.reduce((s, c) => s + c.totalSpent, 0).toFixed(2)}`, color: '#10B981' },
        ].map(({ label, value, color }) => (
          <Grid key={label} size={{ xs: 12, sm: 4 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h4" sx={{ fontWeight: 700, color, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>{value}</Typography>
              <Typography variant="body2" color="text.secondary">{label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Box sx={{ mb: 2 }}>
        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress sx={{ color: '#DC2626' }} />
          </Box>
        ) : (
          <>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Showing {filtered.length} of {customers.length} customers
            </Typography>
            <DataTable
              columns={columns}
              data={filtered}
              onRowClick={(c) => setSelected(c as RealCustomer)}
              emptyMessage="No customers found."
            />
          </>
        )}
      </Box>

      {/* Customer Details Dialog */}
      <MobileDialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: '#DC2626', fontWeight: 700, fontSize: 20 }}>
                  {selected.name.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 700 }}>{selected.name}</Typography>
                  <Typography variant="caption" color="text.secondary">Customer since {formatDate(selected.firstOrderAt)}</Typography>
                </Box>
              </Box>
              <Button onClick={() => setSelected(null)} sx={{ minWidth: 'auto', color: 'text.secondary' }}>
                <CloseIcon />
              </Button>
            </DialogTitle>

            <DialogContent dividers>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    <Typography variant="body2">{selected.phone}</Typography>
                  </Box>
                  {selected.email && (
                    <Typography variant="body2" color="text.secondary">{selected.email}</Typography>
                  )}
                </Stack>

                <Stack direction="row" spacing={3}>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Orders</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#DC2626' }}>{selected.orderCount}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Total Spent</Typography>
                    <Typography sx={{ fontWeight: 700, color: '#10B981' }}>{formatPrice(selected.totalSpent)}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="text.secondary">Last Order</Typography>
                    <Typography sx={{ fontWeight: 700 }}>{formatDate(selected.lastOrderAt)}</Typography>
                  </Box>
                </Stack>

                <Divider />

                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                    <OrderIcon sx={{ color: '#DC2626', fontSize: 18 }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Orders ({selected.orders.length})
                    </Typography>
                  </Box>
                  <Stack spacing={1.5}>
                    {selected.orders.map((o) => (
                      <Paper key={o.id} sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.02)' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, fontSize: 12 }}>
                              SK-{o.id.slice(0, 6).toUpperCase()}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">{formatDate(o.createdAt)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={o.status}
                              size="small"
                              sx={{ textTransform: 'capitalize', fontSize: 10, height: 20 }}
                            />
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
                              {formatPrice(o.total)}
                            </Typography>
                          </Box>
                        </Box>
                      </Paper>
                    ))}
                  </Stack>
                </Box>
              </Stack>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setSelected(null)}>Close</Button>
              <Button
                variant="contained"
                component="a"
                href={`https://wa.me/${selected.phone.replace(/\D/g, '')}`}
                target="_blank"
                rel="noopener noreferrer"
                sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
              >
                WhatsApp
              </Button>
            </DialogActions>
          </>
        )}
      </MobileDialog>
    </Box>
  );
}
