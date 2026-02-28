'use client';

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Close as CloseIcon, CloudUpload as UploadIcon } from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';
import { categories } from '@/data/products';
import { formatPrice } from '@/lib/utils';
import type { Product } from '@/types';

function getStockLabel(stock: number): 'in-stock' | 'low-stock' | 'out-of-stock' {
  if (stock === 0) return 'out-of-stock';
  if (stock < 10) return 'low-stock';
  return 'in-stock';
}

const stockColors = {
  'in-stock':     { bg: 'rgba(34, 197, 94, 0.1)',   text: '#22C55E' },
  'low-stock':    { bg: 'rgba(251, 146, 60, 0.1)',   text: '#FB923C' },
  'out-of-stock': { bg: 'rgba(239, 68, 68, 0.1)',    text: '#EF4444' },
};

const categoryOptions = [
  { value: 'all', label: 'All Products' },
  ...categories.map((cat) => ({ value: cat.slug, label: cat.name })),
];

const emptyForm = {
  name: '', slug: '', description: '', price: '', originalPrice: '',
  category: 'digital', sku: '', stock: '', images: [] as string[],
  isNew: false, isFeatured: false, gender: '' as '' | 'men' | 'women' | 'unisex',
};

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const loadProducts = useCallback(() => {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((data) => { setProducts(Array.isArray(data) ? data : []); setIsLoading(false); })
      .catch(() => setIsLoading(false));
  }, []);

  useEffect(() => { loadProducts(); }, [loadProducts]);

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (product.sku ?? '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const openAdd = () => {
    setEditProduct(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditProduct(product);
    setForm({
      name: product.name,
      slug: product.slug,
      description: product.description ?? '',
      price: String(product.price),
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      category: product.category,
      sku: product.sku ?? '',
      stock: String(product.stock),
      images: product.images ?? [],
      isNew: product.isNew ?? false,
      isFeatured: product.isFeatured ?? false,
      gender: (product.gender ?? '') as '' | 'men' | 'women' | 'unisex',
    });
    setDialogOpen(true);
  };

  const handleUploadImages = async (files: FileList) => {
    setIsUploading(true);
    const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-') || 'temp';
    const newUrls: string[] = [];

    for (const file of Array.from(files)) {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slug', slug);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) newUrls.push(data.url);
    }

    setForm(f => ({ ...f, images: [...f.images, ...newUrls] }));
    setIsUploading(false);
    // Reset file input so same file can be re-selected
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index: number) => {
    setForm(f => ({ ...f, images: f.images.filter((_, i) => i !== index) }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      description: form.description,
      price: parseFloat(form.price) || 0,
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
      category: form.category,
      sku: form.sku || null,
      stock: parseInt(form.stock) || 0,
      images: form.images,
      isNew: form.isNew,
      isFeatured: form.isFeatured,
      gender: form.gender || null,
    };

    if (editProduct) {
      await fetch(`/api/admin/products/${editProduct.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    } else {
      await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
    }

    setIsSaving(false);
    setDialogOpen(false);
    loadProducts();
  };

  const columns: Column[] = [
    {
      id: 'images',
      label: 'Image',
      minWidth: 80,
      sortable: false,
      format: (value, product: Product) => (
        <Box sx={{ width: 50, height: 50, position: 'relative', bgcolor: 'rgba(0,0,0,0.02)', borderRadius: 1, overflow: 'hidden' }}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
          )}
        </Box>
      ),
    },
    {
      id: 'name',
      label: 'Product Name',
      minWidth: 250,
      format: (value, product: Product) => (
        <Box>
          <Typography sx={{ fontWeight: 500 }}>{value}</Typography>
          <Typography variant="caption" color="text.secondary">SKU: {product.sku}</Typography>
        </Box>
      ),
    },
    {
      id: 'category',
      label: 'Category',
      minWidth: 120,
      format: (value) => {
        const cat = categories.find((c) => c.slug === value);
        return <Chip label={cat?.name || value} size="small" variant="outlined" sx={{ textTransform: 'capitalize' }} />;
      },
    },
    {
      id: 'price',
      label: 'Price',
      minWidth: 100,
      align: 'right',
      format: (value) => <Typography sx={{ fontWeight: 600 }}>{formatPrice(value)}</Typography>,
    },
    {
      id: 'stock',
      label: 'Stock',
      minWidth: 100,
      align: 'center',
      format: (value, product: Product) => {
        const status = getStockLabel(product.stock);
        const col = stockColors[status];
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
            <Chip label={status.replace('-', ' ')} size="small" sx={{ bgcolor: col.bg, color: col.text, fontWeight: 600, fontSize: 10, height: 20, textTransform: 'capitalize' }} />
          </Box>
        );
      },
    },
    {
      id: 'isFeatured',
      label: 'Featured',
      minWidth: 100,
      align: 'center',
      sortable: false,
      format: (value) => (
        <Chip
          label={value ? 'Yes' : 'No'}
          size="small"
          sx={{ bgcolor: value ? 'rgba(220,38,38,0.1)' : 'rgba(0,0,0,0.05)', color: value ? '#DC2626' : 'text.secondary', fontWeight: 600 }}
        />
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>Products Management</Typography>
          <Typography variant="body1" color="text.secondary">Manage your watch inventory and catalog</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
          sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
          Add Product
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <TextField
          fullWidth
          placeholder="Search by product name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment> }}
          sx={{ mb: 3 }}
        />
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {categoryOptions.map((cat) => (
            <Chip
              key={cat.value}
              label={cat.label}
              onClick={() => setSelectedCategory(cat.value)}
              variant={selectedCategory === cat.value ? 'filled' : 'outlined'}
              sx={{
                bgcolor: selectedCategory === cat.value ? '#DC2626' : 'transparent',
                color: selectedCategory === cat.value ? 'white' : 'text.primary',
                borderColor: selectedCategory === cat.value ? '#DC2626' : 'rgba(0,0,0,0.23)',
                '&:hover': { bgcolor: selectedCategory === cat.value ? '#B91C1C' : 'rgba(220,38,38,0.04)' },
              }}
            />
          ))}
        </Stack>
      </Paper>

      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {isLoading ? 'Loading...' : `Showing ${filteredProducts.length} of ${products.length} products`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            {(['in-stock', 'low-stock', 'out-of-stock'] as const).map((s) => (
              <Chip key={s} size="small"
                label={`${products.filter(p => getStockLabel(p.stock) === s).length} ${s.replace('-', ' ')}`}
                sx={{ bgcolor: stockColors[s].bg, color: stockColors[s].text, fontWeight: 600, textTransform: 'capitalize' }}
              />
            ))}
          </Box>
        </Box>
        <DataTable columns={columns} data={filteredProducts} onRowClick={openEdit} emptyMessage="No products found." />
      </Box>

      {/* Add / Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>{editProduct ? 'Edit Product' : 'Add Product'}</Typography>
          <Button onClick={() => setDialogOpen(false)} sx={{ minWidth: 'auto', color: 'text.secondary' }}><CloseIcon /></Button>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {[
              { label: 'Product Name *', key: 'name' },
              { label: 'Slug (auto-generated if empty)', key: 'slug' },
              { label: 'SKU', key: 'sku' },
              { label: 'Price ($) *', key: 'price', type: 'number' },
              { label: 'Original Price ($)', key: 'originalPrice', type: 'number' },
              { label: 'Stock *', key: 'stock', type: 'number' },
            ].map(({ label, key, type }) => (
              <Grid key={key} size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth size="small" label={label} type={type ?? 'text'}
                  value={form[key as keyof typeof emptyForm] as string}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                />
              </Grid>
            ))}
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" select label="Category" value={form.category}
                onChange={(e) => setForm(f => ({ ...f, category: e.target.value }))}
                SelectProps={{ native: true }}
              >
                {categories.map(c => <option key={c.slug} value={c.slug}>{c.name}</option>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" select label="Gender" value={form.gender}
                onChange={(e) => setForm(f => ({ ...f, gender: e.target.value as typeof form.gender }))}
                SelectProps={{ native: true }}
              >
                <option value="">— Not specified —</option>
                <option value="men">Men</option>
                <option value="women">Women</option>
                <option value="unisex">Unisex</option>
              </TextField>
            </Grid>

            {/* Image Upload Section */}
            <Grid size={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>Images</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
                {/* Thumbnails */}
                {form.images.map((url, index) => (
                  <Box key={index} sx={{ position: 'relative', width: 70, height: 70, borderRadius: 1, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.12)', bgcolor: 'rgba(0,0,0,0.02)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Image ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 4 }} />
                    <IconButton
                      size="small"
                      onClick={() => removeImage(index)}
                      sx={{ position: 'absolute', top: 0, right: 0, p: 0.25, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: 0, '&:hover': { bgcolor: '#DC2626' } }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}

                {/* Upload Button */}
                <Button
                  variant="outlined"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  sx={{ width: 70, height: 70, minWidth: 70, flexDirection: 'column', gap: 0.5, borderStyle: 'dashed', fontSize: 10, color: 'text.secondary', borderColor: 'rgba(0,0,0,0.23)', '&:hover': { borderColor: '#DC2626', color: '#DC2626' } }}
                >
                  {isUploading ? (
                    <CircularProgress size={20} sx={{ color: '#DC2626' }} />
                  ) : (
                    <>
                      <UploadIcon sx={{ fontSize: 20 }} />
                      Upload
                    </>
                  )}
                </Button>
              </Box>
              {isUploading && (
                <Typography variant="caption" color="text.secondary">Uploading to Cloudinary...</Typography>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.length) handleUploadImages(e.target.files); }}
              />
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth size="small" multiline rows={3}
                label="Description"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </Grid>
            <Grid size={{ xs: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isNew} onChange={e => setForm(f => ({ ...f, isNew: e.target.checked }))} />
                <Typography variant="body2">New Arrival</Typography>
              </label>
            </Grid>
            <Grid size={{ xs: 6 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={form.isFeatured} onChange={e => setForm(f => ({ ...f, isFeatured: e.target.checked }))} />
                <Typography variant="body2">Featured</Typography>
              </label>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" disabled={isSaving || isUploading || !form.name || !form.price}
            onClick={handleSave}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
            {isSaving ? 'Saving...' : editProduct ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
