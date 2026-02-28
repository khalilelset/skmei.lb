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
} from '@mui/material';
import {
  Add as AddIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';

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

  const load = useCallback(() => {
    fetch('/api/admin/feedback')
      .then((r) => r.json())
      .then((data) => { setItems(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (item: FeedbackImage) => {
    setEditId(item.id);
    setForm({ image: item.image, alt: item.alt, sort_order: item.sort_order });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.image) return;
    setIsSaving(true);
    if (editId) {
      await fetch(`/api/admin/feedback/${editId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
    } else {
      await fetch('/api/admin/feedback', {
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
    if (!confirm('Delete this feedback image? This cannot be undone.')) return;
    await fetch(`/api/admin/feedback/${id}`, { method: 'DELETE' });
    load();
  };

  const columns: Column[] = [
    {
      id: 'image',
      label: 'Preview',
      minWidth: 80,
      sortable: false,
      format: (value) => (
        <Box sx={{ width: 64, height: 48, position: 'relative', borderRadius: 1, overflow: 'hidden', bgcolor: '#f3f4f6' }}>
          {value ? (
            <Image src={value} alt="preview" fill style={{ objectFit: 'cover' }} sizes="64px" />
          ) : (
            <Box sx={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography variant="caption" color="text.secondary">No img</Typography>
            </Box>
          )}
        </Box>
      ),
    },
    {
      id: 'alt',
      label: 'Alt Text',
      minWidth: 200,
      format: (value) => (
        <Typography variant="body2" sx={{ color: value ? 'text.primary' : 'text.secondary', fontStyle: value ? 'normal' : 'italic' }}>
          {value || '(no alt text)'}
        </Typography>
      ),
    },
    {
      id: 'sort_order',
      label: 'Order',
      minWidth: 80,
      align: 'center',
    },
    {
      id: 'created_at',
      label: 'Added',
      minWidth: 120,
      format: (value) => new Date(value).toLocaleDateString(),
    },
    {
      id: 'id',
      label: 'Actions',
      minWidth: 100,
      align: 'center',
      sortable: false,
      format: (value, row: FeedbackImage) => (
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
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Feedback Images</Typography>
          <Typography variant="body1" color="text.secondary">Manage customer feedback photos shown on the homepage</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={openCreate}
          sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
        >
          Add Image
        </Button>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {items.length} image{items.length !== 1 ? 's' : ''} · sorted by Order field
        </Typography>
        <DataTable
          columns={columns}
          data={items}
          emptyMessage={isLoading ? 'Loading...' : 'No feedback images yet. Add one above.'}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{editId ? 'Edit Image' : 'Add Feedback Image'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Image URL *"
                placeholder="https://..."
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              />
            </Grid>
            {form.image && (
              <Grid size={12}>
                <Box sx={{ position: 'relative', width: '100%', height: 200, borderRadius: 2, overflow: 'hidden', bgcolor: '#f3f4f6' }}>
                  <Image src={form.image} alt="preview" fill style={{ objectFit: 'cover' }} sizes="600px" />
                </Box>
              </Grid>
            )}
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Alt Text"
                placeholder="Describe the image for accessibility"
                value={form.alt}
                onChange={(e) => setForm((f) => ({ ...f, alt: e.target.value }))}
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Sort Order"
                value={form.sort_order}
                onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
                helperText="Lower numbers appear first"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            disabled={isSaving || !form.image}
            onClick={handleSave}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {isSaving ? 'Saving...' : editId ? 'Save Changes' : 'Add Image'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
