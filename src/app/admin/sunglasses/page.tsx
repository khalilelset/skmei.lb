'use client';

import 'react-easy-crop/react-easy-crop.css';
import { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Paper, Button, TextField, Grid, Chip,
  IconButton, Tooltip, Switch, FormControlLabel, MenuItem,
  InputAdornment, CircularProgress, Dialog, Slider,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Close as CloseIcon,
  CloudUpload as UploadIcon, FiberNew as NewIcon, LocalOffer as SaleIcon,
  Star as BestsellerIcon, Visibility as VisIcon, VisibilityOff as VisOffIcon,
  Link as LinkIcon, VideoFile as VideoIcon,
  ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableSkeleton from '@/components/admin/TableSkeleton';
import MobileDialog from '@/components/admin/MobileDialog';
import { formatPrice } from '@/lib/utils';
import { uploadVideoDirectly } from '@/lib/uploadVideo';
import type { Sunglasses, SunglassesVariant } from '@/types';

// ── Colour presets (same palette as products admin) ──────────────────────────
const COLOR_PRESETS = [
  { name: 'Black',      hex: '#1a1a1a' }, { name: 'White',       hex: '#ffffff' },
  { name: 'Silver',     hex: '#C0C0C0' }, { name: 'Gold',        hex: '#FFD700' },
  { name: 'Rose Gold',  hex: '#B76E79' }, { name: 'Pink',        hex: '#FFC0CB' },
  { name: 'Red',        hex: '#DC2626' }, { name: 'Navy',        hex: '#1E3A5F' },
  { name: 'Blue',       hex: '#3B82F6' }, { name: 'Light Blue',  hex: '#93C5FD' },
  { name: 'Green',      hex: '#22C55E' }, { name: 'Orange',      hex: '#F97316' },
  { name: 'Brown',      hex: '#92400E' }, { name: 'Grey',        hex: '#6B7280' },
  { name: 'Tortoise',   hex: '#8B4513' }, { name: 'Transparent', hex: '#e0e0e0' },
  { name: 'Gunmetal',   hex: '#2C3539' }, { name: 'Champagne',   hex: '#F7E7CE' },
];

const SPEC_KEYS = [
  { key: 'frameMaterial',  label: 'Frame Material' },
  { key: 'lensType',       label: 'Lens Type' },
  { key: 'uvProtection',   label: 'UV Protection' },
  { key: 'frameShape',     label: 'Frame Shape' },
  { key: 'frameSize',      label: 'Frame Size' },
  { key: 'lensWidth',      label: 'Lens Width' },
  { key: 'bridgeWidth',    label: 'Bridge Width' },
  { key: 'templeLength',   label: 'Temple Length' },
];

const emptySpecs = Object.fromEntries(SPEC_KEYS.map(k => [k.key, '']));

interface VariantForm {
  id: string;
  colorName: string;
  colorHex: string;
  images: string[];
  videoUrl: string;
  videoInputMode: 'upload' | 'url';
  uploading: boolean;
  uploadingVideo: boolean;
}

const emptyForm = () => ({
  name: '', slug: '', description: '', brand: 'SKMEI',
  price: '', originalPrice: '', stock: '',
  gender: '' as '' | 'men' | 'women' | 'unisex',
  isNew: false, isBestseller: false, onSale: false, isVisible: true,
  videoUrl: '',
  videoInputMode: 'url' as 'upload' | 'url',
  uploadingVideo: false,
  features: [] as string[],
  specifications: { ...emptySpecs } as Record<string, string>,
  variants: [] as VariantForm[],
});

function newVariant(): VariantForm {
  return { id: crypto.randomUUID(), colorName: '', colorHex: '#000000', images: [], videoUrl: '', videoInputMode: 'url', uploading: false, uploadingVideo: false };
}

function generateSlug(name: string) {
  return name.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-');
}

export default function AdminSunglassesPage() {
  const [rows, setRows]           = useState<Sunglasses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId]       = useState<string | null>(null);
  const [form, setForm]           = useState(emptyForm());
  const [isSaving, setIsSaving]   = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [colorPickerIdx, setColorPickerIdx] = useState<number | null>(null);
  const [sectionVisible, setSectionVisible] = useState(true);
  const [savingSection, setSavingSection]   = useState(false);

  // Crop dialog state
  const [cropSrc, setCropSrc]                     = useState<string | null>(null);
  const [cropVariantIdx, setCropVariantIdx]         = useState<number>(0);
  const [cropQueue, setCropQueue]                   = useState<File[]>([]);
  const [crop, setCrop]                             = useState({ x: 0, y: 0 });
  const [zoom, setZoom]                             = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels]   = useState<Area | null>(null);
  const [isCropUploading, setIsCropUploading]       = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    fetch('/api/admin/sunglasses')
      .then(r => r.json())
      .then(data => { setRows(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  // Load homepage section visibility setting
  useEffect(() => {
    fetch('/api/admin/settings')
      .then(r => r.json())
      .then(data => {
        if (typeof data.sunglasses_section_visible === 'boolean') {
          setSectionVisible(data.sunglasses_section_visible);
        }
      })
      .catch(() => {});
  }, []);

  const handleToggleSectionVisible = async (checked: boolean) => {
    setSectionVisible(checked);
    setSavingSection(true);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sunglasses_section_visible: checked }),
    });
    setSavingSection(false);
  };

  const openAdd = () => {
    setEditId(null);
    setForm(emptyForm());
    setDialogOpen(true);
  };

  const openEdit = (sg: Sunglasses) => {
    setEditId(sg.id);
    setForm({
      name: sg.name, slug: sg.slug, description: sg.description, brand: sg.brand,
      price: String(sg.price), originalPrice: sg.originalPrice ? String(sg.originalPrice) : '',
      stock: String(sg.stock), gender: sg.gender ?? '',
      isNew: sg.isNew ?? false, isBestseller: sg.isBestseller ?? false, onSale: sg.onSale ?? false, isVisible: sg.isVisible ?? true,
      videoUrl: (sg as Sunglasses & { videoUrl?: string | null }).videoUrl ?? '',
      videoInputMode: 'url' as const,
      uploadingVideo: false,
      features: [...sg.features],
      specifications: { ...emptySpecs, ...sg.specifications },
      variants: sg.variants.map(v => ({
        id: v.id, colorName: v.colorName, colorHex: v.colorHex,
        images: [...v.images], videoUrl: v.videoUrl ?? '',
        videoInputMode: 'url' as const, uploading: false, uploadingVideo: false,
      })),
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this sunglasses entry?')) return;
    await fetch(`/api/admin/sunglasses/${id}`, { method: 'DELETE' });
    load();
  };

  const handleToggleVisible = async (sg: Sunglasses) => {
    await fetch(`/api/admin/sunglasses/${sg.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_visible: !sg.isVisible }),
    });
    load();
  };

  // Variant helpers
  const addVariant = () => setForm(f => ({ ...f, variants: [...f.variants, newVariant()] }));
  const removeVariant = (idx: number) => setForm(f => ({ ...f, variants: f.variants.filter((_, i) => i !== idx) }));
  const updateVariant = (idx: number, patch: Partial<VariantForm>) =>
    setForm(f => ({ ...f, variants: f.variants.map((v, i) => i === idx ? { ...v, ...patch } : v) }));

  // Open crop dialog for selected files (1:1)
  const handleImageUpload = (idx: number, files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArr = Array.from(files);
    const [first, ...rest] = fileArr;
    setCropVariantIdx(idx);
    setCropQueue(rest);
    const reader = new FileReader();
    reader.onload = () => { setCropSrc(reader.result as string); setCrop({ x: 0, y: 0 }); setZoom(1); };
    reader.readAsDataURL(first);
  };

  // After crop confirmed — upload blob and open next file if any
  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setIsCropUploading(true);
    setCropSrc(null);
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      const fd = new FormData();
      fd.append('file', blob, 'image.jpg');
      fd.append('folder', 'sunglasses');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      if (res.ok) {
        const { url } = await res.json() as { url: string };
        const vi = cropVariantIdx;
        setForm(f => ({
          ...f,
          variants: f.variants.map((v, i) => i === vi ? { ...v, images: [...v.images, url] } : v),
        }));
      }
    } finally {
      setIsCropUploading(false);
      if (cropQueue.length > 0) {
        const [next, ...rest] = cropQueue;
        setCropQueue(rest);
        const reader = new FileReader();
        reader.onload = () => { setCropSrc(reader.result as string); setCrop({ x: 0, y: 0 }); setZoom(1); };
        reader.readAsDataURL(next);
      }
    }
  };

  const handleVideoUpload = async (idx: number, file: File) => {
    updateVariant(idx, { uploadingVideo: true });
    try {
      const url = await uploadVideoDirectly(file, 'sunglasses');
      updateVariant(idx, { videoUrl: url, uploadingVideo: false });
    } catch (e) {
      alert((e as Error).message);
      updateVariant(idx, { uploadingVideo: false });
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.price) return;
    setIsSaving(true);
    const body = {
      name:          form.name.trim(),
      slug:          form.slug || generateSlug(form.name),
      description:   form.description,
      brand:         form.brand,
      price:         Number(form.price),
      original_price: form.originalPrice ? Number(form.originalPrice) : null,
      stock:         Number(form.stock || 0),
      gender:        form.gender || 'unisex',
      is_new:        form.isNew,
      is_bestseller: form.isBestseller,
      on_sale:       form.onSale,
      is_visible:    form.isVisible,
      video_url:     form.videoUrl || null,
      features:      form.features,
      specifications: Object.fromEntries(Object.entries(form.specifications).filter(([, v]) => v.trim() !== '')),
      variants:      form.variants.map(v => ({
        id: v.id, colorName: v.colorName, colorHex: v.colorHex,
        images: v.images, videoUrl: v.videoUrl || null,
      })) as SunglassesVariant[],
    };
    const url    = editId ? `/api/admin/sunglasses/${editId}` : '/api/admin/sunglasses';
    const method = editId ? 'PATCH' : 'POST';
    const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    setIsSaving(false);
    if (res.ok) { setDialogOpen(false); load(); }
    else { const e = await res.json().catch(() => ({})); alert((e as { error?: string }).error ?? 'Save failed'); }
  };

  const columns: Column[] = [
    {
      id: 'name', label: 'Name', minWidth: 180,
      format: (value, row: Sunglasses) => (
        <Box>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{value as string}</Typography>
          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>{row.brand} · {row.gender}</Typography>
        </Box>
      ),
    },
    {
      id: 'price', label: 'Price', minWidth: 110, align: 'center',
      format: (value, row: Sunglasses) => (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Typography sx={{ fontWeight: 700, fontSize: 14 }}>{formatPrice(value as number)}</Typography>
          {row.originalPrice && (
            <Typography sx={{ fontSize: 11, color: 'text.secondary', textDecoration: 'line-through' }}>{formatPrice(row.originalPrice)}</Typography>
          )}
        </Box>
      ),
    },
    {
      id: 'stock', label: 'Stock', minWidth: 80, align: 'center',
      format: (value) => {
        const n = value as number;
        const color = n === 0 ? '#EF4444' : n < 5 ? '#FB923C' : '#22C55E';
        return <Chip label={n} size="small" sx={{ bgcolor: `${color}20`, color, fontWeight: 700, fontSize: 12 }} />;
      },
    },
    {
      id: 'variants', label: 'Colors', minWidth: 140, sortable: false,
      format: (value) => {
        const variants = value as SunglassesVariant[];
        return (
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {variants.map(v => (
              <Tooltip key={v.id} title={v.colorName}>
                <Box sx={{ width: 18, height: 18, borderRadius: '50%', bgcolor: v.colorHex, border: '1px solid rgba(0,0,0,0.15)' }} />
              </Tooltip>
            ))}
          </Box>
        );
      },
    },
    {
      id: 'isVisible', label: 'Visible', minWidth: 80, align: 'center', sortable: false,
      format: (value, row: Sunglasses) => (
        <IconButton size="small" onClick={e => { e.stopPropagation(); handleToggleVisible(row); }} sx={{ color: value ? '#22C55E' : 'text.disabled' }}>
          {value ? <VisIcon fontSize="small" /> : <VisOffIcon fontSize="small" />}
        </IconButton>
      ),
    },
    {
      id: 'id', label: 'Actions', minWidth: 100, align: 'center', sortable: false,
      format: (value, row: Sunglasses) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Button size="small" variant="outlined" onClick={e => { e.stopPropagation(); openEdit(row); }} sx={{ fontSize: 11, py: 0.5, px: 1 }}>Edit</Button>
          <IconButton size="small" onClick={e => { e.stopPropagation(); handleDelete(value as string); }} sx={{ color: '#EF4444' }}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 2, flexWrap: 'wrap' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Sunglasses</Typography>
          <Typography variant="body1" color="text.secondary">Manage sunglasses with per-color variants</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Homepage section visibility toggle */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, bgcolor: sectionVisible ? 'rgba(34,197,94,0.08)' : 'rgba(0,0,0,0.04)', border: '1px solid', borderColor: sectionVisible ? 'rgba(34,197,94,0.25)' : 'rgba(0,0,0,0.12)', borderRadius: 2, px: 2, py: 1 }}>
            {sectionVisible ? <VisIcon fontSize="small" sx={{ color: '#22C55E' }} /> : <VisOffIcon fontSize="small" sx={{ color: 'text.disabled' }} />}
            <Box>
              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                Homepage Section
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {sectionVisible ? 'Visible on website' : 'Hidden from website'}
              </Typography>
            </Box>
            <Switch
              checked={sectionVisible}
              onChange={e => handleToggleSectionVisible(e.target.checked)}
              disabled={savingSection}
              sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#22C55E' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#22C55E' } }}
            />
          </Box>
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd} sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
            Add Sunglasses
          </Button>
        </Box>
      </Box>

      <Paper sx={{ p: 3 }}>
        {isLoading ? <TableSkeleton columns={6} rows={5} /> : (
          <DataTable columns={columns} data={rows} emptyMessage="No sunglasses yet. Add one above." />
        )}
      </Paper>

      {/* ── Create / Edit Dialog ── */}
      <MobileDialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="md" fullWidth>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, pt: 2.5, pb: 1 }}>
          <Typography variant="h6" fontWeight={700}>{editId ? 'Edit Sunglasses' : 'New Sunglasses'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </Box>

        <Box sx={{ px: 3, pb: 3, overflowY: 'auto', maxHeight: '75vh' }}>
          <Grid container spacing={2}>

            {/* Basic info */}
            <Grid size={8}>
              <TextField fullWidth size="small" label="Name *" value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value, slug: generateSlug(e.target.value) }))} />
            </Grid>
            <Grid size={4}>
              <TextField fullWidth size="small" label="Brand" value={form.brand}
                onChange={e => setForm(f => ({ ...f, brand: e.target.value }))} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="Slug" value={form.slug}
                onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} helperText="Auto-generated from name" />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" label="Description" multiline rows={3} value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
            </Grid>
            <Grid size={4}>
              <TextField fullWidth size="small" type="number" label="Price *" value={form.price}
                onChange={e => setForm(f => ({ ...f, price: e.target.value }))}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }} />
            </Grid>
            <Grid size={4}>
              <TextField fullWidth size="small" type="number" label="Original Price" value={form.originalPrice}
                onChange={e => setForm(f => ({ ...f, originalPrice: e.target.value }))}
                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                helperText="Leave empty if not on sale" />
            </Grid>
            <Grid size={4}>
              <TextField fullWidth size="small" type="number" label="Stock" value={form.stock}
                onChange={e => setForm(f => ({ ...f, stock: e.target.value }))} />
            </Grid>
            <Grid size={4}>
              <TextField fullWidth size="small" select label="Gender" value={form.gender}
                onChange={e => setForm(f => ({ ...f, gender: e.target.value as typeof form.gender }))}>
                <MenuItem value="">Unisex</MenuItem>
                <MenuItem value="men">Men</MenuItem>
                <MenuItem value="women">Women</MenuItem>
                <MenuItem value="unisex">Unisex</MenuItem>
              </TextField>
            </Grid>

            {/* Labels */}
            <Grid size={12}>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  { key: 'isNew', label: 'New', icon: <NewIcon sx={{ fontSize: 16 }} />, color: '#DC2626' },
                  { key: 'isBestseller', label: 'Bestseller', icon: <BestsellerIcon sx={{ fontSize: 16 }} />, color: '#3B82F6' },
                  { key: 'onSale', label: 'On Sale', icon: <SaleIcon sx={{ fontSize: 16 }} />, color: '#F97316' },
                ].map(({ key, label, icon, color }) => (
                  <Chip
                    key={key}
                    icon={icon}
                    label={label}
                    clickable
                    onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof f] }))}
                    sx={{
                      bgcolor: form[key as keyof typeof form] ? `${color}20` : 'transparent',
                      color: form[key as keyof typeof form] ? color : 'text.secondary',
                      border: `1px solid ${form[key as keyof typeof form] ? color : 'rgba(0,0,0,0.15)'}`,
                      fontWeight: 600,
                    }}
                  />
                ))}
                <FormControlLabel
                  control={<Switch checked={form.isVisible} onChange={e => setForm(f => ({ ...f, isVisible: e.target.checked }))} sx={{ '& .MuiSwitch-switchBase.Mui-checked': { color: '#DC2626' }, '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { bgcolor: '#DC2626' } }} />}
                  label={<Typography variant="body2" fontWeight={600}>{form.isVisible ? 'Visible' : 'Hidden'}</Typography>}
                />
              </Box>
            </Grid>

            {/* Features */}
            <Grid size={12}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Features</Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField size="small" fullWidth label="Add feature" value={featureInput}
                  onChange={e => setFeatureInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && featureInput.trim()) { setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] })); setFeatureInput(''); e.preventDefault(); } }} />
                <Button variant="outlined" size="small" onClick={() => { if (featureInput.trim()) { setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] })); setFeatureInput(''); } }}>Add</Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                {form.features.map((feat, i) => (
                  <Chip key={i} label={feat} size="small" onDelete={() => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))} />
                ))}
              </Box>
            </Grid>

            {/* Specifications */}
            <Grid size={12}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Specifications</Typography>
              <Grid container spacing={1.5}>
                {SPEC_KEYS.map(({ key, label }) => (
                  <Grid key={key} size={6}>
                    <TextField fullWidth size="small" label={label} value={form.specifications[key] ?? ''}
                      onChange={e => setForm(f => ({ ...f, specifications: { ...f.specifications, [key]: e.target.value } }))} />
                  </Grid>
                ))}
              </Grid>
            </Grid>

            {/* Product Video */}
            <Grid size={12}>
              <Typography variant="subtitle2" fontWeight={700} gutterBottom>Product Video (optional)</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <ToggleButtonGroup
                  size="small" exclusive
                  value={form.videoInputMode}
                  onChange={(_, v) => v && setForm(f => ({ ...f, videoInputMode: v, videoUrl: '' }))}
                >
                  <ToggleButton value="url" sx={{ py: 0.25, px: 1.5, fontSize: 11 }}>
                    <LinkIcon sx={{ fontSize: 13, mr: 0.5 }} />URL
                  </ToggleButton>
                  <ToggleButton value="upload" sx={{ py: 0.25, px: 1.5, fontSize: 11 }}>
                    <VideoIcon sx={{ fontSize: 13, mr: 0.5 }} />Upload
                  </ToggleButton>
                </ToggleButtonGroup>
              </Box>
              {form.videoInputMode === 'url' ? (
                <TextField fullWidth size="small" label="Video URL" value={form.videoUrl}
                  onChange={e => setForm(f => ({ ...f, videoUrl: e.target.value }))}
                  placeholder="https://res.cloudinary.com/..." />
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    component="label" variant="outlined" size="small"
                    disabled={form.uploadingVideo}
                    startIcon={form.uploadingVideo ? <CircularProgress size={13} /> : <VideoIcon />}
                    sx={{ borderStyle: 'dashed' }}
                  >
                    {form.uploadingVideo ? 'Uploading…' : form.videoUrl ? 'Replace Video' : 'Upload Video'}
                    <input type="file" hidden accept="video/*" onChange={async e => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setForm(f => ({ ...f, uploadingVideo: true }));
                      try {
                        const url = await uploadVideoDirectly(file, 'sunglasses');
                        setForm(f => ({ ...f, videoUrl: url, uploadingVideo: false }));
                      } catch (err) {
                        alert((err as Error).message);
                        setForm(f => ({ ...f, uploadingVideo: false }));
                      }
                    }} />
                  </Button>
                  {form.videoUrl && <Typography variant="caption" color="success.main">✓ Video ready</Typography>}
                </Box>
              )}
              {form.videoUrl && form.videoInputMode === 'url' && (
                <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 0.5 }}>✓ Video URL set</Typography>
              )}
            </Grid>

            {/* ── Variants ── */}
            <Grid size={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={700}>Color Variants</Typography>
                <Button size="small" startIcon={<AddIcon />} variant="outlined" onClick={addVariant}
                  sx={{ borderColor: '#DC2626', color: '#DC2626' }}>
                  Add Color
                </Button>
              </Box>

              {form.variants.length === 0 && (
                <Box sx={{ textAlign: 'center', py: 4, border: '1px dashed rgba(0,0,0,0.15)', borderRadius: 2, color: 'text.secondary', fontSize: 14 }}>
                  No color variants yet. Click "Add Color" to start.
                </Box>
              )}

              {form.variants.map((variant, idx) => (
                <Box key={variant.id} sx={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2, p: 2, mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                    {/* Color swatch + picker toggle */}
                    <Tooltip title="Choose color">
                      <Box
                        sx={{ width: 36, height: 36, borderRadius: '50%', bgcolor: variant.colorHex, border: '2px solid rgba(0,0,0,0.2)', cursor: 'pointer', flexShrink: 0 }}
                        onClick={() => setColorPickerIdx(colorPickerIdx === idx ? null : idx)}
                      />
                    </Tooltip>
                    <TextField size="small" label="Color Name" value={variant.colorName}
                      onChange={e => updateVariant(idx, { colorName: e.target.value })} sx={{ flex: 1 }} />
                    <IconButton size="small" color="error" onClick={() => removeVariant(idx)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  {/* Color palette */}
                  {colorPickerIdx === idx && (
                    <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 2, p: 1.5, bgcolor: 'rgba(0,0,0,0.04)', borderRadius: 1.5 }}>
                      {COLOR_PRESETS.map(c => (
                        <Tooltip key={c.name} title={c.name}>
                          <Box
                            onClick={() => { updateVariant(idx, { colorHex: c.hex, colorName: variant.colorName || c.name }); setColorPickerIdx(null); }}
                            sx={{ width: 28, height: 28, borderRadius: '50%', bgcolor: c.hex, border: variant.colorHex === c.hex ? '3px solid #DC2626' : '1px solid rgba(0,0,0,0.2)', cursor: 'pointer', '&:hover': { transform: 'scale(1.15)', transition: 'transform 0.1s' } }}
                          />
                        </Tooltip>
                      ))}
                    </Box>
                  )}

                  {/* Images */}
                  <Box sx={{ mb: 1.5 }}>
                    <Typography variant="caption" fontWeight={600} color="text.secondary" gutterBottom display="block">
                      Photos ({variant.images.length})
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                      {variant.images.map((img, imgIdx) => (
                        <Box key={imgIdx} sx={{ position: 'relative', width: 64, height: 64 }}>
                          <Box component="img" src={img} sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 1, border: '1px solid rgba(0,0,0,0.12)' }} />
                          <IconButton
                            size="small"
                            sx={{ position: 'absolute', top: -8, right: -8, width: 18, height: 18, bgcolor: '#EF4444', color: '#fff', '&:hover': { bgcolor: '#DC2626' } }}
                            onClick={() => updateVariant(idx, { images: variant.images.filter((_, ii) => ii !== imgIdx) })}
                          >
                            <CloseIcon sx={{ fontSize: 12 }} />
                          </IconButton>
                        </Box>
                      ))}
                      <Button
                        component="label"
                        variant="outlined"
                        size="small"
                        disabled={isCropUploading}
                        startIcon={isCropUploading ? <CircularProgress size={12} /> : <UploadIcon />}
                        sx={{ height: 64, minWidth: 80, borderStyle: 'dashed' }}
                      >
                        Upload
                        <input type="file" hidden multiple accept="image/*" onChange={e => handleImageUpload(idx, e.target.files)} />
                      </Button>
                    </Box>
                  </Box>

                  {/* Video */}
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <Typography variant="caption" fontWeight={600} color="text.secondary">Video (optional)</Typography>
                      <ToggleButtonGroup
                        size="small"
                        exclusive
                        value={variant.videoInputMode}
                        onChange={(_, v) => v && updateVariant(idx, { videoInputMode: v, videoUrl: '' })}
                      >
                        <ToggleButton value="upload" sx={{ py: 0.25, px: 1, fontSize: 10 }}>
                          <VideoIcon sx={{ fontSize: 12, mr: 0.5 }} />Upload
                        </ToggleButton>
                        <ToggleButton value="url" sx={{ py: 0.25, px: 1, fontSize: 10 }}>
                          <LinkIcon sx={{ fontSize: 12, mr: 0.5 }} />URL
                        </ToggleButton>
                      </ToggleButtonGroup>
                    </Box>
                    {variant.videoInputMode === 'url' ? (
                      <TextField fullWidth size="small" label="Video URL" value={variant.videoUrl}
                        onChange={e => updateVariant(idx, { videoUrl: e.target.value })}
                        placeholder="https://res.cloudinary.com/..." />
                    ) : (
                      <Button
                        component="label"
                        variant="outlined"
                        size="small"
                        disabled={variant.uploadingVideo}
                        startIcon={variant.uploadingVideo ? <CircularProgress size={12} /> : <VideoIcon />}
                        sx={{ borderStyle: 'dashed' }}
                      >
                        {variant.uploadingVideo ? 'Uploading…' : variant.videoUrl ? 'Replace Video' : 'Upload Video'}
                        <input type="file" hidden accept="video/*" onChange={e => { const f = e.target.files?.[0]; if (f) handleVideoUpload(idx, f); }} />
                      </Button>
                    )}
                    {variant.videoUrl && <Typography variant="caption" color="success.main" display="block" sx={{ mt: 0.5 }}>✓ Video set</Typography>}
                  </Box>
                </Box>
              ))}
            </Grid>

          </Grid>
        </Box>

        <Box sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={isSaving || !form.name || !form.price} onClick={handleSave}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
            {isSaving ? 'Saving…' : editId ? 'Save Changes' : 'Create'}
          </Button>
        </Box>
      </MobileDialog>

      {/* ── Crop Dialog (1:1) ── */}
      <Dialog
        open={!!cropSrc}
        onClose={() => { setCropSrc(null); setCropQueue([]); }}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { bgcolor: '#111', color: 'white', borderRadius: 3, overflow: 'hidden' } }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 2.5, py: 1.5, borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Typography fontWeight={700} fontSize={15}>Crop Image</Typography>
          <IconButton size="small" onClick={() => { setCropSrc(null); setCropQueue([]); }} sx={{ color: 'rgba(255,255,255,0.6)' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ position: 'relative', width: '100%', height: 380, bgcolor: '#0a0a0a' }}>
          {cropSrc && (
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={1}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              style={{
                cropAreaStyle: { border: '2px solid #DC2626', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' },
              }}
            />
          )}
          <Box sx={{ position: 'absolute', top: 10, left: 10, bgcolor: 'rgba(220,38,38,0.85)', backdropFilter: 'blur(4px)', color: 'white', px: 1.5, py: 0.4, borderRadius: 1.5, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>
            1 : 1
          </Box>
          {cropQueue.length > 0 && (
            <Box sx={{ position: 'absolute', top: 10, right: 10, bgcolor: 'rgba(0,0,0,0.7)', color: 'white', px: 1.5, py: 0.4, borderRadius: 1.5, fontSize: 11, fontWeight: 600 }}>
              +{cropQueue.length} more
            </Box>
          )}
        </Box>

        <Box sx={{ px: 3, py: 2, bgcolor: '#f8f8f8' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 36 }}>Zoom</Typography>
            <IconButton size="small" onClick={() => setZoom(z => Math.max(1, z - 0.2))} sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#DC2626', color: 'white' } }}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Slider
              value={zoom} min={1} max={3} step={0.05}
              onChange={(_, v) => setZoom(v as number)}
              sx={{ color: '#DC2626', flex: 1 }}
            />
            <IconButton size="small" onClick={() => setZoom(z => Math.min(3, z + 0.2))} sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#DC2626', color: 'white' } }}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, px: 2.5, py: 2, borderTop: '1px solid rgba(0,0,0,0.08)', bgcolor: 'white' }}>
          <Button onClick={() => { setCropSrc(null); setCropQueue([]); }}>Cancel</Button>
          <Button
            variant="contained"
            disabled={isCropUploading}
            onClick={handleCropConfirm}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {isCropUploading ? <CircularProgress size={18} sx={{ color: 'white' }} /> : cropQueue.length > 0 ? 'Crop & Next' : 'Crop & Upload'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
