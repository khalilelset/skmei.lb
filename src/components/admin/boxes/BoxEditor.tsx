'use client';

import { useId, useRef, useState } from 'react';
import type { Area } from 'react-easy-crop';
import { Check, Globe, ImageOff, ImagePlus, Loader2, PackageOpen, RefreshCw, Trash2, Upload, X } from 'lucide-react';
import { getCroppedImg } from '@/lib/cropImage';
import { cn } from '@/lib/utils';
import { Button, buttonVariants } from '@/components/admin/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { Input } from '@/components/admin/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { toast } from '@/components/admin/ui/sonner';
import { CropDialog } from '@/components/admin/CropDialog';
import { BoxImage, Field, MoneyInput, Section } from './parts';
import { TYPE_META, priceLabel, uploadSlug, type BoxItem, type BoxType, type BrandOption } from './model';

export type SaveResult = 'created' | 'updated';

/** Radix Select can't hold "", so the "no brand" choice uses a sentinel. */
const ALL_BRANDS = '__all__';

interface FormState {
  code: string;
  type: BoxType;
  price: string;
  image: string;
  brandId: string;
}

const EMPTY_FORM: FormState = { code: '', type: 'standard', price: '0', image: '', brandId: '' };

function formFrom(box: BoxItem | null): FormState {
  if (!box) return EMPTY_FORM;
  return {
    code: box.code ?? '',
    type: box.type === 'gift' ? 'gift' : 'standard',
    price: String(box.price ?? 0),
    image: box.image ?? '',
    brandId: box.brandId ?? '',
  };
}

export function BoxEditor({
  open,
  onOpenChange,
  sessionKey,
  box,
  brands,
  onBusyChange,
  onSaved,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionKey: number;
  box: BoxItem | null;
  brands: BrandOption[];
  onBusyChange: (busy: boolean) => void;
  onSaved: (result: SaveResult, code: string) => void;
  onDelete: (box: BoxItem) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Focus the dialog itself rather than the code field (avoids popping the keyboard on phones).
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        className={cn(
          'w-[min(800px,calc(100vw-32px))] max-h-[min(92dvh,900px)]',
          'max-sm:inset-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none',
        )}
      >
        <EditorForm
          key={sessionKey}
          box={box}
          brands={brands}
          onClose={() => onOpenChange(false)}
          onBusyChange={onBusyChange}
          onSaved={onSaved}
          onDelete={onDelete}
        />
      </DialogContent>
    </Dialog>
  );
}

