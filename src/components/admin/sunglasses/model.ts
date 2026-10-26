import type { Sunglasses, SunglassesVariant } from '@/types';

/** Colour presets (same palette the old sunglasses page used). */
export const COLOR_PRESETS = [
  { name: 'Black', hex: '#1a1a1a' },
  { name: 'White', hex: '#ffffff' },
  { name: 'Silver', hex: '#C0C0C0' },
  { name: 'Gold', hex: '#FFD700' },
  { name: 'Rose Gold', hex: '#B76E79' },
  { name: 'Pink', hex: '#FFC0CB' },
  { name: 'Red', hex: '#DC2626' },
  { name: 'Navy', hex: '#1E3A5F' },
  { name: 'Blue', hex: '#3B82F6' },
  { name: 'Light Blue', hex: '#93C5FD' },
  { name: 'Green', hex: '#22C55E' },
  { name: 'Orange', hex: '#F97316' },
  { name: 'Brown', hex: '#92400E' },
  { name: 'Grey', hex: '#6B7280' },
  { name: 'Tortoise', hex: '#8B4513' },
  { name: 'Transparent', hex: '#e0e0e0' },
  { name: 'Gunmetal', hex: '#2C3539' },
  { name: 'Champagne', hex: '#F7E7CE' },
] as const;

export const SPEC_KEYS = [
  { key: 'frameMaterial', label: 'Frame Material', placeholder: 'e.g. Metal' },
  { key: 'lensType', label: 'Lens Type', placeholder: 'e.g. Polarized' },
  { key: 'uvProtection', label: 'UV Protection', placeholder: 'e.g. UV400' },
  { key: 'frameShape', label: 'Frame Shape', placeholder: 'e.g. Aviator' },
  { key: 'frameSize', label: 'Frame Size', placeholder: 'e.g. Medium' },
  { key: 'lensWidth', label: 'Lens Width', placeholder: 'e.g. 58 mm' },
  { key: 'bridgeWidth', label: 'Bridge Width', placeholder: 'e.g. 14 mm' },
  { key: 'templeLength', label: 'Temple Length', placeholder: 'e.g. 140 mm' },
] as const;

const emptySpecs = (): Record<string, string> => Object.fromEntries(SPEC_KEYS.map((k) => [k.key, '']));

export type Gender = '' | 'men' | 'women' | 'unisex';
export type VideoMode = 'upload' | 'url';

export interface VariantForm {
  id: string;
  colorName: string;
  colorHex: string;
  images: string[];
  videoUrl: string;
  videoInputMode: VideoMode;
}

export interface SunglassesForm {
  name: string;
  slug: string;
  description: string;
  brand: string;
  price: string;
  originalPrice: string;
  stock: string;
  gender: Gender;
  isNew: boolean;
  isBestseller: boolean;
  onSale: boolean;
  isVisible: boolean;
  videoUrl: string;
  videoInputMode: VideoMode;
  features: string[];
  specifications: Record<string, string>;
  variants: VariantForm[];
}

export const emptyForm = (): SunglassesForm => ({
  name: '',
  slug: '',
  description: '',
  brand: 'SKMEI',
  price: '',
  originalPrice: '',
  stock: '',
  gender: '',
  isNew: false,
  isBestseller: false,
  onSale: false,
  isVisible: true,
  videoUrl: '',
  videoInputMode: 'url',
  features: [],
  specifications: emptySpecs(),
  variants: [],
});

export function newVariant(): VariantForm {
  return { id: crypto.randomUUID(), colorName: '', colorHex: '#000000', images: [], videoUrl: '', videoInputMode: 'url' };
}

