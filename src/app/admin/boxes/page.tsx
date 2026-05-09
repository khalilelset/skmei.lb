'use client';

import 'react-easy-crop/react-easy-crop.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
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
  IconButton,
  Tooltip,
  CircularProgress,
  Slider,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
  CardGiftcard as GiftIcon,
  Inventory2 as StandardIcon,
} from '@mui/icons-material';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableSkeleton from '@/components/admin/TableSkeleton';
import MobileDialog from '@/components/admin/MobileDialog';

interface BoxItem {
  id: string;
  code: string;
  type: 'standard' | 'gift';
  price: number;
  image: string;
  brandId: string | null;
  brandName?: string | null;
  createdAt: string;
}

interface Brand {
  id: string;
  name: string;
}

const emptyForm = {
  code: '',
  type: 'standard' as 'standard' | 'gift',
  price: '0',
  image: '',
  brandId: '',
};

export default function BoxesPage() {
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [filterBrand, setFilterBrand] = useState('');
  const [filterType, setFilterType] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state — separate dialog, same as products page
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const load = useCallback(() => {
    // Fetch brands independently so a boxes error never blocks the dropdown
    fetch('/api/admin/brands')
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setBrands(data); })
      .catch(() => {});

    fetch('/api/admin/boxes')
      .then((r) => r.json())
      .then((data) => { setBoxes(Array.isArray(data) ? data : []); })
      .catch(() => { setBoxes([]); })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setUploadError('');
    setDialogOpen(true);
  };

  const openEdit = (box: BoxItem) => {
    setEditId(box.id);
    setForm({
      code: box.code,
      type: box.type,
      price: String(box.price),
      image: box.image,
      brandId: box.brandId ?? '',
    });
    setUploadError('');
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this box?')) return;
    await fetch(`/api/admin/boxes/${id}`, { method: 'DELETE' });
    load();
  };

  // ── Image upload — same flow as products page ──────────────────────────────

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCropSrc(reader.result as string);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    const src = cropSrc;
    const pixels = croppedAreaPixels;
    setIsUploading(true);
    setUploadError('');
    setCropSrc(null);
    try {
      const blob = await getCroppedImg(src, pixels);
      const fd = new FormData();
      fd.append('file', blob, 'box.jpg');
      fd.append('slug', (form.code || 'box').toLowerCase().replace(/[^a-z0-9-]/g, '-'));
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok || !data.url) {
        setUploadError(data.error ?? 'Upload failed — please try again.');
      } else {
        setForm((f) => ({ ...f, image: data.url }));
      }
    } catch {
      setUploadError('Upload failed — please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  // ── Save ──────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!form.code.trim()) return;
    setIsSaving(true);
    const payload = {
      code:    form.code.trim(),
      type:    form.type,
      price:   Number(form.price) || 0,
      image:   form.image || null,
      brandId: form.brandId || null,
    };
    try {
      if (editId) {
        await fetch(`/api/admin/boxes/${editId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch('/api/admin/boxes', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
      }
      setDialogOpen(false);
      load();
    } finally {
      setIsSaving(false);
    }
  };

  // ── Table columns ─────────────────────────────────────────────────────────

  const columns: Column[] = [
    {
      id: 'image',
      label: 'Image',
      minWidth: 72,
      sortable: false,
      format: (val) =>
        val ? (
          <Box sx={{ position: 'relative', width: 52, height: 52, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
            <Image src={val as string} alt="box" fill style={{ objectFit: 'cover' }} />
          </Box>
        ) : (
          <Box sx={{ width: 52, height: 52, borderRadius: 2, bgcolor: 'grey.100', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <GiftIcon sx={{ color: 'grey.400', fontSize: 24 }} />
          </Box>
        ),
    },
    {
      id: 'code',
      label: 'Code',
      minWidth: 100,
      format: (val) => <Typography sx={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 13 }}>{val as string}</Typography>,
    },
    {
      id: 'type',
      label: 'Type',
      minWidth: 100,
      format: (val) => (
        <Chip
          label={val === 'standard' ? 'Standard' : 'Gift Box'}
          size="small"
          icon={val === 'standard' ? <StandardIcon /> : <GiftIcon />}
          sx={{
            bgcolor: val === 'standard' ? 'rgba(59,130,246,0.1)' : 'rgba(236,72,153,0.1)',
            color:   val === 'standard' ? '#3B82F6' : '#EC4899',
            fontWeight: 600,
            '& .MuiChip-icon': { color: 'inherit', fontSize: 14 },
          }}
        />
      ),
    },
    {
      id: 'price',
      label: 'Price Addition',
      minWidth: 110,
      align: 'right',
      format: (val) => (
        <Typography sx={{ fontWeight: 700, color: Number(val) > 0 ? '#DC2626' : '#6B7280' }}>
          {Number(val) === 0 ? 'Free' : `+$${Number(val).toFixed(2)}`}
        </Typography>
      ),
    },
    {
      id: 'brandName',
      label: 'Brand',
      minWidth: 100,
      format: (val) => val
        ? <Chip label={val as string} size="small" variant="outlined" />
        : <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>All brands</Typography>,
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      align: 'center',
      sortable: false,
      format: (_, row) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row as unknown as BoxItem)}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" color="error" onClick={() => handleDelete((row as { id: string }).id)}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const filteredBoxes = boxes.filter((b) => {
    if (filterType && b.type !== filterType) return false;
    if (filterBrand === '__global__') return b.brandId === null;
    if (filterBrand && b.brandId !== filterBrand) return false;
    return true;
  });

  const activeFilters = (filterBrand ? 1 : 0) + (filterType ? 1 : 0);

  return (
    <Box>
      {/* Page header */}
      <Box sx={{ display: 'flex', alignItems: { sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, mb: 3 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700 }}>Watch Boxes</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Manage standard and gift boxes available at checkout
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, alignSelf: { xs: 'flex-start', sm: 'auto' } }}>
          Add Box
        </Button>
      </Box>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Brand</InputLabel>
          <Select label="Brand" value={filterBrand} onChange={(e) => setFilterBrand(e.target.value)}>
            <MenuItem value="">All brands</MenuItem>
            <MenuItem value="__global__"><em>Global (no brand)</em></MenuItem>
            {brands.map((b) => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
          </Select>
        </FormControl>

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Type</InputLabel>
          <Select label="Type" value={filterType} onChange={(e) => setFilterType(e.target.value)}>
            <MenuItem value="">All types</MenuItem>
            <MenuItem value="standard">Standard</MenuItem>
            <MenuItem value="gift">Gift Box</MenuItem>
          </Select>
        </FormControl>

        {activeFilters > 0 && (
          <Button size="small" onClick={() => { setFilterBrand(''); setFilterType(''); }}
            sx={{ color: '#DC2626', textTransform: 'none', fontWeight: 600 }}>
            Clear filters ({activeFilters})
          </Button>
        )}

        <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
          {filteredBoxes.length} of {boxes.length} boxes
        </Typography>
      </Box>

      {/* Table */}
      <Paper>
        {isLoading
          ? <TableSkeleton columns={7} rows={5} />
          : <DataTable columns={columns} data={filteredBoxes} emptyMessage="No boxes match the current filters." />
        }
      </Paper>

      {/* ── Create / Edit Dialog ── */}
      <MobileDialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 700 }}>
            {editId ? 'Edit Box' : 'Add Box'}
          </Typography>
          <IconButton onClick={() => setDialogOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>

        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Image upload — same pattern as products page */}
            <Grid size={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Box Image <Typography component="span" variant="caption" color="text.secondary">(1:1 square)</Typography>
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Preview */}
                {form.image && (
                  <Box sx={{ position: 'relative', width: 200, height: 200, borderRadius: 2, overflow: 'hidden', border: '2px solid #DC2626', flexShrink: 0 }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={form.image} alt="box preview" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    <IconButton
                      size="small"
                      onClick={() => setForm((f) => ({ ...f, image: '' }))}
                      sx={{ position: 'absolute', top: 0, right: 0, p: 0.25, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: 0, '&:hover': { bgcolor: '#DC2626' } }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                )}

                {/* Upload button — label wraps hidden input, same as products page */}
                <label style={{ cursor: isUploading ? 'default' : 'pointer' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    style={{ display: 'none' }}
                    onChange={handleFileSelected}
                  />
                  <Box
                    component="span"
                    sx={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 1.5, width: 200, height: 200,
                      border: '2px dashed',
                      borderColor: isUploading ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.23)',
                      borderRadius: 2, fontSize: 13,
                      color: isUploading ? 'rgba(0,0,0,0.26)' : 'text.secondary',
                      transition: 'all 0.2s',
                      '&:hover': isUploading ? {} : { borderColor: '#DC2626', color: '#DC2626', bgcolor: 'rgba(220,38,38,0.02)' },
                    }}
                  >
                    {isUploading
                      ? <CircularProgress size={32} sx={{ color: '#DC2626' }} />
                      : <><UploadIcon sx={{ fontSize: 40 }} /><span>{form.image ? 'Replace' : 'Upload'}</span></>
                    }
                  </Box>
                </label>
              </Box>

              {isUploading && (
                <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                  Uploading…
                </Typography>
              )}
              {uploadError && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                  {uploadError}
                </Typography>
              )}
            </Grid>

            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Box Code *" fullWidth size="small"
                value={form.code}
                onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
                placeholder="e.g. STD-001, GIFT-01"
                inputProps={{ style: { fontFamily: 'monospace' } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Type *</InputLabel>
                <Select
                  label="Type *"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as 'standard' | 'gift' }))}
                >
                  <MenuItem value="standard">Standard Box (default)</MenuItem>
                  <MenuItem value="gift">Gift Box</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Price Addition ($)" fullWidth size="small" type="number"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                helperText="0 = free (standard box)"
                inputProps={{ min: 0, step: 0.5 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small">
                <InputLabel>Brand</InputLabel>
                <Select
                  label="Brand"
                  value={form.brandId}
                  onChange={(e) => setForm((f) => ({ ...f, brandId: e.target.value }))}
                >
                  <MenuItem value=""><em>All brands (global)</em></MenuItem>
                  {brands.map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setDialogOpen(false)} disabled={isSaving}>Cancel</Button>
          <Button
            variant="contained" onClick={handleSave}
            disabled={isSaving || isUploading || !form.code.trim()}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {isSaving ? <CircularProgress size={20} color="inherit" /> : editId ? 'Save Changes' : 'Create Box'}
          </Button>
        </DialogActions>
      </MobileDialog>

      {/* ── Crop Dialog — separate, on top of everything, same as products page ── */}
      <Dialog
        open={!!cropSrc}
        maxWidth="sm"
        fullWidth
        onClose={() => setCropSrc(null)}
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header */}
        <Box sx={{
          px: 3, py: 2,
          background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
              Crop Image
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
              Drag to reposition · Scroll or slide to zoom
            </Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setCropSrc(null)}
            sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}
          >
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Crop canvas */}
        <Box sx={{ position: 'relative', width: '100%', height: 400, bgcolor: '#0a0a0a' }}>
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
                cropAreaStyle: {
                  border: '2px solid #DC2626',
                  boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)',
                },
              }}
            />
          )}
          {/* 1:1 badge */}
          <Box sx={{
            position: 'absolute', top: 12, left: 12,
            bgcolor: 'rgba(220,38,38,0.85)', backdropFilter: 'blur(4px)',
            color: 'white', px: 1.5, py: 0.5, borderRadius: 2,
            fontSize: 11, fontWeight: 700, letterSpacing: 1,
          }}>
            1 : 1
          </Box>
        </Box>

        {/* Zoom control */}
        <Box sx={{ px: 3, py: 2.5, bgcolor: '#f8f8f8', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 36 }}>
              Zoom
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <IconButton
                size="small"
                onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#DC2626', color: 'white', borderColor: '#DC2626' } }}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
              <Slider
                value={zoom} min={1} max={3} step={0.05}
                onChange={(_, v) => setZoom(v as number)}
                sx={{
                  color: '#DC2626',
                  '& .MuiSlider-thumb': { width: 16, height: 16, boxShadow: '0 2px 6px rgba(220,38,38,0.4)' },
                  '& .MuiSlider-rail': { bgcolor: 'rgba(0,0,0,0.12)' },
                }}
              />
              <IconButton
                size="small"
                onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#DC2626', color: 'white', borderColor: '#DC2626' } }}
              >
                <ZoomInIcon fontSize="small" />
              </IconButton>
            </Box>
            <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 700, minWidth: 32, textAlign: 'right' }}>
              {zoom.toFixed(1)}×
            </Typography>
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ px: 3, py: 2, display: 'flex', gap: 1.5, justifyContent: 'flex-end', bgcolor: 'white', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setCropSrc(null)} sx={{ color: 'text.secondary', borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCropConfirm}
            disabled={!croppedAreaPixels}
            startIcon={<UploadIcon />}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, borderRadius: 2, px: 3, fontWeight: 600, boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}
          >
            Crop & Upload
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