function EditorForm({
  box,
  brands,
  onClose,
  onBusyChange,
  onSaved,
  onDelete,
}: {
  box: BoxItem | null;
  brands: BrandOption[];
  onClose: () => void;
  onBusyChange: (busy: boolean) => void;
  onSaved: (result: SaveResult, code: string) => void;
  onDelete: (box: BoxItem) => void;
}) {
  const uid = useId();
  const codeRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(() => formFrom(box));
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const isEdit = !!box;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));

  const priceNum = form.price.trim() === '' ? 0 : Number(form.price);
  const codeError = touched && !form.code.trim() ? 'Enter a box code' : '';
  const priceError = Number.isNaN(priceNum) ? 'Enter a number' : priceNum < 0 ? "Price can't be negative" : '';

  // A brand that was deleted since this box was saved still needs an option so the Select shows it.
  const brandMissing = !!form.brandId && !brands.some((b) => b.id === form.brandId);
  const brandName = brands.find((b) => b.id === form.brandId)?.name ?? (form.brandId ? 'Removed brand' : '');
  const meta = TYPE_META[form.type];

  // ---- image: pick → crop → upload ------------------------------------------------------------
  const onFileSelected = (file: File | undefined) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.onerror = () => toast.error("Couldn't read that file");
    reader.readAsDataURL(file);
  };

  const onCropConfirm = async (area: Area) => {
    const src = cropSrc;
    if (!src) return;
    setCropSrc(null);
    setIsUploading(true);
    setUploadError('');
    onBusyChange(true);
    try {
      const blob = await getCroppedImg(src, area);
      const fd = new FormData();
      fd.append('file', blob, 'box.jpg');
      fd.append('slug', uploadSlug(form.code));
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        const msg = data.error ?? 'Upload failed — please try again.';
        setUploadError(msg);
        toast.error("Couldn't upload the image", { description: msg });
      } else {
        const url = data.url;
        setForm((f) => ({ ...f, image: url }));
      }
    } catch {
      setUploadError('Upload failed — please try again.');
      toast.error("Couldn't upload the image", { description: 'Check your connection and try again.' });
    } finally {
      setIsUploading(false);
      onBusyChange(false);
    }
  };

  // ---- save -----------------------------------------------------------------------------------
  const save = async () => {
    setTouched(true);
    if (!form.code.trim()) {
      codeRef.current?.focus();
      return;
    }
    if (priceError) return;
    const payload = {
      code: form.code.trim(),
      type: form.type,
      price: Number(form.price) || 0,
      image: form.image || null,
      brandId: form.brandId || null,
    };
    setIsSaving(true);
    onBusyChange(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/boxes/${box.id}` : '/api/admin/boxes', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      onBusyChange(false);
      onSaved(isEdit ? 'updated' : 'created', payload.code);
    } catch (err) {
      onBusyChange(false);
      toast.error(isEdit ? "Couldn't save your changes" : "Couldn't add the box", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const fileId = `${uid}-file`;
  const busy = isSaving || isUploading;

  return (
    <>
      <DialogHeader className="flex items-center gap-3.5">
        <span className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-[12px] border border-adm-line bg-adm-surface-2 text-adm-faint">
          <BoxImage src={form.image} alt="" sizes="44px" fallback={<meta.icon className="size-5" />} />
        </span>
        <div className="min-w-0">
          <DialogTitle className="truncate">{isEdit ? `Edit box ${box.code}` : 'Add box'}</DialogTitle>
          <DialogDescription>
            {isEdit ? 'Changes apply to new orders at checkout.' : 'A standard or gift box customers can choose at checkout.'}
          </DialogDescription>
        </div>
      </DialogHeader>

      <DialogBody className="bg-adm-canvas px-4 py-4 sm:px-6 sm:py-5">
        <form
          id={`${uid}-form`}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) save();
          }}
          className="grid gap-4 sm:grid-cols-[minmax(0,250px)_minmax(0,1fr)]"
        >
          {/* ---------- Image ---------- */}
          <Section icon={<ImagePlus />} title="Box image" description="Cropped square (1:1) before upload.">
            <input
              id={fileId}
              type="file"
              accept="image/*"
              disabled={isUploading}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                onFileSelected(file);
              }}
            />
            <div className="relative mx-auto aspect-square w-full max-w-[250px] overflow-hidden rounded-[14px]">
              {form.image ? (
                <div className="relative size-full border-2 border-adm-accent/70 bg-adm-surface-2 [border-radius:inherit]">
                  <BoxImage
                    src={form.image}
                    alt="Box preview"
                    sizes="250px"
                    fallback={
                      <span className="flex size-full flex-col items-center justify-center gap-1.5 px-3 text-center text-[12px] font-semibold text-adm-muted">
                        <ImageOff className="size-6 text-adm-faint" />
                        Can&apos;t load this image
                        <span className="font-normal">Upload a new one to replace it.</span>
                      </span>
                    }
                  />
                  <button
                    type="button"
                    aria-label="Remove image"
                    disabled={isUploading}
                    onClick={() => {
                      set('image', '');
                      setUploadError('');
                    }}
                    className="absolute right-0 top-0 grid size-10 place-items-center"
                  >
                    <span className="grid size-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-adm-accent">
                      <X className="size-4" />
                    </span>
                  </button>
                </div>
              ) : (
                // A <label> keeps the click a real user gesture (needed on iOS).
                <label
                  htmlFor={fileId}
                  className={cn(
                    'flex size-full flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed px-4 text-center text-[13px] font-semibold transition-colors',
                    isUploading
                      ? 'cursor-default border-adm-line text-adm-faint'
                      : 'cursor-pointer border-adm-line-2 text-adm-muted hover:border-adm-accent hover:bg-adm-accent-soft/40 hover:text-adm-accent-hover',
                  )}
                >
                  {!isUploading && (
                    <>
                      <span className="grid size-12 place-items-center rounded-full bg-adm-surface-2 text-adm-accent-hover shadow-adm-sm">
                        <Upload className="size-5" />
                      </span>
                      Upload image
                      <span className="text-[12px] font-normal text-adm-muted">You&apos;ll crop it square next</span>
                    </>
                  )}
                </label>
              )}
              {isUploading && (
                <div className="absolute inset-0 grid place-items-center bg-adm-surface/80 backdrop-blur-[2px]">
                  <span className="flex flex-col items-center gap-2 text-[12.5px] font-semibold text-adm-muted">
                    <Loader2 className="size-7 animate-spin text-adm-accent" />
                    Uploading…
                  </span>
                </div>
              )}
            </div>

            {form.image && (
              <label
                htmlFor={fileId}
                aria-disabled={isUploading}
                className={cn(
                  buttonVariants({ variant: 'outline' }),
                  'mt-3 w-full cursor-pointer',
                  isUploading && 'pointer-events-none opacity-50',
                )}
              >
                <RefreshCw />
                Replace image
              </label>
            )}
            {uploadError && <p className="mt-2 text-[12px] font-medium text-adm-accent-hover">{uploadError}</p>}
          </Section>

          {/* ---------- Details ---------- */}
          <div className="flex min-w-0 flex-col gap-4">
            <Section icon={<PackageOpen />} title="Box details" description="How this box is listed and priced at checkout.">
              <div className="grid gap-4">
                <Field label="Box code" htmlFor={`${uid}-code`} required error={codeError} hint="A short unique code, e.g. STD-001 or GIFT-01.">
                  <Input
                    ref={codeRef}
                    id={`${uid}-code`}
                    value={form.code}
                    onChange={(e) => set('code', e.target.value)}
                    placeholder="e.g. STD-001, GIFT-01"
                    autoComplete="off"
                    spellCheck={false}
                    aria-invalid={!!codeError || undefined}
                    className="font-adm-mono tracking-[-0.01em]"
                  />
                </Field>

                <div className="flex min-w-0 flex-col gap-1.5">
                  <span id={`${uid}-type`} className="flex items-center gap-1 text-[13px] font-semibold text-adm-ink-2">
                    Type <span className="text-adm-accent">*</span>
                  </span>
                  <div role="radiogroup" aria-labelledby={`${uid}-type`} className="grid grid-cols-2 gap-2">
                    {(['standard', 'gift'] as const).map((t) => {
                      const m = TYPE_META[t];
                      const active = form.type === t;
                      return (
                        <button
                          key={t}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => set('type', t)}
                          className={cn(
                            'relative flex min-h-[58px] min-w-0 items-center gap-2.5 rounded-[12px] border px-3 py-2.5 text-left outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-adm-accent/25',
                            active
                              ? 'border-adm-accent bg-adm-accent-soft/50 shadow-[0_0_0_1px_var(--color-adm-accent)]'
                              : 'border-adm-line-2 bg-adm-surface hover:border-[#D5CAC7] hover:bg-adm-surface-2',
                          )}
                        >
                          <span className={cn('grid size-9 shrink-0 place-items-center rounded-[10px]', m.tile)}>
                            <m.icon className="size-[18px]" />
                          </span>
                          <span className="min-w-0">
                            <span className="block truncate text-[13.5px] font-semibold text-adm-ink">{t === 'standard' ? 'Standard box' : 'Gift box'}</span>
                            <span className="block truncate text-[12px] text-adm-muted">{m.hint}</span>
                          </span>
                          {active && (
                            <span className="absolute right-2 top-2 grid size-4 place-items-center rounded-full bg-adm-accent text-white">
                              <Check className="size-3" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Price addition" htmlFor={`${uid}-price`} error={priceError} hint="0 = free (standard box)">
                    <MoneyInput
                      id={`${uid}-price`}
                      min={0}
                      step={0.5}
                      value={form.price}
                      onChange={(e) => set('price', e.target.value)}
                      aria-invalid={!!priceError || undefined}
                    />
                  </Field>
                  <Field label="Brand" hint="Leave on “All brands” to offer it with every watch.">
                    <Select value={form.brandId || ALL_BRANDS} onValueChange={(v) => set('brandId', v === ALL_BRANDS ? '' : v)}>
                      <SelectTrigger aria-label="Brand">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={ALL_BRANDS}>All brands (global)</SelectItem>
                        {brandMissing && <SelectItem value={form.brandId}>Removed brand</SelectItem>}
                        {brands.map((b) => (
                          <SelectItem key={b.id} value={b.id}>
                            {b.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </Field>
                </div>
              </div>
            </Section>

            {/* Live summary */}
            <div className="flex min-w-0 items-center gap-3 rounded-[14px] border border-dashed border-adm-line-2 bg-adm-surface/60 px-4 py-3">
              <span className={cn('grid size-9 shrink-0 place-items-center rounded-[10px]', meta.tile)}>
                <meta.icon className="size-[18px]" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="truncate text-[13.5px] font-semibold text-adm-ink">
                  <span className="font-adm-mono">{form.code.trim() || 'NEW-BOX'}</span> · {meta.long}
                </div>
                <div className="flex items-center gap-1.5 truncate text-[12px] text-adm-muted">
                  <Globe className="size-3 shrink-0" />
                  {brandName ? `${brandName} only` : 'All brands'}
                </div>
              </div>
              <span
                className={cn(
                  'shrink-0 font-adm-display text-[17px] font-bold tabular-nums',
                  !priceError && priceNum > 0 ? 'text-adm-accent-hover' : 'text-adm-muted',
                )}
              >
                {priceError ? '—' : priceLabel(priceNum)}
              </span>
            </div>
          </div>
        </form>
      </DialogBody>

      <DialogFooter className="pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
        {isEdit && (
          <Button variant="ghost-destructive" className="mr-auto" disabled={busy} onClick={() => onDelete(box)}>
            <Trash2 />
            Delete
          </Button>
        )}
        <Button variant="outline" disabled={isSaving} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form={`${uid}-form`} disabled={busy}>
          {isSaving && <Loader2 className="animate-spin" />}
          {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Create box'}
        </Button>
      </DialogFooter>

      <CropDialog src={cropSrc} onCancel={() => setCropSrc(null)} onConfirm={onCropConfirm} />
    </>
  );
}
