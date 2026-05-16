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
  const [selectedSource, setSelectedSource] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);
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
      const matchesSource = selectedSource === 'all' || (order.source ?? 'website') === selectedSource;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [orders, searchQuery, selectedStatus, selectedSource]);

  const handleInlineStatusChange = async (orderId: string, newStatus: string) => {
    setInlineUpdating((prev) => ({ ...prev, [orderId]: true }));
    setOrders((prev) => prev.map((o) => o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o));
    await fetch(`/api/admin/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    setInlineUpdating((prev) => ({ ...prev, [orderId]: false }));
    const order = orders.find((o) => o.id === orderId);
    if (order) {
      const waLink = buildWhatsAppLink(order, newStatus);
      if (waLink) window.open(waLink, '_blank');
    }
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
    setStatusSaved(true);
    loadOrders();
    const waLink = buildWhatsAppLink(selectedOrder, updatingStatus);
    if (waLink) window.open(waLink, '_blank');
  };

  const buildWhatsAppLink = (order: Order, status: string) => {
    const phone = `961${order.customer.phone.replace(/^(\+961|00961|961)/, '').replace(/\s/g, '')}`;
    const firstName = order.customer.firstName;
    const orderNum = order.orderNumber;

    // Build items list for confirmed & cancelled
    const itemsAr = order.items.map((i) => {
      const box = i.box ? ` 📦 ${i.box.code ?? 'Box'}${i.box.price > 0 ? ` (+$${i.box.price.toFixed(2)})` : ' (Free)'}` : '';
      return `- ${i.productName} x${i.quantity}${box}`;
    }).join('\n');
    const itemsEn = order.items.map((i) => {
      const box = i.box ? ` 📦 ${i.box.code ?? 'Box'}${i.box.price > 0 ? ` (+$${i.box.price.toFixed(2)})` : ' (Free)'}` : '';
      return `- ${i.productName} x${i.quantity}${box}`;
    }).join('\n');

    const sep = '\n\n---\n\n';
    const messages: Record<string, string> = {
      confirmed:
        `\u0645\u0631\u062D\u0628\u0627\u064B ${firstName}! \u2705\n\n` +
        `\u0637\u0644\u0628\u0643 \u0631\u0642\u0645 ${orderNum} \u062A\u0645 \u062A\u0623\u0643\u064A\u062F\u0647 \u0645\u0646 \u0642\u0650\u0628\u064E\u0644 \u0641\u0631\u064A\u0642\u0646\u0627.\n` +
        `\u0646\u062D\u0646 \u0646\u062C\u0647\u0651\u0632 \u0637\u0644\u0628\u0643 \u0627\u0644\u0622\u0646 \u0644\u0644\u0634\u062D\u0646! \u{1F4E6}\n` +
        `\u{1F4C5} \u0645\u062F\u0629 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629: \u0628\u064A\u0646 3 \u0625\u0644\u0649 5 \u0623\u064A\u0627\u0645 \u0639\u0645\u0644.\n\n` +
        `\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A:\n\n${itemsAr}\n\n` +
        `\u0634\u0643\u0631\u0627\u064B \u0644\u062B\u0642\u062A\u0643 \u0628\u0646\u0627 \u{231A}\u{1F64F}\nskmeilb.com` +
        sep +
        `Hello ${firstName}! \u2705\n\n` +
        `Your order ${orderNum} has been confirmed by our team.\n` +
        `We are now preparing your order for shipment! \u{1F4E6}\n` +
        `\u{1F4C5} Estimated delivery: 3 to 5 business days.\n\n` +
        `Items:\n\n${itemsEn}\n\n` +
        `Thank you for choosing us \u{231A}\u{1F64F}\nskmeilb.com`,

      shipped:
        `\u0645\u0631\u062D\u0628\u0627\u064B ${firstName}! \u{1F69A}\n\n` +
        `\u0637\u0644\u0628\u0643 \u0631\u0642\u0645 ${orderNum} \u0641\u064A \u0627\u0644\u0637\u0631\u064A\u0642 \u0625\u0644\u064A\u0643 \u0627\u0644\u0622\u0646!\n` +
        `\u0633\u064A\u0635\u0644\u0643 \u0642\u0631\u064A\u0628\u0627\u064B \u2014 \u064A\u0631\u062C\u0649 \u0627\u0644\u062A\u0648\u0627\u062C\u062F \u0644\u0627\u0633\u062A\u0644\u0627\u0645\u0647.\n` +
        `\u{1F4C5} \u0645\u062F\u0629 \u0627\u0644\u062A\u0648\u0635\u064A\u0644 \u0627\u0644\u0645\u062A\u0648\u0642\u0639\u0629: \u0628\u064A\u0646 2 \u0625\u0644\u0649 4 \u0623\u064A\u0627\u0645 \u0639\u0645\u0644.\n\n` +
        `\u0634\u0643\u0631\u0627\u064B \u0644\u062B\u0642\u062A\u0643 \u0628\u0646\u0627 \u{231A}\u{1F64F}\nskmeilb.com` +
        sep +
        `Hello ${firstName}! \u{1F69A}\n\n` +
        `Your order ${orderNum} is on its way!\n` +
        `It will arrive shortly \u2014 please be available to receive it.\n` +
        `\u{1F4C5} Estimated delivery: 2 to 4 business days.\n\n` +
        `Thank you for choosing us \u{231A}\u{1F64F}\nskmeilb.com`,

      delivered:
        `\u0623\u0647\u0644\u0627\u064B ${firstName}! \u{1F389}\n\n` +
        `\u062A\u0645 \u062A\u0648\u0635\u064A\u0644 \u0637\u0644\u0628\u0643 \u0628\u0646\u062C\u0627\u062D!\n` +
        `\u0646\u0623\u0645\u0644 \u0623\u0646 \u062A\u0643\u0648\u0646 \u0633\u0639\u064A\u062F\u0627\u064B \u0628\u0645\u0634\u062A\u0631\u064A\u0627\u062A\u0643 \u{231A}\n\n` +
        `\u{1F4AC} \u0631\u0623\u064A\u0643 \u064A\u0647\u0645\u0646\u0627 \u2014 \u0634\u0627\u0631\u0643\u0646\u0627 \u062A\u062C\u0631\u0628\u062A\u0643!\n` +
        `\u{1F4F2} \u0627\u062D\u0641\u0638 \u0631\u0642\u0645\u0646\u0627 \u0644\u062A\u0635\u0644\u0643 \u0623\u062D\u062F\u062B \u0627\u0644\u0639\u0631\u0648\u0636.\n\n` +
        `\u0634\u0643\u0631\u0627\u064B \u0644\u062B\u0642\u062A\u0643 \u0628\u0646\u0627 \u{1F64F}\nskmeilb.com` +
        sep +
        `Hello ${firstName}! \u{1F389}\n\n` +
        `Your order has been delivered successfully!\n` +
        `We hope you love your new purchase \u{231A}\n\n` +
        `\u{1F4AC} Your feedback matters \u2014 share your experience!\n` +
        `\u{1F4F2} Save our number to get the latest offers.\n\n` +
        `Thank you for choosing us \u{1F64F}\nskmeilb.com`,

      cancelled:
        `\u0645\u0631\u062D\u0628\u0627\u064B ${firstName}! \u274C\n\n` +
        `\u0646\u0623\u0633\u0641 \u0644\u0625\u0628\u0644\u0627\u063A\u0643 \u0623\u0646 \u0637\u0644\u0628\u0643 \u0631\u0642\u0645 ${orderNum} \u062A\u0645 \u0625\u0644\u063A\u0627\u0624\u0647.\n\n` +
        `\u0627\u0644\u0645\u0646\u062A\u062C\u0627\u062A \u0627\u0644\u062A\u064A \u0643\u0627\u0646\u062A \u0641\u064A \u0637\u0644\u0628\u0643:\n\n${itemsAr}\n\n` +
        `\u0625\u0630\u0627 \u0643\u0627\u0646 \u0644\u062F\u064A\u0643 \u0623\u064A \u0627\u0633\u062A\u0641\u0633\u0627\u0631 \u0623\u0648 \u062A\u0631\u064A\u062F \u0625\u0639\u0627\u062F\u0629 \u0627\u0644\u0637\u0644\u0628\u060C \u062A\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627.\n` +
        `\u0646\u0639\u062A\u0630\u0631 \u0639\u0646 \u0623\u064A \u0625\u0632\u0639\u0627\u062C \u{1F64F}\nskmeilb.com` +
        sep +
        `Hello ${firstName}! \u274C\n\n` +
        `We are sorry to inform you that your order ${orderNum} has been cancelled.\n\n` +
        `Items that were in your order:\n\n${itemsEn}\n\n` +
        `If you have any questions or wish to reorder, please contact us.\n` +
        `We apologize for any inconvenience \u{1F64F}\nskmeilb.com`,
    };

    const text = messages[status];
    if (!text) return null;
    return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
  };

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setUpdatingStatus(order.status);
    setStatusSaved(false);
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
      id: 'source',
      label: 'Via',
      minWidth: 110,
      align: 'center',
      sortable: false,
      format: (value) => {
        const isWhatsApp = value === 'whatsapp';
        return (
          <Chip
            label={isWhatsApp ? 'WhatsApp' : 'Website'}
            size="small"
            sx={{
              bgcolor: isWhatsApp ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
              color: isWhatsApp ? '#16A34A' : '#3B82F6',
              fontWeight: 700,
              fontSize: 10,
              border: `1px solid ${isWhatsApp ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
            }}
          />
        );
      },
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
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
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
                '&:hover': { bgcolor: selectedStatus === status.value ? '#B91C1C' : 'rgba(220,38,38,0.04)' },
              }}
            />
          ))}
        </Stack>
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {[
            { value: 'all',       label: 'All Sources' },
            { value: 'website',   label: 'Website' },
            { value: 'whatsapp',  label: 'WhatsApp' },
          ].map((src) => (
            <Chip
              key={src.value}
              label={src.label}
              onClick={() => setSelectedSource(src.value)}
              variant={selectedSource === src.value ? 'filled' : 'outlined'}
              sx={{
                bgcolor: selectedSource === src.value ? '#16A34A' : 'transparent',
                color: selectedSource === src.value ? 'white' : 'text.primary',
                borderColor: selectedSource === src.value ? '#16A34A' : 'rgba(0,0,0,0.23)',
                '&:hover': { bgcolor: selectedSource === src.value ? '#15803D' : 'rgba(22,163,74,0.04)' },
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
                    <Typography sx={{ fontWeight: 800, fontSize: 24, color: '#0f0f0f', letterSpacing: 0.3 }}>
                      {selectedOrder.orderNumber}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.25 }}>
                      <CalendarIcon sx={{ fontSize: 11, color: '#9ca3af' }} />
                      <Typography sx={{ fontSize: 11, color: '#9ca3af' }}>
                        {formatDate(selectedOrder.createdAt)}
                      </Typography>
                      <Chip
                        label={selectedOrder.source === 'whatsapp' ? 'WhatsApp' : 'Website'}
                        size="small"
                        sx={{
                          height: 16, fontSize: 9, fontWeight: 700,
                          bgcolor: selectedOrder.source === 'whatsapp' ? 'rgba(34,197,94,0.1)' : 'rgba(59,130,246,0.1)',
                          color: selectedOrder.source === 'whatsapp' ? '#16A34A' : '#3B82F6',
                          border: `1px solid ${selectedOrder.source === 'whatsapp' ? 'rgba(34,197,94,0.3)' : 'rgba(59,130,246,0.3)'}`,
                          '& .MuiChip-label': { px: 0.75 },
                        }}
                      />
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
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, borderLeft: '2px solid rgba(220,38,38,0.4)', pl: 1.5 }}>
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
                          <Box
                            component="a"
                            href={(() => {
                              const phone = `961${selectedOrder.customer.phone.replace(/^(\+961|00961|961)/, '').replace(/\s/g, '')}`;
                              const firstName = selectedOrder.customer.firstName;
                              const orderNumber = selectedOrder.orderNumber;
                              const msg = `مرحباً ${firstName}! 👋\n\nشكراً لطلبك من SKMEI.LB 🛍️\nرقم طلبك: #${orderNumber}\n\n✅ لقد استلمنا طلبك بنجاح!\nسنتواصل معك قريباً للتأكيد بعد التحقق من توفر المنتج.\n\n━━━━━━━━━━━━━━━\nHello ${firstName}! 👋\n\nThank you for your order from SKMEI.LB 🛍️\nOrder #: ${orderNumber}\n\n✅ We have received your order successfully!\nWe will contact you shortly to confirm once we verify product availability.\n\n— SKMEI.LB ⌚`;
                              return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            sx={{
                              width: 30, height: 30, borderRadius: 1.5, bgcolor: '#25d366',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              flexShrink: 0, cursor: 'pointer', textDecoration: 'none',
                              '&:hover': { bgcolor: '#1ebe5d' },
                            }}
                          >
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                            </svg>
                          </Box>
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
                        <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                          {[selectedOrder.shippingAddress.area, selectedOrder.shippingAddress.city, selectedOrder.shippingAddress.street].filter(Boolean).join(', ') || '—'}
                        </Typography>
                        <Typography sx={{ fontSize: 13, color: '#6b7280', mt: 0.25 }}>Lebanon</Typography>
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
                          {item.box && (
                            <Typography sx={{ fontSize: 11, color: '#9ca3af', mt: 0.4 }}>
                              📦 {item.box.code ?? 'Gift Box'}{item.box.price > 0 ? ` (+${formatPrice(item.box.price)})` : ' (Free)'}
                            </Typography>
                          )}
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

              <DialogActions sx={{ px: 3, py: 2, bgcolor: '#fff', borderTop: '1px solid #f0f0f0', gap: 1 }}>
                {statusSaved ? (
                  <>
                    <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box sx={{ width: 20, height: 20, bgcolor: '#22c55e', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                      </Box>
                      <Typography sx={{ fontSize: 13, color: '#22c55e', fontWeight: 600 }}>Status updated!</Typography>
                    </Box>
                    {buildWhatsAppLink(selectedOrder, updatingStatus) && (
                      <Button
                        variant="contained"
                        onClick={() => {
                          const link = buildWhatsAppLink(selectedOrder, updatingStatus);
                          if (link) window.open(link, '_blank');
                        }}
                        sx={{ bgcolor: '#25d366', '&:hover': { bgcolor: '#1ebe5d' }, borderRadius: 2, px: 2.5, fontWeight: 600, gap: 1 }}
                      >
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                        Notify Customer
                      </Button>
                    )}
                    <Button onClick={() => { setSelectedOrder(null); setStatusSaved(false); }} sx={{ color: '#6b7280' }}>Done</Button>
                  </>
                ) : (
                  <>
                    <Button onClick={() => setSelectedOrder(null)} sx={{ color: '#6b7280' }}>Cancel</Button>
                    <Button
                      variant="contained"
                      disabled={isSavingStatus || updatingStatus === selectedOrder.status}
                      onClick={handleUpdateStatus}
                      sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, borderRadius: 2, px: 3, fontWeight: 600 }}
                    >
                      {isSavingStatus ? 'Saving…' : 'Save Status'}
                    </Button>
                  </>
                )}
              </DialogActions>
            </>
          );
        })()}
      </Dialog>
    </Box>
  );
}
