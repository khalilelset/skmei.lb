import { generateProductSlug } from '@/lib/utils';
import type { Product, ProductColor } from '@/types';

/* ---------- Reference data ---------- */

export interface BrandDefaults {
  price?: string;
  costPrice?: string;
  originalPrice?: string;
  category?: string;
  gender?: string;
  description?: string;
  videoUrl?: string;
  features?: string[];
  priceTiers?: { qty: string; price: string }[];
  specifications?: Record<string, string>;
}

export interface BrandOption {
  id: string;
  name: string;
  defaults?: BrandDefaults | null;
}

export interface CategoryOption {
  id: string;
  slug: string;
  name: string;
}

/* ---------- Stock ---------- */

export type StockLevel = 'in-stock' | 'low-stock' | 'out-of-stock';

/** Same rule the old products page used for its stock summary: under 10 is "low". */
export const LOW_STOCK_BELOW = 10;

export function stockLevel(stock: number): StockLevel {
  if (stock === 0) return 'out-of-stock';
  if (stock < LOW_STOCK_BELOW) return 'low-stock';
  return 'in-stock';
}

/* ---------- Form model ---------- */

export const SPEC_FIELDS = [
  { key: 'movement', label: 'Movement' },
  { key: 'caseMaterial', label: 'Case Material' },
  { key: 'bandMaterial', label: 'Band Material' },
  { key: 'caseSize', label: 'Case Size' },
  { key: 'caseThickness', label: 'Case Thickness' },
  { key: 'bandWidth', label: 'Band Width' },
  { key: 'bandLength', label: 'Band Length' },
  { key: 'waterResistance', label: 'Water Resistance' },
  { key: 'displayType', label: 'Display Type' },
  { key: 'features', label: 'Features' },
  { key: 'caseShape', label: 'Case Shape' },
  { key: 'dialWindowMaterial', label: 'Dial Window Material' },
  { key: 'warranty', label: 'Warranty' },
] as const;

export const emptySpecs: Record<string, string> = Object.fromEntries(SPEC_FIELDS.map((f) => [f.key, '']));

export type Gender = '' | 'men' | 'women' | 'unisex';

export interface PriceTierDraft {
  qty: string;
  price: string;
}

export interface ProductForm {
  name: string;
  slug: string;
  description: string;
  price: string;
  costPrice: string;
  originalPrice: string;
  category: string;
  stock: string;
  sortOrder: string;
  images: string[];
  features: string[];
  videoUrl: string;
  brand: string;
  isNew: boolean;
  onSale: boolean;
  isBestseller: boolean;
  isCouple: boolean;
  isVisible: boolean;
  gender: Gender;
  colors: ProductColor[];
  priceTiers: PriceTierDraft[];
  /** Keeps any extra keys stored on the product (e.g. dialColor) so they survive a save. */
  specifications: Record<string, string>;
}

export const emptyForm: ProductForm = {
  name: '',
  slug: '',
  description: '',
  price: '',
  costPrice: '',
  originalPrice: '',
  category: '',
  stock: '',
  sortOrder: '0',
  images: [],
  features: [],
  videoUrl: '',
  brand: '',
  isNew: false,
  onSale: false,
  isBestseller: false,
  isCouple: false,
  isVisible: true,
  gender: '',
  colors: [],
  priceTiers: [],
  specifications: { ...emptySpecs },
};

export function newProductForm(firstCategory: string | undefined): ProductForm {
  return { ...emptyForm, specifications: { ...emptySpecs }, category: firstCategory ?? '' };
}

export function productToForm(product: Product): ProductForm {
  return {
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
    isVisible: product.isVisible ?? true,
    videoUrl: product.videoUrl ?? '',
    gender: (product.gender ?? '') as Gender,
    brand: product.brand ?? '',
    colors: product.colors ?? [],
    priceTiers: (product.priceTiers ?? []).map((t) => ({ qty: String(t.qty), price: String(t.price) })),
    sortOrder: String(product.sortOrder ?? 0),
    specifications: { ...emptySpecs, ...(product.specifications ?? {}) },
  };
}

