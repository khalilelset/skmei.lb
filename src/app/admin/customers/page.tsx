'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Grid,
  Divider,
  Stack,
} from '@mui/material';
import {
  Search as SearchIcon,
  Close as CloseIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  ShoppingBag as OrderIcon,
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';
import { getCustomers, getCustomerOrders } from '@/data/mockData';
import { formatDate, formatPrice } from '@/lib/utils';
import type { Customer } from '@/types';

export default function CustomersPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const customers = getCustomers();

  // Filter customers based on search
  const filteredCustomers = useMemo(() => {
    return customers.filter((customer) =>
      `${customer.firstName} ${customer.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [customers, searchQuery]);

  const columns: Column[] = [
    {
      id: 'avatar',
      label: '',
      minWidth: 60,
      sortable: false,
      format: (_, customer: Customer) => (
        <Avatar
          sx={{
            width: 40,
            height: 40,
            bgcolor: '#DC2626',
            fontWeight: 600,
          }}
        >
          {`${customer.firstName} ${customer.lastName}`.charAt(0).toUpperCase()}
        </Avatar>
      ),
    },
    {
      id: 'firstName',
      label: 'Customer Name',
      minWidth: 200,
      format: (_, customer: Customer) => (
        <Box>
          <Typography sx={{ fontWeight: 600 }}>{customer.firstName} {customer.lastName}</Typography>
          <Typography variant="caption" color="text.secondary">
            {customer.email}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'phone',
      label: 'Phone',
      minWidth: 140,
      format: (value) => (
        <Typography variant="body2">{value}</Typography>
      ),
    },
    {
      id: 'totalOrders',
      label: 'Total Orders',
      minWidth: 120,
      align: 'center',
      format: (_, customer: Customer) => {
        const orderCount = getCustomerOrders(customer.id).length;
        return (
          <Chip
            label={orderCount}
            size="small"
            sx={{
              bgcolor: 'rgba(220, 38, 38, 0.1)',
              color: '#DC2626',
              fontWeight: 600,
            }}
          />
        );
      },
    },
    {
      id: 'createdAt',
      label: 'Member Since',
      minWidth: 140,
      format: (value) => formatDate(value),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 100,
      align: 'center',
      sortable: false,
      format: () => (
        <Chip
          label="Active"
          size="small"
          sx={{
            bgcolor: 'rgba(34, 197, 94, 0.1)',
            color: '#22C55E',
            fontWeight: 600,
          }}
        />
      ),
    },
  ];

  const handleRowClick = (customer: Customer) => {
    setSelectedCustomer(customer);
  };

  const handleCloseDialog = () => {
    setSelectedCustomer(null);
  };

  const customerOrders = selectedCustomer ? getCustomerOrders(selectedCustomer.id) : [];

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
          Customers Management
        </Typography>
        <Typography variant="body1" color="text.secondary">
          View and manage your customer base
        </Typography>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by name, email, or phone..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      {/* Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#DC2626' }}>
              {customers.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Customers
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#22C55E' }}>
              {customers.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Active Customers
            </Typography>
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h4" sx={{ fontWeight: 700, color: '#3B82F6' }}>
              0
            </Typography>
            <Typography variant="body2" color="text.secondary">
              New This Month
            </Typography>
          </Paper>
        </Grid>
      </Grid>

      {/* Customers Table */}
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Showing {filteredCustomers.length} of {customers.length} customers
        </Typography>
        <DataTable
          columns={columns}
          data={filteredCustomers}
          onRowClick={handleRowClick}
          emptyMessage="No customers found. Try adjusting your search."
        />
      </Box>

      {/* Customer Details Dialog */}
      <Dialog
        open={!!selectedCustomer}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        {selectedCustomer && (
          <>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar
                  sx={{
                    width: 56,
                    height: 56,
                    bgcolor: '#DC2626',
                    fontWeight: 600,
                    fontSize: 24,
                  }}
                >
                  {`${selectedCustomer.firstName} ${selectedCustomer.lastName}`.charAt(0).toUpperCase()}
                </Avatar>
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {`${selectedCustomer.firstName} ${selectedCustomer.lastName}`}
                  </Typography>
                  <Chip
                    label="Active"
                    size="small"
                    sx={{
                      bgcolor: 'rgba(34, 197, 94, 0.1)',
                      color: '#22C55E',
                      fontWeight: 600,
                      mt: 0.5,
                    }}
                  />
                </Box>
              </Box>
              <Button
                onClick={handleCloseDialog}
                sx={{ minWidth: 'auto', color: 'text.secondary' }}
              >
                <CloseIcon />
              </Button>
            </DialogTitle>
            <DialogContent dividers>
              <Grid container spacing={3}>
                {/* Contact Information */}
                <Grid size={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Contact Information
                  </Typography>
                  <Stack spacing={1.5}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2">{selectedCustomer.email}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon sx={{ color: 'text.secondary', fontSize: 20 }} />
                      <Typography variant="body2">{selectedCustomer.phone}</Typography>
                    </Box>
                  </Stack>
                </Grid>

                {/* Addresses */}
                <Grid size={12}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 2 }}>
                    Addresses
                  </Typography>
                  <Stack spacing={2}>
                    {selectedCustomer.addresses.map((address, index) => (
                      <Paper key={index} sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                        <Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
                          {address.street}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {address.city}, {address.state} {address.postalCode}
                        </Typography>
                      </Paper>
                    ))}
                  </Stack>
                </Grid>

                <Grid size={12}>
                  <Divider />
                </Grid>

                {/* Order History */}
                <Grid size={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <OrderIcon sx={{ color: '#DC2626' }} />
                    <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                      Order History ({customerOrders.length} orders)
                    </Typography>
                  </Box>
                  {customerOrders.length > 0 ? (
                    <Stack spacing={2}>
                      {customerOrders.map((order) => (
                        <Paper key={order.id} sx={{ p: 2, bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {order.orderNumber}
                            </Typography>
                            <Chip
                              label={order.status}
                              size="small"
                              sx={{
                                textTransform: 'capitalize',
                                fontSize: 11,
                              }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography variant="caption" color="text.secondary">
                              {formatDate(order.createdAt)}
                            </Typography>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#DC2626' }}>
                              {formatPrice(order.total)}
                            </Typography>
                          </Box>
                        </Paper>
                      ))}
                    </Stack>
                  ) : (
                    <Paper sx={{ p: 3, textAlign: 'center', bgcolor: 'rgba(0, 0, 0, 0.02)' }}>
                      <Typography variant="body2" color="text.secondary">
                        No orders yet
                      </Typography>
                    </Paper>
                  )}
                </Grid>

                {/* Account Info */}
                <Grid size={12}>
                  <Divider sx={{ mb: 2 }} />
                  <Typography variant="caption" color="text.secondary">
                    Member since {formatDate(selectedCustomer.createdAt)}
                  </Typography>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
              <Button
                variant="contained"
                sx={{
                  bgcolor: '#DC2626',
                  '&:hover': { bgcolor: '#B91C1C' },
                }}
              >
                Contact Customer
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
