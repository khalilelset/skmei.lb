'use client';

import 'react-easy-crop/react-easy-crop.css';
import { useState, useEffect, useCallback, useRef } from 'react';
import Image from 'next/image';
import {
  Box, Typography, Paper, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, IconButton, Tooltip, Chip, CircularProgress, Slider, MenuItem,
} from '@mui/material';
import {
  Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon, Close as CloseIcon,
  CloudUpload as UploadIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon,
  VideoFile as VideoIcon,
} from '@mui/icons-material';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableSkeleton from '@/components/admin/TableSkeleton';
import MobileDialog from '@/components/admin/MobileDialog';

interface InstagramPost {
  id: string;
  type: 'image' | 'carousel' | 'video';
  images: string[];
  videoSrc?: string;
  poster?: string;
  postUrl: string;
  likes: number;
  comments: number;
  caption: string;
  sort_order: number;
  createdAt: string;
}

const emptyForm = {
  type: 'image' as 'image' | 'carousel' | 'video',
  images: [] as string[],
  videoSrc: '',
  postUrl: '',
  likes: 0,
  comments: 0,
  caption: '',
  sort_order: 0,
};

export default function InstagramPage() {
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

  // Upload states
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const imgFileRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

  // Crop state (for images)
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

  const load = useCallback(() => {
    fetch('/api/admin/instagram')
      .then((r) => r.json())
      .then((data) => { setPosts(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (post: InstagramPost) => {
    setEditId(post.id);
    setForm({
      type: post.type,
      images: post.images ?? [],
      videoSrc: post.videoSrc ?? '',
      postUrl: post.postUrl,
      likes: post.likes,
      comments: post.comments,
      caption: post.caption,
      sort_order: post.sort_order,
    });
    setDialogOpen(true);
  };

  // Open crop for images (supports queue for carousel)
  const handleImgFilesSelected = (files: FileList) => {
    const arr = Array.from(files);
    if (!arr.length) return;
    const [first, ...rest] = arr;
    setCropQueue(rest);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(first);
    setCrop({ x: 0, y: 0 }); setZoom(1);
    if (imgFileRef.current) imgFileRef.current.value = '';
  };

  // Upload video directly (no crop)
  const handleVideoSelected = async (file: File) => {
    if (videoFileRef.current) videoFileRef.current.value = '';
    setIsUploadingVideo(true);
    try {
      const fd = new FormData();
      fd.append('file', file, file.name);
      fd.append('slug', 'instagram');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, videoSrc: data.url }));
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // Crop confirm — uploads and advances queue
  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    const savedSrc = cropSrc;
    setCropSrc(null);
    setIsUploadingImg(true);
    try {
      const blob = await getCroppedImg(savedSrc, croppedAreaPixels);
      const fd = new FormData();
      fd.append('file', blob, 'image.jpg');
      fd.append('slug', 'instagram');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) {
        setForm(f => ({ ...f, images: [...f.images, data.url] }));
        // Next in queue
        if (cropQueue.length > 0) {
          const [next, ...rest] = cropQueue;
          setCropQueue(rest);
          const reader = new FileReader();
          reader.onload = () => setCropSrc(reader.result as string);
          reader.readAsDataURL(next);
          setCrop({ x: 0, y: 0 }); setZoom(1);
        }
      }
    } finally {
      setIsUploadingImg(false);
    }
  };

  const handleSave = async () => {
    if (!form.postUrl) return;
    setIsSaving(true);
    const payload = {
      type: form.type,
      images: form.images,
      videoSrc: form.videoSrc || null,
      postUrl: form.postUrl,
      likes: Number(form.likes),
      comments: Number(form.comments),
      caption: form.caption,
      sort_order: Number(form.sort_order),
    };
    if (editId) {
      await fetch(`/api/admin/instagram/${editId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    } else {
      await fetch('/api/admin/instagram', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
    }
    setIsSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/admin/instagram/${id}`, { method: 'DELETE' });
    load();
  };

  const typeColors: Record<string, string> = { image: '#3b82f6', carousel: '#8b5cf6', video: '#ef4444' };

  const columns: Column[] = [
    {
      id: 'images', label: 'Preview', minWidth: 80, sortable: false,
      format: (value, row: InstagramPost) => {
        const src = (value as string[])?.[0] ?? row.poster ?? '';
        return (
          <Box sx={{ width: 64, height: 64, position: 'relative', borderRadius: 1, overflow: 'hidden', bgcolor: '#f3f4f6' }}>
            {src ? <Image src={src} alt="preview" fill style={{ objectFit: 'cover' }} sizes="64px" />
              : <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}><Typography variant="caption" color="text.secondary">No img</Typography></Box>}
          </Box>
        );
      },
    },
    {
      id: 'type', label: 'Type', minWidth: 100,
      format: (value) => <Chip label={value} size="small" sx={{ bgcolor: `${typeColors[value]}20`, color: typeColors[value], fontWeight: 600, textTransform: 'capitalize' }} />,
    },
    {
      id: 'caption', label: 'Caption', minWidth: 220,
      format: (value) => <Typography variant="body2" sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{value || <em style={{ color: '#9ca3af' }}>No caption</em>}</Typography>,
    },
    { id: 'likes', label: 'Likes', minWidth: 70, align: 'center' },
    { id: 'comments', label: 'Comments', minWidth: 90, align: 'center' },
    { id: 'sort_order', label: 'Order', minWidth: 70, align: 'center' },
    {
      id: 'id', label: 'Actions', minWidth: 100, align: 'center', sortable: false,
      format: (value, row: InstagramPost) => (
        <Box sx={{ display: 'flex', gap: 0.5, justifyContent: 'center' }}>
          <Tooltip title="Edit"><IconButton size="small" onClick={(e) => { e.stopPropagation(); openEdit(row); }} sx={{ color: '#6366f1' }}><EditIcon fontSize="small" /></IconButton></Tooltip>
          <Tooltip title="Delete"><IconButton size="small" onClick={(e) => { e.stopPropagation(); handleDelete(value); }} sx={{ color: '#EF4444' }}><DeleteIcon fontSize="small" /></IconButton></Tooltip>
        </Box>
      ),
    },
  ];

  const isUploading = isUploadingImg || isUploadingVideo;

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Instagram Feed</Typography>
          <Typography variant="body1" color="text.secondary">Manage posts shown in the Instagram section on the homepage</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
          sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>Add Post</Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {['image', 'carousel', 'video'].map((t) => (
            <Chip key={t} label={`${posts.filter((p) => p.type === t).length} ${t}`} size="small"
              sx={{ bgcolor: `${typeColors[t]}15`, color: typeColors[t], fontWeight: 600, textTransform: 'capitalize' }} />
          ))}
        </Box>
        {isLoading ? (
          <TableSkeleton columns={6} rows={6} />
        ) : (
          <DataTable columns={columns} data={posts} emptyMessage="No posts yet." />
        )}
      </Paper>

      {/* Add/Edit Dialog */}
      <MobileDialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>{editId ? 'Edit Post' : 'Add Instagram Post'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Post type */}
            <Grid size={12}>
              <TextField fullWidth size="small" select label="Post Type" value={form.type}
                onChange={(e) => setForm(f => ({ ...f, type: e.target.value as typeof form.type, images: [], videoSrc: '', poster: '' }))}>
                <MenuItem value="image">Image</MenuItem>
                <MenuItem value="carousel">Carousel</MenuItem>
                <MenuItem value="video">Video</MenuItem>
              </TextField>
            </Grid>

            {/* IMAGE / CAROUSEL upload */}
            {(form.type === 'image' || form.type === 'carousel') && (
              <Grid size={12}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>
                  {form.type === 'carousel' ? 'Carousel Images' : 'Image'}
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, mb: 1 }}>
                  {form.images.map((url, i) => (
                    <Box key={i} sx={{ position: 'relative', width: 200, height: 200, borderRadius: 1.5, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)' }}>
                      <Image src={url} alt={`img ${i + 1}`} fill style={{ objectFit: 'cover' }} sizes="100px" />
                      <IconButton size="small" onClick={() => setForm(f => ({ ...f, images: f.images.filter((_, idx) => idx !== i) }))}
                        sx={{ position: 'absolute', top: 0, right: 0, p: 0.25, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: 0, '&:hover': { bgcolor: '#DC2626' } }}>
                        <CloseIcon sx={{ fontSize: 12 }} />
                      </IconButton>
                    </Box>
                  ))}
                  {/* Only show upload button for carousel (unlimited) or image (max 1) */}
                  {(form.type === 'carousel' || form.images.length === 0) && (
                    <label style={{ cursor: isUploadingImg ? 'default' : 'pointer' }}>
                      <input ref={imgFileRef} type="file" accept="image/*"
                        multiple={form.type === 'carousel'} disabled={isUploadingImg}
                        style={{ display: 'none' }}
                        onChange={(e) => { if (e.target.files?.length) handleImgFilesSelected(e.target.files); }} />
                      <Box component="span" sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 0.5, width: 200, height: 200, border: '2px dashed',
                        borderColor: isUploadingImg ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.2)',
                        borderRadius: 1.5, fontSize: 11, color: isUploadingImg ? 'text.disabled' : 'text.secondary',
                        transition: 'all 0.2s',
                        '&:hover': isUploadingImg ? {} : { borderColor: '#DC2626', color: '#DC2626' },
                      }}>
                        {isUploadingImg ? <CircularProgress size={20} sx={{ color: '#DC2626' }} /> : (
                          <><UploadIcon sx={{ fontSize: 36 }} /><Typography variant="body2" fontWeight={600}>Upload Image</Typography></>
                        )}
                      </Box>
                    </label>
                  )}
                </Box>
                {isUploadingImg && <Typography variant="caption" color="text.secondary">Uploading...</Typography>}
              </Grid>
            )}

            {/* VIDEO upload */}
            {form.type === 'video' && (
              <>
                <Grid size={12}>
                  <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Video File</Typography>
                  {form.videoSrc ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1.5, border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2, bgcolor: '#f9fafb' }}>
                      <VideoIcon sx={{ color: '#ef4444' }} />
                      <Typography variant="body2" sx={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>Video uploaded ✓</Typography>
                      <IconButton size="small" onClick={() => setForm(f => ({ ...f, videoSrc: '' }))} sx={{ color: 'text.secondary' }}><CloseIcon fontSize="small" /></IconButton>
                    </Box>
                  ) : (
                    <label style={{ cursor: isUploadingVideo ? 'default' : 'pointer', display: 'block' }}>
                      <input ref={videoFileRef} type="file" accept="video/*" disabled={isUploadingVideo}
                        style={{ display: 'none' }}
                        onChange={(e) => { if (e.target.files?.[0]) handleVideoSelected(e.target.files[0]); }} />
                      <Box sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                        gap: 1, py: 3, border: '2px dashed', borderColor: 'rgba(0,0,0,0.2)', borderRadius: 2,
                        color: 'text.secondary', transition: 'all 0.2s',
                        '&:hover': { borderColor: '#ef4444', color: '#ef4444' },
                      }}>
                        {isUploadingVideo ? <CircularProgress size={24} sx={{ color: '#ef4444' }} /> : (
                          <><VideoIcon sx={{ fontSize: 32 }} /><Typography variant="body2" fontWeight={600}>Click to upload video</Typography></>
                        )}
                      </Box>
                    </label>
                  )}
                </Grid>

              </>
            )}

            {/* Post URL */}
            <Grid size={12}>
              <TextField fullWidth size="small" label="Post URL *" placeholder="https://www.instagram.com/p/..."
                value={form.postUrl} onChange={(e) => setForm(f => ({ ...f, postUrl: e.target.value }))} />
            </Grid>

            {/* Caption */}
            <Grid size={12}>
              <TextField fullWidth size="small" multiline minRows={2} label="Caption"
                value={form.caption} onChange={(e) => setForm(f => ({ ...f, caption: e.target.value }))} />
            </Grid>

            {/* Likes / Comments / Order */}
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" type="number" label="Likes" value={form.likes}
                onChange={(e) => setForm(f => ({ ...f, likes: Number(e.target.value) }))} inputProps={{ min: 0 }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" type="number" label="Comments" value={form.comments}
                onChange={(e) => setForm(f => ({ ...f, comments: Number(e.target.value) }))} inputProps={{ min: 0 }} />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField fullWidth size="small" type="number" label="Sort Order" value={form.sort_order}
                onChange={(e) => setForm(f => ({ ...f, sort_order: Number(e.target.value) }))}
                inputProps={{ min: 0 }} helperText="Lower = first" />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={isSaving || isUploading || !form.postUrl} onClick={handleSave}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
            {isSaving ? 'Saving...' : editId ? 'Save Changes' : 'Add Post'}
          </Button>
        </DialogActions>
      </MobileDialog>

      {/* Crop Dialog */}
      <Dialog open={!!cropSrc} maxWidth="sm" fullWidth onClose={() => { setCropSrc(null); setCropQueue([]); }}
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ px: 3, py: 2, background: 'linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 100%)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2 }}>Crop Image</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>Drag to reposition · Scroll or slide to zoom</Typography>
          </Box>
          <IconButton size="small" onClick={() => { setCropSrc(null); setCropQueue([]); }} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: 'white' } }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <Box sx={{ position: 'relative', width: '100%', height: 400, bgcolor: '#0a0a0a' }}>
          {cropSrc && (
            <Cropper image={cropSrc} crop={crop} zoom={zoom} aspect={1}
              onCropChange={setCrop} onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setCroppedAreaPixels(pixels)}
              style={{ cropAreaStyle: { border: '2px solid #DC2626', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' } }} />
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
          <Button onClick={() => { setCropSrc(null); setCropQueue([]); }} sx={{ color: 'text.secondary' }}>Cancel</Button>
          <Button variant="contained" onClick={handleCropConfirm} startIcon={<UploadIcon />}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, borderRadius: 2, px: 3, fontWeight: 600, boxShadow: '0 4px 12px rgba(220,38,38,0.3)' }}>
            {cropQueue.length > 0 ? `Crop & Next (${cropQueue.length} left)` : 'Crop & Upload'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