/** Brand defaults only fill a NEW product. Mirrors the old page field by field. */
export function applyBrandDefaults(form: ProductForm, brandName: string, defs: BrandDefaults): ProductForm {
  return {
    ...form,
    brand: brandName,
    ...(defs.price !== undefined && { price: defs.price }),
    ...(defs.costPrice !== undefined && { costPrice: defs.costPrice }),
    ...(defs.originalPrice !== undefined && { originalPrice: defs.originalPrice }),
    ...(defs.category !== undefined && { category: defs.category }),
    ...(defs.gender !== undefined && { gender: defs.gender as Gender }),
    ...(defs.description !== undefined && { description: defs.description }),
    ...(defs.videoUrl !== undefined && { videoUrl: defs.videoUrl }),
    ...(defs.features !== undefined && { features: [...defs.features] }),
    ...(defs.priceTiers !== undefined && {
      priceTiers: defs.priceTiers.map((t) => ({ qty: String(t.qty), price: String(t.price) })),
    }),
    ...(defs.specifications !== undefined && { specifications: { ...emptySpecs, ...defs.specifications } }),
  };
}

/** Folder slug used for uploads before the product is saved. */
export function uploadSlug(form: ProductForm) {
  return form.slug || generateProductSlug(form.name, form.brand) || 'temp';
}

export type RequiredField = 'name' | 'price' | 'stock' | 'brand' | 'category' | 'images';

export const REQUIRED_LABELS: Record<RequiredField, string> = {
  name: 'name',
  price: 'sale price',
  stock: 'stock',
  brand: 'brand',
  category: 'category',
  images: 'at least one image',
};

/** Same checks as the old page's save guard. */
export function missingFields(form: ProductForm): RequiredField[] {
  const missing: RequiredField[] = [];
  if (!form.name.trim()) missing.push('name');
  if (!form.price) missing.push('price');
  if (!form.stock.trim()) missing.push('stock');
  if (!form.brand) missing.push('brand');
  if (!form.category) missing.push('category');
  if (form.images.length === 0) missing.push('images');
  return missing;
}

/** Request body for POST /api/admin/products and PATCH /api/admin/products/:id (unchanged from the old page). */
export function buildPayload(form: ProductForm) {
  const slug = form.slug || generateProductSlug(form.name, form.brand);
  return {
    name: form.name,
    slug,
    description: form.description,
    price: parseFloat(form.price) || 0,
    costPrice: form.costPrice ? parseFloat(form.costPrice) : undefined,
    originalPrice: form.originalPrice ? parseFloat(form.originalPrice) : undefined,
    category: form.category,
    sku: slug,
    stock: parseInt(form.stock) || 0,
    images: form.images,
    features: form.features,
    videoUrl: form.videoUrl || null,
    isNew: form.isNew,
    onSale: form.onSale,
    isBestseller: form.isBestseller,
    isCouple: form.isCouple,
    isVisible: form.isVisible,
    gender: form.gender || null,
    brand: form.brand,
    colors: form.colors,
    priceTiers: form.priceTiers
      .filter((t) => t.qty && t.price && parseFloat(t.qty) > 0 && parseFloat(t.price) > 0)
      .map((t) => ({ qty: parseInt(t.qty), price: parseFloat(t.price) }))
      .sort((a, b) => a.qty - b.qty),
    sortOrder: parseInt(form.sortOrder) || 0,
    specifications: form.specifications,
  };
}

/* ---------- Colors ---------- */

export const COLOR_PRESETS: ProductColor[] = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#f5f5f5' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Gold', hex: '#D4AF37' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Rose', hex: '#FF007F' },
  { name: 'Pink', hex: '#EC4899' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Blue', hex: '#1D4ED8' },
  { name: 'Light Blue', hex: '#60A5FA' },
  { name: 'Aqua', hex: '#06B6D4' },
  { name: 'Green', hex: '#16A34A' },
  { name: 'Orange', hex: '#EA580C' },
  { name: 'Brown', hex: '#78350F' },
  { name: 'Grey', hex: '#6B7280' },
  { name: 'Champagne', hex: '#F7E7CE' },
  { name: 'Gunmetal', hex: '#2C3539' },
];

/* ---------- Misc ---------- */

export async function readError(res: Response) {
  const body = (await res.json().catch(() => null)) as { error?: string } | null;
  return body?.error || `Request failed (HTTP ${res.status})`;
}

export function discountPercent(price: number, originalPrice?: number) {
  if (!originalPrice || originalPrice <= price) return 0;
  return Math.round((1 - price / originalPrice) * 100);
}
