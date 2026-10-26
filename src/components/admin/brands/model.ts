/* Types, constants and pure helpers for the Brands admin page.
 * The request payloads built here are byte-for-byte what the old MUI page sent. */

export interface PriceTier {
  qty: string;
  price: string;
}

export interface BrandDefaults {
  price?: string;
  costPrice?: string;
  originalPrice?: string;
  category?: string;
  gender?: string;
  description?: string;
  videoUrl?: string;
  features?: string[];
  priceTiers?: PriceTier[];
  specifications?: Record<string, string>;
}

export interface Brand {
  id: string;
  name: string;
  warranty_value: number | null;
  warranty_unit: string | null;
  defaults: BrandDefaults | null;
  created_at: string;
}

export interface CategoryOption {
  slug: string;
  name: string;
}

export const WARRANTY_UNITS = [
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
];

export const GENDERS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'unisex', label: 'Unisex' },
];

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
];

const emptySpecs = (): Record<string, string> => Object.fromEntries(SPEC_FIELDS.map((f) => [f.key, '']));

export const emptyDefaults = (): BrandDefaults => ({
  price: '',
  costPrice: '',
  originalPrice: '',
  category: '',
  gender: '',
  description: '',
  videoUrl: '',
  features: [],
  priceTiers: [],
  specifications: emptySpecs(),
});

/** Editor state for a brand, exactly as the old page's openCreate / openEdit set it up. */
export interface BrandForm {
  name: string;
  warrantyValue: string;
  warrantyUnit: string;
  /** The old "Product defaults" expand toggle: when off, saving sends `defaults: null`. */
  defaultsOn: boolean;
  defaults: BrandDefaults;
}

export function toForm(brand: Brand | null): BrandForm {
  if (!brand) return { name: '', warrantyValue: '', warrantyUnit: 'months', defaultsOn: false, defaults: emptyDefaults() };
  const d = brand.defaults;
  return {
    name: brand.name,
    warrantyValue: brand.warranty_value != null ? String(brand.warranty_value) : '',
    warrantyUnit: brand.warranty_unit ?? 'months',
    defaultsOn: !!d,
    defaults: d
      ? {
          price: d.price ?? '',
          costPrice: d.costPrice ?? '',
          originalPrice: d.originalPrice ?? '',
          category: d.category ?? '',
          gender: d.gender ?? '',
          description: d.description ?? '',
          videoUrl: d.videoUrl ?? '',
          features: d.features ?? [],
          priceTiers: (d.priceTiers ?? []).map((t) => ({ qty: String(t.qty), price: String(t.price) })),
          specifications: { ...emptySpecs(), ...(d.specifications ?? {}) },
        }
      : emptyDefaults(),
  };
}

/** Verbatim port of the old buildDefaultsPayload(). */
export function buildDefaultsPayload(defaults: BrandDefaults): BrandDefaults | null {
  const hasAny =
    defaults.price || defaults.costPrice || defaults.originalPrice ||
    defaults.category || defaults.gender || defaults.description || defaults.videoUrl ||
    (defaults.features ?? []).length > 0 ||
    (defaults.priceTiers ?? []).length > 0 ||
    Object.values(defaults.specifications ?? {}).some(Boolean);
  if (!hasAny) return null;
  return {
    price: defaults.price || undefined,
    costPrice: defaults.costPrice || undefined,
    originalPrice: defaults.originalPrice || undefined,
    category: defaults.category || undefined,
    gender: defaults.gender || undefined,
    description: defaults.description || undefined,
    videoUrl: defaults.videoUrl || undefined,
    features: (defaults.features ?? []).length > 0 ? defaults.features : undefined,
    priceTiers: (defaults.priceTiers ?? []).filter((t) => t.qty && t.price).length > 0
      ? (defaults.priceTiers ?? []).filter((t) => t.qty && t.price) : undefined,
    specifications: Object.values(defaults.specifications ?? {}).some(Boolean)
      ? defaults.specifications : undefined,
  };
}

/** Same JSON body the old handleSave() sent to POST /api/admin/brands and PATCH /api/admin/brands/:id. */
export function buildRequestBody(form: BrandForm) {
  const parsed = form.warrantyValue.trim() ? parseInt(form.warrantyValue) : null;
  return {
    name: form.name,
    warranty_value: parsed,
    warranty_unit: parsed != null ? form.warrantyUnit : null,
    defaults: form.defaultsOn ? buildDefaultsPayload(form.defaults) : null,
  };
}

/* ---------- list helpers ---------- */

export type BrandFilter = 'all' | 'defaults' | 'none';
export type SortKey = 'name' | 'warranty' | 'created_at';
export interface SortState {
  key: SortKey | '';
  dir: 'asc' | 'desc';
}

export const SORT_KEYS: SortKey[] = ['name', 'warranty', 'created_at'];
export const SORT_LABEL: Record<SortKey, string> = { name: 'Brand', warranty: 'Warranty', created_at: 'Added' };

export const matchesFilter = (b: Brand, f: BrandFilter) => (f === 'all' ? true : f === 'defaults' ? !!b.defaults : !b.defaults);

export const matchesSearch = (b: Brand, q: string) => {
  const s = q.trim().toLowerCase();
  return !s || b.name.toLowerCase().includes(s);
};

/** Sorts like the old DataTable did: by the raw column value (warranty → warranty_value). */
export function sortBrands(list: Brand[], sort: SortState): Brand[] {
  if (!sort.key) return list;
  const pick = (b: Brand): string | number | null =>
    sort.key === 'name' ? b.name : sort.key === 'warranty' ? b.warranty_value : b.created_at;
  return [...list].sort((a, b) => {
    const av = pick(a);
    const bv = pick(b);
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = typeof av === 'number' && typeof bv === 'number' ? av - bv : String(av).localeCompare(String(bv));
    return sort.dir === 'asc' ? cmp : -cmp;
  });
}

/** "12 months" / "1 month" (the old page printed "1 months"). */
export const warrantyText = (b: Pick<Brand, 'warranty_value' | 'warranty_unit'>) =>
  b.warranty_value != null && b.warranty_unit
    ? `${b.warranty_value} ${b.warranty_value === 1 ? b.warranty_unit.replace(/s$/, '') : b.warranty_unit}`
    : null;

export const fmtDay = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });

/** Valid bundle tiers, e.g. "2 for $15". */
export const validTiers = (d: BrandDefaults | null) =>
  (d?.priceTiers ?? []).filter((t) => Number(t.qty) > 0 && Number(t.price) > 0);
