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
  ToggleButtonGroup,
  ToggleButton,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Phone as PhoneIcon,
  ShoppingBag as OrderIcon,
  AccountCircle as AccountIcon,
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';
import { formatDate, formatPrice, formatPhoneDisplay, phoneToWaNumber } from '@/lib/utils';
import MobileDialog from '@/components/admin/MobileDialog';

interface Customer {
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
  orders: { id: string; total: number; status: string; createdAt: string }[];
}

type FilterType = 'all' | 'account' | 'order-only';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [selected, setSelected] = useState<Customer | null>(null);

  useEffect(() => {
    fetch('/api/admin/customers')
      .then((r) => r.json())
      .then((data) => { setCustomers(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = customers;
    if (filter === 'account') list = list.filter((c) => c.hasAccount);
    if (filter === 'order-only') list = list.filter((c) => !c.hasAccount && c.orderCount > 0);
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      list = list.filter((c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.email ?? '').toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, searchQuery, filter]);

  const withAccount = customers.filter((c) => c.hasAccount).length;
  const orderOnly = customers.filter((c) => !c.hasAccount && c.orderCount > 0).length;

  const columns: Column[] = [
    {
      id: 'name',
      label: 'Customer',
      minWidth: 220,
      format: (_, c: Customer) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ width: 36, height: 36, bgcolor: c.hasAccount ? '#DC2626' : '#6B7280', fontWeight: 600, fontSize: 15 }}>
            {c.name ? c.name.charAt(0).toUpperCase() : '?'}
          </Avatar>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{c.name || '—'}</Typography>
              {c.hasAccount && (
                <Chip
                  label="Account"
                  size="small"
                  icon={<AccountIcon sx={{ fontSize: '12px !important' }} />}
                  sx={{ height: 18, fontSize: 10, bgcolor: 'rgba(220,38,38,0.1)', color: '#DC2626', '& .MuiChip-label': { px: 0.75 } }}
                />
              )}
            </Box>
            {c.email && <Typography variant="caption" color="text.secondary">{c.email}</Typography>}
          </Box>
        </Box>
      ),
    },
    {
      id: 'phone',
      label: 'Phone',
      minWidth: 140,
      format: (value) => <Typography variant="body2">{formatPhoneDisplay(value as string)}</Typography>,
    },
    {
      id: 'orderCount',
      label: 'Orders',
      minWidth: 100,
      align: 'center',
      format: (value) => (
        <Chip
          label={value as number}
          size="small"
          sx={{
            bgcolor: (value as number) > 0 ? 'rgba(220,38,38,0.1)' : 'rgba(0,0,0,0.06)',
            color: (value as number) > 0 ? '#DC2626' : '#9CA3AF',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: 'totalSpent',
      label: 'Total Spent',
      minWidth: 120,
      align: 'right',
      format: (value) => (
        <Typography sx={{ fontWeight: 600, color: (value as number) > 0 ? '#DC2626' : '#9CA3AF' }}>
          {(value as number) > 0 ? formatPrice(value) : '—'}
        </Typography>
      ),
    },
    {
      id: 'lastOrderAt',
      label: 'Last Order',
      minWidth: 140,
      format: (value) => (
        <Typography variant="body2" color="text.secondary">
          {value ? formatDate(value as string) : '—'}
        </Typography>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>
          Customers
        </Typography>
        <Typography variant="body2" color="text.secondary">
          All customers — accounts + order history merged by phone
        </Typography>
      </Box>

      <Grid container spacing={2} sx={{ mb: 3 }}>
        {[
          { label: 'Total Customers', value: customers.length, color: '#DC2626' },
          { label: 'Have Account', value: withAccount, color: '#8B5CF6' },
          { label: 'Order Only', value: orderOnly, color: '#3B82F6' },
          { label: 'Total Revenue', value: `$${customers.reduce((s, c) => s + c.totalSpent, 0).toFixed(2)}`, color: '#10B981' },
        ].map(({ label, value, color }) => (
          <Grid key={label} size={{ xs: 6, sm: 3 }}>
            <Paper sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="h5" sx={{ fontWeight: 700, color, fontSize: { xs: '1.25rem', sm: '1.75rem' } }}>{value}</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>{label}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ sm: 'center' }}>
          <TextField
            fullWidth
            placeholder="Search by name, phone, or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          />
          <ToggleButtonGroup
            value={filter}
            exclusive
            onChange={(_, v) => { if (v) setFilter(v); }}
            size="small"
            sx={{ flexShrink: 0 }}
          >
            <ToggleButton value="all" sx={{ px: 2, fontSize: 12 }}>All</ToggleButton>
            <ToggleButton value="account" sx={{ px: 2, fontSize: 12 }}>Has Account</ToggleButton>
            <ToggleButton value="order-only" sx={{ px: 2, fontSize: 12 }}>Order Only</ToggleButton>
          </ToggleButtonGroup>
        </Stack>
      </Paper>

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
              onRowClick={(c) => setSelected(c as Customer)}
              emptyMessage="No customers found."
            />
          </>
        )}
      </Box>

      <MobileDialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 48, height: 48, bgcolor: selected.hasAccount ? '#DC2626' : '#6B7280', fontWeight: 700, fontSize: 20 }}>
                  {selected.name ? selected.name.charAt(0).toUpperCase() : '?'}
                </Avatar>
                <Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700 }}>{selected.name || 'Unknown'}</Typography>
                    {selected.hasAccount && (
                      <Chip label="Account" size="small" sx={{ height: 20, fontSize: 10, bgcolor: 'rgba(220,38,38,0.1)', color: '#DC2626' }} />
                    )}
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    {selected.firstOrderAt
                      ? `Customer since ${formatDate(selected.firstOrderAt)}`
                      : selected.accountCreatedAt
                      ? `Account created ${formatDate(selected.accountCreatedAt)}`
                      : ''}
                  </Typography>
                </Box>
              </Box>
              <Button onClick={() => setSelected(null)} sx={{ minWidth: 'auto', color: 'text.secondary' }}>
                <CloseIcon />
              </Button>
            </DialogTitle>

            <DialogContent dividers>
              <Stack spacing={2.5}>
                <Stack direction="row" spacing={2} flexWrap="wrap">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon sx={{ color: 'text.secondary', fontSize: 18 }} />
                    <Typography variant="body2">{formatPhoneDisplay(selected.phone)}</Typography>
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
                    <Typography sx={{ fontWeight: 700, color: '#10B981' }}>{selected.orderCount > 0 ? formatPrice(selected.totalSpent) : '—'}</Typography>
                  </Box>
                  {selected.lastOrderAt && (
                    <Box>
                      <Typography variant="caption" color="text.secondary">Last Order</Typography>
                      <Typography sx={{ fontWeight: 700 }}>{formatDate(selected.lastOrderAt)}</Typography>
                    </Box>
                  )}
                </Stack>

                {selected.hasAccount && selected.addresses.length > 0 && (
                  <>
                    <Divider />
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                        Saved Addresses ({selected.addresses.length})
                      </Typography>
                      <Stack spacing={1}>
                        {(selected.addresses as { region?: string; city?: string; street?: string; building?: string }[]).map((addr, i) => (
                          <Paper key={i} sx={{ p: 1.5, bgcolor: 'rgba(0,0,0,0.02)', fontSize: 13 }}>
                            {[addr.street, addr.building, addr.city, addr.region].filter(Boolean).join(', ')}
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  </>
                )}

                {selected.orders.length > 0 && (
                  <>
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
                                <Chip label={o.status} size="small" sx={{ textTransform: 'capitalize', fontSize: 10, height: 20 }} />
                                <Typography variant="body2" sx={{ fontWeight: 700, color: '#DC2626' }}>
                                  {formatPrice(o.total)}
                                </Typography>
                              </Box>
                            </Box>
                          </Paper>
                        ))}
                      </Stack>
                    </Box>
                  </>
                )}
              </Stack>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setSelected(null)}>Close</Button>
              <Button
                variant="contained"
                component="a"
                href={`https://wa.me/${phoneToWaNumber(selected.phone)}`}
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
