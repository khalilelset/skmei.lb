'use client';

import * as React from 'react';
import { useRef, useState } from 'react';
import type { Area } from 'react-easy-crop';
import { Check, Compass, ImageIcon, ImageUp, Loader2, Plus, RefreshCw, Tag, Trash2, Upload, X } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { Input, Textarea } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { toast } from '@/components/admin/ui/sonner';
import { getCroppedImg } from '@/lib/cropImage';
import { cn } from '@/lib/utils';
import { CropDialog } from '@/components/admin/CropDialog';
import { CategoryIcon } from './CategoryIcon';
import { type Category, type CategoryForm, ICON_OPTIONS, categoryToForm, emptyForm, readError, slugify } from './model';
import { SafeImg } from './SafeImg';

export type SaveResult = 'created' | 'updated';

export function CategoryEditor({
  open,
  onOpenChange,
  sessionKey,
  category,
  onSaved,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionKey: number;
  category: Category | null;
  onSaved: (result: SaveResult, name: string) => void;
  onDelete: (category: Category) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        // Focus the dialog itself rather than the name field (avoids popping the keyboard on phones).
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        className={cn(
          'w-[min(860px,calc(100vw-32px))] max-h-[min(94dvh,900px)]',
          'max-sm:inset-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none',
        )}
      >
        <EditorForm key={sessionKey} category={category} onClose={() => onOpenChange(false)} onSaved={onSaved} onDelete={onDelete} />
      </DialogContent>
    </Dialog>
  );
}

function Section({
  title,
  description,
  icon,
  aside,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('min-w-0 rounded-[16px] bg-adm-surface p-4 shadow-adm-md sm:p-5', className)}>
      <header className="mb-4 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-adm-accent-soft text-adm-accent-hover [&_svg]:size-4">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-adm-display text-[15px] font-bold leading-tight tracking-[-0.01em] text-adm-ink">{title}</h3>
          {description && <p className="mt-0.5 text-[12.5px] leading-snug text-adm-muted">{description}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string | false;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="gap-1">
        {label}
        {required && <span className="text-adm-accent">*</span>}
      </Label>
      {children}
      {error ? <p className="text-[12px] font-medium text-adm-accent-hover">{error}</p> : hint ? <p className="text-[12px] text-adm-muted">{hint}</p> : null}
    </div>
  );
}

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif';

