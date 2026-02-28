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

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  image: string;
  product_count: number;
  sort_order: number;
  created_at: string;
}

const emptyForm = {
  name: '',
  slug: '',
  description: '',
  image: '',
  product_count: 0,
  sort_order: 0,
};

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);

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
      product_count: cat.product_count ?? 0,
      sort_order: cat.sort_order ?? 0,
    });
    setDialogOpen(true);
  };

  const handleNameChange = (name: string) => {
    const slug = editId ? form.slug : name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    setForm((f) => ({ ...f, name, slug }));
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
        <Box sx={{ width: 64, height: 64, position: 'relative', borderRadius: 1, overflow: 'hidden', bgcolor: '#f3f4f6' }}>
          {value ? (
            <Image src={value} alt="category" fill style={{ objectFit: 'cover' }} sizes="64px" />
          ) : (
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
              <Typography variant="caption" color="text.secondary">No img</Typography>
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
      id: 'product_count',
      label: 'Products',
      minWidth: 80,
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
        <DataTable
          columns={columns}
          data={categories}
          emptyMessage={isLoading ? 'Loading...' : 'No categories yet. Add one above.'}
        />
      </Paper>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{editId ? 'Edit Category' : 'Add Category'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Name *"
                placeholder="e.g. Digital Watches"
                value={form.name}
                onChange={(e) => handleNameChange(e.target.value)}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                label="Slug *"
                placeholder="e.g. digital"
                value={form.slug}
                onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))}
                helperText="Used in URLs — lowercase, no spaces"
              />
            </Grid>
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                label="Image URL"
                placeholder="https://..."
                value={form.image}
                onChange={(e) => setForm((f) => ({ ...f, image: e.target.value }))}
              />
            </Grid>
            {form.image && (
              <Grid size={12}>
                <Box sx={{ position: 'relative', width: '100%', height: 160, borderRadius: 2, overflow: 'hidden', bgcolor: '#f3f4f6' }}>
                  <Image src={form.image} alt="preview" fill style={{ objectFit: 'cover' }} sizes="600px" />
                </Box>
              </Grid>
            )}
            <Grid size={12}>
              <TextField
                fullWidth
                size="small"
                multiline
                minRows={2}
                label="Description"
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                size="small"
                type="number"
                label="Product Count"
                value={form.product_count}
                onChange={(e) => setForm((f) => ({ ...f, product_count: Number(e.target.value) }))}
                inputProps={{ min: 0 }}
                helperText="Displayed label on the card"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
            disabled={isSaving || !form.name || !form.slug}
            onClick={handleSave}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}
          >
            {isSaving ? 'Saving...' : editId ? 'Save Changes' : 'Add Category'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
