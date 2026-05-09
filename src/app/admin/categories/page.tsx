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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
  CloudUpload as UploadIcon,
  ZoomIn as ZoomInIcon,
  ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';
import {
  Watch, Timer, Clock, Activity, Zap, Gem, Smartphone, Heart, Star,
  Shield, Package, Users, Tag, Sun, Flame, Award, Layers, Sparkles,
  type LucideProps,
} from 'lucide-react';

type IconName = 'Watch' | 'Timer' | 'Clock' | 'Activity' | 'Zap' | 'Gem' | 'Smartphone' |
  'Heart' | 'Star' | 'Shield' | 'Package' | 'Users' | 'Tag' | 'Sun' | 'Flame' | 'Award' | 'Layers' | 'Sparkles';

const ICON_OPTIONS: { name: IconName; Comp: React.ComponentType<LucideProps> }[] = [
  { name: 'Watch',      Comp: Watch },
  { name: 'Timer',      Comp: Timer },
  { name: 'Clock',      Comp: Clock },
  { name: 'Activity',   Comp: Activity },
  { name: 'Zap',        Comp: Zap },
  { name: 'Gem',        Comp: Gem },
  { name: 'Smartphone', Comp: Smartphone },
  { name: 'Heart',      Comp: Heart },
  { name: 'Star',       Comp: Star },
  { name: 'Shield',     Comp: Shield },
  { name: 'Package',    Comp: Package },
  { name: 'Users',      Comp: Users },
  { name: 'Tag',        Comp: Tag },
  { name: 'Sun',        Comp: Sun },
  { name: 'Flame',      Comp: Flame },
  { name: 'Award',      Comp: Award },
  { name: 'Layers',     Comp: Layers },
  { name: 'Sparkles',   Comp: Sparkles },
];
import DataTable, { Column } from '@/components/admin/DataTable';
import TableSkeleton from '@/components/admin/TableSkeleton';
import MobileDialog from '@/components/admin/MobileDialog';

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  icon: string | null;
  sort_order: number;
  created_at: string;
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  icon: '' as string,
  sort_order: 0,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const load = useCallback(() => {
    fetch('/api/admin/categories')
      .then((r) => r.json())
      .then((data) => { setCategories(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (cat: Category) => {
    setEditId(cat.id);
    setForm({
      name: cat.name,
      slug: cat.slug,
      description: cat.description ?? '',
      image: cat.image ?? '',
      icon: cat.icon ?? '',
      sort_order: cat.sort_order ?? 0,
    });
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = editId ? form.slug : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setForm((f) => ({ ...f, name, slug }));
  };

  const handleFileSelect = (file: File) => {
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
    setIsUploading(true);
    setCropSrc(null);
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      const slug = form.slug || 'category';
      const fd = new FormData();
      fd.append('file', blob, 'image.jpg');
      fd.append('slug', slug);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setForm((f) => ({ ...f, image: data.url }));
    } catch {
      // silently ignore
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.name || !form.slug) return;
    setIsSaving(true);
    if (editId) {
      await fetch(`/api/admin/categories/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/admin/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setIsSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category? This cannot be undone.')) return;
    await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' });
    load();
  };

  const columns: Column[] = [
    {
      id: 'image',
      label: 'Image',
      minWidth: 80,
      sortable: false,
      format: (value) => (
        <Box sx={{ width: 48, height: 64, position: 'relative', borderRadius: 1, overflow: 'hidden', bgcolor: '#f3f4f6' }}>
          {value ? (
            <Image src={value} alt="category" fill style={{ objectFit: 'cover' }} sizes="48px" />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="caption" color="text.secondary">—</Typography>
            </Box>
          )}
        </Box>
      ),
    },
    {
      id: 'name',
      label: 'Name',
      minWidth: 140,
      format: (value) => (
        <Typography sx={{ fontWeight: 700, color: '#DC2626' }}>{value}</Typography>
      ),
    },
    {
      id: 'slug',
      label: 'Slug',
      minWidth: 140,
      format: (value) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'text.secondary' }}>{value}</Typography>
      ),
    },
    {
      id: 'description',
      label: 'Description',
      minWidth: 200,
      format: (value) => (
        <Typography variant="body2" sx={{ maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: value ? 'text.primary' : 'text.secondary', fontStyle: value ? 'normal' : 'italic' }}>
          {value || '(no description)'}
        </Typography>
      ),
    },
    {
      id: 'sort_order',
      label: 'Order',
      minWidth: 70,
      align: 'center',
    },
    {
      id: 'id',
      label: 'Actions',
      minWidth: 100,
      align: 'center',
      sortable: false,
      format: (value, row: Category) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }} sx={{ color: '#6366f1' }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(value); }} sx={{ color: '#EF4444', '&:hover': { bgcolor: 'rgba(239,68,68,0.1)' } }}>
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
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Categories</Typography>
          <Typography variant="body1" color="text.secondary">Manage the watch categories shown in the store</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
        >
          Add Category
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'} · sorted by Order field
        </Typography>
        {isLoading ? (
          <TableSkeleton columns={5} rows={6} />
        ) : (
          <DataTable columns={columns} data={categories} emptyMessage="No categories yet. Add one above." />
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <MobileDialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>{editId ? 'Edit Category' : 'Add Category'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" label="Name *" placeholder="e.g. Digital Watches"
                value={form.name} onChange={(e) => handleNameChange(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" label="Slug *" placeholder="e.g. digital"
                value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                helperText="Used in URLs — lowercase, no spaces"
              />
            </Grid>

            {/* Image Upload */}
            <Grid size={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Category Image</Typography>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                style={{ display: 'none' }}
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileSelect(f); }}
              />

              {form.image ? (
                <Box sx={{ position: 'relative', width: 120, aspectRatio: '3/4', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                  {isUploading ? (
                    <Box sx={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: 'rgba(0,0,0,0.5)' }}>
                      <CircularProgress size={32} sx={{ color: '#DC2626' }} />
                    </Box>
                  ) : null}
                  <Image src={form.image} alt="preview" fill style={{ objectFit: 'cover' }} sizes="600px" />
                  {!isUploading && (
                    <Box sx={{
                      position: 'absolute', inset: 0, bgcolor: 'rgba(0,0,0,0)',
                      '&:hover': { bgcolor: 'rgba(0,0,0,0.45)' }, transition: 'background 0.2s',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1,
                    }}
                      className="group"
                    >
                      <Button size="small" variant="contained" startIcon={<UploadIcon />}
                        onClick={() => fileInputRef.current?.click()}
                        sx={{ bgcolor: 'rgba(255,255,255,0.95)', color: '#111', '&:hover': { bgcolor: 'white' }, opacity: 0, '.group:hover &': { opacity: 1 }, transition: 'opacity 0.2s' }}
                      >
                        Replace
                      </Button>
                      <Button size="small" variant="contained"
                        onClick={() => setForm((f) => ({ ...f, image: '' }))}
                        sx={{ bgcolor: 'rgba(239,68,68,0.9)', color: 'white', '&:hover': { bgcolor: '#DC2626' }, opacity: 0, '.group:hover &': { opacity: 1 }, transition: 'opacity 0.2s' }}
                      >
                        Remove
                      </Button>
                    </Box>
                  )}
                </Box>
              ) : (
                <Box
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  sx={{
                    width: 120, aspectRatio: '3/4', border: '2px dashed', borderColor: 'rgba(0,0,0,0.18)',
                    borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center',
                    justifyContent: 'center', gap: 1, cursor: isUploading ? 'default' : 'pointer',
                    bgcolor: 'rgba(0,0,0,0.02)', transition: 'all 0.2s',
                    '&:hover': { borderColor: '#DC2626', bgcolor: 'rgba(220,38,38,0.03)' },
                  }}
                >
                  {isUploading ? (
                    <CircularProgress size={32} sx={{ color: '#DC2626' }} />
                  ) : (
                    <>
                      <UploadIcon sx={{ fontSize: 36, color: 'text.disabled' }} />
                      <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 500 }}>Click to upload image</Typography>
                      <Typography variant="caption" color="text.disabled">JPEG, PNG, WebP · max 8 MB</Typography>
                    </>
                  )}
                </Box>
              )}
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth size="small" multiline minRows={2} label="Description"
                value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" type="number" label="Sort Order"
                value={form.sort_order} onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                inputProps={{ min: 0 }} helperText="Lower numbers appear first"
              />
            </Grid>

            {/* Icon Picker */}
            <Grid size={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Nav Icon {form.icon && <span style={{ fontWeight: 400, color: '#DC2626' }}>· {form.icon}</span>}
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 1 }}>
                {ICON_OPTIONS.map(({ name, Comp }) => {
                  const selected = form.icon === name;
                  return (
                    <Box
                      key={name}
                      onClick={() => setForm((f) => ({ ...f, icon: selected ? '' : name }))}
                      sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 0.5, p: 1.5, borderRadius: 2, border: '2px solid',
                        borderColor: selected ? '#DC2626' : 'rgba(0,0,0,0.1)',
                        bgcolor: selected ? 'rgba(220,38,38,0.06)' : 'transparent',
                        cursor: 'pointer', transition: 'all 0.15s',
                        '&:hover': { borderColor: '#DC2626', bgcolor: 'rgba(220,38,38,0.04)' },
                      }}
                    >
                      <Comp size={20} color={selected ? '#DC2626' : '#6b7280'} />
                      <Typography variant="caption" sx={{ fontSize: 9, color: selected ? '#DC2626' : 'text.secondary', fontWeight: selected ? 700 : 400 }}>
                        {name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>
              {form.icon && (
                <Button size="small" onClick={() => setForm((f) => ({ ...f, icon: '' }))}
                  sx={{ mt: 1, color: 'text.secondary', fontSize: 11 }}>
                  Clear icon
                </Button>
              )}
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={isSaving || !form.name || !form.slug}
            onClick={handleSave}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {isSaving ? 'Saving...' : editId ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogActions>
      </MobileDialog>

      {/* Crop Dialog */}
      <Dialog
        open={!!cropSrc}
        maxWidth="sm"
        fullWidth
        onClose={() => setCropSrc(null)}
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header */}
        <Box sx={{ px: 3, py: 2, background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" component="span" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Crop Image</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', display: 'block' }}>Drag to reposition · Scroll or slide to zoom</Typography>
          </Box>
          <IconButton size="small" onClick={() => setCropSrc(null)} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white', bgcolor: 'rgba(255,255,255,0.1)' } }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Crop canvas — 3:4 portrait to match website */}
        <Box sx={{ position: 'relative', width: '100%', height: 460, bgcolor: '#0a0a0a' }}>
          {cropSrc && (
            <Cropper
              image={cropSrc}
              crop={crop}
              zoom={zoom}
              aspect={3 / 4}
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
        </Box>

        {/* Zoom controls */}
        <Box sx={{ px: 3, py: 2.5, bgcolor: '#111', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton size="small" onClick={() => setZoom((z) => Math.max(1, z - 0.1))} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white' } }}>
              <ZoomOutIcon fontSize="small" />
            </IconButton>
            <Slider
              value={zoom}
              min={1} max={3} step={0.01}
              onChange={(_, v) => setZoom(v as number)}
              sx={{ color: '#DC2626', '& .MuiSlider-thumb': { width: 14, height: 14 }, '& .MuiSlider-rail': { bgcolor: 'rgba(255,255,255,0.15)' } }}
            />
            <IconButton size="small" onClick={() => setZoom((z) => Math.min(3, z + 0.1))} sx={{ color: 'rgba(255,255,255,0.5)', '&:hover': { color: 'white' } }}>
              <ZoomInIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1.5, px: 3, py: 2, bgcolor: 'white', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setCropSrc(null)} sx={{ color: 'text.secondary', borderRadius: 2 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCropConfirm}
            startIcon={<UploadIcon />}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, borderRadius: 2, px: 3, fontWeight: 700 }}
          >
            Upload
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
