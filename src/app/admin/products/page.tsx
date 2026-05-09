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
import { Search as SearchIcon, Add as AddIcon, Close as CloseIcon, CloudUpload as UploadIcon, ZoomIn as ZoomInIcon, ZoomOut as ZoomOutIcon, FiberNew as NewIcon, LocalOffer as SaleIcon, Star as BestsellerIcon, VideoFile as VideoIcon, Favorite as CoupleIcon } from '@mui/icons-material';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { getCroppedImg } from '@/lib/cropImage';
import DataTable, { Column } from '@/components/admin/DataTable';
import TableSkeleton from '@/components/admin/TableSkeleton';
import MobileDialog from '@/components/admin/MobileDialog';
const categories = [
  { slug: 'digital', name: 'Digital Watches' },
  { slug: 'analog',  name: 'Analog Watches' },
  { slug: 'sports',  name: 'Sports Watches' },
  { slug: 'smart',   name: 'Smart Watches' },
  { slug: 'luxury',  name: 'Luxury Collection' },
];
import { formatPrice } from '@/lib/utils';
import type { Product, ProductColor } from '@/types';

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
  name: '', slug: '', description: '', price: '', costPrice: '', originalPrice: '',
  category: 'digital', stock: '', images: [] as string[],
  features: [] as string[],
  videoUrl: '',
  brand: 'SKMEI',
  isNew: false, onSale: false, isBestseller: false, isCouple: false, gender: '' as '' | 'men' | 'women' | 'unisex',
  colors: [] as ProductColor[],
  priceTiers: [] as { qty: string; price: string }[],
  specifications: { ...emptySpecs },
};

