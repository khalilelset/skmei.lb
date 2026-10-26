'use client';

import { useId, useState, type ReactNode } from 'react';
import type { Area } from 'react-easy-crop';
import { Check, ImageOff, Link2, Loader2, Trash2, Upload, Video, X } from 'lucide-react';
import { CropDialog } from '@/components/admin/CropDialog';
import { Field, SafeImg, UploadTile, readAsDataUrl, uploadImage } from '@/components/admin/media';
import { Button } from '@/components/admin/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { Input, Textarea } from '@/components/admin/ui/input';
import { Segmented } from '@/components/admin/ui/segmented';
import { toast } from '@/components/admin/ui/sonner';
import { getCroppedImg } from '@/lib/cropImage';
import { uploadVideoDirectly } from '@/lib/uploadVideo';
import { cn } from '@/lib/utils';
import { POST_TYPES, TYPE_META, type InstagramPost, type PostType } from './model';

type VideoMode = 'upload' | 'url';

interface FormState {
  type: PostType;
  images: string[];
  videoSrc: string;
  postUrl: string;
  likes: string;
  comments: string;
  caption: string;
  sortOrder: string;
}

function formFrom(post: InstagramPost | null): FormState {
  return {
    type: post?.type ?? 'image',
    images: post?.images ?? [],
    videoSrc: post?.videoSrc ?? '',
    postUrl: post?.postUrl ?? '',
    likes: String(post?.likes ?? 0),
    comments: String(post?.comments ?? 0),
    caption: post?.caption ?? '',
    sortOrder: String(post?.sort_order ?? 0),
  };
}

