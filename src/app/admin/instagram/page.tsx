'use client';

import { useState, useEffect, useCallback } from 'react';
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
  Chip,
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';

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
  images: '',
  videoSrc: '',
  poster: '',
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

  const load = useCallback(() => {
    fetch('/api/admin/instagram')
      .then((r) => r.json())
      .then((data) => { setPosts(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (post: InstagramPost) => {
    setEditId(post.id);
    setForm({
      type: post.type,
      images: (post.images ?? []).join('\n'),
      videoSrc: post.videoSrc ?? '',
      poster: post.poster ?? '',
      postUrl: post.postUrl,
      likes: post.likes,
      comments: post.comments,
      caption: post.caption,
      sort_order: post.sort_order,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.postUrl) return;
    setIsSaving(true);
    const payload = {
      type: form.type,
      images: form.images.split('\n').map((s) => s.trim()).filter(Boolean),
      videoSrc: form.videoSrc || null,
      poster: form.poster || null,
      postUrl: form.postUrl,
      likes: Number(form.likes),
      comments: Number(form.comments),
      caption: form.caption,
      sort_order: Number(form.sort_order),
    };
    if (editId) {
      await fetch(`/api/admin/instagram/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/admin/instagram', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }
    setIsSaving(false);
    setDialogOpen(false);
    load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this post? This cannot be undone.')) return;
    await fetch(`/api/admin/instagram/${id}`, { method: 'DELETE' });
    load();
  };

  const typeColors: Record<string, string> = {
    image: '#3b82f6',
    carousel: '#8b5cf6',
    video: '#ef4444',
  };

  const columns: Column[] = [
    {
      id: 'images',
      label: 'Preview',
      minWidth: 80,
      sortable: false,
      format: (value, row: InstagramPost) => {
        const src = (value as string[])?.[0] ?? row.poster ?? '';
        return (
          <Box sx={{ width: 64, height: 64, position: 'relative', borderRadius: 1, overflow: 'hidden', bgcolor: '#f3f4f6' }}>
            {src ? (
              <Image src={src} alt="preview" fill style={{ objectFit: 'cover' }} sizes="64px" />
            ) : (
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                <Typography variant="caption" color="text.secondary">No img</Typography>
              </Box>
            )}
          </Box>
        );
      },
    },
    {
      id: 'type',
      label: 'Type',
      minWidth: 100,
      format: (value) => (
        <Chip
          label={value}
          size="small"
          sx={{ bgcolor: `${typeColors[value]}20`, color: typeColors[value], fontWeight: 600, textTransform: 'capitalize' }}
        />
      ),
    },
    {
      id: 'caption',
      label: 'Caption',
      minWidth: 220,
      format: (value) => (
        <Typography variant="body2" sx={{ maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || <em style={{ color: '#9ca3af' }}>No caption</em>}
        </Typography>
      ),
    },
    {
      id: 'likes',
      label: 'Likes',
      minWidth: 70,
      align: 'center',
    },
    {
      id: 'comments',
      label: 'Comments',
      minWidth: 90,
      align: 'center',
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
      format: (value, row: InstagramPost) => (
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
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Instagram Feed</Typography>
          <Typography variant="body1" color="text.secondary">Manage posts shown in the Instagram section on the homepage</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
        >
          Add Post
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
          {['image', 'carousel', 'video'].map((t) => (
            <Chip
              key={t}
              label={`${posts.filter((p) => p.type === t).length} ${t}`}
              size="small"
              sx={{ bgcolor: `${typeColors[t]}15`, color: typeColors[t], fontWeight: 600, textTransform: 'capitalize' }}
            />
          ))}
        </Box>
        <DataTable
          columns={columns}
          data={posts}
          emptyMessage={isLoading ? 'Loading...' : 'No posts yet. Add one above.'}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{editId ? 'Edit Post' : 'Add Instagram Post'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                select
                label="Post Type"
                value={form.type}
                onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as typeof form.type }))}
                SelectProps={{ native: true }}
              >
                <option value="image">Image</option>
                <option value="carousel">Carousel</option>
                <option value="video">Video</option>
              </TextField>
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Post URL *"
                placeholder="https://www.instagram.com/p/..."
                value={form.postUrl}
                onChange={(e) => setForm((f) => ({ ...f, postUrl: e.target.value }))}
              />
            </Grid>
            {(form.type === 'image' || form.type === 'carousel') && (
              <Grid size={12}>
                <TextField
                  fullWidth
                  size="small"
                  multiline
                  minRows={3}
                  label="Image URLs (one per line)"
                  placeholder="https://example.com/img1.jpg&#10;https://example.com/img2.jpg"
                  value={form.images}
                  onChange={(e) => setForm((f) => ({ ...f, images: e.target.value }))}
                  helperText="For carousel, add multiple URLs on separate lines"
                />
              </Grid>
            )}
            {form.type === 'video' && (
              <>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Video URL"
                    placeholder="https://example.com/video.mp4"
                    value={form.videoSrc}
                    onChange={(e) => setForm((f) => ({ ...f, videoSrc: e.target.value }))}
                  />
                </Grid>
                <Grid size={12}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Poster / Thumbnail URL"
                    placeholder="https://example.com/poster.jpg"
                    value={form.poster}
                    onChange={(e) => setForm((f) => ({ ...f, poster: e.target.value }))}
                  />
                </Grid>
              </>
            )}
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="Caption"
                value={form.caption}
                onChange={(e) => setForm((f) => ({ ...f, caption: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Likes"
                value={form.likes}
                onChange={(e) => setForm((f) => ({ ...f, likes: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Comments"
                value={form.comments}
                onChange={(e) => setForm((f) => ({ ...f, comments: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Sort Order"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
                helperText="Lower = first"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={isSaving || !form.postUrl}
            onClick={handleSave}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {isSaving ? 'Saving...' : editId ? 'Save Changes' : 'Add Post'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
