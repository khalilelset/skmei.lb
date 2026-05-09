'use client';

import 'react-easy-crop/react-easy-crop.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, IconButton, Tooltip, CircularProgress, Slider,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon,
  Close as CloseIcon, CloudUpload as UploadIcon,
  ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon,
} from '@mui/icons-material';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableSkeleton from '@/components/admin/TableSkeleton';
import MobileDialog from '@/components/admin/MobileDialog';

interface FeedbackImage {
  id: string;
  image: string;
  alt: string;
  sort_order: number;
  created_at: string;
}

const emptyForm = { image: '', alt: '', sort_order: 0 };

export default function FeedbackPage() {
  const [items, setItems] = useState<FeedbackImage[]>([]);
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
    fetch('/api/admin/feedback')
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (item: FeedbackImage) => {
    setEditId(item.id);
    setForm({ image: item.image, alt: item.alt, sort_order: item.sort_order });
    setDialogOpen(true);
  };

  const handleFileSelected = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setCropSrc(null);
    setIsUploading(true);
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      const fd = new FormData();
      fd.append('file', blob, 'feedback.jpg');
      fd.append('slug', 'feedback');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, image: data.url }));
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.image) return;
    setIsSaving(true);
    if (editId) {
      await fetch(`/api/admin/feedback/${editId}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/admin/feedback', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    }
    setIsSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this feedback image?')) return;
    await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' });
    load();
  };

  const columns: Column[] = [
    {
      id: 'image', label: 'Preview', minWidth: 80, sortable: false,
      format: (value) => (
        <Box sx={{ width: 64, height: 64, position: 'relative', borderRadius: 1, overflow: 'hidden', bgcolor: '#f3f4f6' }}>
          {value ? <Image src={value} alt="preview" fill style={{ objectFit: 'cover' }} sizes="64px" />
            : <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>No img</Typography>}
        </Box>
      ),
    },
    {
      id: 'alt', label: 'Alt Text', minWidth: 200,
      format: (value) => (
        <Typography variant="body2" sx={{ color: value ? 'text.primary' : 'text.secondary', fontStyle: value ? 'normal' : 'italic' }}>
          {value || '(no alt text)'}
        </Typography>
      ),
    },
    { id: 'sort_order', label: 'Order', minWidth: 80, align: 'center' },
    { id: 'created_at', label: 'Added', minWidth: 120, format: (v) => new Date(v).toLocaleDateString() },
    {
      id: 'id', label: 'Actions', minWidth: 100, align: 'center', sortable: false,
      format: (value, row: FeedbackImage) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }} sx={{ color: '#6366f1' }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete">
            <IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(value); }} sx={{ color: '#EF4444' }}>
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
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Feedback Images</Typography>
          <Typography variant="body1" color="text.secondary">Manage customer feedback photos shown on the homepage</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
          Add Image
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {items.length} image{items.length !== 1 ? 's' : ''} · sorted by Order field
        </Typography>
        {isLoading ? (
          <TableSkeleton columns={5} rows={6} />
        ) : (
          <DataTable columns={columns} data={items} emptyMessage="No feedback images yet. Add one above." />
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <MobileDialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>{editId ? 'Edit Image' : 'Add Feedback Image'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Image Upload */}
            <Grid size={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Photo</Typography>
              {form.image ? (
                <Box sx={{ position: 'relative', width: 200, height: 200, borderRadius: 2, overflow: 'hidden', bgcolor: '#f3f4f6', mb: 1 }}>
                  <Image src={form.image} alt="preview" fill style={{ objectFit: 'cover' }} sizes="200px" />
                  <IconButton
                    size="small"
                    onClick={() => setForm(f => ({ ...f, image: '' }))}
                    sx={{ position: 'absolute', top: 8, right: 8, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', '&:hover': { bgcolor: '#DC2626' } }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ) : (
                <label style={{ cursor: isUploading ? 'default' : 'pointer', display: 'block' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    disabled={isUploading}
                    style={{ display: 'none' }}
                    onChange={(e) => { if (e.target.files?.[0]) handleFileSelected(e.target.files[0]); }}
                  />
                  <Box sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 1.5, width: 200, height: 200,
                    border: '2px dashed', borderColor: 'rgba(0,0,0,0.2)', borderRadius: 2,
                    color: 'text.secondary', transition: 'all 0.2s',
                    '&:hover': { borderColor: '#DC2626', color: '#DC2626', bgcolor: 'rgba(220,38,38,0.02)' },
                  }}>
                    {isUploading ? <CircularProgress size={28} sx={{ color: '#DC2626' }} /> : (
                      <>
                        <UploadIcon sx={{ fontSize: 36 }} />
                        <Typography variant="body2" fontWeight={600}>Click to upload photo</Typography>
                        <Typography variant="caption" color="inherit">Will be cropped to 1:1 square</Typography>
                      </>
                    )}
                  </Box>
                </label>
              )}
            </Grid>

            <Grid size={12}>
              <TextField fullWidth size="small" label="Alt Text"
                placeholder="Describe the image for accessibility"
                value={form.alt}
                onChange={(e) => setForm(f => ({ ...f, alt: e.target.value }))} />
            </Grid>
            <Grid size={12}>
              <TextField fullWidth size="small" type="number" label="Sort Order"
                value={form.sort_order}
                onChange={(e) => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                inputProps={{ min: 0 }} helperText="Lower numbers appear first" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={isSaving || isUploading || !form.image} onClick={handleSave}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
            {isSaving ? 'Saving...' : editId ? 'Save Changes' : 'Add Image'}
          </Button>
        </DialogActions>
      </MobileDialog>

      {/* Crop Dialog */}
      <Dialog open={!!cropSrc} maxWidth="sm" fullWidth onClose={() => setCropSrc(null)}
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ px: 3, py: 2, background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Crop Photo</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Drag to reposition · Scroll or slide to zoom</Typography>
          </Box>
          <IconButton size="small" onClick={() => setCropSrc(null)} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white' } }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ position: 'relative', width: '100%', height: 400, bgcolor: '#0a0a0a' }}>
          {cropSrc && (
            <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={4 / 3}
              onCropChange={setCrop} onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              style={{ cropAreaStyle: { border: '2px solid #DC2626', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' } }}
            />
          )}
          <Box sx={{ position: 'absolute', top: 12, left: 12, bgcolor: 'rgba(220,38,38,0.85)', color: 'white', px: 1.5, py: 0.5, borderRadius: 2, fontSize: 11, fontWeight: 700, letterSpacing: 1 }}>1 : 1</Box>
        </Box>
        <Box sx={{ px: 3, py: 2.5, bgcolor: '#f8f8f8', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 36 }}>Zoom</Typography>
            <IconButton size="small" onClick={() => setZoom(z => Math.max(1, z - 0.2))} sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#DC2626', color: 'white' } }}><ZoomOutIcon fontSize="small" /></IconButton>
            <Slider value={zoom} min={1} max={3} step={0.05} onChange={(_, v) => setZoom(v as number)}
              sx={{ color: '#DC2626', '& .MuiSlider-thumb': { width: 16, height: 16 } }} />
            <IconButton size="small" onClick={() => setZoom(z => Math.min(3, z + 0.2))} sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#DC2626', color: 'white' } }}><ZoomInIcon fontSize="small" /></IconButton>
            <Typography variant="caption" sx={{ color: '#DC2626', fontWeight: 700, minWidth: 32, textAlign: 'right' }}>{zoom.toFixed(1)}×</Typography>
          </Box>
        </Box>
        <Box sx={{ px: 3, py: 2, display: 'flex', gap: 1.5, justifyContent: 'flex-end', bgcolor: 'white', borderTop: '1px solid rgba(0,0,0,0.06)' }}>
          <Button onClick={() => setCropSrc(null)} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCropConfirm} startIcon={<UploadIcon />}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, borderRadius: 2, px: 3, fontWeight: 600, boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
            Crop & Upload
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