export function InstagramEditor({
  open,
  onOpenChange,
  sessionKey,
  post,
  onSaved,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionKey: number;
  post: InstagramPost | null;
  onSaved: (edited: boolean) => void;
  onDelete: (post: InstagramPost) => void;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        onOpenAutoFocus={(e) => {
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        className={cn(
          'w-[min(820px,calc(100vw-32px))] max-h-[min(92dvh,900px)]',
          'max-sm:inset-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none',
        )}
      >
        <EditorForm key={sessionKey} post={post} onClose={() => onOpenChange(false)} onSaved={onSaved} onDelete={onDelete} />
      </DialogContent>
    </Dialog>
  );
}

function EditorForm({
  post,
  onClose,
  onSaved,
  onDelete,
}: {
  post: InstagramPost | null;
  onClose: () => void;
  onSaved: (edited: boolean) => void;
  onDelete: (post: InstagramPost) => void;
}) {
  const uid = useId();
  const [form, setForm] = useState<FormState>(() => formFrom(post));
  const [videoMode, setVideoMode] = useState<VideoMode>(post?.videoSrc ? 'url' : 'upload');
  const [touched, setTouched] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImg, setIsUploadingImg] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [cropQueue, setCropQueue] = useState<File[]>([]);

  const isEdit = !!post;
  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }));
  const isUploading = isUploadingImg || isUploadingVideo;
  const busy = isSaving || isUploading;
  const urlError = touched && !form.postUrl.trim() ? 'Enter the Instagram post link' : '';

  // Switching type starts the media over, like before.
  const changeType = (type: PostType) => {
    if (type === form.type) return;
    setForm((f) => ({ ...f, type, images: [], videoSrc: '' }));
  };

  // ---- images: pick → crop each (queue) → upload ----------------------------------------------
  const openCrop = async (file: File) => {
    try {
      setCropSrc(await readAsDataUrl(file));
    } catch {
      toast.error("Couldn't read that file");
      setCropQueue([]);
    }
  };

  const onImagesPicked = (files: FileList | null) => {
    const list = Array.from(files ?? []);
    if (!list.length) return;
    const [first, ...rest] = list;
    setCropQueue(rest);
    openCrop(first);
  };

  const cancelCrop = () => {
    setCropSrc(null);
    setCropQueue([]);
  };

  const onCropConfirm = async (area: Area) => {
    const src = cropSrc;
    if (!src) return;
    setCropSrc(null);
    setIsUploadingImg(true);
    try {
      const blob = await getCroppedImg(src, area);
      const url = await uploadImage(blob, 'image.jpg', { slug: 'instagram' });
      setForm((f) => ({ ...f, images: [...f.images, url] }));
      if (cropQueue.length > 0) {
        const [next, ...rest] = cropQueue;
        setCropQueue(rest);
        openCrop(next);
      }
    } catch (err) {
      setCropQueue([]);
      toast.error("Couldn't upload the image", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsUploadingImg(false);
    }
  };

  // ---- video ------------------------------------------------------------------------------------
  const onVideoPicked = async (file: File | undefined) => {
    if (!file) return;
    setIsUploadingVideo(true);
    try {
      const url = await uploadVideoDirectly(file, 'instagram/videos');
      set('videoSrc', url);
    } catch (err) {
      toast.error("Couldn't upload the video", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsUploadingVideo(false);
    }
  };

  // ---- save -------------------------------------------------------------------------------------
  const save = async () => {
    setTouched(true);
    if (!form.postUrl.trim()) return;
    const payload = {
      type: form.type,
      images: form.images,
      videoSrc: form.videoSrc || null,
      postUrl: form.postUrl,
      likes: Number(form.likes),
      comments: Number(form.comments),
      caption: form.caption,
      sort_order: Number(form.sortOrder),
    };
    setIsSaving(true);
    try {
      const res = await fetch(isEdit ? `/api/admin/instagram/${post.id}` : '/api/admin/instagram', {
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
      toast.error(isEdit ? "Couldn't save your changes" : "Couldn't add the post", {
        description: err instanceof Error ? err.message : undefined,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const imgFileId = `${uid}-img`;
  const videoFileId = `${uid}-video`;
  const canAddImage = form.type === 'carousel' || form.images.length === 0;

  return (
    <>
      <DialogHeader>
        <DialogTitle>{isEdit ? 'Edit post' : 'Add Instagram post'}</DialogTitle>
        <DialogDescription>Shown in the Instagram section on the homepage.</DialogDescription>
      </DialogHeader>

      <DialogBody className="bg-adm-canvas px-4 py-4 sm:px-6 sm:py-5">
        <form
          id={`${uid}-form`}
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            if (!busy) save();
          }}
          className="grid gap-4"
        >
          {/* ---------- Type + media ---------- */}
          <Panel title="Post type & media">
            <div role="radiogroup" aria-label="Post type" className="mb-4 grid grid-cols-3 gap-2">
              {POST_TYPES.map((t) => {
                const m = TYPE_META[t];
                const active = form.type === t;
                return (
                  <button
                    key={t}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    disabled={isUploading}
                    onClick={() => changeType(t)}
                    className={cn(
                      'relative flex min-h-[52px] min-w-0 items-center gap-2.5 rounded-[12px] border px-3 py-2 text-left outline-none transition-[border-color,background-color,box-shadow] focus-visible:ring-[3px] focus-visible:ring-adm-accent/25 disabled:opacity-60',
                      active
                        ? 'border-adm-accent bg-adm-accent-soft/50 shadow-[0_0_0_1px_var(--color-adm-accent)]'
                        : 'border-adm-line-2 bg-adm-surface hover:border-[#D5CAC7] hover:bg-adm-surface-2',
                    )}
                  >
                    <span className={cn('grid size-8 shrink-0 place-items-center rounded-[9px] max-sm:hidden', m.tile)}>
                      <m.icon className="size-4" />
                    </span>
                    <span className="min-w-0 truncate text-[13.5px] font-semibold text-adm-ink max-sm:w-full max-sm:text-center">{m.label}</span>
                    {active && (
                      <span className="absolute right-1.5 top-1.5 grid size-4 place-items-center rounded-full bg-adm-accent text-white">
                        <Check className="size-3" strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {form.type !== 'video' ? (
              <>
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="text-[13px] font-semibold text-adm-ink-2">{form.type === 'carousel' ? 'Carousel images' : 'Image'}</span>
                  <span className="text-[12px] text-adm-muted">
                    {form.type === 'carousel' ? `${form.images.length} added · pick several at once` : 'Cropped square (1:1)'}
                  </span>
                </div>
                <input
                  id={imgFileId}
                  type="file"
                  accept="image/*"
                  multiple={form.type === 'carousel'}
                  disabled={isUploadingImg}
                  className="sr-only"
                  onChange={(e) => {
                    const files = e.target.files;
                    onImagesPicked(files);
                    e.target.value = '';
                  }}
                />
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                  {form.images.map((url, i) => (
                    <div key={`${url}-${i}`} className="relative aspect-square overflow-hidden rounded-[12px] bg-adm-surface-2 ring-1 ring-adm-line">
                      <SafeImg src={url} alt={`Image ${i + 1}`} className="size-full object-cover" fallback={<BrokenImage />} />
                      {form.type === 'carousel' && (
                        <span className="absolute bottom-1.5 left-1.5 rounded-full bg-black/55 px-1.5 font-adm-mono text-[11px] font-semibold text-white backdrop-blur">
                          {i + 1}
                        </span>
                      )}
                      <button
                        type="button"
                        aria-label={`Remove image ${i + 1}`}
                        onClick={() => set('images', form.images.filter((_, idx) => idx !== i))}
                        className="absolute right-0 top-0 grid size-10 place-items-center"
                      >
                        <span className="grid size-7 place-items-center rounded-full bg-black/55 text-white backdrop-blur transition-colors hover:bg-adm-accent">
                          <X className="size-4" />
                        </span>
                      </button>
                    </div>
                  ))}
                  {canAddImage && (
                    <UploadTile
                      htmlFor={imgFileId}
                      uploading={isUploadingImg}
                      title={form.images.length ? 'Add more' : 'Upload image'}
                      hint={form.images.length ? undefined : 'Square crop next'}
                      className="aspect-square"
                    />
                  )}
                </div>
              </>
            ) : (
              <>
                <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[13px] font-semibold text-adm-ink-2">Video</span>
                  <Segmented<VideoMode>
                    ariaLabel="Video source"
                    value={videoMode}
                    onChange={(m) => {
                      if (m === videoMode || isUploadingVideo) return;
                      setVideoMode(m);
                      set('videoSrc', '');
                    }}
                    options={[
                      { value: 'upload', label: 'Upload', icon: <Upload /> },
                      { value: 'url', label: 'URL', icon: <Link2 /> },
                    ]}
                  />
                </div>

                {videoMode === 'url' ? (
                  <div className="relative">
                    <Link2 className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-adm-muted" />
                    <Input
                      aria-label="Video URL"
                      value={form.videoSrc}
                      onChange={(e) => set('videoSrc', e.target.value)}
                      placeholder="https://... direct video URL"
                      className="pl-9 pr-10"
                    />
                    {form.videoSrc && (
                      <button
                        type="button"
                        aria-label="Clear video URL"
                        onClick={() => set('videoSrc', '')}
                        className="absolute right-1 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-[8px] text-adm-muted hover:text-adm-ink"
                      >
                        <X className="size-4" />
                      </button>
                    )}
                  </div>
                ) : form.videoSrc ? (
                  <div className="flex items-center gap-2.5 rounded-[12px] border border-adm-line bg-adm-surface-2 py-1.5 pl-3 pr-1.5">
                    <Video className="size-5 shrink-0 text-adm-accent" />
                    <span className="flex-1 truncate text-[13.5px] font-medium">Video uploaded</span>
                    <Check className="size-4 text-[#16A34A]" />
                    <Button type="button" variant="ghost" size="icon" aria-label="Remove video" onClick={() => set('videoSrc', '')}>
                      <X />
                    </Button>
                  </div>
                ) : (
                  <>
                    <input
                      id={videoFileId}
                      type="file"
                      accept="video/*"
                      disabled={isUploadingVideo}
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        e.target.value = '';
                        onVideoPicked(file);
                      }}
                    />
                    <UploadTile htmlFor={videoFileId} uploading={isUploadingVideo} icon={<Video />} title="Upload video" hint="MP4 or MOV, sent straight to storage" className="py-7" />
                  </>
                )}

                {form.videoSrc && (
                  <div className="relative mt-3 aspect-square w-full max-w-[320px] overflow-hidden rounded-[12px] bg-black ring-1 ring-adm-line">
                    <video key={form.videoSrc} src={form.videoSrc} controls muted playsInline className="absolute inset-0 size-full object-contain" />
                  </div>
                )}
              </>
            )}
          </Panel>

          {/* ---------- Details ---------- */}
          <Panel title="Post details">
            <div className="grid gap-4">
              <Field label="Post URL" htmlFor={`${uid}-url`} required error={urlError}>
                <Input
                  id={`${uid}-url`}
                  type="url"
                  inputMode="url"
                  value={form.postUrl}
                  onChange={(e) => set('postUrl', e.target.value)}
                  placeholder="https://www.instagram.com/p/..."
                  aria-invalid={!!urlError || undefined}
                />
              </Field>
              <Field label="Caption" htmlFor={`${uid}-caption`}>
                <Textarea id={`${uid}-caption`} rows={2} value={form.caption} onChange={(e) => set('caption', e.target.value)} />
              </Field>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Likes" htmlFor={`${uid}-likes`}>
                  <Input id={`${uid}-likes`} type="number" inputMode="numeric" min={0} value={form.likes} onChange={(e) => set('likes', e.target.value)} className="tabular-nums" />
                </Field>
                <Field label="Comments" htmlFor={`${uid}-comments`}>
                  <Input id={`${uid}-comments`} type="number" inputMode="numeric" min={0} value={form.comments} onChange={(e) => set('comments', e.target.value)} className="tabular-nums" />
                </Field>
                <Field label="Sort order" htmlFor={`${uid}-order`} hint="Lower = first">
                  <Input id={`${uid}-order`} type="number" inputMode="numeric" min={0} value={form.sortOrder} onChange={(e) => set('sortOrder', e.target.value)} className="tabular-nums" />
                </Field>
              </div>
            </div>
          </Panel>
        </form>
      </DialogBody>

      <DialogFooter className="pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
        {isEdit && (
          <Button variant="ghost-destructive" className="mr-auto" disabled={busy} onClick={() => onDelete(post)}>
            <Trash2 />
            Delete
          </Button>
        )}
        <Button variant="outline" disabled={isSaving} onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" form={`${uid}-form`} disabled={busy || !form.postUrl}>
          {isSaving && <Loader2 className="animate-spin" />}
          {isSaving ? 'Saving…' : isEdit ? 'Save changes' : 'Add post'}
        </Button>
      </DialogFooter>

      <CropDialog src={cropSrc} remaining={cropQueue.length} onCancel={cancelCrop} onConfirm={onCropConfirm} />
    </>
  );
}

function Panel({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="min-w-0 rounded-[16px] bg-adm-surface p-4 shadow-adm-md sm:p-5">
      <h3 className="mb-3.5 font-adm-display text-[15px] font-bold tracking-[-0.01em] text-adm-ink">{title}</h3>
      {children}
    </section>
  );
}

function BrokenImage() {
  return (
    <span className="flex size-full flex-col items-center justify-center gap-1 px-2 text-center text-[11.5px] font-semibold text-adm-muted">
      <ImageOff className="size-5 text-adm-faint" />
      Can&apos;t load
    </span>
  );
}
