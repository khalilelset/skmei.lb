'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';

interface Coupon {
  id: string;
  code: string;
  discount: number;
  active: boolean;
  created_at: string;
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCode, setNewCode] = useState('');
  const [newDiscount, setNewDiscount] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const loadCoupons = useCallback(() => {
    fetch('/api/admin/coupons')
      .then((r) => r.json())
      .then((data) => { setCoupons(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  const handleToggleActive = async (coupon: Coupon) => {
    await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !coupon.active }),
    });
    loadCoupons();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this coupon? This cannot be undone.')) return;
    await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' });
    loadCoupons();
  };

  const handleCreate = async () => {
    if (!newCode || !newDiscount) return;
    setIsSaving(true);
    await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: newCode, discount: parseInt(newDiscount) }),
    });
    setIsSaving(false);
    setDialogOpen(false);
    setNewCode('');
    setNewDiscount('');
    loadCoupons();
  };

  const columns: Column[] = [
    {
      id: 'code',
      label: 'Code',
      minWidth: 150,
      format: (value) => (
        <Typography sx={{ fontWeight: 700, fontSize: 15, letterSpacing: 1, color: '#DC2626' }}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'discount',
      label: 'Discount',
      minWidth: 120,
      align: 'center',
      format: (value) => (
        <Chip
          label={`${value}% OFF`}
          size="small"
          sx={{ bgcolor: 'rgba(220,38,38,0.1)', color: '#DC2626', fontWeight: 700 }}
        />
      ),
    },
    {
      id: 'active',
      label: 'Status',
      minWidth: 120,
      align: 'center',
      sortable: false,
      format: (value, row: Coupon) => (
        <FormControlLabel
          control={
            <Switch
              checked={value}
              onChange={() => handleToggleActive(row)}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#DC2626' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#DC2626' } }}
            />
          }
          label={<Typography variant="body2" sx={{ color: value ? '#22C55E' : 'text.secondary', fontWeight: 600 }}>{value ? 'Active' : 'Inactive'}</Typography>}
        />
      ),
    },
    {
      id: 'created_at',
      label: 'Created',
      minWidth: 120,
      format: (value) => new Date(value).toLocaleDateString(),
    },
    {
      id: 'id',
      label: 'Actions',
      minWidth: 80,
      align: 'center',
      sortable: false,
      format: (value) => (
        <Tooltip title="Delete coupon">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleDelete(value); }}
            sx={{ color: '#EF4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Coupons</Typography>
          <Typography variant="body1" color="text.secondary">Manage discount codes for your store</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setDialogOpen(true)}
          sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
        >
          Add Coupon
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          <Chip
            label={`${coupons.filter(c => c.active).length} Active`}
            size="small"
            sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22C55E', fontWeight: 600 }}
          />
          <Chip
            label={`${coupons.filter(c => !c.active).length} Inactive`}
            size="small"
            sx={{ bgcolor: 'rgba(0,0,0,0.05)', color: 'text.secondary', fontWeight: 600 }}
          />
        </Box>
        <DataTable
          columns={columns}
          data={coupons}
          emptyMessage={isLoading ? 'Loading...' : 'No coupons found. Create one above.'}
        />
      </Paper>

      {/* Create Coupon Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>New Coupon</Typography>
          <Button onClick={() => setDialogOpen(false)} sx={{ minWidth: 'auto', color: 'text.secondary' }}>
            <CloseIcon />
          </Button>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Coupon Code *"
                placeholder="e.g. SUMMER20"
                value={newCode}
                onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                inputProps={{ style: { textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 } }}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Discount Percentage *"
                placeholder="e.g. 15"
                value={newDiscount}
                onChange={(e) => setNewDiscount(e.target.value)}
                inputProps={{ min: 1, max: 100 }}
                InputProps={{ endAdornment: <Typography sx={{ color: 'text.secondary', mr: 1 }}>%</Typography> }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={isSaving || !newCode || !newDiscount}
            onClick={handleCreate}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {isSaving ? 'Creating...' : 'Create Coupon'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
