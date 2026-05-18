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
  IconButton,
  Tooltip,
  MenuItem,
  Stack,
  Collapse,
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  AutoAwesome as DefaultsIcon,
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableSkeleton from '@/components/admin/TableSkeleton';
import MobileDialog from '@/components/admin/MobileDialog';

interface BrandDefaults {
  price?: string;
  costPrice?: string;
  originalPrice?: string;
  category?: string;
  gender?: string;
  features?: string[];
  specifications?: Record<string, string>;
}

interface Brand {
  id: string;
  name: string;
  warranty_value: number | null;
  warranty_unit: string | null;
  defaults: BrandDefaults | null;
  created_at: string;
}

const WARRANTY_UNITS = [
  { value: 'days',   label: 'Days' },
  { value: 'weeks',  label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years',  label: 'Years' },
];

const SPEC_FIELDS = [
  { key: 'movement',        label: 'Movement' },
  { key: 'caseMaterial',    label: 'Case Material' },
  { key: 'bandMaterial',    label: 'Band Material' },
  { key: 'dialColor',       label: 'Dial Color' },
  { key: 'caseSize',        label: 'Case Size' },
  { key: 'waterResistance', label: 'Water Resistance' },
  { key: 'warranty',        label: 'Warranty' },
];

const emptyDefaults: BrandDefaults = {
  price: '', costPrice: '', originalPrice: '',
  category: '', gender: '',
  features: [],
  specifications: { movement: '', caseMaterial: '', bandMaterial: '', dialColor: '', caseSize: '', waterResistance: '', warranty: '' },
};

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [warrantyValue, setWarrantyValue] = useState<string>('');
  const [warrantyUnit, setWarrantyUnit] = useState<string>('months');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Defaults state
  const [showDefaults, setShowDefaults] = useState(false);
  const [defaults, setDefaults] = useState<BrandDefaults>({ ...emptyDefaults, features: [], specifications: { ...emptyDefaults.specifications } });
  const [featureInput, setFeatureInput] = useState('');
  const [categories, setCategories] = useState<{ slug: string; name: string }[]>([]);

  const load = useCallback(() => {
    setIsLoading(true);
    fetch('/api/admin/brands')
      .then((r) => r.json())
      .then((data) => { setBrands(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const resetDefaults = () => setDefaults({ ...emptyDefaults, features: [], specifications: { ...emptyDefaults.specifications } });

  const openCreate = () => {
    setEditId(null);
    setName('');
    setWarrantyValue('');
    setWarrantyUnit('months');
    setError('');
    setShowDefaults(false);
    resetDefaults();
    setFeatureInput('');
    setDialogOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditId(brand.id);
    setName(brand.name);
    setWarrantyValue(brand.warranty_value != null ? String(brand.warranty_value) : '');
    setWarrantyUnit(brand.warranty_unit ?? 'months');
    setError('');
    const d = brand.defaults;
    if (d) {
      setDefaults({
        price:          d.price         ?? '',
        costPrice:      d.costPrice     ?? '',
        originalPrice:  d.originalPrice ?? '',
        category:       d.category      ?? '',
        gender:         d.gender        ?? '',
        features:       d.features      ?? [],
        specifications: { ...emptyDefaults.specifications, ...(d.specifications ?? {}) },
      });
      setShowDefaults(true);
    } else {
      resetDefaults();
      setShowDefaults(false);
    }
    setFeatureInput('');
    setDialogOpen(true);
  };

  const setSpec = (key: string, value: string) =>
    setDefaults((d) => ({ ...d, specifications: { ...d.specifications, [key]: value } }));

  const addFeature = () => {
    const v = featureInput.trim();
    if (!v) return;
    setDefaults((d) => ({ ...d, features: [...(d.features ?? []), v] }));
    setFeatureInput('');
  };

  const removeFeature = (i: number) =>
    setDefaults((d) => ({ ...d, features: (d.features ?? []).filter((_, idx) => idx !== i) }));

  const buildDefaultsPayload = (): BrandDefaults | null => {
    const hasAny =
      defaults.price || defaults.costPrice || defaults.originalPrice ||
      defaults.category || defaults.gender ||
      (defaults.features ?? []).length > 0 ||
      Object.values(defaults.specifications ?? {}).some(Boolean);
    if (!hasAny) return null;
    return {
      price:          defaults.price         || undefined,
      costPrice:      defaults.costPrice     || undefined,
      originalPrice:  defaults.originalPrice || undefined,
      category:       defaults.category      || undefined,
      gender:         defaults.gender        || undefined,
      features:       (defaults.features ?? []).length > 0 ? defaults.features : undefined,
      specifications: Object.values(defaults.specifications ?? {}).some(Boolean)
        ? defaults.specifications : undefined,
    };
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Brand name is required.'); return; }
    setIsSaving(true);
    setError('');
    const url = editId ? `/api/admin/brands/${editId}` : '/api/admin/brands';
    const parsed = warrantyValue.trim() ? parseInt(warrantyValue) : null;
    const res = await fetch(url, {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        warranty_value: parsed,
        warranty_unit: parsed != null ? warrantyUnit : null,
        defaults: showDefaults ? buildDefaultsPayload() : null,
      }),
    });
    const data = await res.json();
    setIsSaving(false);
    if (!res.ok) { setError(data.error ?? 'Something went wrong.'); return; }
    setDialogOpen(false);
    load();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsDeleting(true);
    await fetch(`/api/admin/brands/${deleteId}`, { method: 'DELETE' });
    setBrands((prev) => prev.filter((b) => b.id !== deleteId));
    setDeleteId(null);
    setIsDeleting(false);
  };

  const columns: Column[] = [
    {
      id: 'name',
      label: 'Brand Name',
      format: (value) => (
        <Typography sx={{ fontWeight: 700, color: '#DC2626' }}>{value}</Typography>
      ),
    },
    {
      id: 'warranty_value',
      label: 'Warranty',
      format: (_value, row: Brand) => (
        <Typography variant="body2" color="text.secondary">
          {row.warranty_value != null && row.warranty_unit
            ? `${row.warranty_value} ${row.warranty_unit}`
            : '—'}
        </Typography>
      ),
    },
    {
      id: 'defaults',
      label: 'Defaults',
      minWidth: 100,
      align: 'center',
      sortable: false,
      format: (value) => value ? (
        <Chip
          icon={<DefaultsIcon sx={{ fontSize: '14px !important' }} />}
          label="Set"
          size="small"
          sx={{ bgcolor: 'rgba(99,102,241,0.1)', color: '#6366f1', fontWeight: 600, fontSize: 11 }}
        />
      ) : (
        <Typography variant="caption" color="text.disabled">—</Typography>
      ),
    },
    {
      id: 'created_at',
      label: 'Added',
      format: (value) => (
        <Typography variant="body2" color="text.secondary">
          {new Date(value).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
        </Typography>
      ),
    },
    {
      id: 'id',
      label: 'Actions',
      align: 'center',
      sortable: false,
      format: (_value, row: Brand) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }} sx={{ color: '#6366f1' }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); setDeleteId(row.id); }} sx={{ color: '#EF4444' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Brands</Typography>
          <Typography variant="body1" color="text.secondary">Manage watch brands available in the store</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
        >
          Add Brand
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {brands.length} brand{brands.length !== 1 ? 's' : ''}
        </Typography>
        {isLoading ? (
          <TableSkeleton columns={4} rows={4} />
        ) : (
          <DataTable columns={columns} data={brands} emptyMessage="No brands yet. Add one above." />
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <MobileDialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>{editId ? 'Edit Brand' : 'Add Brand'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Stack spacing={2.5}>

            {/* Basic info */}
            <TextField
              fullWidth size="small" label="Brand Name *" placeholder="e.g. SKMEI"
              value={name} onChange={(e) => setName(e.target.value)}
              error={!!error} helperText={error}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }} autoFocus
            />
            <Box>
              <Typography variant="caption" color="text.secondary" sx={{ mb: 0.75, display: 'block' }}>
                Warranty (optional)
              </Typography>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <TextField
                  size="small" type="number" label="Duration" placeholder="e.g. 12"
                  value={warrantyValue} onChange={(e) => setWarrantyValue(e.target.value)}
                  inputProps={{ min: 0 }} sx={{ flex: 1 }}
                />
                <TextField
                  size="small" select label="Unit" value={warrantyUnit}
                  onChange={(e) => setWarrantyUnit(e.target.value)} sx={{ width: 120 }}
                >
                  {WARRANTY_UNITS.map((u) => <MenuItem key={u.value} value={u.value}>{u.label}</MenuItem>)}
                </TextField>
              </Box>
            </Box>

            {/* Product Defaults toggle */}
            <Box>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => setShowDefaults((v) => !v)}
                startIcon={<DefaultsIcon />}
                endIcon={showDefaults ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                sx={{
                  justifyContent: 'space-between',
                  borderColor: showDefaults ? '#6366f1' : 'divider',
                  color: showDefaults ? '#6366f1' : 'text.secondary',
                  textTransform: 'none',
                  fontWeight: 600,
                  '&:hover': { borderColor: '#6366f1', bgcolor: 'rgba(99,102,241,0.04)' },
                }}
              >
                Product Defaults
                {showDefaults && (
                  <Typography component="span" variant="caption" sx={{ ml: 'auto', mr: 1, color: 'text.disabled' }}>
                    auto-fill when brand is selected
                  </Typography>
                )}
              </Button>

              <Collapse in={showDefaults}>
                <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>

                  {/* Pricing */}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Pricing
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small" label="Sale Price" type="number" placeholder="e.g. 29.99"
                      value={defaults.price} onChange={(e) => setDefaults((d) => ({ ...d, price: e.target.value }))}
                      InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: 13 }}>$</Typography> }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small" label="Cost Price" type="number" placeholder="e.g. 15"
                      value={defaults.costPrice} onChange={(e) => setDefaults((d) => ({ ...d, costPrice: e.target.value }))}
                      InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: 13 }}>$</Typography> }}
                      sx={{ flex: 1 }}
                    />
                    <TextField
                      size="small" label="Original Price" type="number" placeholder="e.g. 39.99"
                      value={defaults.originalPrice} onChange={(e) => setDefaults((d) => ({ ...d, originalPrice: e.target.value }))}
                      InputProps={{ startAdornment: <Typography sx={{ mr: 0.5, color: 'text.secondary', fontSize: 13 }}>$</Typography> }}
                      sx={{ flex: 1 }}
                    />
                  </Box>

                  {/* Category + Gender */}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Classification
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small" select label="Category" value={defaults.category ?? ''}
                      onChange={(e) => setDefaults((d) => ({ ...d, category: e.target.value }))}
                      sx={{ flex: 1 }}
                    >
                      <MenuItem value=""><em>— None —</em></MenuItem>
                      {categories.map((c) => <MenuItem key={c.slug} value={c.slug}>{c.name}</MenuItem>)}
                    </TextField>
                    <TextField
                      size="small" select label="Gender" value={defaults.gender ?? ''}
                      onChange={(e) => setDefaults((d) => ({ ...d, gender: e.target.value }))}
                      sx={{ flex: 1 }}
                    >
                      <MenuItem value=""><em>— None —</em></MenuItem>
                      <MenuItem value="men">Men</MenuItem>
                      <MenuItem value="women">Women</MenuItem>
                      <MenuItem value="unisex">Unisex</MenuItem>
                    </TextField>
                  </Box>

                  {/* Features */}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Features
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <TextField
                      size="small" fullWidth placeholder="e.g. Water resistant"
                      value={featureInput}
                      onChange={(e) => setFeatureInput(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } }}
                    />
                    <Button variant="outlined" onClick={addFeature} sx={{ whiteSpace: 'nowrap', minWidth: 80 }}>Add</Button>
                  </Box>
                  {(defaults.features ?? []).length > 0 && (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                      {(defaults.features ?? []).map((f, i) => (
                        <Chip key={i} label={f} size="small" onDelete={() => removeFeature(i)} />
                      ))}
                    </Box>
                  )}

                  {/* Specifications */}
                  <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 1 }}>
                    Specifications
                  </Typography>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                    {SPEC_FIELDS.map((f) => (
                      <TextField
                        key={f.key}
                        size="small"
                        label={f.label}
                        value={(defaults.specifications ?? {})[f.key] ?? ''}
                        onChange={(e) => setSpec(f.key, e.target.value)}
                      />
                    ))}
                  </Box>
                </Box>
              </Collapse>
            </Box>

          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={isSaving || !name.trim()}
            onClick={handleSave}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {isSaving ? 'Saving...' : editId ? 'Save Changes' : 'Add Brand'}
          </Button>
        </DialogActions>
      </MobileDialog>

      {/* Delete Confirm */}
      <MobileDialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderTop: '3px solid #DC2626' } }}>
        <DialogTitle>Delete Brand?</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary">
            This will remove the brand. Products using this brand name will not be affected.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} disabled={isDeleting}>Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={isDeleting}>
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </MobileDialog>
    </Box>
  );
}
