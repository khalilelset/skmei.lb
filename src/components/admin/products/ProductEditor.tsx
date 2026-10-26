'use client';

import { useState } from 'react';
import type { Area } from 'react-easy-crop';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleDollarSign,
  Eye,
  EyeOff,
  Film,
  Heart,
  ImageOff,
  ImagePlus,
  Link2,
  ListChecks,
  Loader2,
  Palette,
  Plus,
  Ruler,
  Sparkles,
  Star,
  Tag,
  Trash2,
  Upload,
  Watch,
  X,
} from 'lucide-react';
import { getCroppedImg } from '@/lib/cropImage';
import { uploadVideoDirectly } from '@/lib/uploadVideo';
import { cn, formatPrice, generateProductSlug } from '@/lib/utils';
import type { Product } from '@/types';
import { Button } from '@/components/admin/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/admin/ui/dropdown-menu';
import { Input, Textarea } from '@/components/admin/ui/input';
import { Segmented } from '@/components/admin/ui/segmented';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { toast } from '@/components/admin/ui/sonner';
import { Switch } from '@/components/admin/ui/switch';
import { CropDialog } from '@/components/admin/CropDialog';
import { Field, MoneyInput, Section, uploadTile } from './fields';
import { SafeImg } from './SafeImg';
import {
  type BrandOption,
  type CategoryOption,
  COLOR_PRESETS,
  type Gender,
  type ProductForm,
  REQUIRED_LABELS,
  type RequiredField,
  SPEC_FIELDS,
  applyBrandDefaults,
  buildPayload,
  missingFields,
  newProductForm,
  productToForm,
  readError,
  uploadSlug,
} from './model';