interface BrandOption {
  id: string;
  name: string;
}

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<Product | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoFileRef = useRef<HTMLInputElement>(null);

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

  useEffect(() => {
    fetch('/api/admin/brands')
      .then((r) => r.json())
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

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
      costPrice: product.costPrice ? String(product.costPrice) : '',
      originalPrice: product.originalPrice ? String(product.originalPrice) : '',
      category: product.category,
      stock: String(product.stock),
      images: product.images ?? [],
      features: product.features ?? [],
      isNew: product.isNew ?? false,
      onSale: product.onSale ?? false,
      isBestseller: product.isBestseller ?? false,
      isCouple: product.isCouple ?? false,
      videoUrl: product.videoUrl ?? '',
      gender: (product.gender ?? '') as '' | 'men' | 'women' | 'unisex',
      brand: product.brand ?? 'SKMEI',
      colors: product.colors ?? [],
      priceTiers: (product.priceTiers ?? []).map((t) => ({ qty: String(t.qty), price: String(t.price) })),
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

  const handleVideoSelected = async (file: File) => {
    if (videoFileRef.current) videoFileRef.current.value = '';
    setIsUploadingVideo(true);
    try {
      const slug = form.slug || form.name.toLowerCase().replace(/\s+/g, '-') || 'temp';
      const fd = new FormData();
      fd.append('file', file);
      fd.append('slug', slug);
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (data.url) setForm(f => ({ ...f, videoUrl: data.url }));
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const payload = {
      name: form.name,
      slug: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      description: form.description,
      price: parseFloat(form.price) || 0,
      costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
      originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
      category: form.category,
      sku: form.slug || form.name.toLowerCase().replace(/\s+/g, '-'),
      stock: parseInt(form.stock) || 0,
      images: form.images,
      features: form.features,
      videoUrl: form.videoUrl || null,
      isNew: form.isNew,
      onSale: form.onSale,
      isBestseller: form.isBestseller,
      isCouple: form.isCouple,
      gender: form.gender || null,
      brand: form.brand || 'SKMEI',
      colors: form.colors,
      priceTiers: form.priceTiers
        .filter((t) => t.qty && t.price && parseFloat(t.qty) > 0 && parseFloat(t.price) > 0)
        .map((t) => ({ qty: parseInt(t.qty), price: parseFloat(t.price) }))
        .sort((a, b) => a.qty - b.qty),
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
        <Box sx={{ width: 64, height: 64, position: 'relative', bgcolor: '#f3f4f6', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.06)' }}>
          {product.images?.[0] && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={product.images[0]} alt={product.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
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
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75, alignItems: 'center' }}>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
            {product.brand && product.brand.toUpperCase() !== 'SKMEI' && (
              <Chip label={product.brand} size="small" sx={{ bgcolor: 'rgba(251,146,60,0.12)', color: '#B45309', fontWeight: 700, fontSize: 10, border: '1px solid rgba(251,146,60,0.3)' }} />
            )}
            {product.isNew && <Chip label="New" size="small" sx={{ bgcolor: 'rgba(220,38,38,0.1)', color: '#DC2626', fontWeight: 600, fontSize: 10 }} />}
            {product.onSale && <Chip label="Sale" size="small" sx={{ bgcolor: 'rgba(251,146,60,0.1)', color: '#FB923C', fontWeight: 600, fontSize: 10 }} />}
            {product.isBestseller && <Chip label="Bestseller" size="small" sx={{ bgcolor: 'rgba(59,130,246,0.1)', color: '#3B82F6', fontWeight: 600, fontSize: 10 }} />}
            {product.isCouple && <Chip label="Couple Set" size="small" sx={{ bgcolor: 'rgba(236,72,153,0.1)', color: '#EC4899', fontWeight: 600, fontSize: 10 }} />}
            {!product.brand || product.brand.toUpperCase() === 'SKMEI' ? (
              !product.isNew && !product.onSale && !product.isBestseller && !(product.colors?.length) && <span style={{ color: '#9CA3AF', fontSize: 12 }}>—</span>
            ) : null}
          </Box>
          {product.colors && product.colors.length > 0 && (
            <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', justifyContent: 'center' }}>
              {product.colors.slice(0, 6).map((c, i) => (
                <Box key={i} title={c.name} sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: c.hex, border: '1.5px solid rgba(0,0,0,0.15)', boxShadow: '0 1px 3px rgba(0,0,0,0.15)' }} />
              ))}
              {product.colors.length > 6 && (
                <Typography variant="caption" sx={{ fontSize: 9, color: 'text.secondary', lineHeight: '14px' }}>+{product.colors.length - 6}</Typography>
              )}
            </Box>
          )}
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
      <MobileDialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6" component="span" sx={{ fontWeight: 600 }}>{editProduct ? 'Edit Product' : 'Add Product'}</Typography>
          <Button onClick={() => setDialogOpen(false)} sx={{ minWidth: 'auto', color: 'text.secondary' }}><CloseIcon /></Button>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {[
              { label: 'Product Name *', key: 'name' },
              { label: 'Slug (auto-generated if empty)', key: 'slug' },
              { label: 'Sale Price ($) *', key: 'price', type: 'number' },
              { label: 'My Cost Price ($)', key: 'costPrice', type: 'number' },
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
            {/* Live gross profit hint */}
            {form.price && form.costPrice && parseFloat(form.price) > 0 && parseFloat(form.costPrice) > 0 && (() => {
              const sale = parseFloat(form.price);
              const cost = parseFloat(form.costPrice);
              const profit = sale - cost;
              const margin = (profit / sale) * 100;
              const isGood = margin >= 0;
              return (
                <Grid size={12}>
                  <Box sx={{
                    display: 'flex', gap: 3, p: 1.5, borderRadius: 2,
                    bgcolor: isGood ? 'rgba(16,185,129,0.06)' : 'rgba(239,68,68,0.06)',
                    border: `1px solid ${isGood ? 'rgba(16,185,129,0.2)' : 'rgba(239,68,68,0.2)'}`,
                  }}>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Gross Profit</Typography>
                      <Typography sx={{ fontWeight: 700, color: isGood ? '#10B981' : '#EF4444', fontSize: 15 }}>
                        ${profit.toFixed(2)}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>Margin</Typography>
                      <Typography sx={{ fontWeight: 700, color: isGood ? '#10B981' : '#EF4444', fontSize: 15 }}>
                        {margin.toFixed(1)}%
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              );
            })()}
            {/* Bundle / Tiered Pricing */}
            <Grid size={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5 }}>Bundle Pricing <Typography component="span" variant="caption" color="text.secondary">(optional — e.g. 2 for $15)</Typography></Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                Each row defines a total price when the customer buys exactly that many units.
              </Typography>
              {form.priceTiers.map((tier, i) => (
                <Box key={i} sx={{ display: 'flex', gap: 1, mb: 1, alignItems: 'center' }}>
                  <TextField
                    size="small" type="number" label="Qty" sx={{ width: 90 }}
                    value={tier.qty}
                    onChange={(e) => setForm(f => ({
                      ...f,
                      priceTiers: f.priceTiers.map((t, idx) => idx === i ? { ...t, qty: e.target.value } : t),
                    }))}
                    inputProps={{ min: 1, step: 1 }}
                  />
                  <Typography sx={{ color: 'text.secondary', fontSize: 13 }}>units for</Typography>
                  <TextField
                    size="small" type="number" label="Total ($)" sx={{ width: 110 }}
                    value={tier.price}
                    onChange={(e) => setForm(f => ({
                      ...f,
                      priceTiers: f.priceTiers.map((t, idx) => idx === i ? { ...t, price: e.target.value } : t),
                    }))}
                    inputProps={{ min: 0, step: 0.01 }}
                  />
                  <IconButton size="small" onClick={() => setForm(f => ({ ...f, priceTiers: f.priceTiers.filter((_, idx) => idx !== i) }))}
                    sx={{ color: '#EF4444' }}>
                    <CloseIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>
              ))}
              <Button
                size="small" variant="outlined" startIcon={<AddIcon />}
                onClick={() => setForm(f => ({ ...f, priceTiers: [...f.priceTiers, { qty: '', price: '' }] }))}
                sx={{ borderColor: 'rgba(0,0,0,0.23)', color: 'text.secondary', mt: 0.5, '&:hover': { borderColor: '#DC2626', color: '#DC2626' } }}
              >
                Add Tier
              </Button>
            </Grid>

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
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth size="small" select label="Brand"
                value={form.brand}
                onChange={(e) => setForm(f => ({ ...f, brand: e.target.value }))}
              >
                {brands.map((b) => (
                  <MenuItem key={b.id} value={b.name}>{b.name}</MenuItem>
                ))}
                {brands.length === 0 && (
                  <MenuItem disabled value="">No brands — add one in Brands page</MenuItem>
                )}
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

            {/* Video Upload Section */}
            <Grid size={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5 }}>Product Video <Typography component="span" variant="caption" color="text.secondary">(optional — shown on product page)</Typography></Typography>
              <input ref={videoFileRef} type="file" accept="video/*" disabled={isUploadingVideo} style={{ display: 'none' }}
                onChange={(e) => { if (e.target.files?.[0]) handleVideoSelected(e.target.files[0]); }} />
              {form.videoUrl ? (
                <Box sx={{ position: 'relative', borderRadius: 2, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.12)', bgcolor: '#000', aspectRatio: '3/4', maxWidth: 200 }}>
                  <video src={form.videoUrl} controls style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }} />
                  <IconButton size="small" onClick={() => setForm(f => ({ ...f, videoUrl: '' }))}
                    sx={{ position: 'absolute', top: 6, right: 6, bgcolor: 'rgba(0,0,0,0.6)', color: 'white', '&:hover': { bgcolor: '#DC2626' } }}>
                    <CloseIcon sx={{ fontSize: 14 }} />
                  </IconButton>
                </Box>
              ) : (
                <label style={{ cursor: isUploadingVideo ? 'default' : 'pointer' }}>
                  <Box component="span" sx={{
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    gap: 1, width: 240, height: 120,
                    border: '2px dashed', borderColor: isUploadingVideo ? 'rgba(0,0,0,0.12)' : 'rgba(0,0,0,0.23)',
                    borderRadius: 2, fontSize: 12, color: isUploadingVideo ? 'rgba(0,0,0,0.26)' : 'text.secondary',
                    transition: 'all 0.2s',
                    '&:hover': isUploadingVideo ? {} : { borderColor: '#DC2626', color: '#DC2626', bgcolor: 'rgba(220,38,38,0.02)' },
                  }}>
                    {isUploadingVideo ? <CircularProgress size={24} sx={{ color: '#DC2626' }} /> : <><VideoIcon sx={{ fontSize: 28 }} /><span>Upload Video</span></>}
                  </Box>
                  <input type="file" accept="video/*" disabled={isUploadingVideo} style={{ display: 'none' }}
                    onChange={(e) => { if (e.target.files?.[0]) handleVideoSelected(e.target.files[0]); }} />
                </label>
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

            {/* Color Variants */}
            <Grid size={12}>
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, mt: 1 }}>Color Variants</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 2 }}>
                Tap a color to add it. Tap again (or click ×) to remove. Shown as swatches on product pages.
              </Typography>

              {/* Preset palette */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5 }}>
                {([
                  { name: 'Black',      hex: '#1a1a1a' },
                  { name: 'White',      hex: '#f5f5f5' },
                  { name: 'Silver',     hex: '#C0C0C0' },
                  { name: 'Gold',       hex: '#D4AF37' },
                  { name: 'Rose Gold',  hex: '#B76E79' },
                  { name: 'Red',        hex: '#DC2626' },
                  { name: 'Blue',       hex: '#1D4ED8' },
                  { name: 'Light Blue', hex: '#60A5FA' },
                  { name: 'Aqua',       hex: '#06B6D4' },
                  { name: 'Green',      hex: '#16A34A' },
                  { name: 'Orange',     hex: '#EA580C' },
                  { name: 'Brown',      hex: '#78350F' },
                  { name: 'Grey',       hex: '#6B7280' },
                  { name: 'Champagne',  hex: '#F7E7CE' },
                  { name: 'Gunmetal',   hex: '#2C3539' },
                ] as ProductColor[]).map((preset) => {
                  const active = form.colors.some(c => c.name === preset.name);
                  return (
                    <Box
                      key={preset.name}
                      onClick={() => setForm(f => ({
                        ...f,
                        colors: active
                          ? f.colors.filter(c => c.name !== preset.name)
                          : [...f.colors, preset],
                      }))}
                      sx={{
                        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.6,
                        cursor: 'pointer',
                        '&:hover .swatch': { transform: 'scale(1.12)' },
                      }}
                    >
                      <Box
                        className="swatch"
                        sx={{
                          width: 38, height: 38, borderRadius: '50%',
                          bgcolor: preset.hex,
                          border: active ? '3px solid #DC2626' : preset.hex === '#f5f5f5' ? '2px solid rgba(0,0,0,0.15)' : '2px solid rgba(0,0,0,0.08)',
                          boxShadow: active ? `0 0 0 2px white, 0 0 0 4px #DC2626, 0 4px 12px ${preset.hex}60` : '0 2px 6px rgba(0,0,0,0.18)',
                          transition: 'all 0.18s',
                          position: 'relative',
                        }}
                      >
                        {active && (
                          <Box sx={{
                            position: 'absolute', inset: 0, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            bgcolor: 'rgba(0,0,0,0.35)',
                          }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                              <polyline points="20 6 9 17 4 12" />
                            </svg>
                          </Box>
                        )}
                      </Box>
                      <Typography variant="caption" sx={{
                        fontSize: 9, fontWeight: active ? 700 : 500,
                        color: active ? '#DC2626' : 'text.secondary',
                        textAlign: 'center', lineHeight: 1.2, maxWidth: 46,
                      }}>
                        {preset.name}
                      </Typography>
                    </Box>
                  );
                })}
              </Box>

              {/* Selected colors summary */}
              {form.colors.length > 0 && (
                <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#DC2626', fontSize: 11 }}>
                    Selected:
                  </Typography>
                  {form.colors.map((c, i) => (
                    <Chip
                      key={i}
                      size="small"
                      label={c.name}
                      onDelete={() => setForm(f => ({ ...f, colors: f.colors.filter((_, idx) => idx !== i) }))}
                      avatar={<Box sx={{ width: 14, height: 14, borderRadius: '50%', bgcolor: c.hex, border: '1px solid rgba(0,0,0,0.15)', ml: '6px !important' }} />}
                      sx={{ bgcolor: 'rgba(220,38,38,0.07)', color: '#DC2626', fontWeight: 600, fontSize: 11, '& .MuiChip-deleteIcon': { color: '#DC2626', fontSize: 14 } }}
                    />
                  ))}
                </Box>
              )}
            </Grid>

            {/* Label Toggles */}
            <Grid size={12}><Typography variant="body2" sx={{ fontWeight: 600, mb: 1.5, mt: 1 }}>Product Labels</Typography></Grid>
            {[
              { key: 'isNew',       label: 'New',        icon: <NewIcon sx={{ fontSize: 22 }} />,        color: '#DC2626', bg: 'rgba(220,38,38,0.08)',  activeBg: '#DC2626' },
              { key: 'onSale',      label: 'Sale',       icon: <SaleIcon sx={{ fontSize: 22 }} />,       color: '#B91C1C', bg: 'rgba(185,28,28,0.08)',   activeBg: '#B91C1C' },
              { key: 'isBestseller',label: 'Bestseller', icon: <BestsellerIcon sx={{ fontSize: 22 }} />, color: '#991B1B', bg: 'rgba(153,27,27,0.08)',   activeBg: '#991B1B' },
              { key: 'isCouple',    label: 'Couple Set', icon: <CoupleIcon sx={{ fontSize: 22 }} />,     color: '#EC4899', bg: 'rgba(236,72,153,0.08)',  activeBg: '#EC4899' },
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
          <Button variant="contained" disabled={isSaving || isUploading || isUploadingVideo || !form.name || !form.price}
            onClick={handleSave}
            sx={{ bgcolor: '#DC2626', '&:hover': { bgcolor: '#B91C1C' } }}>
            {isSaving ? 'Saving...' : editProduct ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogActions>
      </MobileDialog>

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
