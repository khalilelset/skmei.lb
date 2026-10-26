'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import type { Area } from 'react-easy-crop';
import {
  Check,
  CircleDollarSign,
  Eye,
  EyeOff,
  Film,
  Glasses,
  ListChecks,
  Loader2,
  Palette,
  Plus,
  Ruler,
  Sparkles,
  Star,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { getCroppedImg } from '@/lib/cropImage';
import { uploadVideoDirectly } from '@/lib/uploadVideo';
import { cn } from '@/lib/utils';
import type { Sunglasses } from '@/types';
import { CropDialog } from '@/components/admin/CropDialog';
import { Button } from '@/components/admin/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { Input, Textarea } from '@/components/admin/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { toast } from '@/components/admin/ui/sonner';
import { Switch } from '@/components/admin/ui/switch';
import { Field, MoneyInput, Section, hitPad } from './fields';
import {
  SPEC_KEYS,
  buildPayload,
  emptyForm,
  generateSlug,
  newVariant,
  readError,
  toForm,
  type Gender,
  type SunglassesForm,
  type VariantForm,
} from './model';
import { VariantCard, VideoField } from './parts';
import { SafeImg } from './SafeImg';

const LABEL_TOGGLES = [
  { key: 'isNew', label: 'New', icon: Sparkles, color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  { key: 'isBestseller', label: 'Bestseller', icon: Star, color: '#1D4ED8', bg: 'rgba(59,130,246,0.08)' },
  { key: 'onSale', label: 'On sale', icon: Tag, color: '#C2410C', bg: 'rgba(249,115,22,0.09)' },
] as const;

const EASE = [0.2, 0.8, 0.2, 1] as const;
const MAIN_VIDEO = 'main';

type RequiredField = 'name' | 'price';
const REQUIRED_LABELS: Record<RequiredField, string> = { name: 'name', price: 'price' };

export type SaveResult = 'created' | 'updated';

/**
 * Center `el` in the dialog body and focus it. Only the body is scrolled: scrollIntoView would also
 * shift the overflow-hidden dialog shell, pushing the header out of view.
 */
function revealInBody(el: HTMLElement | null, smooth: boolean) {
  if (!el) return;
  const body = el.closest<HTMLElement>('[data-slot="dialog-body"]');
  if (body) {
    const b = body.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    body.scrollTo({ top: body.scrollTop + r.top - b.top - (body.clientHeight - r.height) / 2, behavior: smooth ? 'smooth' : 'auto' });
  }
  el.focus({ preventScroll: true });
}

/**
 * Add / edit sunglasses dialog. <EditorForm> mounts fresh every time the dialog opens
 * (`sessionKey`), which is the reset the old page did in openAdd / openEdit.
 */
export function SunglassesEditor({
  open,
  onOpenChange,
  sessionKey,
  item,
  brandSuggestions,
  onSaved,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionKey: number;
  item: Sunglasses | null;
  brandSuggestions: string[];
  onSaved: (result: SaveResult, name: string) => void;
  onDelete: (item: Sunglasses) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Focus the dialog itself rather than selecting the name text (and popping the keyboard on phones).
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        className={cn(
          'w-[min(1080px,calc(100vw-32px))] max-h-[min(94dvh,1040px)]',
          'max-sm:inset-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none',
        )}
      >
        <EditorForm
          key={sessionKey}
          item={item}
          brandSuggestions={brandSuggestions}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
          onDelete={onDelete}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditorForm({
  item,
  brandSuggestions,
  onClose,
  onSaved,
  onDelete,
}: {
  item: Sunglasses | null;
  brandSuggestions: string[];
  onClose: () => void;
  onSaved: (result: SaveResult, name: string) => void;
  onDelete: (item: Sunglasses) => void;
}) {
  const reduce = useReducedMotion();
  const isEdit = !!item;
  const [form, setForm] = useState<SunglassesForm>(() => (item ? toForm(item) : emptyForm()));
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const [featureInput, setFeatureInput] = useState('');
  const [videoUploads, setVideoUploads] = useState<ReadonlySet<string>>(() => new Set());

  // Crop queue: every picked file is cropped 1:1 then uploaded, one at a time, into one variant.
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);
  const [cropTarget, setCropTarget] = useState<string | null>(null);
  const [isCropUploading, setIsCropUploading] = useState(false);

  const set = (patch: Partial<SunglassesForm>) => setForm((f) => ({ ...f, ...patch }));
  const missing: RequiredField[] = [...(form.name.trim() ? [] : ['name' as const]), ...(form.price ? [] : ['price' as const])];
  const showError = (k: RequiredField) => submitted && missing.includes(k);
  const busy = isSaving || isCropUploading || !!cropSrc || videoUploads.size > 0;

  /* ---------- Name → slug (auto until the slug is typed by hand) ---------- */
  const onNameChange = (name: string) => setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : generateSlug(name) }));

  /* ---------- Variants ---------- */
  const updateVariant = (id: string, patch: Partial<VariantForm>) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)) }));

  const addVariant = () => {
    const v = newVariant();
    setForm((f) => ({ ...f, variants: [...f.variants, v] }));
    window.setTimeout(() => revealInBody(document.getElementById(`sv-variant-${v.id}-name`), !reduce), 60);
  };

  const removeVariant = (id: string) => {
    const index = form.variants.findIndex((v) => v.id === id);
    const removed = form.variants[index];
    if (!removed) return;
    setForm((f) => ({ ...f, variants: f.variants.filter((v) => v.id !== id) }));
    toast(`${removed.colorName || `Color ${index + 1}`} removed`, {
      description: 'Nothing is saved until you press Save.',
      action: {
        label: 'Undo',
        onClick: () =>
          setForm((f) => {
            if (f.variants.some((v) => v.id === removed.id)) return f;
            const variants = [...f.variants];
            variants.splice(Math.min(index, variants.length), 0, removed);
            return { ...f, variants };
          }),
      },
    });
  };

  const moveImage = (id: string, from: number, to: number) =>
    setForm((f) => ({
      ...f,
      variants: f.variants.map((v) => {
        if (v.id !== id || to < 0 || to >= v.images.length) return v;
        const images = [...v.images];
        const [img] = images.splice(from, 1);
        images.splice(to, 0, img);
        return { ...v, images };
      }),
    }));

  const removeImage = (id: string, index: number) =>
    setForm((f) => ({ ...f, variants: f.variants.map((v) => (v.id === id ? { ...v, images: v.images.filter((_, i) => i !== index) } : v)) }));

  /* ---------- Images: pick → crop 1:1 (one by one) → upload to folder "sunglasses" ---------- */
  const readIntoCropper = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
  };

  const onPickImages = (variantId: string, files: File[]) => {
    if (files.length === 0) return;
    const [first, ...rest] = files;
    setCropTarget(variantId);
    setCropQueue(rest);
    readIntoCropper(first);
  };

  const onCropConfirm = async (area: Area) => {
    const src = cropSrc;
    const target = cropTarget;
    if (!src || !target) return;
    setIsCropUploading(true);
    setCropSrc(null);
    try {
      const blob = await getCroppedImg(src, area);
      const fd = new FormData();
      fd.append('file', blob, 'image.jpg');
      fd.append('folder', 'sunglasses');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (res.ok && data.url) {
        const url = data.url;
        setForm((f) => ({ ...f, variants: f.variants.map((v) => (v.id === target ? { ...v, images: [...v.images, url] } : v)) }));
      } else {
        toast.error("Couldn't upload the photo", { description: data.error ?? `HTTP ${res.status}` });
      }
    } catch (err) {
      toast.error("Couldn't upload the photo", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsCropUploading(false);
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

  /* ---------- Videos (main + per variant), straight to R2 in folder "sunglasses" ---------- */
  const onVideoFile = async (key: string, file: File) => {
    setVideoUploads((s) => new Set(s).add(key));
    try {
      const url = await uploadVideoDirectly(file, 'sunglasses');
      if (key === MAIN_VIDEO) set({ videoUrl: url });
      else updateVariant(key, { videoUrl: url });
      toast.success('Video uploaded');
    } catch (err) {
      toast.error("Couldn't upload the video", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setVideoUploads((s) => {
        const n = new Set(s);
        n.delete(key);
        return n;
      });
    }
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
      toast.error('Some required fields are empty', { description: `Add the ${missing.map((k) => REQUIRED_LABELS[k]).join(' and ')}.` });
      revealInBody(document.getElementById(`sv-${missing[0]}`), !reduce);
      return;
    }
    setIsSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/sunglasses/${item.id}` : '/api/admin/sunglasses', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload(form)),
      });
      if (!res.ok) throw new Error(await readError(res));
      onSaved(isEdit ? 'updated' : 'created', form.name.trim());
    } catch (err) {
      toast.error(isEdit ? "Couldn't save your changes" : "Couldn't add the sunglasses", {
        description: err instanceof Error ? err.message : 'Save failed',
      });
      setIsSaving(false);
    }
  };

  /* ---------- Derived ---------- */
  const cover = form.variants.find((v) => v.images.length > 0)?.images[0];
  const price = parseFloat(form.price);
  const original = parseFloat(form.originalPrice);
  const discount = price > 0 && original > price ? Math.round((1 - price / original) * 100) : 0;
  const photoCount = form.variants.reduce((n, v) => n + v.images.length, 0);

  return (
    <>
      <DialogHeader className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center overflow-hidden rounded-[12px] bg-adm-accent-soft text-adm-accent-hover">
          {cover ? (
            <SafeImg src={cover} className="size-full object-cover" fallback={<Glasses className="size-5" />} />
          ) : isEdit ? (
            <Glasses className="size-5" />
          ) : (
            <Plus className="size-5" />
          )}
        </span>
        <div className="min-w-0">
          <DialogTitle>{isEdit ? 'Edit sunglasses' : 'Add sunglasses'}</DialogTitle>
          <DialogDescription className="truncate">
            {isEdit ? item.name : 'Fill in the details, then add a color for each frame.'}
          </DialogDescription>
        </div>
      </DialogHeader>

      <DialogBody className="overscroll-contain bg-adm-canvas px-3 py-4 sm:px-6 sm:py-5">
        <div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(300px,360px)] lg:items-start">
          {/* ---------- Left column ---------- */}
          <div className="flex min-w-0 flex-col gap-4 max-lg:contents">
            <Section icon={<Glasses />} title="Basics" description="Name, brand and the link customers see." className="max-lg:order-1">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="sv-name" required error={showError('name') && 'This field is required'} className="sm:col-span-2">
                  <Input
                    id="sv-name"
                    value={form.name}
                    onChange={(e) => onNameChange(e.target.value)}
                    aria-invalid={showError('name')}
                    placeholder="e.g. SKMEI Aviator Polarized"
                  />
                </Field>

                <Field label="Brand" htmlFor="sv-brand">
                  <Input id="sv-brand" list="sv-brand-list" value={form.brand} onChange={(e) => set({ brand: e.target.value })} autoComplete="off" />
                  <datalist id="sv-brand-list">
                    {brandSuggestions.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </Field>

                <Field label="Gender" htmlFor="sv-gender" hint="Saved as Unisex unless you pick Men or Women.">
                  {/* The old select had a blank "Unisex" plus a real one; both saved as "unisex". */}
                  <Select value={form.gender || 'unisex'} onValueChange={(v) => set({ gender: v as Gender })}>
                    <SelectTrigger id="sv-gender">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </Field>

                <Field
                  label="Slug"
                  htmlFor="sv-slug"
                  className="sm:col-span-2"
                  hint={
                    slugTouched
                      ? 'Custom slug: it no longer follows the name.'
                      : isEdit
                        ? 'Auto-generated from the name. Renaming changes it, and with it the product link.'
                        : 'Auto-generated from the name.'
                  }
                >
                  <Input
                    id="sv-slug"
                    value={form.slug}
                    onChange={(e) => {
                      setSlugTouched(true);
                      set({ slug: e.target.value });
                    }}
                    placeholder="auto from the name"
                    className="font-adm-mono"
                  />
                </Field>

                <Field label="Description" htmlFor="sv-description" className="sm:col-span-2">
                  <Textarea id="sv-description" rows={4} value={form.description} onChange={(e) => set({ description: e.target.value })} />
                </Field>
              </div>
            </Section>

            <Section icon={<CircleDollarSign />} title="Pricing & stock" className="max-lg:order-2">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                <Field label="Price ($)" htmlFor="sv-price" required error={showError('price') && 'This field is required'}>
                  <MoneyInput id="sv-price" value={form.price} onChange={(e) => set({ price: e.target.value })} aria-invalid={showError('price')} />
                </Field>
                <Field
                  label="Original price ($)"
                  htmlFor="sv-original"
                  hint={discount > 0 ? <span className="font-semibold text-adm-accent-hover">Shows {discount}% off</span> : 'Leave empty if not on sale'}
                >
                  <MoneyInput id="sv-original" value={form.originalPrice} onChange={(e) => set({ originalPrice: e.target.value })} />
                </Field>
                <Field label="Stock" htmlFor="sv-stock" hint="Empty = 0" className="max-sm:col-span-2">
                  <Input
                    id="sv-stock"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={form.stock}
                    onChange={(e) => set({ stock: e.target.value })}
                    className="tabular-nums"
                  />
                </Field>
              </div>
            </Section>

            <Section
              icon={<Palette />}
              title="Color variants"
              description={
                form.variants.length > 0
                  ? `${form.variants.length} ${form.variants.length === 1 ? 'color' : 'colors'} · ${photoCount} ${photoCount === 1 ? 'photo' : 'photos'}. Each color has its own photos and video.`
                  : 'Each color has its own photos (cropped square) and an optional video.'
              }
              aside={
                <Button variant="soft" size="sm" className="h-9 shrink-0" onClick={addVariant}>
                  <Plus />
                  Add color
                </Button>
              }
              className="max-lg:order-4"
            >
              {form.variants.length === 0 ? (
                <div className="rounded-[12px] border-2 border-dashed border-adm-line-2 px-4 py-8 text-center text-[13.5px] text-adm-muted">
                  <Palette className="mx-auto mb-2 size-6 text-adm-faint" />
                  No color variants yet. Click &ldquo;Add color&rdquo; to start.
                </div>
              ) : (
                <ul className="flex flex-col gap-3">
                  <AnimatePresence initial={false}>
                    {form.variants.map((v, i) => (
                      <motion.li
                        key={v.id}
                        layout={reduce ? false : 'position'}
                        initial={reduce ? false : { opacity: 0, y: 10, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.97, transition: { duration: 0.16 } }}
                        transition={{ duration: 0.32, ease: EASE }}
                      >
                        <VariantCard
                          variant={v}
                          index={i}
                          imagesUploading={isCropUploading && cropTarget === v.id}
                          imagesLocked={isCropUploading}
                          videoUploading={videoUploads.has(v.id)}
                          onChange={(patch) => updateVariant(v.id, patch)}
                          onRemove={() => removeVariant(v.id)}
                          onPickImages={(files) => onPickImages(v.id, files)}
                          onMoveImage={(from, to) => moveImage(v.id, from, to)}
                          onRemoveImage={(idx) => removeImage(v.id, idx)}
                          onVideoFile={(file) => onVideoFile(v.id, file)}
                        />
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              )}
              {form.variants.length > 0 && (
                <Button variant="outline" className="mt-3 w-full border-dashed" onClick={addVariant}>
                  <Plus />
                  Add another color
                </Button>
              )}
            </Section>

            <Section
              icon={<ListChecks />}
              title="Features"
              description='Bullet points on the product page (e.g. "Polarized lenses", "UV400").'
              className="max-lg:order-6"
            >
              <div className="flex gap-2">
                <Input
                  aria-label="New feature"
                  placeholder="e.g. Polarized lenses"
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
                    <li
                      key={`${feat}-${i}`}
                      className="inline-flex min-h-7 max-w-full items-center gap-1 rounded-full bg-adm-accent-soft py-1 pl-3 pr-1 text-[12.5px] font-semibold text-adm-accent-hover"
                    >
                      <span className="min-w-0 break-words">{feat}</span>
                      <button
                        type="button"
                        aria-label={`Remove ${feat}`}
                        onClick={() => set({ features: form.features.filter((_, idx) => idx !== i) })}
                        className={cn('grid size-5 shrink-0 place-items-center rounded-full hover:bg-adm-accent/15', hitPad)}
                      >
                        <X className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </Section>

            <Section icon={<Ruler />} title="Specifications" description="Empty rows are left out." className="max-lg:order-7">
              <div className="overflow-hidden rounded-[12px] border border-adm-line">
                {SPEC_KEYS.map(({ key, label, placeholder }, i) => (
                  <div key={key} className={cn('grid grid-cols-[minmax(112px,38%)_minmax(0,1fr)]', i > 0 && 'border-t border-adm-line')}>
                    <label
                      htmlFor={`sv-spec-${key}`}
                      className="flex items-center border-r border-adm-line bg-adm-surface-2 px-3 py-2 text-[12.5px] font-semibold text-adm-ink-2"
                    >
                      {label}
                    </label>
                    <input
                      id={`sv-spec-${key}`}
                      value={form.specifications[key] ?? ''}
                      onChange={(e) => set({ specifications: { ...form.specifications, [key]: e.target.value } })}
                      placeholder={placeholder}
                      className="h-10 min-w-0 bg-transparent px-3 text-base text-adm-ink outline-none transition-colors placeholder:text-[#B3A9AB] focus:bg-[#FFFAF9] sm:text-[13.5px]"
                    />
                  </div>
                ))}
              </div>
            </Section>
          </div>

          {/* ---------- Right column ---------- */}
          <div className="flex min-w-0 flex-col gap-4 max-lg:contents">
            <Section icon={<Eye />} title="Visibility & labels" className="max-lg:order-3">
              <label
                htmlFor="sv-visible"
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
                    {form.isVisible ? 'Customers can find and buy these' : 'Saved, but not shown to customers'}
                  </span>
                </span>
                <Switch id="sv-visible" checked={form.isVisible} onCheckedChange={(v) => set({ isVisible: v })} className="data-[state=checked]:bg-[#22C55E]" />
              </label>

              <div className="mb-2 mt-4 text-[13px] font-semibold text-adm-ink-2">Labels</div>
              <div className="grid grid-cols-2 gap-2">
                {LABEL_TOGGLES.map(({ key, label, icon: Icon, color, bg }) => {
                  const active = form[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      aria-pressed={active}
                      onClick={() => set({ [key]: !active } as Partial<SunglassesForm>)}
                      className="flex h-12 items-center gap-2 rounded-[12px] border-2 px-3 text-[13px] font-bold outline-none transition-[background-color,border-color,color] duration-200 focus-visible:ring-[3px] focus-visible:ring-adm-accent/25"
                      style={active ? { borderColor: color, background: bg, color } : { borderColor: 'var(--color-adm-line-2)', color: 'var(--color-adm-muted)' }}
                    >
                      <Icon className="size-[18px] shrink-0" fill={active && key === 'isBestseller' ? 'currentColor' : 'none'} />
                      {label}
                      {active && <Check className="ml-auto size-4 shrink-0" strokeWidth={3} />}
                    </button>
                  );
                })}
              </div>
            </Section>

            <Section icon={<Film />} title="Product video" description="Optional. Each color can also have its own video." className="max-lg:order-5">
              <VideoField
                idPrefix="sv-main"
                mode={form.videoInputMode}
                url={form.videoUrl}
                uploading={videoUploads.has(MAIN_VIDEO)}
                onModeChange={(m) => set({ videoInputMode: m, videoUrl: '' })}
                onUrlChange={(u) => set({ videoUrl: u })}
                onFile={(file) => onVideoFile(MAIN_VIDEO, file)}
              />
            </Section>
          </div>
        </div>
      </DialogBody>

      <DialogFooter className="justify-between pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
        {isEdit ? (
          <Button variant="ghost-destructive" disabled={busy} onClick={() => onDelete(item)}>
            <Trash2 />
            <span className="max-sm:sr-only">Delete</span>
          </Button>
        ) : (
          <span />
        )}
        <div className="flex items-center gap-2">
          {busy && !isSaving && <span className="text-[12px] text-adm-muted max-sm:hidden">Waiting for uploads...</span>}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={busy} onClick={handleSave} className="min-w-[120px]">
            {isSaving && <Loader2 className="animate-spin" />}
            {isSaving ? 'Saving...' : isEdit ? 'Save changes' : 'Add sunglasses'}
          </Button>
        </div>
      </DialogFooter>

      <CropDialog src={cropSrc} remaining={cropQueue.length} aspect={1} aspectLabel="1 : 1" zoomStep={0.2} sliderStep={0.05} onCancel={cancelCrop} onConfirm={onCropConfirm} />
    </>
  );
}
