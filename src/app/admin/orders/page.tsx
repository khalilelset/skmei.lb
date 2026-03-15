'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useMediaQuery, useTheme } from '@mui/material';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  ReceiptLong as ReceiptIcon,
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableSkeleton from '@/components/admin/TableSkeleton';
import { formatPrice, formatDate } from '@/lib/utils';
import type { Order } from '@/types';
import Image from 'next/image';

const statusColors: Record<string, { bg: string; text: string }> = {
  pending:    { bg: 'rgba(234, 179, 8, 0.1)',   text: '#CA8A04' },
  confirmed:  { bg: 'rgba(59, 130, 246, 0.1)',  text: '#3B82F6' },
  processing: { bg: 'rgba(168, 85, 247, 0.1)',  text: '#A855F7' },
  shipped:    { bg: 'rgba(99, 102, 241, 0.1)',  text: '#6366F1' },
  delivered:  { bg: 'rgba(34, 197, 94, 0.1)',   text: '#22C55E' },
  cancelled:  { bg: 'rgba(239, 68, 68, 0.1)',   text: '#EF4444' },
};

function getStatusColor(status: string) {
  return statusColors[status] ?? { bg: 'rgba(0, 0, 0, 0.05)', text: '#6B7280' };
}

const statusOptions = [
  { value: 'all',        label: 'All Orders' },
  { value: 'pending',    label: 'Pending' },
  { value: 'confirmed',  label: 'Confirmed' },
  { value: 'processing', label: 'Processing' },
  { value: 'shipped',    label: 'Shipped' },
  { value: 'delivered',  label: 'Delivered' },
  { value: 'cancelled',  label: 'Cancelled' },
];

