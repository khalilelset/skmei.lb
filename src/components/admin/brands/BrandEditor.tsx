'use client';

import { useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import {
  AlertTriangle,
  BadgeDollarSign,
  ClipboardList,
  Film,
  Layers,
  Link2,
  ListChecks,
  Loader2,
  Plus,
  ShieldCheck,
  Sparkles,
  Tag,
  Text,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { uploadVideoDirectly } from '@/lib/uploadVideo';
import { cn, formatPrice } from '@/lib/utils';
import { Button } from '@/components/admin/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { Input, Textarea } from '@/components/admin/ui/input';
import { Segmented } from '@/components/admin/ui/segmented';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { toast } from '@/components/admin/ui/sonner';
import { Switch } from '@/components/admin/ui/switch';
import { Field, MoneyInput, Section, uploadTile } from './fields';
import {
  GENDERS,
  SPEC_FIELDS,
  WARRANTY_UNITS,
  buildRequestBody,
  toForm,
  type Brand,
  type BrandDefaults,
  type BrandForm,
  type CategoryOption,
  type PriceTier,
} from './model';

export type SaveResult = 'created' | 'updated';

/** Radix Select can't hold an empty value, so "— None —" maps to this sentinel and back to ''. */
const NONE = '__none__';
const EASE = [0.2, 0.8, 0.2, 1] as const;

export function BrandEditor({
  open,
  onOpenChange,
  brand,
  sessionKey,
  categories,
  onSaved,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  brand: Brand | null;
  /** Bumped on every open so the form starts fresh (no state syncing in effects). */
  sessionKey: number;
  categories: CategoryOption[];
  onSaved: (result: SaveResult, name: string) => void;
  onDelete: (brand: Brand) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          'w-[min(1000px,calc(100vw-32px))] max-h-[min(94dvh,1000px)]',
          'max-sm:inset-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none',
        )}
      >
        <EditorForm
          key={sessionKey}
          brand={brand}
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
  brand,
  categories,
  onClose,
  onSaved,
  onDelete,
}: {
  brand: Brand | null;
  categories: CategoryOption[];
  onClose: () => void;
  onSaved: (result: SaveResult, name: string) => void;
  onDelete: (brand: Brand) => void;
}) {
  const reduce = useReducedMotion();
  const isEdit = !!brand;
  const [form, setForm] = useState<BrandForm>(() => toForm(brand));
  const [error, setError] = useState('');
  const [featureInput, setFeatureInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [videoMode, setVideoMode] = useState<'upload' | 'url'>('upload');
  const [videoUrlDraft, setVideoUrlDraft] = useState('');

  const d = form.defaults;
  const setD = (patch: Partial<BrandDefaults> | ((d: BrandDefaults) => Partial<BrandDefaults>)) =>
    setForm((f) => ({ ...f, defaults: { ...f.defaults, ...(typeof patch === 'function' ? patch(f.defaults) : patch) } }));
  const setSpec = (key: string, value: string) => setD((cur) => ({ specifications: { ...cur.specifications, [key]: value } }));
  const setTier = (i: number, patch: Partial<PriceTier>) =>
    setD((cur) => ({ priceTiers: (cur.priceTiers ?? []).map((t, idx) => (idx === i ? { ...t, ...patch } : t)) }));

  const busy = isSaving || isUploadingVideo;
  const canSave = !busy && !!form.name.trim();

  /* ---------- Features ---------- */
  const addFeature = () => {
    const v = featureInput.trim();
    if (!v) return;
    setD((cur) => ({ features: [...(cur.features ?? []), v] }));
    setFeatureInput('');
  };
  const removeFeature = (i: number) => setD((cur) => ({ features: (cur.features ?? []).filter((_, idx) => idx !== i) }));

  /* ---------- Video ---------- */
  const onVideoSelected = async (file: File) => {
    setIsUploadingVideo(true);
    try {
      const url = await uploadVideoDirectly(file, 'brand-defaults/videos');
      setD({ videoUrl: url });
      toast.success('Brand video uploaded');
    } catch (err) {
      console.error('Brand video upload failed:', err);
      toast.error("Couldn't upload the video", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsUploadingVideo(false);
    }
  };
  const commitVideoUrl = () => {
    const v = videoUrlDraft.trim();
    if (!v) return;
    setD({ videoUrl: v });
    setVideoUrlDraft('');
  };

  /* ---------- Save (same request as the old page) ---------- */
  const handleSave = async () => {
    if (busy) return;
    if (!form.name.trim()) {
      setError('Brand name is required.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const res = await fetch(isEdit ? `/api/admin/brands/${brand.id}` : '/api/admin/brands', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildRequestBody(form)),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg: string = data.error ?? 'Something went wrong.';
        setError(msg);
        setIsSaving(false);
        toast.error(isEdit ? "Couldn't save your changes" : "Couldn't add the brand", { description: msg });
        return;
      }
      setIsSaving(false);
      onSaved(isEdit ? 'updated' : 'created', form.name.trim());
    } catch {
      setIsSaving(false);
      toast.error(isEdit ? "Couldn't save your changes" : "Couldn't add the brand", { description: 'Check your connection and try again.' });
    }
  };

  const price = Number(d.price);
  const cost = Number(d.costPrice);
  const original = Number(d.originalPrice);
  const priceHint =
    d.price && d.costPrice && price > 0 && cost > 0 ? `Profit ${formatPrice(price - cost)} per watch` : 'What customers pay.';
  const originalHint =
    d.price && d.originalPrice && original > price && price > 0
      ? `Shows as ${Math.round((1 - price / original) * 100)}% off`
      : 'Crossed-out price (optional).';
  const specsFilled = SPEC_FIELDS.filter((f) => (d.specifications ?? {})[f.key]).length;
  const hadSavedDefaults = isEdit && !!brand.defaults;

  const expand = reduce
    ? {}
    : {
        initial: { opacity: 0, height: 0 },
        animate: { opacity: 1, height: 'auto' },
        exit: { opacity: 0, height: 0 },
        transition: { duration: 0.32, ease: EASE },
      };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit brand' : 'Add brand'}</DialogTitle>
        <DialogDescription>
          {isEdit ? `Update ${brand.name}, its warranty and the defaults new products start from.` : 'Add a watch brand to the store.'}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="overscroll-contain bg-adm-canvas px-3 py-4 sm:px-6 sm:py-5">
        <div className="grid gap-4 lg:grid-cols-2 lg:items-start">
          <Section icon={<Tag />} title="Brand details">
            <div className="flex flex-col gap-4">
              <Field label="Brand name" htmlFor="be-name" required error={error}>
                <Input
                  id="be-name"
                  placeholder="e.g. SKMEI"
                  autoComplete="off"
                  autoFocus
                  aria-invalid={!!error || undefined}
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleSave();
                    }
                  }}
                />
              </Field>
              <Field label={<><ShieldCheck className="size-3.5 text-adm-muted" />Warranty <span className="font-normal text-adm-muted">(optional)</span></>} htmlFor="be-warranty">
                <div className="flex gap-2">
                  <Input
                    id="be-warranty"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    placeholder="e.g. 12"
                    className="flex-1 tabular-nums"
                    value={form.warrantyValue}
                    onChange={(e) => setForm((f) => ({ ...f, warrantyValue: e.target.value }))}
                  />
                  <Select value={form.warrantyUnit} onValueChange={(v) => setForm((f) => ({ ...f, warrantyUnit: v }))}>
                    <SelectTrigger aria-label="Warranty unit" className="w-[130px] shrink-0">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WARRANTY_UNITS.map((u) => (
                        <SelectItem key={u.value} value={u.value}>
                          {u.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </Field>
            </div>
          </Section>

          <Section
            icon={<Sparkles />}
            title="Product defaults"
            description="Auto-fill the new product form when this brand is selected. Editing an existing product never auto-fills."
            aside={
              <Switch
                id="be-defaults"
                aria-label="Use product defaults"
                checked={form.defaultsOn}
                onCheckedChange={(v) => setForm((f) => ({ ...f, defaultsOn: v }))}
                className="mt-1"
              />
            }
          >
            <label
              htmlFor="be-defaults"
              className={cn(
                'flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-[12px] border px-3 py-2.5 text-[13px] transition-colors',
                form.defaultsOn
                  ? 'border-[#D9D5FF] bg-[#F6F5FF] text-[#4338CA]'
                  : hadSavedDefaults
                    ? 'border-[#F6D9A8] bg-[#FFF8EC] text-[#B45309]'
                    : 'border-adm-line bg-adm-surface-2 text-adm-muted hover:border-adm-line-2',
              )}
            >
              {form.defaultsOn ? (
                <Sparkles className="size-4 shrink-0" />
              ) : hadSavedDefaults ? (
                <AlertTriangle className="size-4 shrink-0" />
              ) : (
                <Layers className="size-4 shrink-0" />
              )}
              <span className="min-w-0 flex-1 leading-snug">
                {form.defaultsOn
                  ? 'On. Fill in only what you want pre-filled; empty fields are skipped.'
                  : hadSavedDefaults
                    ? "Off. Saving will clear this brand's saved defaults."
                    : 'Off. Turn on to set prices, bundle deals, specs and a shared video.'}
              </span>
            </label>
          </Section>
        </div>

        <AnimatePresence initial={false}>
          {form.defaultsOn && (
            // The negative margin + padding gives the cards' shadows room inside the clipping box.
            <motion.div key="defaults" className="-mx-3 -mb-3 overflow-hidden px-3 pb-3" {...expand}>
              <div className="grid gap-4 pt-4 lg:grid-cols-2 lg:items-start">
                {/* ---------- Left column ---------- */}
                <div className="flex min-w-0 flex-col gap-4">
                  <Section icon={<BadgeDollarSign />} title="Pricing">
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Field label="Sale price" htmlFor="be-price" hint={priceHint}>
                        <MoneyInput id="be-price" placeholder="29.99" value={d.price ?? ''} onChange={(e) => setD({ price: e.target.value })} />
                      </Field>
                      <Field label="Cost price" htmlFor="be-cost" hint="Only visible to staff.">
                        <MoneyInput id="be-cost" placeholder="15" value={d.costPrice ?? ''} onChange={(e) => setD({ costPrice: e.target.value })} />
                      </Field>
                      <Field label="Original price" htmlFor="be-original" hint={originalHint}>
                        <MoneyInput
                          id="be-original"
                          placeholder="39.99"
                          value={d.originalPrice ?? ''}
                          onChange={(e) => setD({ originalPrice: e.target.value })}
                        />
                      </Field>
                    </div>
                  </Section>

                  <Section icon={<ClipboardList />} title="Classification">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Category">
                        <Select value={d.category || NONE} onValueChange={(v) => setD({ category: v === NONE ? '' : v })}>
                          <SelectTrigger aria-label="Category">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>None</SelectItem>
                            {categories.map((c) => (
                              <SelectItem key={c.slug} value={c.slug}>
                                {c.name}
                              </SelectItem>
                            ))}
                            {/* Keep a saved slug selectable even if that category was since removed. */}
                            {d.category && !categories.some((c) => c.slug === d.category) && (
                              <SelectItem value={d.category}>{d.category}</SelectItem>
                            )}
                          </SelectContent>
                        </Select>
                      </Field>
                      <Field label="Gender">
                        <Select value={d.gender || NONE} onValueChange={(v) => setD({ gender: v === NONE ? '' : v })}>
                          <SelectTrigger aria-label="Gender">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value={NONE}>None</SelectItem>
                            {GENDERS.map((g) => (
                              <SelectItem key={g.value} value={g.value}>
                                {g.label}
                              </SelectItem>
                            ))}
                            {d.gender && !GENDERS.some((g) => g.value === d.gender) && <SelectItem value={d.gender}>{d.gender}</SelectItem>}
                          </SelectContent>
                        </Select>
                      </Field>
                    </div>
                  </Section>

                  <Section icon={<Text />} title="Description">
                    <Textarea
                      aria-label="Default description"
                      rows={4}
                      placeholder="Default product description..."
                      value={d.description ?? ''}
                      onChange={(e) => setD({ description: e.target.value })}
                    />
                  </Section>

                  <Section
                    icon={<ListChecks />}
                    title="Specifications"
                    aside={
                      <span className="mt-1 shrink-0 rounded-full bg-adm-canvas-2 px-2 py-0.5 font-adm-mono text-[11px] font-semibold tabular-nums text-adm-muted">
                        {specsFilled}/{SPEC_FIELDS.length}
                      </span>
                    }
                  >
                    <div className="grid gap-3 sm:grid-cols-2">
                      {SPEC_FIELDS.map((f) => (
                        <Field key={f.key} label={f.label} htmlFor={`be-spec-${f.key}`}>
                          <Input
                            id={`be-spec-${f.key}`}
                            autoComplete="off"
                            value={(d.specifications ?? {})[f.key] ?? ''}
                            onChange={(e) => setSpec(f.key, e.target.value)}
                          />
                        </Field>
                      ))}
                    </div>
                  </Section>
                </div>

                {/* ---------- Right column ---------- */}
                <div className="flex min-w-0 flex-col gap-4">
                  <Section
                    icon={<Layers />}
                    title="Bundle pricing"
                    description="Applies across every product of this brand in the cart, e.g. any 2 for $15."
                  >
                    {(d.priceTiers ?? []).length > 0 && (
                      <ul className="mb-3 flex flex-col gap-2">
                        {(d.priceTiers ?? []).map((tier, i) => {
                            const q = Number(tier.qty);
                            const p = Number(tier.price);
                            const each = q > 0 && p > 0 ? formatPrice(p / q) : null;
                            return (
                              // Tiers have no ids (the payload is plain {qty, price}), so rows only animate in.
                              <motion.li
                                key={i}
                                initial={reduce ? false : { opacity: 0, y: -6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.22, ease: EASE }}
                                className="flex items-center gap-2 rounded-[12px] border border-adm-line bg-adm-surface-2 p-2"
                              >
                                <Input
                                  type="number"
                                  inputMode="numeric"
                                  min={1}
                                  step={1}
                                  aria-label={`Tier ${i + 1} quantity`}
                                  placeholder="Qty"
                                  className="w-[68px] shrink-0 bg-adm-surface tabular-nums"
                                  value={tier.qty}
                                  onChange={(e) => setTier(i, { qty: e.target.value })}
                                />
                                <span className="shrink-0 text-[12.5px] text-adm-muted">for</span>
                                <MoneyInput
                                  aria-label={`Tier ${i + 1} total price`}
                                  placeholder="Total"
                                  className="w-[104px] shrink-0"
                                  value={tier.price}
                                  onChange={(e) => setTier(i, { price: e.target.value })}
                                />
                                <span className="min-w-0 flex-1 truncate text-[12px] text-adm-muted">{each ? `${each} each` : ''}</span>
                                <Button
                                  type="button"
                                  variant="ghost-destructive"
                                  size="icon"
                                  aria-label={`Remove tier ${i + 1}`}
                                  onClick={() => setD((cur) => ({ priceTiers: (cur.priceTiers ?? []).filter((_, idx) => idx !== i) }))}
                                >
                                  <X />
                                </Button>
                              </motion.li>
                            );
                          })}
                      </ul>
                    )}
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => setD((cur) => ({ priceTiers: [...(cur.priceTiers ?? []), { qty: '', price: '' }] }))}
                      >
                        <Plus />
                        Add tier
                      </Button>
                      {(d.priceTiers ?? []).length > 0 && <span className="text-[12px] text-adm-muted">Tiers missing a qty or total are skipped.</span>}
                    </div>
                  </Section>

                  <Section icon={<ListChecks />} title="Features">
                    <div className="flex gap-2">
                      <Input
                        aria-label="New feature"
                        placeholder="e.g. Water resistant"
                        autoComplete="off"
                        value={featureInput}
                        onChange={(e) => setFeatureInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addFeature();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addFeature} disabled={!featureInput.trim()}>
                        <Plus />
                        Add
                      </Button>
                    </div>
                    {(d.features ?? []).length > 0 ? (
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        <AnimatePresence initial={false}>
                          {(d.features ?? []).map((f, i, all) => (
                            <motion.li
                              // Stable across removals: the text plus how many identical entries precede it.
                              key={`${f}#${all.slice(0, i).filter((x) => x === f).length}`}
                              layout={!reduce}
                              initial={reduce ? false : { opacity: 0, scale: 0.85 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={reduce ? undefined : { opacity: 0, scale: 0.85 }}
                              transition={{ type: 'spring', stiffness: 480, damping: 30 }}
                              className="inline-flex h-9 max-w-full items-center rounded-full bg-adm-canvas-2 pl-3 text-[13px] font-medium text-adm-ink-2"
                            >
                              <span className="truncate">{f}</span>
                              <button
                                type="button"
                                aria-label={`Remove ${f}`}
                                onClick={() => removeFeature(i)}
                                className="grid size-9 shrink-0 place-items-center rounded-full text-adm-muted transition-colors hover:text-adm-accent-hover focus-visible:outline-2 focus-visible:outline-adm-accent"
                              >
                                <X className="size-3.5" />
                              </button>
                            </motion.li>
                          ))}
                        </AnimatePresence>
                      </ul>
                    ) : (
                      <p className="mt-2 text-[12px] text-adm-muted">Press Enter to add each one.</p>
                    )}
                  </Section>

                  <Section icon={<Film />} title="Video" description="Shared across all products of this brand. Upload once, applies to all.">
                    {d.videoUrl ? (
                      <div className="flex flex-wrap items-end gap-3">
                        <div className="relative aspect-[3/4] w-[180px] max-w-full overflow-hidden rounded-[12px] border border-adm-line bg-black">
                          <video src={d.videoUrl} controls className="block size-full object-contain" />
                          <button
                            type="button"
                            aria-label="Remove video"
                            onClick={() => setD({ videoUrl: '' })}
                            className="absolute right-1 top-1 grid size-9 place-items-center"
                          >
                            <span className="grid size-7 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-adm-accent">
                              <X className="size-3.5" />
                            </span>
                          </button>
                        </div>
                        <p className="min-w-0 flex-1 break-all text-[12px] text-adm-muted">{d.videoUrl}</p>
                      </div>
                    ) : (
                      <>
                        <Segmented
                          ariaLabel="Video source"
                          value={videoMode}
                          onChange={setVideoMode}
                          options={[
                            { value: 'upload', label: 'Upload', icon: <Upload /> },
                            { value: 'url', label: 'URL', icon: <Link2 /> },
                          ]}
                          className="mb-3 max-sm:[&_[role=tab]]:h-9"
                        />
                        {videoMode === 'upload' ? (
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
                                Upload brand video
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
                        ) : (
                          <Field label="Video URL" htmlFor="be-video-url" hint="Paste a direct video link, then press Enter or Use.">
                            <div className="flex gap-2">
                              <Input
                                id="be-video-url"
                                type="url"
                                placeholder="https://... direct video URL"
                                value={videoUrlDraft}
                                onChange={(e) => setVideoUrlDraft(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') {
                                    e.preventDefault();
                                    commitVideoUrl();
                                  }
                                }}
                              />
                              <Button type="button" variant="outline" onClick={commitVideoUrl} disabled={!videoUrlDraft.trim()}>
                                Use
                              </Button>
                            </div>
                          </Field>
                        )}
                      </>
                    )}
                  </Section>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogBody>

      <DialogFooter className="justify-between pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
        {isEdit ? (
          <Button variant="ghost-destructive" disabled={busy} onClick={() => onDelete(brand)}>
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
          <Button onClick={handleSave} disabled={!canSave}>
            {isSaving && <Loader2 className="animate-spin" />}
            {isSaving ? 'Saving...' : isEdit ? 'Save changes' : 'Add brand'}
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
