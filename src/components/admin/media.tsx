'use client';

import * as React from 'react';
import { Loader2, Upload } from 'lucide-react';
import { Label } from '@/components/admin/ui/label';
import { cn } from '@/lib/utils';

/**
 * <img> that swaps to `fallback` when the file can't load (e.g. old res.cloudinary.com links,
 * which now answer 401). Resets on its own when `src` changes.
 */
export function SafeImg({
  src,
  fallback,
  alt = '',
  ...props
}: Omit<React.ComponentProps<'img'>, 'src'> & { src: string; fallback: React.ReactNode }) {
  const [failedSrc, setFailedSrc] = React.useState<string | null>(null);
  if (failedSrc === src) return <>{fallback}</>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt={alt} onError={() => setFailedSrc(src)} {...props} />;
}

export function readAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

/** POSTs an image to /api/admin/upload and returns its public URL; throws with the server's message. */
export async function uploadImage(blob: Blob, filename: string, fields: Record<string, string>) {
  const fd = new FormData();
  fd.append('file', blob, filename);
  for (const [k, v] of Object.entries(fields)) fd.append(k, v);
  const res = await fetch('/api/admin/upload', { method: 'POST', body: fd });
  const data = (await res.json().catch(() => ({}))) as { url?: string; error?: string };
  if (!res.ok || !data.url) throw new Error(data.error ?? 'Upload failed — please try again.');
  return data.url;
}

/** Dashed drop-zone style tile. A <label> so the click stays a real user gesture (needed on iOS). */
export function UploadTile({
  htmlFor,
  uploading,
  title,
  hint,
  icon,
  className,
}: {
  htmlFor: string;
  uploading?: boolean;
  title: React.ReactNode;
  hint?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <label
      htmlFor={htmlFor}
      aria-disabled={uploading || undefined}
      className={cn(
        'flex flex-col items-center justify-center gap-2 rounded-[14px] border-2 border-dashed px-4 text-center text-[13px] font-semibold transition-colors',
        uploading
          ? 'pointer-events-none cursor-default border-adm-line text-adm-faint'
          : 'cursor-pointer border-adm-line-2 text-adm-muted hover:border-adm-accent hover:bg-adm-accent-soft/40 hover:text-adm-accent-hover',
        className,
      )}
    >
      {uploading ? (
        <>
          <Loader2 className="size-7 animate-spin text-adm-accent" />
          Uploading…
        </>
      ) : (
        <>
          <span className="grid size-12 place-items-center rounded-full bg-adm-surface-2 text-adm-accent-hover shadow-adm-sm [&_svg]:size-5">
            {icon ?? <Upload />}
          </span>
          {title}
          {hint && <span className="text-[12px] font-normal text-adm-muted">{hint}</span>}
        </>
      )}
    </label>
  );
}

export function Field({
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
      {error ? (
        <p className="text-[12px] font-medium text-adm-accent-hover">{error}</p>
      ) : hint ? (
        <p className="text-[12px] text-adm-muted">{hint}</p>
      ) : null}
    </div>
  );
}
