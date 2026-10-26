'use client';

import * as React from 'react';
import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CircleCheck,
  ExternalLink,
  Film,
  ImageOff,
  Link2,
  Loader2,
  Pipette,
  RefreshCw,
  Star,
  Trash2,
  Upload,
  X,
} from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/admin/ui/dropdown-menu';
import { Input } from '@/components/admin/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/admin/ui/popover';
import { Segmented } from '@/components/admin/ui/segmented';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/admin/ui/tooltip';
import { cn } from '@/lib/utils';
import { uploadTile } from './fields';
import { COLOR_PRESETS, fileLabel, type VariantForm, type VideoMode } from './model';
import { SafeImg } from './SafeImg';

const HEX_RE = /^#[0-9a-f]{6}$/i;

/* ------------------------------------------------------------------ */
/* Video: upload straight to R2, or paste a URL                        */
/* ------------------------------------------------------------------ */

export function VideoField({
  idPrefix,
  mode,
  url,
  uploading,
  onModeChange,
  onUrlChange,
  onFile,
}: {
  idPrefix: string;
  mode: VideoMode;
  url: string;
  uploading: boolean;
  /** Switching the source clears the current video (same as before). */
  onModeChange: (mode: VideoMode) => void;
  onUrlChange: (url: string) => void;
  onFile: (file: File) => void;
}) {
  const fileInput = (
    <input
      type="file"
      accept="video/*"
      disabled={uploading}
      className="sr-only"
      onChange={(e) => {
        const file = e.target.files?.[0];
        e.target.value = '';
        if (file) onFile(file);
      }}
    />
  );

  return (
    <div className="min-w-0">
      <Segmented
        ariaLabel="Video source"
        value={mode}
        onChange={(v) => {
          if (v !== mode) onModeChange(v);
        }}
        options={[
          { value: 'upload', label: 'Upload', icon: <Upload /> },
          { value: 'url', label: 'URL', icon: <Link2 /> },
        ]}
        className="mb-2.5 max-sm:[&_[role=tab]]:h-9"
      />

      {mode === 'url' ? (
        <div className="flex flex-col gap-1.5">
          <Input
            id={`${idPrefix}-video-url`}
            type="url"
            inputMode="url"
            aria-label="Video URL"
            placeholder="https://... direct video URL"
            value={url}
            onChange={(e) => onUrlChange(e.target.value)}
          />
          {url && (
            <p className="flex min-w-0 items-center gap-1.5 text-[12px] font-semibold text-[#15803D]">
              <CircleCheck className="size-3.5 shrink-0" />
              Video URL set
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="ml-1 inline-flex min-h-9 items-center gap-1 font-medium text-adm-muted underline-offset-2 hover:text-adm-ink hover:underline"
              >
                Open
                <ExternalLink className="size-3" />
              </a>
            </p>
          )}
        </div>
      ) : url ? (
        <div className="flex min-w-0 items-center gap-2 rounded-[12px] border border-[#C9EBD3] bg-[#F3FBF5] py-1.5 pl-3 pr-1.5">
          {uploading ? <Loader2 className="size-4 shrink-0 animate-spin text-adm-accent" /> : <CircleCheck className="size-4 shrink-0 text-[#16A34A]" />}
          <div className="min-w-0 flex-1">
            <b className="block text-[12.5px] text-[#15803D]">{uploading ? 'Uploading new video...' : 'Video ready'}</b>
            <span className="block truncate font-adm-mono text-[11px] text-adm-muted">{fileLabel(url)}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className="text-adm-muted">
                <a href={url} target="_blank" rel="noreferrer" aria-label="Open video">
                  <ExternalLink />
                </a>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Open video</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button asChild variant="ghost" size="icon" className={cn('text-adm-muted', uploading && 'pointer-events-none opacity-50')}>
                <label aria-label="Replace video" className="cursor-pointer">
                  <RefreshCw />
                  {fileInput}
                </label>
              </Button>
            </TooltipTrigger>
            <TooltipContent>Replace video</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost-destructive" size="icon" aria-label="Remove video" disabled={uploading} onClick={() => onUrlChange('')}>
                <X />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Remove video</TooltipContent>
          </Tooltip>
        </div>
      ) : (
        <label
          className={cn(
            uploadTile,
            'h-[88px] w-full',
            uploading
              ? 'cursor-default border-adm-line text-adm-faint'
              : 'cursor-pointer border-adm-line-2 text-adm-muted hover:border-adm-accent hover:bg-adm-accent-soft/40 hover:text-adm-accent-hover',
          )}
        >
          {uploading ? (
            <>
              <Loader2 className="size-5 animate-spin text-adm-accent" />
              Uploading video...
            </>
          ) : (
            <>
              <Film className="size-5" />
              Upload video
            </>
          )}
          {fileInput}
        </label>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Color swatch + preset palette                                        */
/* ------------------------------------------------------------------ */

function ColorPicker({ variant, onPick }: { variant: VariantForm; onPick: (patch: Partial<VariantForm>) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <button
              type="button"
              aria-label={`Choose color${variant.colorName ? ` (now ${variant.colorName})` : ''}`}
              className="group/sw relative grid size-10 shrink-0 place-items-center rounded-full outline-none focus-visible:ring-[3px] focus-visible:ring-adm-accent/30"
            >
              <span
                className="size-9 rounded-full transition-transform duration-200 ease-adm-spring group-hover/sw:scale-105"
                style={{ background: variant.colorHex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.14), 0 2px 6px rgba(0,0,0,.14)' }}
              />
              <span className="absolute -bottom-0.5 -right-0.5 grid size-[18px] place-items-center rounded-full bg-adm-surface text-adm-ink-2 shadow-adm-sm [&_svg]:size-2.5">
                <Pipette />
              </span>
            </button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Choose color</TooltipContent>
      </Tooltip>
      <PopoverContent className="w-[min(316px,calc(100vw-32px))] p-3">
        <div className="mb-2 text-[12px] font-semibold text-adm-ink-2">Pick a color</div>
        <div className="grid grid-cols-6 gap-1.5">
          {COLOR_PRESETS.map((c) => {
            const active = variant.colorHex.toLowerCase() === c.hex.toLowerCase();
            return (
              <Tooltip key={c.name}>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    aria-label={c.name}
                    aria-pressed={active}
                    onClick={() => {
                      // Same rule as before: set the hex, keep a typed name, otherwise use the preset's name.
                      onPick({ colorHex: c.hex, colorName: variant.colorName || c.name });
                      setOpen(false);
                    }}
                    className="group/p grid size-10 place-items-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-adm-accent/40"
                  >
                    <span
                      className="grid size-[30px] place-items-center rounded-full transition-transform duration-150 group-hover/p:scale-110"
                      style={{
                        background: c.hex,
                        boxShadow: active ? `0 0 0 2px #fff, 0 0 0 4px #DC2626` : 'inset 0 0 0 1px rgba(0,0,0,.14), 0 1px 4px rgba(0,0,0,.12)',
                      }}
                    >
                      {active && <Check className="size-3.5 text-white drop-shadow-[0_1px_1px_rgba(0,0,0,.6)]" strokeWidth={3} />}
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent>{c.name}</TooltipContent>
              </Tooltip>
            );
          })}
        </div>
        <label className="mt-3 flex min-h-9 cursor-pointer items-center gap-2.5 border-t border-adm-line pt-3 text-[12.5px] font-semibold text-adm-ink-2">
          <input
            type="color"
            value={HEX_RE.test(variant.colorHex) ? variant.colorHex : '#000000'}
            onChange={(e) => onPick({ colorHex: e.target.value })}
            className="size-8 shrink-0 cursor-pointer rounded-[8px] border border-adm-line-2 bg-transparent p-0.5"
          />
          Custom color
          <span className="ml-auto font-adm-mono text-[11.5px] font-medium uppercase text-adm-muted">{variant.colorHex}</span>
        </label>
      </PopoverContent>
    </Popover>
  );
}

/* ------------------------------------------------------------------ */
/* One color variant: color, photos, video                              */
/* ------------------------------------------------------------------ */

export function VariantCard({
  variant,
  index,
  imagesUploading,
  imagesLocked,
  videoUploading,
  onChange,
  onRemove,
  onPickImages,
  onMoveImage,
  onRemoveImage,
  onVideoFile,
}: {
  variant: VariantForm;
  index: number;
  /** A cropped image for THIS variant is uploading. */
  imagesUploading: boolean;
  /** Any crop/upload is in progress (the old page blocked every Upload button meanwhile). */
  imagesLocked: boolean;
  videoUploading: boolean;
  onChange: (patch: Partial<VariantForm>) => void;
  onRemove: () => void;
  onPickImages: (files: File[]) => void;
  onMoveImage: (from: number, to: number) => void;
  onRemoveImage: (index: number) => void;
  onVideoFile: (file: File) => void;
}) {
  const label = variant.colorName || `Color ${index + 1}`;
  return (
    <div className="min-w-0 rounded-[14px] border border-adm-line bg-adm-surface p-3 shadow-adm-sm sm:p-4">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <ColorPicker variant={variant} onPick={onChange} />
        <Input
          id={`sv-variant-${variant.id}-name`}
          aria-label={`Color ${index + 1} name`}
          placeholder="Color name, e.g. Black"
          value={variant.colorName}
          onChange={(e) => onChange({ colorName: e.target.value })}
          className="min-w-0 flex-1"
        />
        <Tooltip>
          <TooltipTrigger asChild>
            {/* Locked while this color's photo or video uploads, or the finished upload would have nowhere to go. */}
            <Button variant="ghost-destructive" size="icon" aria-label={`Remove ${label}`} disabled={imagesUploading || videoUploading} onClick={onRemove}>
              <Trash2 />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove this color</TooltipContent>
        </Tooltip>
      </div>

      <div className="mt-4">
        <div className="mb-2 flex items-baseline justify-between gap-2 text-[12.5px] font-semibold text-adm-ink-2">
          <span>
            Photos <span className="font-normal text-adm-muted">({variant.images.length})</span>
          </span>
          <span className="text-[11.5px] font-normal text-adm-muted">Cropped square · first is the main one</span>
        </div>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(76px,1fr))] gap-2">
          {variant.images.map((url, i) => (
            <div key={`${url}-${i}`} className="group/img relative aspect-square overflow-hidden rounded-[12px] border border-adm-line bg-adm-surface-2">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    aria-label={`${label} photo ${i + 1} options`}
                    className="block size-full outline-none focus-visible:ring-[3px] focus-visible:ring-inset focus-visible:ring-adm-accent/40"
                  >
                    <SafeImg
                      src={url}
                      alt={`${label} photo ${i + 1}`}
                      className="size-full object-cover transition-transform duration-300 group-hover/img:scale-[1.04]"
                      fallback={
                        <span className="flex size-full flex-col items-center justify-center gap-1 px-1 pb-3 text-center text-[10px] font-semibold leading-tight text-adm-muted">
                          <ImageOff className="size-4 text-adm-faint" />
                          Can&apos;t load
                        </span>
                      }
                    />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                  {i > 0 && (
                    <DropdownMenuItem onSelect={() => onMoveImage(i, 0)}>
                      <Star />
                      Make main photo
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem disabled={i === 0} onSelect={() => onMoveImage(i, i - 1)}>
                    <ArrowLeft />
                    Move left
                  </DropdownMenuItem>
                  <DropdownMenuItem disabled={i === variant.images.length - 1} onSelect={() => onMoveImage(i, i + 1)}>
                    <ArrowRight />
                    Move right
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem destructive onSelect={() => onRemoveImage(i)}>
                    <Trash2 />
                    Remove
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {i === 0 && (
                <span className="pointer-events-none absolute bottom-1 left-1 rounded-[6px] bg-adm-side/80 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-[.06em] text-white backdrop-blur">
                  Main
                </span>
              )}
              <button
                type="button"
                aria-label={`Remove ${label} photo ${i + 1}`}
                onClick={() => onRemoveImage(i)}
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
              'aspect-square text-center text-[11.5px]',
              imagesLocked
                ? 'cursor-default border-adm-line text-adm-faint'
                : 'cursor-pointer border-adm-line-2 text-adm-muted hover:border-adm-accent hover:bg-adm-accent-soft/40 hover:text-adm-accent-hover',
            )}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              disabled={imagesLocked}
              aria-label={`Upload photos for ${label}`}
              className="sr-only"
              onChange={(e) => {
                const files = Array.from(e.target.files ?? []);
                e.target.value = '';
                onPickImages(files);
              }}
            />
            {imagesUploading ? (
              <Loader2 className="size-5 animate-spin text-adm-accent" />
            ) : (
              <>
                <Upload className="size-5" />
                Upload
              </>
            )}
          </label>
        </div>
      </div>

      <div className="mt-4 border-t border-adm-line pt-3.5">
        <div className="mb-2 text-[12.5px] font-semibold text-adm-ink-2">
          Video <span className="font-normal text-adm-muted">(optional)</span>
        </div>
        <VideoField
          idPrefix={`sv-variant-${variant.id}`}
          mode={variant.videoInputMode}
          url={variant.videoUrl}
          uploading={videoUploading}
          onModeChange={(m) => onChange({ videoInputMode: m, videoUrl: '' })}
          onUrlChange={(u) => onChange({ videoUrl: u })}
          onFile={onVideoFile}
        />
      </div>
    </div>
  );
}

/** Row of color dots used in the list (table + phone cards). */
export function Swatches({ variants, max = 6, className }: { variants: { id: string; colorName: string; colorHex: string }[]; max?: number; className?: string }) {
  if (variants.length === 0) return <span className={cn('text-[12px] text-adm-faint', className)}>No colors</span>;
  const shown = variants.slice(0, max);
  const rest = variants.length - shown.length;
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {shown.map((v) => (
        <Tooltip key={v.id}>
          <TooltipTrigger asChild>
            <span
              aria-label={v.colorName || v.colorHex}
              className="inline-block size-[18px] rounded-full"
              style={{ background: v.colorHex, boxShadow: 'inset 0 0 0 1px rgba(0,0,0,.15)' }}
            />
          </TooltipTrigger>
          <TooltipContent>{v.colorName || v.colorHex}</TooltipContent>
        </Tooltip>
      ))}
      {rest > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="ml-0.5 rounded-full text-[11.5px] font-semibold text-adm-muted outline-none focus-visible:ring-2 focus-visible:ring-adm-accent/40">
              +{rest}
            </span>
          </TooltipTrigger>
          <TooltipContent>
            {variants
              .slice(max)
              .map((v) => v.colorName || v.colorHex)
              .join(', ')}
          </TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}
