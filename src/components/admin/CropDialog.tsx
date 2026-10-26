'use client';

import 'react-easy-crop/react-easy-crop.css';
import { useEffect, useState } from 'react';
import Cropper from 'react-easy-crop';
import type { Area } from 'react-easy-crop';
import { Slider as SliderPrimitive } from 'radix-ui';
import { Loader2, Upload, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { cn } from '@/lib/utils';

export interface CropOptions {
  /** Width ÷ height of the crop box, e.g. 1, 3 / 4, 4 / 3. */
  aspect?: number;
  /** Badge shown on the image, e.g. "1 : 1". */
  aspectLabel?: string;
  /** How far the zoom buttons move; the slider moves in `sliderStep`. Zoom range is always 1–3×. */
  zoomStep?: number;
  sliderStep?: number;
  /** Taller stage for portrait crops. */
  tall?: boolean;
  /** Images still waiting after this one (multi-image uploads). */
  remaining?: number;
}

/**
 * Crop step shown on top of an editor before an image is uploaded.
 * `src` is a data URL; null closes the dialog.
 */
export function CropDialog({
  src,
  onCancel,
  onConfirm,
  ...options
}: CropOptions & {
  src: string | null;
  onCancel: () => void;
  onConfirm: (area: Area) => void;
}) {
  // Keep the last image on screen while the dialog animates out.
  const [shown, setShown] = useState(src);
  if (src && src !== shown) setShown(src);

  return (
    <Dialog
      open={!!src}
      onOpenChange={(o) => {
        if (!o) onCancel();
      }}
    >
      <DialogContent className="max-h-[calc(100dvh-24px)] w-[min(600px,calc(100vw-24px))]">
        <DialogHeader>
          <DialogTitle>Crop image</DialogTitle>
          <DialogDescription>Drag to reposition · scroll or use the slider to zoom</DialogDescription>
        </DialogHeader>
        {shown && <CropStage key={shown} src={shown} onCancel={onCancel} onConfirm={onConfirm} {...options} />}
      </DialogContent>
    </Dialog>
  );
}

function CropStage({
  src,
  onCancel,
  onConfirm,
  aspect = 1,
  aspectLabel = '1 : 1',
  zoomStep = 0.2,
  sliderStep = 0.05,
  tall = false,
  remaining = 0,
}: CropOptions & {
  src: string;
  onCancel: () => void;
  onConfirm: (area: Area) => void;
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [pixels, setPixels] = useState<Area | null>(null);
  // Mount the cropper after the dialog's zoom-in animation so it measures its real size.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 230);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <div className={cn('relative w-full shrink-0 bg-[#0a0a0a]', tall ? 'h-[min(460px,56dvh)]' : 'h-[min(400px,52dvh)]')}>
        {ready ? (
          <Cropper
            image={src}
            crop={crop}
            zoom={zoom}
            aspect={aspect}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_, areaPixels) => setPixels(areaPixels)}
            style={{ cropAreaStyle: { border: '2px solid #DC2626', boxShadow: '0 0 0 9999px rgba(0,0,0,0.6)' } }}
          />
        ) : (
          <div className="grid size-full place-items-center">
            <Loader2 className="size-6 animate-spin text-white/50" />
          </div>
        )}
        <span className="pointer-events-none absolute left-3 top-3 rounded-[8px] bg-adm-accent/85 px-2.5 py-1 text-[11px] font-bold tracking-[.1em] text-white backdrop-blur">
          {aspectLabel}
        </span>
      </div>

      <div className="flex items-center gap-3 border-t border-adm-line px-5 py-3.5 sm:px-6">
        <span className="w-10 shrink-0 text-xs font-semibold text-adm-muted">Zoom</span>
        <Button variant="outline" size="icon" aria-label="Zoom out" onClick={() => setZoom((z) => Math.max(1, z - zoomStep))}>
          <ZoomOut />
        </Button>
        <SliderPrimitive.Root
          value={[zoom]}
          min={1}
          max={3}
          step={sliderStep}
          onValueChange={([v]) => setZoom(v)}
          className="relative flex h-9 min-w-0 flex-1 touch-none select-none items-center"
        >
          <SliderPrimitive.Track className="relative h-1.5 grow overflow-hidden rounded-full bg-adm-line-2">
            <SliderPrimitive.Range className="absolute h-full rounded-full bg-adm-accent" />
          </SliderPrimitive.Track>
          <SliderPrimitive.Thumb
            aria-label="Zoom"
            className="block size-[18px] rounded-full border-2 border-white bg-adm-accent shadow-[0_2px_6px_rgba(220,38,38,.45)] outline-none transition-shadow focus-visible:ring-[4px] focus-visible:ring-adm-accent/25"
          />
        </SliderPrimitive.Root>
        <Button variant="outline" size="icon" aria-label="Zoom in" onClick={() => setZoom((z) => Math.min(3, z + zoomStep))}>
          <ZoomIn />
        </Button>
        <span className="w-9 shrink-0 text-right font-adm-mono text-xs font-bold tabular-nums text-adm-accent-hover">{zoom.toFixed(1)}×</span>
      </div>

      <DialogFooter className="pb-[calc(14px+env(safe-area-inset-bottom,0px))]">
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button disabled={!pixels} onClick={() => pixels && onConfirm(pixels)}>
          <Upload />
          {remaining > 0 ? `Crop & next (${remaining} left)` : 'Crop & upload'}
        </Button>
      </DialogFooter>
    </>
  );
}
