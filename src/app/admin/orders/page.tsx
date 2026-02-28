'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
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
import { Search as SearchIcon, Close as CloseIcon } from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';
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
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);

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
      minWidth: 120,
      align: 'center',
      sortable: false,
      format: (value) => {
        const sc = getStatusColor(value);
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
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Orders Management</Typography>
        <Typography variant="body1" color="text.secondary">View and manage all customer orders</Typography>
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
          {isLoading ? 'Loading...' : `Showing ${filteredOrders.length} of ${orders.length} orders`}
        </Typography>
        <DataTable
          columns={columns}
          data={filteredOrders}
          onRowClick={handleRowClick}
          emptyMessage="No orders found. Try adjusting your filters."
        />
      </Box>

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onClose={() => setSelectedOrder(null)} maxWidth="md" fullWidth>
        {selectedOrder && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 600 }}>Order Details</Typography>
                <Typography variant="body2" color="text.secondary">{selectedOrder.orderNumber}</Typography>
              </Box>
              <Button onClick={() => setSelectedOrder(null)} sx={{ minWidth: 'auto', color: 'text.secondary' }}>
                <CloseIcon />
              </Button>
            </DialogTitle>

            <DialogContent dividers>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Customer Information</Typography>
                  <Typography variant="body2">{selectedOrder.customer.firstName} {selectedOrder.customer.lastName}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedOrder.customer.email}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedOrder.customer.phone}</Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>Shipping Address</Typography>
                  <Typography variant="body2">{selectedOrder.shippingAddress.street}</Typography>
                  <Typography variant="body2" color="text.secondary">{selectedOrder.shippingAddress.city}</Typography>
                </Grid>

                <Grid size={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>Order Items</Typography>
                  <Stack spacing={2}>
                    {selectedOrder.items.map((item, index) => (
                      <Box key={index} sx={{ display: 'flex', gap: 2, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 2 }}>
                        {item.image && (
                          <Box sx={{ width: 60, height: 60, bgcolor: 'white', borderRadius: 1, position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                            <Image src={item.image} alt={item.productName} fill className="object-contain p-1" />
                          </Box>
                        )}
                        <Box sx={{ flex: 1 }}>
                          <Typography sx={{ fontWeight: 500 }}>{item.productName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            {formatPrice(item.price)} × {item.quantity}
                          </Typography>
                        </Box>
                        <Typography sx={{ fontWeight: 600 }}>{formatPrice(item.price * item.quantity)}</Typography>
                      </Box>
                    ))}
                  </Stack>
                </Grid>

                <Grid size={12}>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Subtotal:</Typography>
                    <Typography>{formatPrice(selectedOrder.subtotal)}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography>Shipping:</Typography>
                    <Typography>{selectedOrder.shipping === 0 ? 'FREE' : formatPrice(selectedOrder.shipping)}</Typography>
                  </Box>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography sx={{ fontWeight: 700, fontSize: 18 }}>Total:</Typography>
                    <Typography sx={{ fontWeight: 700, fontSize: 18, color: '#DC2626' }}>{formatPrice(selectedOrder.total)}</Typography>
                  </Box>
                </Grid>

                <Grid size={12}>
                  <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                    <Typography variant="body2"><strong>Payment:</strong> {selectedOrder.paymentMethod}</Typography>
                    {(() => {
                      const sc = getStatusColor(selectedOrder.status);
                      return (
                        <Chip
                          label={selectedOrder.status}
                          size="small"
                          sx={{ bgcolor: sc.bg, color: sc.text, fontWeight: 600, textTransform: 'capitalize' }}
                        />
                      );
                    })()}
                  </Box>
                  {selectedOrder.notes && (
                    <Box sx={{ mt: 2, p: 2, bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Notes:</Typography>
                      <Typography variant="body2" color="text.secondary">{selectedOrder.notes}</Typography>
                    </Box>
                  )}
                </Grid>

                {/* Status Update */}
                <Grid size={12}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5 }}>Update Status</Typography>
                  <FormControl size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={updatingStatus}
                      label="Status"
                      onChange={(e) => setUpdatingStatus(e.target.value)}
                    >
                      {statusOptions.filter(s => s.value !== 'all').map((s) => (
                        <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setSelectedOrder(null)}>Cancel</Button>
              <Button
                variant="contained"
                disabled={isSavingStatus || updatingStatus === selectedOrder.status}
                onClick={handleUpdateStatus}
                sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
              >
                {isSavingStatus ? 'Saving...' : 'Save Status'}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