const LABEL_TOGGLES = [
  { key: 'isNew', label: 'New', icon: Sparkles, color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  { key: 'onSale', label: 'Sale', icon: Tag, color: '#B91C1C', bg: 'rgba(185,28,28,0.08)' },
  { key: 'isBestseller', label: 'Bestseller', icon: Star, color: '#991B1B', bg: 'rgba(153,27,27,0.08)' },
  { key: 'isCouple', label: 'Couple Set', icon: Heart, color: '#EC4899', bg: 'rgba(236,72,153,0.08)' },
] as const;

/** Small round "×" with a 36px hit area. */
const smallIconHit = "relative after:absolute after:-inset-2 after:content-['']";

export type SaveResult = 'created' | 'updated';

/**
 * Add / edit product dialog. The form state lives in <EditorForm>, which mounts fresh every time
 * the dialog opens (`sessionKey`), the same reset the old page did in openAdd / openEdit.
 */
export function ProductEditor({
  open,
  onOpenChange,
  sessionKey,
  product,
  brands,
  categories,
  onSaved,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionKey: number;
  product: Product | null;
  brands: BrandOption[];
  categories: CategoryOption[];
  onSaved: (result: SaveResult, name: string) => void;
  onDelete: (product: Product) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Radix would focus the name field and select its text (easy to overwrite by accident,
        // and it pops the keyboard on phones). Focus the dialog itself; Tab goes to the name.
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        className={cn(
          'w-[min(1120px,calc(100vw-32px))] max-h-[min(94dvh,1040px)]',
          'max-sm:inset-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none',
        )}
      >
        <EditorForm
          key={sessionKey}
          product={product}
          brands={brands}
          categories={categories}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
          onDelete={onDelete}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditorForm({
  product,
  brands,
  categories,
  onClose,
  onSaved,
  onDelete,
}: {
  product: Product | null;
  brands: BrandOption[];
  categories: CategoryOption[];
  onClose: () => void;
  onSaved: (result: SaveResult, name: string) => void;
  onDelete: (product: Product) => void;
}) {
  const isEdit = !!product;
  const [form, setForm] = useState<ProductForm>(() => (product ? productToForm(product) : newProductForm(categories[0]?.slug)));
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoMode, setVideoMode] = useState<'upload' | 'url'>(product?.videoUrl ? 'url' : 'upload');
  const [featureInput, setFeatureInput] = useState('');
  const [defaultsApplied, setDefaultsApplied] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);

  const set = (patch: Partial<ProductForm>) => setForm((f) => ({ ...f, ...patch }));
  const missing = missingFields(form);
  const showError = (k: RequiredField) => submitted && missing.includes(k);
  const busy = isSaving || isUploading || isUploadingVideo;

  /* ---------- Brand (auto-fills defaults on NEW products only) ---------- */
  const onBrandChange = (name: string) => {
    const defs = brands.find((b) => b.name === name)?.defaults;
    if (!isEdit && defs) {
      setForm((f) => applyBrandDefaults(f, name, defs));
      setDefaultsApplied(true);
    } else {
      set({ brand: name });
      setDefaultsApplied(false);
    }
  };

  /* ---------- Images: pick → crop (one by one) → upload ---------- */
  const readIntoCropper = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onFilesSelected = (files: File[]) => {
    if (files.length === 0) return;
    const [first, ...rest] = files;
    setCropQueue(rest);
    readIntoCropper(first);
  };

  const onCropConfirm = async (area: Area) => {
    const src = cropSrc;
    if (!src) return;
    setIsUploading(true);
    setCropSrc(null);
    try {
      const blob = await getCroppedImg(src, area);
      const fd = new FormData();
      fd.append('file', blob, 'image.jpg');
      fd.append('slug', uploadSlug(form));
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        const url = data.url;
        setForm((f) => ({ ...f, images: [...f.images, url] }));
      } else {
        toast.error("Couldn't upload the image", { description: data.error ?? `HTTP ${res.status}` });
      }
    } catch (err) {
      toast.error("Couldn't upload the image", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsUploading(false);
      if (cropQueue.length > 0) {
        const [next, ...rest] = cropQueue;
        setCropQueue(rest);
        readIntoCropper(next);
      }
    }
  };

  const cancelCrop = () => {
    setCropSrc(null);
    setCropQueue([]);
  };

  const moveImage = (from: number, to: number) =>
    setForm((f) => {
      if (to < 0 || to >= f.images.length) return f;
      const images = [...f.images];
      const [img] = images.splice(from, 1);
      images.splice(to, 0, img);
      return { ...f, images };
    });

  const removeImage = (index: number) => setForm((f) => ({ ...f, images: f.images.filter((_, i) => i !== index) }));

  /* ---------- Video ---------- */
  const onVideoSelected = async (file: File) => {
    setIsUploadingVideo(true);
    try {
      const url = await uploadVideoDirectly(file, `products/${uploadSlug(form)}/videos`);
      setForm((f) => ({ ...f, videoUrl: url }));
      toast.success('Video uploaded');
    } catch (err) {
      console.error('Video upload failed:', err);
      toast.error("Couldn't upload the video", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  const commitVideoUrl = (value: string) => {
    const v = value.trim();
    if (v) set({ videoUrl: v });
  };

  /* ---------- Features ---------- */
  const addFeature = () => {
    const v = featureInput.trim();
    if (!v) return;
    setForm((f) => ({ ...f, features: [...f.features, v] }));
    setFeatureInput('');
  };

  /* ---------- Save ---------- */
  const handleSave = async () => {
    setSubmitted(true);
    if (missing.length > 0) {
      toast.error('Some required fields are empty', { description: `Add the ${missing.map((k) => REQUIRED_LABELS[k]).join(', ')}.` });
      const el = document.getElementById(`pe-${missing[0]}`);
      // Scroll only the dialog body: scrollIntoView would also shift the overflow-hidden dialog
      // shell and push the header out of view.
      const body = el?.closest<HTMLElement>('[data-slot="dialog-body"]');
      if (el && body) {
        const b = body.getBoundingClientRect();
        const r = el.getBoundingClientRect();
        body.scrollTo({ top: body.scrollTop + r.top - b.top - (body.clientHeight - r.height) / 2, behavior: 'smooth' });
      }
      if (el instanceof HTMLInputElement || el instanceof HTMLButtonElement) el.focus({ preventScroll: true });
      return;
    }
    setIsSaving(true);
    try {
      const payload = buildPayload(form);
      const res = await fetch(isEdit ? `/api/admin/products/${product.id}` : '/api/admin/products', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readError(res));
      onSaved(isEdit ? 'updated' : 'created', form.name.trim());
    } catch (err) {
      toast.error(isEdit ? "Couldn't save your changes" : "Couldn't add the product", {
        description: err instanceof Error ? err.message : undefined,
      });
      setIsSaving(false);
    }
  };

  /* ---------- Derived ---------- */
  const autoSlug = !form.slug && form.name ? generateProductSlug(form.name, form.brand) : '';
  const sale = parseFloat(form.price);
  const cost = parseFloat(form.costPrice);
  const showProfit = !!form.price && !!form.costPrice && sale > 0 && cost > 0;
  const profit = sale - cost;
  const margin = (profit / sale) * 100;
  const brandMissingFromList = !!form.brand && !brands.some((b) => b.name === form.brand);
  const categoryMissingFromList = !!form.category && !categories.some((c) => c.slug === form.category);

  return (
    <>
      <DialogHeader className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[12px] bg-adm-accent-soft text-adm-accent-hover">
          {form.images[0] ? (
            <SafeImg src={form.images[0]} className="size-full object-cover" fallback={<Watch className="size-5" />} />
          ) : isEdit ? (
            <Watch className="size-5" />
          ) : (
            <Plus className="size-5" />
          )}
        </span>
        <div className="min-w-0">
          <DialogTitle>{isEdit ? 'Edit product' : 'Add product'}</DialogTitle>
          <DialogDescription className="truncate">
            {isEdit ? (
              <>
                {product.name}
                {product.sku && <span className="font-adm-mono text-[12px]"> · {product.sku}</span>}
              </>
            ) : (
              'Pick a brand first: its saved defaults fill in the form.'
            )}
          </DialogDescription>
        </div>
      </DialogHeader>

      <DialogBody className="overscroll-contain bg-adm-canvas px-3 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,370px)] lg:items-start">
          {/* ---------- Left column ---------- */}
          <div className="flex min-w-0 flex-col gap-4 max-lg:contents">
            <Section icon={<Watch />} title="Basics" description="Name, brand and where it shows in the store." className="max-lg:order-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Product name" htmlFor="pe-name" required error={showError('name') && 'This field is required'} className="sm:col-span-2">
                  <Input id="pe-name" value={form.name} onChange={(e) => set({ name: e.target.value })} aria-invalid={showError('name')} placeholder="e.g. SKMEI 1654BK" />
                </Field>

                <Field label="Brand" htmlFor="pe-brand" required error={showError('brand') && 'This field is required'}>
                  <Select value={form.brand} onValueChange={onBrandChange}>
                    <SelectTrigger id="pe-brand" aria-invalid={showError('brand')}>
                      <SelectValue placeholder="Select brand" />
                    </SelectTrigger>
                    <SelectContent>
                      {brands.map((b) => (
                        <SelectItem key={b.id} value={b.name}>
                          {b.name}
                        </SelectItem>
                      ))}
                      {brandMissingFromList && <SelectItem value={form.brand}>{form.brand}</SelectItem>}
                      {brands.length === 0 && (
                        <SelectItem value="__no-brands" disabled>
                          No brands — add one in Brands page
                        </SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                  {defaultsApplied && (
                    <span className="inline-flex h-6 items-center gap-1.5 self-start rounded-full bg-[#ECEEFF] pl-2.5 pr-1 text-[11.5px] font-semibold text-[#4338CA]">
                      <Sparkles className="size-3" />
                      Defaults applied
                      <button
                        type="button"
                        aria-label="Dismiss"
                        onClick={() => setDefaultsApplied(false)}
                        className={cn('grid size-4 place-items-center rounded-full hover:bg-[#4338CA]/10', smallIconHit)}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  )}
                </Field>

                <Field label="Category" htmlFor="pe-category" required error={showError('category') && 'This field is required'}>
                  <Select value={form.category} onValueChange={(v) => set({ category: v })}>
                    <SelectTrigger id="pe-category" aria-invalid={showError('category')}>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.slug} value={c.slug}>
                          {c.name}
                        </SelectItem>
                      ))}
                      {categoryMissingFromList && <SelectItem value={form.category}>{form.category}</SelectItem>}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Gender" htmlFor="pe-gender">
                  <Select value={form.gender || 'none'} onValueChange={(v) => set({ gender: (v === 'none' ? '' : v) as Gender })}>
                    <SelectTrigger id="pe-gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">— Not specified —</SelectItem>
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Slug" htmlFor="pe-slug" hint={autoSlug ? <>Auto: <span className="font-adm-mono">{autoSlug}</span></> : 'Also used as the SKU.'}>
                  <Input id="pe-slug" value={form.slug} onChange={(e) => set({ slug: e.target.value })} placeholder={autoSlug || 'auto from the name'} className="font-adm-mono" />
                </Field>

                <Field label="Description" htmlFor="pe-description" className="sm:col-span-2">
                  <Textarea id="pe-description" rows={6} value={form.description} onChange={(e) => set({ description: e.target.value })} />
                </Field>
              </div>
            </Section>

            <Section icon={<CircleDollarSign />} title="Pricing & stock" className="max-lg:order-3">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Sale price ($)" htmlFor="pe-price" required error={showError('price') && 'This field is required'}>
                  <MoneyInput id="pe-price" value={form.price} onChange={(e) => set({ price: e.target.value })} aria-invalid={showError('price')} />
                </Field>
                <Field label="Original price ($)" htmlFor="pe-original">
                  <MoneyInput id="pe-original" value={form.originalPrice} onChange={(e) => set({ originalPrice: e.target.value })} />
                </Field>
                <Field label="My cost price ($)" htmlFor="pe-cost">
                  <MoneyInput id="pe-cost" value={form.costPrice} onChange={(e) => set({ costPrice: e.target.value })} />
                </Field>
                <Field label="Stock" htmlFor="pe-stock" required error={showError('stock') && 'This field is required'}>
                  <Input
                    id="pe-stock"
                    type="number"
                    inputMode="numeric"
                    value={form.stock}
                    onChange={(e) => set({ stock: e.target.value })}
                    aria-invalid={showError('stock')}
                    className="tabular-nums"
                  />
                </Field>
                <Field label="Display order" htmlFor="pe-order" hint="0 = first">
                  <Input id="pe-order" type="number" inputMode="numeric" value={form.sortOrder} onChange={(e) => set({ sortOrder: e.target.value })} className="tabular-nums" />
                </Field>
              </div>

              {showProfit && (
                <div
                  className={cn(
                    'mt-4 flex gap-8 rounded-[12px] border px-4 py-2.5',
                    margin >= 0 ? 'border-[#C9EBD3] bg-[#F3FBF5]' : 'border-[#F5C9C4] bg-[#FEF5F4]',
                  )}
                >
                  {[
                    ['Gross profit', formatPrice(profit)],
                    ['Margin', `${margin.toFixed(1)}%`],
                  ].map(([k, v]) => (
                    <div key={k}>
                      <div className="text-xs text-adm-muted">{k}</div>
                      <b className={cn('font-adm-display text-[16px] tabular-nums', margin >= 0 ? 'text-[#15803D]' : 'text-adm-accent-hover')}>{v}</b>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-5 border-t border-adm-line pt-4">
                <div className="text-[13px] font-semibold text-adm-ink-2">
                  Bundle pricing <span className="font-normal text-adm-muted">(optional — e.g. 2 for $15)</span>
                </div>
                <p className="mt-0.5 text-[12px] text-adm-muted">Each row defines a total price when the customer buys exactly that many units.</p>
                <div className="mt-3 flex flex-col gap-2">
                  {form.priceTiers.map((tier, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        type="number"
                        inputMode="numeric"
                        min={1}
                        step={1}
                        placeholder="Qty"
                        aria-label={`Bundle ${i + 1} quantity`}
                        value={tier.qty}
                        onChange={(e) => set({ priceTiers: form.priceTiers.map((t, idx) => (idx === i ? { ...t, qty: e.target.value } : t)) })}
                        className="w-[76px] tabular-nums"
                      />
                      <span className="shrink-0 text-[13px] text-adm-muted">units for</span>
                      <MoneyInput
                        placeholder="Total"
                        aria-label={`Bundle ${i + 1} total price`}
                        value={tier.price}
                        onChange={(e) => set({ priceTiers: form.priceTiers.map((t, idx) => (idx === i ? { ...t, price: e.target.value } : t)) })}
                        className="w-[112px]"
                      />
                      <Button
                        variant="ghost-destructive"
                        size="icon"
                        aria-label={`Remove bundle ${i + 1}`}
                        onClick={() => set({ priceTiers: form.priceTiers.filter((_, idx) => idx !== i) })}
                      >
                        <X />
                      </Button>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" className="h-9 self-start" onClick={() => set({ priceTiers: [...form.priceTiers, { qty: '', price: '' }] })}>
                    <Plus />
                    Add tier
                  </Button>
                </div>
              </div>
            </Section>

            <Section
              icon={<ListChecks />}
              title="Product features"
              description='Bullet points on the product page (e.g. "Water resistant 50M", "LED backlight").'
              className="max-lg:order-5"
            >
              <div className="flex gap-2">
                <Input
                  aria-label="New feature"
                  placeholder="e.g. Water resistant 50M"
                  value={featureInput}
                  onChange={(e) => setFeatureInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && featureInput.trim()) {
                      e.preventDefault();
                      addFeature();
                    }
                  }}
                />
                <Button variant="soft" disabled={!featureInput.trim()} onClick={addFeature}>
                  <Plus />
                  Add
                </Button>
              </div>
              {form.features.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {form.features.map((feat, i) => (
                    <li key={`${feat}-${i}`} className="inline-flex min-h-7 max-w-full items-center gap-1 rounded-full bg-adm-accent-soft py-1 pl-3 pr-1 text-[12.5px] font-semibold text-adm-accent-hover">
                      <span className="min-w-0 break-words">{feat}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${feat}`}
                        onClick={() => set({ features: form.features.filter((_, idx) => idx !== i) })}
                        className={cn('grid size-5 shrink-0 place-items-center rounded-full hover:bg-adm-accent/15', smallIconHit)}
                      >
                        <X className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section icon={<Ruler />} title="Specifications" className="max-lg:order-7">
              <div className="overflow-hidden rounded-[12px] border border-adm-line">
                {SPEC_FIELDS.map(({ key, label }, i) => (
                  <div key={key} className={cn('grid grid-cols-[minmax(112px,36%)_minmax(0,1fr)]', i > 0 && 'border-t border-adm-line')}>
                    <label htmlFor={`pe-spec-${key}`} className="flex items-center border-r border-adm-line bg-adm-surface-2 px-3 py-2 text-[12.5px] font-semibold text-adm-ink-2">
                      {label}
                    </label>
                    <input
                      id={`pe-spec-${key}`}
                      value={form.specifications[key] ?? ''}
                      onChange={(e) => set({ specifications: { ...form.specifications, [key]: e.target.value } })}
                      placeholder={`Enter ${label.toLowerCase()}...`}
                      className="h-10 min-w-0 bg-transparent px-3 text-base text-adm-ink outline-none transition-colors placeholder:text-[#B3A9AB] focus:bg-[#FFFAF9] sm:text-[13.5px]"
                    />
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* ---------- Right column ---------- */}
          <div className="flex min-w-0 flex-col gap-4 max-lg:contents">
            <Section
              icon={<ImagePlus />}
              title={
                <>
                  Images <span className="text-adm-accent">*</span>
                </>
              }
              description="Each upload is cropped square. The first image is the main one."
              className="max-lg:order-2"
            >
              <div id="pe-images" tabIndex={-1} className="grid grid-cols-3 gap-2 outline-none">
                {form.images.map((url, index) => (
                  <div key={`${url}-${index}`} className="group/img relative aspect-square overflow-hidden rounded-[12px] border border-adm-line bg-adm-surface-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button type="button" aria-label={`Image ${index + 1} options`} className="block size-full outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-adm-accent/40">
                          <SafeImg
                            src={url}
                            alt={`Image ${index + 1}`}
                            className="size-full object-cover transition-transform duration-300 group-hover/img:scale-[1.04]"
                            fallback={
                              <span className="flex size-full flex-col items-center justify-center gap-1 px-1 text-center text-[10.5px] font-semibold leading-tight text-adm-muted">
                                <ImageOff className="size-5 text-adm-faint" />
                                Can&apos;t load
                              </span>
                            }
                          />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {index > 0 && (
                          <DropdownMenuItem onSelect={() => moveImage(index, 0)}>
                            <Star />
                            Make main image
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem disabled={index === 0} onSelect={() => moveImage(index, index - 1)}>
                          <ArrowLeft />
                          Move left
                        </DropdownMenuItem>
                        <DropdownMenuItem disabled={index === form.images.length - 1} onSelect={() => moveImage(index, index + 1)}>
                          <ArrowRight />
                          Move right
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem destructive onSelect={() => removeImage(index)}>
                          <Trash2 />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    {index === 0 && (
                      <span className="pointer-events-none absolute bottom-1.5 left-1.5 rounded-[6px] bg-adm-side/80 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[.06em] text-white backdrop-blur">
                        Main
                      </span>
                    )}
                    <button
                      type="button"
                      aria-label={`Remove image ${index + 1}`}
                      onClick={() => removeImage(index)}
                      className="absolute right-0 top-0 grid size-9 place-items-center"
                    >
                      <span className="grid size-6 place-items-center rounded-full bg-black/55 text-white transition-colors hover:bg-adm-accent">
                        <X className="size-3.5" />
                      </span>
                    </button>
                  </div>
                ))}

                {/* A <label> keeps the click a real user gesture (needed on iOS). */}
                <label
                  className={cn(
                    uploadTile,
                    'aspect-square',
                    isUploading
                      ? 'cursor-default border-adm-line text-adm-faint'
                      : showError('images')
                        ? 'cursor-pointer border-adm-accent bg-adm-accent-soft/40 text-adm-accent-hover'
                        : 'cursor-pointer border-adm-line-2 text-adm-muted hover:border-adm-accent hover:bg-adm-accent-soft/40 hover:text-adm-accent-hover',
                  )}
                >
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isUploading}
                    className="sr-only"
                    onChange={(e) => {
                      const files = Array.from(e.target.files ?? []);
                      e.target.value = '';
                      onFilesSelected(files);
                    }}
                  />
                  {isUploading ? (
                    <Loader2 className="size-6 animate-spin text-adm-accent" />
                  ) : (
                    <>
                      <Upload className="size-6" />
                      Upload image
                    </>
                  )}
                </label>
              </div>
              {isUploading && <p className="mt-2 text-xs text-adm-muted">Uploading...</p>}
              {showError('images') && <p className="mt-2 text-[12px] font-medium text-adm-accent-hover">At least one image is required</p>}
            </Section>

            <Section icon={<Film />} title="Product video" description="Optional, shown on the product page." className="max-lg:order-4">
              <Segmented
                ariaLabel="Video source"
                value={videoMode}
                onChange={(v) => {
                  if (v === videoMode) return;
                  setVideoMode(v);
                  set({ videoUrl: '' });
                }}
                options={[
                  { value: 'upload', label: 'Upload', icon: <Upload /> },
                  { value: 'url', label: 'URL', icon: <Link2 /> },
                ]}
                className="mb-3"
              />

              {videoMode === 'url' && !form.videoUrl && (
                <Field label="Video URL" htmlFor="pe-video-url" hint="Paste a direct video link, then press Enter.">
                  <Input
                    id="pe-video-url"
                    type="url"
                    placeholder="https://... direct video URL"
                    onBlur={(e) => commitVideoUrl(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') commitVideoUrl(e.currentTarget.value);
                    }}
                  />
                </Field>
              )}

              {videoMode === 'upload' && !form.videoUrl && (
                <label
                  className={cn(
                    uploadTile,
                    'h-[120px] w-full',
                    isUploadingVideo
                      ? 'cursor-default border-adm-line text-adm-faint'
                      : 'cursor-pointer border-adm-line-2 text-adm-muted hover:border-adm-accent hover:bg-adm-accent-soft/40 hover:text-adm-accent-hover',
                  )}
                >
                  {isUploadingVideo ? (
                    <>
                      <Loader2 className="size-6 animate-spin text-adm-accent" />
                      Uploading video...
                    </>
                  ) : (
                    <>
                      <Film className="size-6" />
                      Upload video
                    </>
                  )}
                  <input
                    type="file"
                    accept="video/*"
                    disabled={isUploadingVideo}
                    className="sr-only"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      e.target.value = '';
                      if (file) onVideoSelected(file);
                    }}
                  />
                </label>
              )}

              {form.videoUrl && (
                <div className="relative aspect-[3/4] max-w-[200px] overflow-hidden rounded-[12px] border border-adm-line bg-black">
                  <video src={form.videoUrl} controls className="block size-full object-contain" />
                  <button
                    type="button"
                    aria-label="Remove video"
                    onClick={() => set({ videoUrl: '' })}
                    className="absolute right-1 top-1 grid size-9 place-items-center"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-adm-accent">
                      <X className="size-3.5" />
                    </span>
                  </button>
                </div>
              )}
            </Section>

            <Section icon={<Eye />} title="Visibility & labels" className="max-lg:order-6">
              <label
                htmlFor="pe-visible"
                className={cn(
                  'flex cursor-pointer select-none items-center gap-3 rounded-[12px] border-2 p-3 transition-colors',
                  form.isVisible ? 'border-[#BFE6CC] bg-[#F3FBF5] hover:border-[#9FD9B3]' : 'border-[#F5C2BD] bg-[#FEF5F4] hover:border-[#EE9C94]',
                )}
              >
                {form.isVisible ? <Eye className="size-5 shrink-0 text-[#16A34A]" /> : <EyeOff className="size-5 shrink-0 text-adm-accent" />}
                <span className="min-w-0 flex-1">
                  <b className={cn('block text-[14px]', form.isVisible ? 'text-[#15803D]' : 'text-adm-accent-hover')}>
                    {form.isVisible ? 'Visible in store' : 'Hidden from store'}
                  </b>
                  <span className="block text-xs text-adm-muted">
                    {form.isVisible ? 'Customers can find and buy this product' : 'Product is saved but not shown to customers'}
                  </span>
                </span>
                <Switch id="pe-visible" checked={form.isVisible} onCheckedChange={(v) => set({ isVisible: v })} className="data-[state=checked]:bg-[#22C55E]" />
              </label>

              <div className="mb-2 mt-4 text-[13px] font-semibold text-adm-ink-2">Product labels</div>
              <div className="grid grid-cols-2 gap-2">
                {LABEL_TOGGLES.map(({ key, label, icon: Icon, color, bg }) => {
                  const active = form[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => set({ [key]: !active } as Partial<ProductForm>)}
                      className="flex h-12 items-center gap-2 rounded-[12px] border-2 px-3 text-[13px] font-bold outline-none transition-[background-color,border-color,color] duration-200 focus-visible:ring-[3px] focus-visible:ring-adm-accent/25"
                      style={
                        active
                          ? { borderColor: color, background: bg, color }
                          : { borderColor: 'var(--color-adm-line-2)', color: 'var(--color-adm-muted)' }
                      }
                    >
                      <Icon className="size-[18px]" fill={active && (key === 'isBestseller' || key === 'isCouple') ? 'currentColor' : 'none'} />
                      {label}
                      {active && <Check className="ml-auto size-4" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section icon={<Palette />} title="Color variants" description="Tap a color to add it, tap again to remove. Shown as swatches on product pages." className="max-lg:order-8">
              <div className="grid grid-cols-[repeat(auto-fill,minmax(54px,1fr))] gap-x-1 gap-y-2.5">
                {COLOR_PRESETS.map((preset) => {
                  const active = form.colors.some((c) => c.name === preset.name);
                  return (
                    <button
                      key={preset.name}
                      type="button"
                      aria-pressed={active}
                      onClick={() =>
                        set({ colors: active ? form.colors.filter((c) => c.name !== preset.name) : [...form.colors, preset] })
                      }
                      className="group/sw flex flex-col items-center gap-1.5 rounded-[10px] py-1 outline-none focus-visible:ring-2 focus-visible:ring-adm-accent/40"
                    >
                      <span
                        className="relative grid size-[34px] place-items-center rounded-full transition-transform duration-200 ease-adm-spring group-hover/sw:scale-110"
                        style={{
                          background: preset.hex,
                          boxShadow: active
                            ? `0 0 0 2px #fff, 0 0 0 4px #DC2626, 0 4px 12px ${preset.hex}60`
                            : 'inset 0 0 0 1px rgba(0,0,0,.12), 0 2px 6px rgba(0,0,0,.14)',
                        }}
                      >
                        {active && (
                          <span className="absolute inset-0 grid place-items-center rounded-full bg-black/35">
                            <Check className="size-3.5 text-white" strokeWidth={3} />
                          </span>
                        )}
                      </span>
                      <span className={cn('max-w-[54px] text-center text-[10.5px] leading-tight', active ? 'font-bold text-adm-accent-hover' : 'font-medium text-adm-muted')}>
                        {preset.name}
                      </span>
                    </button>
                  );
                })}
              </div>
              {form.colors.length > 0 && (
                <div className="mt-3 flex flex-wrap items-center gap-1.5 border-t border-adm-line pt-3">
                  <span className="mr-0.5 text-[11.5px] font-semibold text-adm-accent-hover">Selected:</span>
                  {form.colors.map((c, i) => (
                    <span key={`${c.name}-${i}`} className="inline-flex h-7 items-center gap-1.5 rounded-full bg-adm-accent-soft pl-1.5 pr-1 text-[11.5px] font-semibold text-adm-accent-hover">
                      <span className="size-3.5 rounded-full shadow-[inset_0_0_0_1px_rgba(0,0,0,.15)]" style={{ background: c.hex }} />
                      {c.name}
                      <button
                        type="button"
                        aria-label={`Remove ${c.name}`}
                        onClick={() => set({ colors: form.colors.filter((_, idx) => idx !== i) })}
                        className={cn('grid size-5 place-items-center rounded-full hover:bg-adm-accent/15', smallIconHit)}
                      >
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </Section>
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="justify-between pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
        {isEdit ? (
          <Button variant="ghost-destructive" disabled={busy} onClick={() => onDelete(product)}>
            <Trash2 />
            <span className="max-sm:sr-only">Delete</span>
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={handleSave} className="min-w-[120px]">
            {isSaving && <Loader2 className="animate-spin" />}
            {isSaving ? 'Saving...' : isEdit ? 'Save changes' : 'Add product'}
          </Button>
        </div>
      </DialogFooter>

      <CropDialog src={cropSrc} remaining={cropQueue.length} onCancel={cancelCrop} onConfirm={onCropConfirm} />
    </>
  );
}
