'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
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
  InputAdornment,
  MenuItem,
  OutlinedInput,
  Select,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableSkeleton from '@/components/admin/TableSkeleton';
import MobileDialog from '@/components/admin/MobileDialog';

interface Coupon {
  id: string;
  code: string;
  discount: number;
  active: boolean;
  expires_at: string | null;
  max_discount: number | null;
  apply_on_sale: boolean;
  brands: string[] | null;
  created_at: string;
}

const emptyForm = {
  code: '',
  discount: '',
  expires_at: '',
  max_discount: '',
  apply_on_sale: true,
  brands: [] as string[],
};

function isExpired(coupon: Coupon): boolean {
  return !!coupon.expires_at && new Date(coupon.expires_at) < new Date();
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [brandOptions, setBrandOptions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  const loadCoupons = useCallback(() => {
    fetch('/api/admin/coupons')
      .then((r) => r.json())
      .then((data) => { setCoupons(data); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadCoupons(); }, [loadCoupons]);

  useEffect(() => {
    fetch('/api/admin/brands')
      .then(r => r.json())
      .then((data: { name: string }[]) => setBrandOptions(Array.isArray(data) ? data.map(b => b.name) : []))
      .catch(() => {});
  }, []);

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
    if (!form.code || !form.discount) return;
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          discount: Number(form.discount),
          expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
          max_discount: form.max_discount !== '' ? Number(form.max_discount) : null,
          apply_on_sale: form.apply_on_sale,
          brands: form.brands.length > 0 ? form.brands : null,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        alert(`Failed to create coupon: ${(err as { error?: string }).error ?? res.statusText}`);
        return;
      }
      setDialogOpen(false);
      setForm(emptyForm);
      loadCoupons();
    } finally {
      setIsSaving(false);
    }
  };

  const activeCount  = coupons.filter((c) => c.active && !isExpired(c)).length;
  const expiredCount = coupons.filter((c) => isExpired(c)).length;

  const columns: Column[] = [
    {
      id: 'code',
      label: 'Code',
      minWidth: 140,
      format: (value) => (
        <Typography sx={{ fontWeight: 700, fontSize: 14, letterSpacing: 1.5, color: '#DC2626', fontFamily: 'monospace' }}>
          {value as string}
        </Typography>
      ),
    },
    {
      id: 'discount',
      label: 'Discount',
      minWidth: 110,
      align: 'center',
      format: (value, row: Coupon) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Chip
            label={`${value}% OFF`}
            size="small"
            sx={{ bgcolor: 'rgba(220,38,38,0.1)', color: '#DC2626', fontWeight: 700 }}
          />
          {row.max_discount != null && (
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: 10 }}>
              up to ${row.max_discount}
            </Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'brands',
      label: 'Applies To',
      minWidth: 130,
      align: 'center',
      sortable: false,
      format: (value) => {
        const brands = value as string[] | null;
        if (!brands || brands.length === 0) {
          return <Chip label="All Brands" size="small" sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22C55E', fontWeight: 600, fontSize: 11 }} />;
        }
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            {brands.map(b => (
              <Chip key={b} label={b} size="small" sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontWeight: 600, fontSize: 10 }} />
            ))}
          </Box>
        );
      },
    },
    {
      id: 'apply_on_sale',
      label: 'On Sale Items',
      minWidth: 110,
      align: 'center',
      sortable: false,
      format: (value) => (
        <Chip
          label={value ? 'Yes' : 'No'}
          size="small"
          sx={{
            bgcolor: value ? 'rgba(59,130,246,0.1)' : 'rgba(245,158,11,0.1)',
            color: value ? '#3B82F6' : '#F59E0B',
            fontWeight: 600,
            fontSize: 11,
          }}
        />
      ),
    },
    {
      id: 'expires_at',
      label: 'Expires',
      minWidth: 120,
      format: (value, row: Coupon) => {
        if (!value) return <Typography variant="caption" color="text.disabled">Never</Typography>;
        const expired = isExpired(row);
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.25 }}>
            <Typography variant="caption" sx={{ color: expired ? '#EF4444' : 'text.secondary', fontWeight: expired ? 600 : 400 }}>
              {formatDate(value as string)}
            </Typography>
            {expired && (
              <Typography variant="caption" sx={{ fontSize: 10, color: '#EF4444', fontWeight: 700 }}>EXPIRED</Typography>
            )}
          </Box>
        );
      },
    },
    {
      id: 'active',
      label: 'Status',
      minWidth: 120,
      align: 'center',
      sortable: false,
      format: (value, row: Coupon) => {
        const expired = isExpired(row);
        if (expired) {
          return <Chip label="Expired" size="small" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600 }} />;
        }
        return (
          <FormControlLabel
            control={
              <Switch
                checked={value as boolean}
                onChange={() => handleToggleActive(row)}
                sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#DC2626' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#DC2626' } }}
              />
            }
            label={
              <Typography variant="body2" sx={{ color: value ? '#22C55E' : 'text.secondary', fontWeight: 600 }}>
                {value ? 'Active' : 'Inactive'}
              </Typography>
            }
          />
        );
      },
    },
    {
      id: 'id',
      label: 'Actions',
      minWidth: 70,
      align: 'center',
      sortable: false,
      format: (value) => (
        <Tooltip title="Delete coupon">
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleDelete(value as string); }}
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
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2, flexWrap: 'wrap' }}>
          <Chip label={`${activeCount} Active`} size="small" sx={{ bgcolor: 'rgba(34,197,94,0.1)', color: '#22C55E', fontWeight: 600 }} />
          <Chip label={`${coupons.filter(c => !c.active && !isExpired(c)).length} Inactive`} size="small" sx={{ bgcolor: 'rgba(0,0,0,0.05)', color: 'text.secondary', fontWeight: 600 }} />
          {expiredCount > 0 && (
            <Chip label={`${expiredCount} Expired`} size="small" sx={{ bgcolor: 'rgba(239,68,68,0.1)', color: '#EF4444', fontWeight: 600 }} />
          )}
        </Box>
        {isLoading ? (
          <TableSkeleton columns={7} rows={6} />
        ) : (
          <DataTable columns={columns} data={coupons} emptyMessage="No coupons found. Create one above." />
        )}
      </Paper>

      {/* Create Coupon Dialog */}
      <MobileDialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>New Coupon</Typography>
          <Button onClick={() => setDialogOpen(false)} sx={{ minWidth: 'auto', color: 'text.secondary' }}>
            <CloseIcon />
          </Button>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Code */}
            <Grid size={12}>
              <TextField
                fullWidth size="small"
                label="Coupon Code *"
                placeholder="e.g. SUMMER20"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                inputProps={{ style: { textTransform: 'uppercase', letterSpacing: 2, fontWeight: 700, fontFamily: 'monospace' } }}
              />
            </Grid>

            {/* Discount % */}
            <Grid size={6}>
              <TextField
                fullWidth size="small"
                type="number"
                label="Discount % *"
                placeholder="e.g. 15"
                value={form.discount}
                onChange={(e) => setForm((f) => ({ ...f, discount: e.target.value }))}
                inputProps={{ min: 1, max: 100 }}
                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
              />
            </Grid>

            {/* Max discount $ */}
            <Grid size={6}>
              <TextField
                fullWidth size="small"
                type="number"
                label="Max Discount"
                placeholder="e.g. 12"
                value={form.max_discount}
                onChange={(e) => setForm((f) => ({ ...f, max_discount: e.target.value }))}
                inputProps={{ min: 0, step: 0.5 }}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                helperText="Leave empty for no cap"
              />
            </Grid>

            {/* Brand restriction */}
            <Grid size={12}>
              <FormControl fullWidth size="small">
                <InputLabel>Applies To (brands)</InputLabel>
                <Select
                  multiple
                  value={form.brands}
                  onChange={(e) => setForm(f => ({ ...f, brands: e.target.value as string[] }))}
                  input={<OutlinedInput label="Applies To (brands)" />}
                  renderValue={(selected) =>
                    (selected as string[]).length === 0
                      ? <em style={{ color: '#9CA3AF' }}>All brands</em>
                      : (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as string[]).map(b => <Chip key={b} label={b} size="small" />)}
                        </Box>
                      )
                  }
                >
                  {brandOptions.map(name => (
                    <MenuItem key={name} value={name}>{name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                Leave empty to apply to all brands
              </Typography>
            </Grid>

            {/* Expiry date */}
            <Grid size={12}>
              <TextField
                fullWidth size="small"
                type="date"
                label="Expiry Date"
                value={form.expires_at}
                onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))}
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: new Date().toISOString().split('T')[0] }}
                helperText="Leave empty for no expiry"
              />
            </Grid>

            {/* Apply on sale items */}
            <Grid size={12}>
              <Box sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, px: 2, py: 1.5 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={form.apply_on_sale}
                      onChange={(e) => setForm((f) => ({ ...f, apply_on_sale: e.target.checked }))}
                      sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#DC2626' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#DC2626' } }}
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body2" fontWeight={600}>Apply on sale items</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {form.apply_on_sale ? 'Discount applies to all items including those on sale' : 'Discount only applies to full-price items'}
                      </Typography>
                    </Box>
                  }
                />
              </Box>
            </Grid>

            {/* Preview */}
            {form.code && form.discount && (
              <Grid size={12}>
                <Box sx={{ bgcolor: 'rgba(220,38,38,0.04)', border: '1px dashed rgba(220,38,38,0.3)', borderRadius: 2, p: 1.5 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    Preview
                  </Typography>
                  <Typography sx={{ fontWeight: 700, fontSize: 13, color: '#DC2626', fontFamily: 'monospace', letterSpacing: 1 }}>
                    {form.code}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {form.discount}% off
                    {form.max_discount && ` · up to $${form.max_discount}`}
                    {form.brands.length > 0 && ` · ${form.brands.join(', ')} only`}
                    {!form.apply_on_sale && ' · excludes sale items'}
                    {form.expires_at && ` · expires ${new Date(form.expires_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`}
                  </Typography>
                </Box>
              </Grid>
            )}
          </Grid>
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={isSaving || !form.code || !form.discount}
            onClick={handleCreate}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {isSaving ? 'Creating...' : 'Create Coupon'}
          </Button>
        </DialogActions>
      </MobileDialog>
    </Box>
  );
}
