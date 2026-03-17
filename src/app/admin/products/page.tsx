'use client';

import 'react-easy-crop/react-easy-crop.css';
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
  MenuItem,
  Slider,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon, Close as CloseIcon, CloudUpload as UploadIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, FiberNew as NewIcon, LocalOffer as SaleIcon, Star as BestsellerIcon } from '@mui/icons-material';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableSkeleton from '@/components/admin/TableSkeleton';
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

const emptySpecs = {
  movement: '', caseMaterial: '', bandMaterial: '',
  dialColor: '', caseSize: '', waterResistance: '', warranty: '',
};

const emptyForm = {
  name: '', slug: '', description: '', price: '', originalPrice: '',
  category: 'digital', stock: '', images: [] as string[],
  features: [] as string[],
  isNew: false, onSale: false, isBestseller: false, gender: '' as '' | 'men' | 'women' | 'unisex',
  specifications: { ...emptySpecs },
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
  const [featureInput, setFeatureInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Crop dialog state
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

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
      stock: String(product.stock),
      images: product.images ?? [],
      features: product.features ?? [],
      isNew: product.isNew ?? false,
      onSale: product.onSale ?? false,
      isBestseller: product.isBestseller ?? false,
      gender: (product.gender ?? '') as '' | 'men' | 'women' | 'unisex',
      specifications: { ...emptySpecs, ...(product.specifications ?? {}) },
    });
    setDialogOpen(true);
  };

  // When files are selected, open crop dialog for the first file
  const handleFilesSelected = (files: FileList) => {
    const fileArr = Array.from(files);
    if (fileArr.length === 0) return;
    const [first, ...rest] = fileArr;
    setCropQueue(rest);
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(first);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // After crop confirmed — upload and open next file if any
  const handleCropConfirm = async () => {
    if (!cropSrc || !croppedAreaPixels) return;
    setIsUploading(true);
    setCropSrc(null);
    try {
      const blob = await getCroppedImg(cropSrc, croppedAreaPixels);
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-') || 'temp';
      const fd = new FormData();
      fd.append('file', blob, 'image.jpg');
      fd.append('slug', slug);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, images: [...f.images, data.url] }));
    } finally {
      setIsUploading(false);
      // Open next file in queue
      if (cropQueue.length > 0) {
        const [next, ...rest] = cropQueue;
        setCropQueue(rest);
        const reader = new FileReader();
        reader.onload = () => setCropSrc(reader.result as string);
        reader.readAsDataURL(next);
        setCrop({ x: 0, y: 0 });
        setZoom(1);
      }
    }
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
      sku: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      stock: parseInt(form.stock) || 0,
      images: form.images,
      features: form.features,
      isNew: form.isNew,
      onSale: form.onSale,
      isBestseller: form.isBestseller,
      gender: form.gender || null,
      specifications: form.specifications,
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
      id: 'isNew',
      label: 'Labels',
      minWidth: 140,
      align: 'center',
      sortable: false,
      format: (_, product: Product) => (
        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
          {product.isNew && <Chip label="New" size="small" sx={{ bgcolor: 'rgba(220,38,38,0.1)', color: '#DC2626', fontWeight: 600, fontSize: 10 }} />}
          {product.onSale && <Chip label="Sale" size="small" sx={{ bgcolor: 'rgba(251,146,60,0.1)', color: '#FB923C', fontWeight: 600, fontSize: 10 }} />}
          {product.isBestseller && <Chip label="Bestseller" size="small" sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontWeight: 600, fontSize: 10 }} />}
          {!product.isNew && !product.onSale && !product.isBestseller && <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>}
        </Box>
      ),
    },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4, display: 'flex', alignItems: { xs: 'flex-start', sm: 'center' }, justifyContent: 'space-between', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, fontSize: { xs: '1.5rem', sm: '2.125rem' } }}>Products Management</Typography>
          <Typography variant="body2" color="text.secondary">Manage your watch inventory and catalog</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
          sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' }, flexShrink: 0 }}>
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
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: { xs: 'flex-start', sm: 'center' }, mb: 2, flexDirection: { xs: 'column', sm: 'row' }, gap: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {isLoading ? 'Loading...' : `Showing ${filteredProducts.length} of ${products.length} products`}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
            {(['in-stock', 'low-stock', 'out-of-stock'] as const).map((s) => (
              <Chip key={s} size="small"
                label={`${products.filter(p => getStockLabel(p.stock) === s).length} ${s.replace('-', ' ')}`}
                sx={{ bgcolor: stockColors[s].bg, color: stockColors[s].text, fontWeight: 600, textTransform: 'capitalize' }}
              />
            ))}
          </Box>
        </Box>
        {isLoading ? (
          <TableSkeleton columns={6} rows={8} />
        ) : (
          <DataTable columns={columns} data={filteredProducts} onRowClick={openEdit} emptyMessage="No products found." />
        )}
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
              >
                {categories.map(c => <MenuItem key={c.slug} value={c.slug}>{c.name}</MenuItem>)}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" select label="Gender" value={form.gender}
                onChange={(e) => setForm(f => ({ ...f, gender: e.target.value as typeof form.gender }))}
              >
                <MenuItem value="">— Not specified —</MenuItem>
                <MenuItem value="men">Men</MenuItem>
                <MenuItem value="women">Women</MenuItem>
                <MenuItem value="unisex">Unisex</MenuItem>
              </TextField>
            </Grid>

            {/* Image Upload Section */}
            <Grid size={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 2, mt: 1 }}>Images</Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 2 }}>
                {/* Thumbnails */}
                {form.images.map((url, index) => (
                  <Box key={index} sx={{ position: 'relative', width: 200, height: 200, borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.12)', bgcolor: 'rgba(0,0,0,0.02)' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt={`Image ${index + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    <IconButton
                      size="small"
                      onClick={() => removeImage(index)}
                      sx={{ position: 'absolute', top: 0, right: 0, p: 0.25, bgcolor: 'rgba(0,0,0,0.5)', color: 'white', borderRadius: 0, '&:hover': { bgcolor: '#DC2626' } }}
                    >
                      <CloseIcon sx={{ fontSize: 14 }} />
                    </IconButton>
                  </Box>
                ))}

                {/* Upload Button — uses label so the click is a real user gesture */}
                <label style={{ cursor: isUploading ? 'default' : 'pointer' }}>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploading}
                    style={{ display: 'none' }}
                    onChange={(e) => { if (e.target.files?.length) handleFilesSelected(e.target.files); }}
                  />
                  <Box
                    component="span"
                    sx={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 1, width: 200, height: 200,
                      border: '2px dashed', borderColor: isUploading ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.23)',
                      borderRadius: 2, fontSize: 12, color: isUploading ? 'rgba(0,0,0,0.26)' : 'text.secondary',
                      transition: 'all 0.2s',
                      '&:hover': isUploading ? {} : { borderColor: '#DC2626', color: '#DC2626', bgcolor: 'rgba(220,38,38,0.02)' },
                    }}
                  >
                    {isUploading ? (
                      <CircularProgress size={24} sx={{ color: '#DC2626' }} />
                    ) : (
                      <>
                        <UploadIcon sx={{ fontSize: 28 }} />
                        Upload Image
                      </>
                    )}
                  </Box>
                </label>
              </Box>
              {isUploading && (
                <Typography variant="caption" color="text.secondary">Uploading to Cloudinary...</Typography>
              )}
            </Grid>

            <Grid size={12}>
              <TextField
                fullWidth size="small" multiline rows={6}
                label="Description"
                value={form.description}
                onChange={(e) => setForm(f => ({ ...f, description: e.target.value }))}
              />
            </Grid>

            {/* Features Section */}
            <Grid size={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Product Features
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                These appear as bullet points on the product page (e.g. "Water resistant 50M", "LED backlight")
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
                <TextField
                  fullWidth size="small"
                  placeholder="e.g. Water resistant 50M"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && featureInput.trim()) {
                      e.preventDefault();
                      setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }));
                      setFeatureInput('');
                    }
                  }}
                />
                <Button
                  variant="outlined" size="small"
                  disabled={!featureInput.trim()}
                  onClick={() => {
                    if (featureInput.trim()) {
                      setForm(f => ({ ...f, features: [...f.features, featureInput.trim()] }));
                      setFeatureInput('');
                    }
                  }}
                  sx={{ flexShrink: 0, borderColor: '#DC2626', color: '#DC2626', '&:hover': { bgcolor: 'rgba(220,38,38,0.04)', borderColor: '#B91C1C' } }}
                >
                  Add
                </Button>
              </Box>
              {form.features.length > 0 && (
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {form.features.map((feat, i) => (
                    <Chip
                      key={i}
                      label={feat}
                      size="small"
                      onDelete={() => setForm(f => ({ ...f, features: f.features.filter((_, idx) => idx !== i) }))}
                      sx={{ bgcolor: 'rgba(220,38,38,0.08)', color: '#DC2626', '& .MuiChip-deleteIcon': { color: '#DC2626' } }}
                    />
                  ))}
                </Box>
              )}
            </Grid>

            {/* Specifications Table */}
            <Grid size={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, mt: 1 }}>Specifications</Typography>
              <Box sx={{ border: '1px solid rgba(0,0,0,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                {([
                  { key: 'movement',       label: 'Movement' },
                  { key: 'caseMaterial',   label: 'Case Material' },
                  { key: 'bandMaterial',   label: 'Band Material' },
                  { key: 'dialColor',      label: 'Dial Color' },
                  { key: 'caseSize',       label: 'Case Size' },
                  { key: 'waterResistance',label: 'Water Resistance' },
                  { key: 'warranty',       label: 'Warranty' },
                ] as { key: keyof typeof emptySpecs; label: string }[]).map(({ key, label }, i, arr) => (
                  <Box key={key} sx={{
                    display: 'flex', alignItems: 'center',
                    borderBottom: i < arr.length - 1 ? '1px solid rgba(0,0,0,0.08)' : 'none',
                  }}>
                    <Box sx={{
                      width: 160, minWidth: 160, px: 2, py: 1.25,
                      bgcolor: 'rgba(0,0,0,0.02)',
                      borderRight: '1px solid rgba(0,0,0,0.08)',
                    }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', fontSize: 13 }}>
                        {label}
                      </Typography>
                    </Box>
                    <Box sx={{ flex: 1, px: 1.5, py: 0.75 }}>
                      <TextField
                        fullWidth size="small" variant="standard"
                        placeholder={`Enter ${label.toLowerCase()}...`}
                        value={form.specifications[key]}
                        onChange={(e) => setForm(f => ({
                          ...f,
                          specifications: { ...f.specifications, [key]: e.target.value },
                        }))}
                        InputProps={{ disableUnderline: true, sx: { fontSize: 13 } }}
                      />
                    </Box>
                  </Box>
                ))}
              </Box>
            </Grid>

            {/* Label Toggles */}
            <Grid size={12}><Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, mt: 1 }}>Product Labels</Typography></Grid>
            {[
              { key: 'isNew',       label: 'New',        icon: <NewIcon sx={{ fontSize: 22 }} />,        color: '#DC2626', bg: 'rgba(220,38,38,0.08)',  activeBg: '#DC2626' },
              { key: 'onSale',      label: 'Sale',       icon: <SaleIcon sx={{ fontSize: 22 }} />,       color: '#B91C1C', bg: 'rgba(185,28,28,0.08)',   activeBg: '#B91C1C' },
              { key: 'isBestseller',label: 'Bestseller', icon: <BestsellerIcon sx={{ fontSize: 22 }} />, color: '#991B1B', bg: 'rgba(153,27,27,0.08)',   activeBg: '#991B1B' },
            ].map(({ key, label, icon, color, bg, activeBg }) => {
              const active = form[key as keyof typeof emptyForm] as boolean;
              return (
                <Grid key={key} size={{ xs: 4 }}>
                  <Box
                    onClick={() => setForm(f => ({ ...f, [key]: !f[key as keyof typeof emptyForm] }))}
                    sx={{
                      cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                      gap: 0.75, py: 2, px: 1,
                      borderRadius: 2,
                      border: '2px solid',
                      borderColor: active ? activeBg : 'rgba(0,0,0,0.1)',
                      bgcolor: active ? bg : 'transparent',
                      color: active ? color : 'text.secondary',
                      transition: 'all 0.2s',
                      userSelect: 'none',
                      '&:hover': { borderColor: color, color, bgcolor: bg },
                    }}
                  >
                    {icon}
                    <Typography variant="caption" sx={{ fontWeight: 700, fontSize: 12, letterSpacing: 0.3 }}>
                      {label}
                    </Typography>
                    {active && (
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, mt: 0.25 }} />
                    )}
                  </Box>
                </Grid>
              );
            })}
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

      {/* Crop Dialog */}
      <Dialog
        open={!!cropSrc}
        maxWidth="sm"
        fullWidth
        onClose={() => { setCropSrc(null); setCropQueue([]); }}
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
            onClick={() => { setCropSrc(null); setCropQueue([]); }}
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
        <Box sx={{
          px: 3, py: 2.5,
          bgcolor: '#f8f8f8',
          borderTop: '1px solid rgba(0,0,0,0.06)',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 36 }}>
              Zoom
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flex: 1 }}>
              <IconButton
                size="small"
                onClick={() => setZoom(z => Math.max(1, z - 0.2))}
                sx={{ bgcolor: 'white', border: '1px solid rgba(0,0,0,0.12)', '&:hover': { bgcolor: '#DC2626', color: 'white', borderColor: '#DC2626' } }}
              >
                <ZoomOutIcon fontSize="small" />
              </IconButton>
              <Slider
                value={zoom}
                min={1}
                max={3}
                step={0.05}
                onChange={(_, v) => setZoom(v as number)}
                sx={{
                  color: '#DC2626',
                  '& .MuiSlider-thumb': { width: 16, height: 16, boxShadow: '0 2px 6px rgba(220,38,38,0.4)' },
                  '& .MuiSlider-rail': { bgcolor: 'rgba(0,0,0,0.12)' },
                }}
              />
              <IconButton
                size="small"
                onClick={() => setZoom(z => Math.min(3, z + 0.2))}
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
        <Box sx={{
          px: 3, py: 2,
          display: 'flex', gap: 1.5, justifyContent: 'flex-end',
          bgcolor: 'white', borderTop: '1px solid rgba(0,0,0,0.06)',
        }}>
          <Button
            onClick={() => { setCropSrc(null); setCropQueue([]); }}
            sx={{ color: 'text.secondary', borderRadius: 2 }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={handleCropConfirm}
            startIcon={<UploadIcon />}
            sx={{
              bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' },
              borderRadius: 2, px: 3, fontWeight: 600,
              boxShadow: '0 4px 12px rgba(220,38,38,0.3)',
            }}
          >
            {cropQueue.length > 0 ? `Crop & Next (${cropQueue.length} left)` : 'Crop & Upload'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
