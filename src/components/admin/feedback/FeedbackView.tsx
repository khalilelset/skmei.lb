'use client';

import { useCallback, useEffect, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ImageOff, ImagePlus, Pencil, Plus, RotateCw, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { SafeImg } from '@/components/admin/media';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/admin/ui/alert-dialog';
import { Button } from '@/components/admin/ui/button';
import { Card } from '@/components/admin/ui/card';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/admin/ui/tooltip';
import { toast } from '@/components/admin/ui/sonner';
import { FeedbackEditor, type FeedbackImage } from './FeedbackEditor';

const EASE = [0.2, 0.8, 0.2, 1] as const;

function fmtDay(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

export function FeedbackView() {
  const reduce = useReducedMotion();
  const [items, setItems] = useState<FeedbackImage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [editing, setEditing] = useState<FeedbackImage | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<FeedbackImage | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Comes back sorted by sort_order, the same order the homepage uses.
  const load = useCallback(() => {
    fetch('/api/admin/feedback')
      .then((r) => r.json())
      .then((data) => {
        const ok = Array.isArray(data);
        if (ok) setItems(data);
        setLoadFailed(!ok);
        setIsLoading(false);
      })
      .catch(() => {
        setLoadFailed(true);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setLoadFailed(false);
    setIsLoading(true);
    load();
  };

  const openEditor = (item: FeedbackImage | null) => {
    setEditing(item);
    setEditorKey((k) => k + 1);
    setEditorOpen(true);
  };

  const handleSaved = (edited: boolean) => {
    setEditorOpen(false);
    toast.success(edited ? 'Image saved' : 'Image added', { description: 'The homepage shows the change right away.' });
    load();
  };

  const askDelete = (item: FeedbackImage) => {
    setDeleteTarget(item);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setIsDeleting(true);
    let ok = false;
    try {
      ok = (await fetch(`/api/admin/feedback/${target.id}`, { method: 'DELETE' })).ok;
    } catch {
      ok = false;
    }
    setIsDeleting(false);
    if (ok) {
      setDeleteOpen(false);
      setEditorOpen(false);
      toast.success('Image deleted');
    } else {
      toast.error("Couldn't delete the image", { description: 'Try again in a moment.' });
    }
    load();
  };

  const showError = loadFailed && !isLoading && items.length === 0;

  return (
    <>
      <PageHeader
        title="Feedback images"
        description={
          isLoading || showError
            ? 'Customer feedback photos shown on the homepage.'
            : `Customer feedback photos shown on the homepage · ${items.length} image${items.length === 1 ? '' : 's'}, sorted by order.`
        }
        actions={
          <Button onClick={() => openEditor(null)}>
            <Plus />
            Add image
          </Button>
        }
      />

      {showError && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <b className="font-adm-display text-[15px]">Couldn&apos;t load feedback images</b>
            <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
          </div>
          <Button variant="outline" onClick={retry}>
            <RotateCw />
            Try again
          </Button>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" aria-hidden>
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="aspect-[4/3] w-full rounded-none" />
              <div className="space-y-2 p-3.5">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </Card>
          ))}
        </div>
      ) : !showError && items.length === 0 ? (
        <Card className="flex flex-col items-center px-6 py-14 text-center">
          <span className="grid size-14 place-items-center rounded-full bg-adm-accent-soft text-adm-accent-hover">
            <ImagePlus className="size-6" />
          </span>
          <b className="mt-4 font-adm-display text-[16px]">No feedback images yet</b>
          <p className="mt-1 max-w-[340px] text-[13.5px] text-adm-muted">Add photos customers sent you. They show up in the feedback section on the homepage.</p>
          <Button className="mt-5" onClick={() => openEditor(null)}>
            <Plus />
            Add image
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
          {items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.05 + Math.min(i, 12) * 0.04, ease: EASE }}
            >
              <Card className="group relative overflow-hidden transition-shadow hover:shadow-adm-lg">
                <button
                  type="button"
                  onClick={() => openEditor(item)}
                  aria-label={`Edit image ${item.alt || i + 1}`}
                  className="absolute inset-0 z-[1] rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-adm-accent"
                />
                <div className="relative aspect-[4/3] overflow-hidden bg-adm-surface-2">
                  {item.image ? (
                    <SafeImg
                      src={item.image}
                      alt={item.alt}
                      loading="lazy"
                      className="size-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                      fallback={<NoImage />}
                    />
                  ) : (
                    <NoImage />
                  )}
                  <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2 py-0.5 font-adm-mono text-[11px] font-semibold text-white backdrop-blur">
                    #{item.sort_order}
                  </span>
                  <div className="absolute right-2 top-2 z-[2] flex gap-1 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
                    <OverlayAction label="Edit image" onClick={() => openEditor(item)}>
                      <Pencil />
                    </OverlayAction>
                    <OverlayAction label="Delete image" destructive onClick={() => askDelete(item)}>
                      <Trash2 />
                    </OverlayAction>
                  </div>
                </div>
                <div className="px-3.5 py-3">
                  <p className={item.alt ? 'truncate text-[13.5px] font-semibold text-adm-ink' : 'truncate text-[13px] italic text-adm-faint'}>
                    {item.alt || '(no alt text)'}
                  </p>
                  <p className="mt-0.5 text-[12px] text-adm-muted">Added {fmtDay(item.created_at)}</p>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      <FeedbackEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        sessionKey={editorKey}
        item={editing}
        onSaved={handleSaved}
        onDelete={askDelete}
      />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!isDeleting) setDeleteOpen(o);
        }}
      >
        <AlertDialogContent className="border-t-[3px] border-adm-accent">
          <AlertDialogTitle>Delete this feedback image?</AlertDialogTitle>
          <AlertDialogDescription>It will be removed from the homepage. This cannot be undone.</AlertDialogDescription>
          {deleteTarget?.image && (
            <div className="mt-4 aspect-[4/3] w-40 overflow-hidden rounded-[12px] bg-adm-surface-2 ring-1 ring-adm-line">
              <SafeImg src={deleteTarget.image} alt="" className="size-full object-cover" fallback={<NoImage />} />
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              destructive
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                handleDelete();
              }}
            >
              <Trash2 />
              {isDeleting ? 'Deleting…' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function NoImage() {
  return (
    <span className="flex size-full flex-col items-center justify-center gap-1 text-[12px] font-semibold text-adm-faint">
      <ImageOff className="size-6" />
      No image
    </span>
  );
}

function OverlayAction({
  label,
  destructive,
  onClick,
  children,
}: {
  label: string;
  destructive?: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          aria-label={label}
          onClick={onClick}
          className={
            'grid size-9 place-items-center rounded-full bg-white/90 shadow-adm-sm backdrop-blur outline-none transition-colors focus-visible:ring-2 focus-visible:ring-adm-accent [&_svg]:size-4 ' +
            (destructive ? 'text-adm-accent-hover hover:bg-adm-accent hover:text-white' : 'text-adm-ink-2 hover:bg-white hover:text-adm-ink')
          }
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