export default function OrdersPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [inlineUpdating, setInlineUpdating] = useState<Record<string, boolean>>({});

  const loadOrders = useCallback(() => {
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((data) => { setOrders(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadOrders(); }, [loadOrders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const customerName = `${order.customer.firstName} ${order.customer.lastName}`;
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        customerName.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, selectedStatus]);

  const handleInlineStatusChange = async (orderId: string, newStatus: string) => {
    setInlineUpdating((prev) => ({ ...prev, [orderId]: true }));
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o));
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setInlineUpdating((prev) => ({ ...prev, [orderId]: false }));
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !updatingStatus) return;
    setIsSavingStatus(true);
    await fetch(`/api/admin/orders/${selectedOrder.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: updatingStatus }),
    });
    setIsSavingStatus(false);
    setSelectedOrder(null);
    loadOrders();
  };

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setUpdatingStatus(order.status);
  };

  const columns: Column[] = [
    {
      id: 'orderNumber',
      label: 'Order #',
      minWidth: 120,
      format: (value) => (
        <Typography sx={{ fontWeight: 600, color: '#DC2626' }}>{value}</Typography>
      ),
    },
    {
      id: 'customer',
      label: 'Customer',
      minWidth: 180,
      format: (value) => (
        <Box>
          <Typography sx={{ fontWeight: 500 }}>{value.firstName} {value.lastName}</Typography>
          <Typography variant="caption" color="text.secondary">{value.phone}</Typography>
        </Box>
      ),
    },
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 120,
      format: (value) => formatDate(value),
    },
    {
      id: 'items',
      label: 'Items',
      minWidth: 80,
      align: 'center',
      format: (value) => (value as unknown[]).length,
    },
    {
      id: 'total',
      label: 'Total',
      minWidth: 120,
      align: 'right',
      format: (value) => (
        <Typography sx={{ fontWeight: 600 }}>{formatPrice(value)}</Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 140,
      align: 'center',
      sortable: false,
      format: (value, row) => {
        const sc = getStatusColor(value);
        return (
          <Select
            value={value}
            size="small"
            disabled={!!inlineUpdating[row.id]}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => {
              e.stopPropagation();
              handleInlineStatusChange(row.id, e.target.value);
            }}
            sx={{
              fontSize: '0.75rem',
              fontWeight: 600,
              color: sc.text,
              bgcolor: sc.bg,
              borderRadius: '16px',
              '& .MuiOutlinedInput-notchedOutline': { border: 'none' },
              '& .MuiSelect-select': { py: 0.5, px: 1.5 },
              '& .MuiSelect-icon': { color: sc.text },
            }}
          >
            {statusOptions.filter((s) => s.value !== 'all').map((s) => (
              <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
            ))}
          </Select>
        );
      },
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Orders Management</Typography>
        <Typography variant="body2" color="text.secondary">View and manage all customer orders</Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by order number or customer name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon /></InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {statusOptions.map((status) => (
            <Chip
              key={status.value}
              label={status.label}
              onClick={() => setSelectedStatus(status.value)}
              variant={selectedStatus === status.value ? 'filled' : 'outlined'}
              sx={{
                bgcolor: selectedStatus === status.value ? '#DC2626' : 'transparent',
                color: selectedStatus === status.value ? 'white' : 'text.primary',
                borderColor: selectedStatus === status.value ? '#DC2626' : 'rgba(0,0,0,0.23)',
                '&:hover': {
                  bgcolor: selectedStatus === status.value ? '#B91C1C' : 'rgba(220,38,38,0.04)',
                },
              }}
            />
          ))}
        </Stack>
      </Paper>

      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isLoading ? '\u00a0' : `Showing ${filteredOrders.length} of ${orders.length} orders`}
        </Typography>
        {isLoading ? (
          <TableSkeleton columns={6} rows={8} />
        ) : (
          <DataTable
            columns={columns}
            data={filteredOrders}
            onRowClick={handleRowClick}
            emptyMessage="No orders found. Try adjusting your filters."
          />
        )}
      </Box>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="md" fullWidth fullScreen={isMobile} PaperProps={{ sx: { borderRadius: isMobile ? 0 : 3, overflow: 'hidden' } }}>
        {selectedOrder && (() => {
          const sc = getStatusColor(selectedOrder.status);
          return (
            <>
              {/* Header */}
              <Box sx={{ bgcolor: '#fff', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '3px solid #DC2626' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ width: 40, height: 40, bgcolor: 'rgba(220,38,38,0.08)', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ReceiptIcon sx={{ color: '#DC2626', fontSize: 20 }} />
                  </Box>
                  <Box>
                    <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#0f0f0f', letterSpacing: 0.3 }}>
                      {selectedOrder.orderNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 0.25 }}>
                      <CalendarIcon sx={{ fontSize: 11, color: '#9ca3af' }} />
                      <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>
                        {formatDate(selectedOrder.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Chip
                    label={selectedOrder.status.charAt(0).toUpperCase() + selectedOrder.status.slice(1)}
                    size="small"
                    sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 700, textTransform: 'capitalize', border: `1px solid ${sc.text}30` }}
                  />
                  <Button onClick={() => setSelectedOrder(null)} sx={{ minWidth: 'auto', p: 0.75, color: '#6b7280', '&:hover': { bgcolor: '#f3f4f6', color: '#0f0f0f' } }}>
                    <CloseIcon fontSize="small" />
                  </Button>
                </Box>
              </Box>

              <DialogContent sx={{ p: 0, bgcolor: '#fafafa' }}>
                {/* Customer + Address */}
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 0, borderBottom: '1px solid #eee' }}>
                  {/* Customer */}
                  <Box sx={{ p: 3, borderRight: { md: '1px solid #eee' } }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, mb: 2 }}>Customer</Typography>
                    <Stack spacing={1.5}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Box sx={{ width: 32, height: 32, bgcolor: '#f3f4f6', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <PersonIcon sx={{ fontSize: 16, color: '#6b7280' }} />
                        </Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</Typography>
                      </Box>
                      {selectedOrder.customer.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 32, height: 32, bgcolor: '#f0fdf4', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <PhoneIcon sx={{ fontSize: 16, color: '#16a34a' }} />
                          </Box>
                          <Typography sx={{ fontSize: 14, color: '#374151' }}>{selectedOrder.customer.phone}</Typography>
                        </Box>
                      )}
                      {selectedOrder.customer.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{ width: 32, height: 32, bgcolor: '#eff6ff', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <EmailIcon sx={{ fontSize: 16, color: '#3b82f6' }} />
                          </Box>
                          <Typography sx={{ fontSize: 14, color: '#374151' }}>{selectedOrder.customer.email}</Typography>
                        </Box>
                      )}
                    </Stack>
                  </Box>

                  {/* Address */}
                  <Box sx={{ p: 3 }}>
                    <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, mb: 2 }}>Delivery Address</Typography>
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                      <Box sx={{ width: 32, height: 32, bgcolor: '#fff7ed', borderRadius: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <LocationIcon sx={{ fontSize: 16, color: '#ea580c' }} />
                      </Box>
                      <Box>
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>{selectedOrder.shippingAddress.street || '—'}</Typography>
                        <Typography sx={{ fontSize: 13, color: '#6b7280', mt: 0.25 }}>{selectedOrder.shippingAddress.city}{selectedOrder.shippingAddress.city ? ', Lebanon' : '—'}</Typography>
                      </Box>
                    </Box>
                    {selectedOrder.paymentMethod && (
                      <Box sx={{ mt: 2.5, pt: 2, borderTop: '1px dashed #e5e7eb' }}>
                        <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, mb: 0.75 }}>Payment</Typography>
                        <Typography sx={{ fontSize: 14, fontWeight: 500, textTransform: 'capitalize' }}>{selectedOrder.paymentMethod}</Typography>
                      </Box>
                    )}
                  </Box>
                </Box>

                {/* Items */}
                <Box sx={{ p: 3, borderBottom: '1px solid #eee' }}>
                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, mb: 2 }}>
                    Items Ordered ({selectedOrder.items.length})
                  </Typography>
                  <Stack spacing={1.5}>
                    {selectedOrder.items.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', alignItems: 'center', gap: 2, p: 1.5, bgcolor: '#fff', border: '1px solid #f0f0f0', borderRadius: 2 }}>
                        {item.image ? (
                          <Box sx={{ width: 72, height: 72, bgcolor: '#f8f8f8', borderRadius: 1.5, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                            <Image src={item.image} alt={item.productName} fill className="object-contain p-1" />
                          </Box>
                        ) : (
                          <Box sx={{ width: 72, height: 72, bgcolor: '#f3f4f6', borderRadius: 1.5, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ReceiptIcon sx={{ color: '#d1d5db', fontSize: 28 }} />
                          </Box>
                        )}
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography sx={{ fontWeight: 600, fontSize: 14, lineHeight: 1.4 }}>{item.productName}</Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.75 }}>
                            <Box sx={{ display: 'inline-flex', alignItems: 'center', bgcolor: '#f3f4f6', borderRadius: 10, px: 1.25, py: 0.25 }}>
                              <Typography sx={{ fontSize: 12, fontWeight: 700, color: '#374151' }}>×{item.quantity}</Typography>
                            </Box>
                            <Typography sx={{ fontSize: 13, color: '#9ca3af' }}>{formatPrice(item.price)} each</Typography>
                          </Box>
                        </Box>
                        <Typography sx={{ fontWeight: 700, fontSize: 15, color: '#0f0f0f', flexShrink: 0 }}>
                          {formatPrice(item.price * item.quantity)}
                        </Typography>
                      </Box>
                    ))}
                  </Stack>
                </Box>

                {/* Totals */}
                <Box sx={{ p: 3, borderBottom: '1px solid #eee' }}>
                  <Stack spacing={1}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: 14, color: '#6b7280' }}>Subtotal</Typography>
                      <Typography sx={{ fontSize: 14 }}>{formatPrice(selectedOrder.subtotal)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography sx={{ fontSize: 14, color: '#6b7280' }}>Shipping</Typography>
                      <Typography sx={{ fontSize: 14, color: selectedOrder.shipping === 0 ? '#16a34a' : undefined, fontWeight: selectedOrder.shipping === 0 ? 600 : 400 }}>
                        {selectedOrder.shipping === 0 ? 'FREE' : formatPrice(selectedOrder.shipping)}
                      </Typography>
                    </Box>
                    {(selectedOrder.discount ?? 0) > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography sx={{ fontSize: 14, color: '#16a34a' }}>Discount{selectedOrder.couponCode ? ` (${selectedOrder.couponCode})` : ''}</Typography>
                        <Typography sx={{ fontSize: 14, color: '#16a34a', fontWeight: 600 }}>-{formatPrice(selectedOrder.discount ?? 0)}</Typography>
                      </Box>
                    )}
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', pt: 0.5 }}>
                      <Typography sx={{ fontWeight: 800, fontSize: 16 }}>Total</Typography>
                      <Typography sx={{ fontWeight: 800, fontSize: 18, color: '#DC2626' }}>{formatPrice(selectedOrder.total)}</Typography>
                    </Box>
                  </Stack>
                </Box>

                {/* Notes + Status Update */}
                <Box sx={{ p: 3 }}>
                  {selectedOrder.notes && (
                    <Box sx={{ mb: 3, p: 2, bgcolor: '#fffbeb', border: '1px solid #fde68a', borderRadius: 2 }}>
                      <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#92400e', textTransform: 'uppercase', letterSpacing: 1, mb: 0.75 }}>Customer Notes</Typography>
                      <Typography sx={{ fontSize: 14, color: '#78350f', lineHeight: 1.6 }}>{selectedOrder.notes}</Typography>
                    </Box>
                  )}

                  <Typography sx={{ fontSize: 11, fontWeight: 700, color: '#999', textTransform: 'uppercase', letterSpacing: 1.2, mb: 1.5 }}>Update Status</Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                    {statusOptions.filter(s => s.value !== 'all').map((s) => {
                      const isCurrent = updatingStatus === s.value;
                      const sColor = getStatusColor(s.value);
                      return (
                        <Button
                          key={s.value}
                          size="small"
                          onClick={() => setUpdatingStatus(s.value)}
                          sx={{
                            borderRadius: 10,
                            px: 2,
                            py: 0.5,
                            fontSize: 12,
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            bgcolor: isCurrent ? sColor.bg : 'transparent',
                            color: isCurrent ? sColor.text : '#9ca3af',
                            border: `1.5px solid ${isCurrent ? sColor.text : '#e5e7eb'}`,
                            '&:hover': { bgcolor: sColor.bg, color: sColor.text, borderColor: sColor.text },
                          }}
                        >
                          {s.label}
                        </Button>
                      );
                    })}
                  </Box>
                </Box>
              </DialogContent>

              <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fff', borderTop: '1px solid #f0f0f0' }}>
                <Button onClick={() => setSelectedOrder(null)} sx={{ color: '#6b7280' }}>Cancel</Button>
                <Button
                  variant="contained"
                  disabled={isSavingStatus || updatingStatus === selectedOrder.status}
                  onClick={handleUpdateStatus}
                  sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, borderRadius: 2, px: 3, fontWeight: 600 }}
                >
                  {isSavingStatus ? 'Saving…' : 'Save Status'}
                </Button>
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