function EditorForm({
  category,
  onClose,
  onSaved,
  onDelete,
}: {
  category: Category | null;
  onClose: () => void;
  onSaved: (result: SaveResult, name: string) => void;
  onDelete: (category: Category) => void;
}) {
  const isEdit = !!category;
  const [form, setForm] = useState<CategoryForm>(() => (category ? categoryToForm(category) : emptyForm));
  // While creating, the slug follows the name until it's edited by hand.
  const [slugTouched, setSlugTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const busy = isSaving || isUploading;
  const nameError = submitted && !form.name.trim() && 'Name is required';
  const slugError = submitted && !form.slug.trim() && 'Slug is required';

  const onNameChange = (name: string) => {
    setForm((f) => ({ ...f, name, slug: isEdit || slugTouched ? f.slug : slugify(name) }));
  };

  /* ---------- Image: pick → crop (3:4) → upload ---------- */
  const handleFileSelect = (file: File) => {
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (!file.type.startsWith('image/')) {
      toast.error('Please choose an image file', { description: 'JPEG, PNG, WebP or AVIF' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setCropSrc(reader.result as string);
    reader.readAsDataURL(file);
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
      fd.append('slug', form.slug || 'category');
      const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
      const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
      if (data.url) {
        const url = data.url;
        setForm((f) => ({ ...f, image: url }));
      } else {
        toast.error("Couldn't upload the image", { description: data.error ?? `HTTP ${res.status}` });
      }
    } catch (err) {
      toast.error("Couldn't upload the image", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsUploading(false);
    }
  };

  /* ---------- Save (same POST / PATCH body as before) ---------- */
  const save = async () => {
    setSubmitted(true);
    if (!form.name.trim() || !form.slug.trim()) {
      toast.error('Fill in the required fields', { description: 'Name and slug are required.' });
      return;
    }
    setIsSaving(true);
    try {
      const body = JSON.stringify({ ...form, name: form.name.trim(), slug: form.slug.trim() });
      const res = category
        ? await fetch(`/api/admin/categories/${category.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body })
        : await fetch('/api/admin/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body });
      if (!res.ok) throw new Error(await readError(res));
      onSaved(isEdit ? 'updated' : 'created', form.name.trim());
    } catch (err) {
      toast.error("Couldn't save the category", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit category' : 'Add category'}</DialogTitle>
        <DialogDescription>
          {isEdit ? (
            <>
              Update the name, image and menu icon of <span className="font-adm-mono text-adm-ink-2">{category.slug}</span>
            </>
          ) : (
            'A new watch category for the store menu and filters.'
          )}
        </DialogDescription>
      </DialogHeader>

      <DialogBody className="overscroll-contain bg-adm-canvas px-3 py-4 sm:px-6 sm:py-5">
        <form
          id="category-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) save();
          }}
          className="grid gap-4 md:grid-cols-[minmax(0,1fr)_250px]"
        >
          {/* ---------- Details ---------- */}
          <Section icon={<Tag />} title="Details" description="Name, URL slug and the short text shown on the category page." className="md:col-start-1 md:row-start-1">
            <div className="grid gap-3.5 sm:grid-cols-2">
              <Field label="Name" htmlFor="cat-name" required error={nameError}>
                <Input
                  id="cat-name"
                  placeholder="e.g. Digital Watches"
                  value={form.name}
                  aria-invalid={!!nameError || undefined}
                  onChange={(e) => onNameChange(e.target.value)}
                  autoComplete="off"
                />
              </Field>
              <Field label="Slug" htmlFor="cat-slug" required error={slugError} hint="Used in URLs — lowercase, no spaces">
                <Input
                  id="cat-slug"
                  placeholder="e.g. digital"
                  value={form.slug}
                  aria-invalid={!!slugError || undefined}
                  onChange={(e) => {
                    const slug = e.target.value;
                    setSlugTouched(slug !== '');
                    setForm((f) => ({ ...f, slug }));
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  className="font-adm-mono sm:text-[13px]"
                />
              </Field>
              <Field label="Description" htmlFor="cat-description" className="sm:col-span-2">
                <Textarea
                  id="cat-description"
                  rows={3}
                  placeholder="Optional"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                />
              </Field>
            </div>
          </Section>

          {/* ---------- Image ---------- */}
          <Section
            icon={<ImageUp />}
            title="Image"
            description="Portrait 3:4, like the store tiles."
            className="md:col-start-2 md:row-span-2 md:row-start-1 md:self-start"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT}
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
              }}
            />
            <div className="mx-auto w-[min(100%,210px)] md:w-full">
              {form.image ? (
                <div className="relative aspect-[3/4] overflow-hidden rounded-[12px] border border-adm-line bg-adm-canvas-2">
                  <SafeImg
                    src={form.image}
                    className="absolute inset-0 size-full object-cover"
                    fallback={
                      <span className="absolute inset-0 grid place-items-center p-3 text-center">
                        <span className="flex flex-col items-center gap-1.5 text-adm-faint">
                          <ImageIcon className="size-8" strokeWidth={1.5} />
                          <span className="text-[12px] font-semibold">Image unavailable</span>
                          <span className="text-[11px]">Upload a new one</span>
                        </span>
                      </span>
                    }
                  />
                  {isUploading && (
                    <span className="absolute inset-0 grid place-items-center bg-black/50">
                      <Loader2 className="size-8 animate-spin text-white" />
                    </span>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  disabled={isUploading}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    if (!dragging) setDragging(true);
                  }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    const f = e.dataTransfer.files?.[0];
                    if (f) handleFileSelect(f);
                  }}
                  className={cn(
                    'flex aspect-[3/4] w-full flex-col items-center justify-center gap-1.5 rounded-[12px] border-2 border-dashed px-3 text-center transition-colors',
                    dragging ? 'border-adm-accent bg-adm-accent-soft' : 'border-adm-line-2 bg-adm-surface-2 hover:border-adm-accent hover:bg-adm-accent-soft',
                    isUploading && 'cursor-default',
                  )}
                >
                  {isUploading ? (
                    <Loader2 className="size-8 animate-spin text-adm-accent" />
                  ) : (
                    <>
                      <span className="mb-1 grid size-11 place-items-center rounded-full bg-adm-surface text-adm-accent shadow-adm-sm">
                        <Upload className="size-5" />
                      </span>
                      <span className="text-[13px] font-semibold text-adm-ink-2">Click to upload image</span>
                      <span className="text-[11.5px] text-adm-muted">or drop it here</span>
                      <span className="mt-1 text-[11px] text-adm-faint">JPEG, PNG, WebP · max 8 MB</span>
                    </>
                  )}
                </button>
              )}
              {form.image && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button type="button" variant="outline" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
                    <RefreshCw />
                    Replace
                  </Button>
                  <Button type="button" variant="ghost-destructive" disabled={isUploading} onClick={() => setForm((f) => ({ ...f, image: '' }))}>
                    <X />
                    Remove
                  </Button>
                </div>
              )}
            </div>
          </Section>

          {/* ---------- Store navigation ---------- */}
          <Section
            icon={<Compass />}
            title={
              <>
                Store navigation
                {form.icon && <span className="font-adm-body text-[13px] font-semibold text-adm-accent-hover"> · {form.icon}</span>}
              </>
            }
            description="The icon shown next to this category in the menu, and its position."
            className="md:col-start-1 md:row-start-2"
            aside={
              form.icon ? (
                <Button type="button" variant="ghost" size="sm" className="h-9" onClick={() => setForm((f) => ({ ...f, icon: '' }))}>
                  <X />
                  Clear icon
                </Button>
              ) : undefined
            }
          >
            <div role="group" aria-label="Nav icon" className="grid grid-cols-[repeat(auto-fill,minmax(66px,1fr))] gap-2">
              {ICON_OPTIONS.map(({ name, Comp }) => {
                const selected = form.icon === name;
                return (
                  <button
                    key={name}
                    type="button"
                    aria-pressed={selected}
                    onClick={() => setForm((f) => ({ ...f, icon: selected ? '' : name }))}
                    className={cn(
                      'relative flex min-h-[62px] min-w-0 flex-col items-center justify-center gap-1 rounded-[12px] border px-1 py-2 outline-none transition-[background-color,border-color,color,transform] duration-150 active:scale-[.97] focus-visible:ring-[3px] focus-visible:ring-adm-accent/25',
                      selected
                        ? 'border-adm-accent bg-adm-accent-soft text-adm-accent-hover shadow-[0_0_0_1px_var(--color-adm-accent)]'
                        : 'border-adm-line-2 bg-adm-surface text-adm-muted hover:border-[#E9928B] hover:text-adm-ink',
                    )}
                  >
                    {selected && (
                      <span className="absolute right-1 top-1 grid size-3.5 place-items-center rounded-full bg-adm-accent text-white">
                        <Check className="size-2.5" strokeWidth={3} />
                      </span>
                    )}
                    <Comp className="size-5" />
                    <span className={cn('max-w-full truncate text-[10.5px]', selected ? 'font-bold' : 'font-medium')}>{name}</span>
                  </button>
                );
              })}
            </div>

            <div className="mt-4 grid gap-3.5 border-t border-adm-line pt-4 sm:grid-cols-[180px_minmax(0,1fr)] sm:items-start">
              <Field label="Sort order" htmlFor="cat-sort" hint="Lower numbers appear first">
                <Input
                  id="cat-sort"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  value={form.sort_order}
                  onChange={(e) => setForm((f) => ({ ...f, sort_order: Number(e.target.value) }))}
                  className="tabular-nums"
                />
              </Field>
              <div className="flex min-w-0 items-center gap-3 rounded-[12px] bg-adm-surface-2 px-3 py-2.5 sm:mt-[22px]">
                <span className="grid size-9 shrink-0 place-items-center rounded-[10px] bg-adm-surface text-adm-accent shadow-adm-sm">
                  <CategoryIcon icon={form.icon} className="size-[18px]" fallback={<Plus className="size-[18px] text-adm-faint" />} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-adm-ink">{form.name.trim() || 'Category name'}</span>
                  <span className="block truncate text-[11.5px] text-adm-muted">Menu preview{form.icon ? '' : ' · no icon'}</span>
                </span>
              </div>
            </div>
          </Section>
        </form>
      </DialogBody>

      <DialogFooter className="justify-between pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
        {category ? (
          <Button type="button" variant="ghost-destructive" disabled={busy} onClick={() => onDelete(category)}>
            <Trash2 />
            <span className="max-sm:sr-only">Delete</span>
          </Button>
        ) : (
          <span />
        )}
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button type="submit" form="category-form" disabled={busy}>
            {isSaving ? <Loader2 className="animate-spin" /> : <Check />}
            {isSaving ? 'Saving…' : isUploading ? 'Uploading…' : isEdit ? 'Save changes' : 'Add category'}
          </Button>
        </div>
      </DialogFooter>

      {/* Portrait, matching the store's category tiles. */}
      <CropDialog
        src={cropSrc}
        aspect={3 / 4}
        aspectLabel="3 : 4"
        zoomStep={0.1}
        sliderStep={0.01}
        tall
        onCancel={() => setCropSrc(null)}
        onConfirm={onCropConfirm}
      />
    </>
  );
}
