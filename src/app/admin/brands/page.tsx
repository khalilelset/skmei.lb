'use client';

import { useState, useEffect, useCallback } from 'react';
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
import TableSkeleton from '@/components/admin/TableSkeleton';

interface Brand {
  id: string;
  name: string;
  created_at: string;
}

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(() => {
    setIsLoading(true);
    fetch('/api/admin/brands')
      .then((r) => r.json())
      .then((data) => { setBrands(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const openCreate = () => {
    setEditId(null);
    setName('');
    setError('');
    setDialogOpen(true);
  };

  const openEdit = (brand: Brand) => {
    setEditId(brand.id);
    setName(brand.name);
    setError('');
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) { setError('Brand name is required.'); return; }
    setIsSaving(true);
    setError('');
    const url = editId ? `/api/admin/brands/${editId}` : '/api/admin/brands';
    const res = await fetch(url, {
      method: editId ? 'PATCH' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
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
          <TableSkeleton columns={3} rows={4} />
        ) : (
          <DataTable columns={columns} data={brands} emptyMessage="No brands yet. Add one above." />
        )}
      </Paper>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>{editId ? 'Edit Brand' : 'Add Brand'}</Typography>
          <IconButton onClick={() => setDialogOpen(false)} size="small"><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            size="small"
            label="Brand Name *"
            placeholder="e.g. SKMEI"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!error}
            helperText={error}
            onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            autoFocus
          />
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
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} maxWidth="xs" fullWidth PaperProps={{ sx: { borderTop: '3px solid #DC2626' } }}>
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
      </Dialog>
    </Box>
  );
}
