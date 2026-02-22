'use client';

import { useState, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  TextField,
  InputAdornment,
  Chip,
  Stack,
  Button,
} from '@mui/material';
import { Search as SearchIcon, Add as AddIcon } from '@mui/icons-material';
import DataTable, { Column } from '@/components/admin/DataTable';
import { products as allProducts, categories } from '@/data/products';
import { formatPrice } from '@/lib/utils';

function getStockLabel(stock: number): 'in-stock' | 'low-stock' | 'out-of-stock' {
  if (stock === 0) return 'out-of-stock';
  if (stock < 10) return 'low-stock';
  return 'in-stock';
}
import type { Product } from '@/types';
import Image from 'next/image';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const products = allProducts;

  // Filter products based on search and category
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch =
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        selectedCategory === 'all' || product.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [products, searchQuery, selectedCategory]);

  const columns: Column[] = [
    {
      id: 'image',
      label: 'Image',
      minWidth: 80,
      sortable: false,
      format: (_, product: Product) => (
        <Box
          sx={{
            width: 50,
            height: 50,
            position: 'relative',
            bgcolor: 'rgba(0, 0, 0, 0.02)',
            borderRadius: 1,
            overflow: 'hidden',
          }}
        >
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-1"
          />
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
          <Typography variant="caption" color="text.secondary">
            SKU: {product.sku}
          </Typography>
        </Box>
      ),
    },
    {
      id: 'category',
      label: 'Category',
      minWidth: 120,
      format: (value) => {
        const category = categories.find((cat) => cat.slug === value);
        return (
          <Chip
            label={category?.name || value}
            size="small"
            variant="outlined"
            sx={{ textTransform: 'capitalize' }}
          />
        );
      },
    },
    {
      id: 'price',
      label: 'Price',
      minWidth: 100,
      align: 'right',
      format: (value) => (
        <Typography sx={{ fontWeight: 600 }}>
          {formatPrice(value)}
        </Typography>
      ),
    },
    {
      id: 'stock',
      label: 'Stock',
      minWidth: 100,
      align: 'center',
      format: (value, product: Product) => {
        const status = getStockLabel(product.stock);
        const colors = {
          'in-stock': { bg: 'rgba(34, 197, 94, 0.1)', text: '#22C55E' },
          'low-stock': { bg: 'rgba(251, 146, 60, 0.1)', text: '#FB923C' },
          'out-of-stock': { bg: 'rgba(239, 68, 68, 0.1)', text: '#EF4444' },
        };
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Typography sx={{ fontWeight: 600 }}>{value}</Typography>
            <Chip
              label={status.replace('-', ' ')}
              size="small"
              sx={{
                bgcolor: colors[status as keyof typeof colors].bg,
                color: colors[status as keyof typeof colors].text,
                fontWeight: 600,
                fontSize: 10,
                height: 20,
                textTransform: 'capitalize',
              }}
            />
          </Box>
        );
      },
    },
    {
      id: 'featured',
      label: 'Featured',
      minWidth: 100,
      align: 'center',
      sortable: false,
      format: (value) => (
        <Chip
          label={value ? 'Yes' : 'No'}
          size="small"
          sx={{
            bgcolor: value ? 'rgba(220, 38, 38, 0.1)' : 'rgba(0, 0, 0, 0.05)',
            color: value ? '#DC2626' : 'text.secondary',
            fontWeight: 600,
          }}
        />
      ),
    },
  ];

  const categoryOptions = [
    { value: 'all', label: 'All Products' },
    ...categories.map((cat) => ({ value: cat.slug, label: cat.name })),
  ];

  return (
    <Box>
      {/* Page Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, mb: 1 }}>
            Products Management
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Manage your watch inventory and catalog
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          sx={{
            bgcolor: '#DC2626',
            '&:hover': { bgcolor: '#B91C1C' },
          }}
        >
          Add Product
        </Button>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Search Bar */}
        <TextField
          fullWidth
          placeholder="Search by product name or SKU..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ mb: 3 }}
        />

        {/* Category Filters */}
        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          {categoryOptions.map((category) => (
            <Chip
              key={category.value}
              label={category.label}
              onClick={() => setSelectedCategory(category.value)}
              variant={selectedCategory === category.value ? 'filled' : 'outlined'}
              sx={{
                bgcolor: selectedCategory === category.value ? '#DC2626' : 'transparent',
                color: selectedCategory === category.value ? 'white' : 'text.primary',
                borderColor: selectedCategory === category.value ? '#DC2626' : 'rgba(0, 0, 0, 0.23)',
                '&:hover': {
                  bgcolor: selectedCategory === category.value ? '#B91C1C' : 'rgba(220, 38, 38, 0.04)',
                },
              }}
            />
          ))}
        </Stack>
      </Paper>

      {/* Products Table */}
      <Box sx={{ mb: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Showing {filteredProducts.length} of {products.length} products
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Chip
              label={`${products.filter(p => getStockLabel(p.stock) === 'in-stock').length} In Stock`}
              size="small"
              sx={{ bgcolor: 'rgba(34, 197, 94, 0.1)', color: '#22C55E', fontWeight: 600 }}
            />
            <Chip
              label={`${products.filter(p => getStockLabel(p.stock) === 'low-stock').length} Low Stock`}
              size="small"
              sx={{ bgcolor: 'rgba(251, 146, 60, 0.1)', color: '#FB923C', fontWeight: 600 }}
            />
            <Chip
              label={`${products.filter(p => getStockLabel(p.stock) === 'out-of-stock').length} Out of Stock`}
              size="small"
              sx={{ bgcolor: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', fontWeight: 600 }}
            />
          </Box>
        </Box>
        <DataTable
          columns={columns}
          data={filteredProducts}
          emptyMessage="No products found. Try adjusting your filters."
        />
      </Box>
    </Box>
  );
}