/** Same slug rule the old page used (no brand-prefix logic, unlike watches). */
export function generateSlug(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function toForm(sg: Sunglasses): SunglassesForm {
  return {
    name: sg.name,
    slug: sg.slug,
    description: sg.description,
    brand: sg.brand,
    price: String(sg.price),
    originalPrice: sg.originalPrice ? String(sg.originalPrice) : '',
    stock: String(sg.stock),
    gender: sg.gender ?? '',
    isNew: sg.isNew ?? false,
    isBestseller: sg.isBestseller ?? false,
    onSale: sg.onSale ?? false,
    isVisible: sg.isVisible ?? true,
    videoUrl: sg.videoUrl ?? '',
    videoInputMode: 'url',
    features: [...sg.features],
    specifications: { ...emptySpecs(), ...sg.specifications },
    variants: sg.variants.map((v) => ({
      id: v.id,
      colorName: v.colorName,
      colorHex: v.colorHex,
      images: [...v.images],
      videoUrl: v.videoUrl ?? '',
      videoInputMode: 'url',
    })),
  };
}

/** Request body for POST /api/admin/sunglasses and PATCH /api/admin/sunglasses/[id] (same keys and conversions as before). */
export function buildPayload(form: SunglassesForm) {
  return {
    name: form.name.trim(),
    slug: form.slug || generateSlug(form.name),
    description: form.description,
    brand: form.brand,
    price: Number(form.price),
    original_price: form.originalPrice ? Number(form.originalPrice) : null,
    stock: Number(form.stock || 0),
    gender: form.gender || 'unisex',
    is_new: form.isNew,
    is_bestseller: form.isBestseller,
    on_sale: form.onSale,
    is_visible: form.isVisible,
    video_url: form.videoUrl || null,
    features: form.features,
    specifications: Object.fromEntries(Object.entries(form.specifications).filter(([, v]) => String(v ?? '').trim() !== '')),
    variants: form.variants.map((v) => ({
      id: v.id,
      colorName: v.colorName,
      colorHex: v.colorHex,
      images: v.images,
      videoUrl: v.videoUrl || null,
    })) as SunglassesVariant[],
  };
}

export async function readError(res: Response, fallback = 'Save failed') {
  const e = (await res.json().catch(() => ({}))) as { error?: string };
  return e.error ?? fallback;
}

/* ---------- List helpers ---------- */

export type VisFilter = 'all' | 'visible' | 'hidden';
export type SortKey = 'newest' | 'name' | 'name-desc' | 'price-asc' | 'price-desc' | 'stock' | 'stock-desc';

export const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Newest first',
  name: 'Name (A–Z)',
  'name-desc': 'Name (Z–A)',
  'price-asc': 'Price: low to high',
  'price-desc': 'Price: high to low',
  stock: 'Stock: lowest first',
  'stock-desc': 'Stock: highest first',
};

/** The list treats a missing flag as hidden, exactly like the old eye icon did. */
export const isShown = (sg: Sunglasses) => !!sg.isVisible;

export function matchesSearch(sg: Sunglasses, q: string) {
  const s = q.trim().toLowerCase();
  if (!s) return true;
  return sg.name.toLowerCase().includes(s) || (sg.brand ?? '').toLowerCase().includes(s);
}

export function sortRows(rows: Sunglasses[], key: SortKey) {
  if (key === 'newest') return rows;
  const out = [...rows];
  switch (key) {
    case 'name':
      return out.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return out.sort((a, b) => b.name.localeCompare(a.name));
    case 'price-asc':
      return out.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return out.sort((a, b) => b.price - a.price);
    case 'stock':
      return out.sort((a, b) => a.stock - b.stock);
    case 'stock-desc':
      return out.sort((a, b) => b.stock - a.stock);
  }
}

export const firstImage = (sg: Sunglasses) => sg.variants.find((v) => v.images.length > 0)?.images[0] ?? null;

export const GENDER_LABEL: Record<string, string> = { men: 'Men', women: 'Women', unisex: 'Unisex' };

export function stockTone(n: number): 'red' | 'amber' | 'green' {
  return n === 0 ? 'red' : n < 5 ? 'amber' : 'green';
}

/** Short name for a stored media URL (last path segment). */
export function fileLabel(url: string) {
  try {
    const last = new URL(url).pathname.split('/').filter(Boolean).pop();
    return last ? decodeURIComponent(last) : url;
  } catch {
    return url;
  }
}
