'use client';

import { useId, useState } from 'react';
import type { Area } from 'react-easy-crop';
import { ImageOff, Loader2, RefreshCw, Trash2, X } from 'lucide-react';
import { CropDialog } from '@/components/admin/CropDialog';
import { Field, SafeImg, UploadTile, readAsDataUrl, uploadImage } from '@/components/admin/media';
import { Button, buttonVariants } from '@/components/admin/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { Input } from '@/components/admin/ui/input';
import { toast } from '@/components/admin/ui/sonner';
import { getCroppedImg } from '@/lib/cropImage';
import { cn } from '@/lib/utils';

export interface FeedbackImage {
  id: string;
  image: string;
  alt: string;
  sort_order: number;
  created_at: string;
}

export function FeedbackEditor({
  open,
  onOpenChange,
  sessionKey,
  item,
  onSaved,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionKey: number;
  item: FeedbackImage | null;
  onSaved: (edited: boolean) => void;
  onDelete: (item: FeedbackImage) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        className={cn(
          'w-[min(720px,calc(100vw-32px))]',
          'max-sm:inset-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none',
        )}
      >
        <EditorForm key={sessionKey} item={item} onClose={() => onOpenChange(false)} onSaved={onSaved} onDelete={onDelete} />
      </DialogContent>
    </Dialog>
  );
}

function EditorForm({
  item,
  onClose,
  onSaved,
  onDelete,
}: {
  item: FeedbackImage | null;
  onClose: () => void;
  onSaved: (edited: boolean) => void;
  onDelete: (item: FeedbackImage) => void;
}) {
  const uid = useId();
  const [image, setImage] = useState(item?.image ?? '');
  const [alt, setAlt] = useState(item?.alt ?? '');
  const [sortOrder, setSortOrder] = useState(String(item?.sort_order ?? 0));
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const isEdit = !!item;
  const fileId = `${uid}-file`;

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    try {
      setCropSrc(await readAsDataUrl(file));
    } catch {
      toast.error("Couldn't read that file");
    }
  };

  const onCropConfirm = async (area: Area) => {
    const src = cropSrc;
    if (!src) return;
    setCropSrc(null);
    setIsUploading(true);
    try {
      const blob = await getCroppedImg(src, area);
      setImage(await uploadImage(blob, 'feedback.jpg', { slug: 'feedback' }));
    } catch (err) {
      toast.error("Couldn't upload the photo", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsUploading(false);
    }
  };

  const save = async () => {
    if (!image) return;
    const payload = { image, alt, sort_order: Number(sortOrder) || 0 };
    setIsSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/feedback/${item.id}` : '/api/admin/feedback', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      onSaved(isEdit);
    } catch (err) {
      toast.error(isEdit ? "Couldn't save your changes" : "Couldn't add the image", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const busy = isSaving || isUploading;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit image' : 'Add feedback image'}</DialogTitle>
        <DialogDescription>Customer photos shown in the feedback section on the homepage.</DialogDescription>
      </DialogHeader>

      <DialogBody className="bg-adm-canvas px-4 py-4 sm:px-6 sm:py-5">
        <form
          id={`${uid}-form`}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy && image) save();
          }}
          className="grid gap-4 sm:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]"
        >
          <section className="min-w-0 rounded-[16px] bg-adm-surface p-4 shadow-adm-md sm:p-5">
            <h3 className="mb-3 font-adm-display text-[15px] font-bold tracking-[-0.01em]">
              Photo <span className="text-adm-accent">*</span>
            </h3>
            <input
              id={fileId}
              type="file"
              accept="image/*"
              disabled={isUploading}
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = '';
                onFile(file);
              }}
            />
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[14px]">
              {image ? (
                <div className="relative size-full bg-adm-surface-2">
                  <SafeImg
                    src={image}
                    alt="Preview"
                    className="size-full object-cover"
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
                    aria-label="Remove photo"
                    disabled={isUploading}
                    onClick={() => setImage('')}
                    className="absolute right-0 top-0 grid size-11 place-items-center"
                  >
                    <span className="grid size-8 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-adm-accent">
                      <X className="size-4" />
                    </span>
                  </button>
                  {isUploading && (
                    <div className="absolute inset-0 grid place-items-center bg-adm-surface/80 backdrop-blur-[2px]">
                      <Loader2 className="size-7 animate-spin text-adm-accent" />
                    </div>
                  )}
                </div>
              ) : (
                <UploadTile htmlFor={fileId} uploading={isUploading} title="Upload photo" hint="You'll crop it to 4:3 next" className="size-full" />
              )}
            </div>
            {image && (
              <label
                htmlFor={fileId}
                aria-disabled={isUploading}
                className={cn(buttonVariants({ variant: 'outline' }), 'mt-3 w-full cursor-pointer', isUploading && 'pointer-events-none opacity-50')}
              >
                <RefreshCw />
                Replace photo
              </label>
            )}
          </section>

          <section className="flex min-w-0 flex-col gap-4 rounded-[16px] bg-adm-surface p-4 shadow-adm-md sm:p-5">
            <h3 className="font-adm-display text-[15px] font-bold tracking-[-0.01em]">Details</h3>
            <Field label="Alt text" htmlFor={`${uid}-alt`} hint="Describe the image for screen readers and search engines.">
              <Input id={`${uid}-alt`} value={alt} onChange={(e) => setAlt(e.target.value)} placeholder="e.g. Customer wearing a black SKMEI watch" />
            </Field>
            <Field label="Sort order" htmlFor={`${uid}-order`} hint="Lower numbers appear first.">
              <Input
                id={`${uid}-order`}
                type="number"
                inputMode="numeric"
                min={0}
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="w-32 tabular-nums"
              />
            </Field>
          </section>
        </form>
      </DialogBody>

      <DialogFooter className="pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
        {isEdit && (
          <Button variant="ghost-destructive" className="mr-auto" disabled={busy} onClick={() => onDelete(item)}>
            <Trash2 />
            Delete
          </Button>
        )}
        <Button variant="outline" disabled={isSaving} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form={`${uid}-form`} disabled={busy || !image}>
          {isSaving && <Loader2 className="animate-spin" />}
          {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add image'}
        </Button>
      </DialogFooter>

      {/* 4:3 to match the homepage feedback tiles. */}
      <CropDialog src={cropSrc} aspect={4 / 3} aspectLabel="4 : 3" onCancel={() => setCropSrc(null)} onConfirm={onCropConfirm} />
    </>
  );
}
