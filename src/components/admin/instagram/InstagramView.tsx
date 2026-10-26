'use client';

import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ExternalLink, Heart, ImageOff, LayoutGrid, MessageCircle, Pencil, Plus, RotateCw, Search, Trash2 } from 'lucide-react';
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
import { Badge } from '@/components/admin/ui/badge';
import { Button } from '@/components/admin/ui/button';
import { Card } from '@/components/admin/ui/card';
import { SearchInput } from '@/components/admin/ui/input';
import { Segmented, type SegmentedOption } from '@/components/admin/ui/segmented';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/admin/ui/tooltip';
import { toast } from '@/components/admin/ui/sonner';
import { cn } from '@/lib/utils';
import { InstagramEditor } from './InstagramEditor';
import { POST_TYPES, TYPE_META, matchesSearch, type InstagramPost, type PostType } from './model';

type Filter = 'all' | PostType;
const EASE = [0.2, 0.8, 0.2, 1] as const;
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export function InstagramView() {
  const reduce = useReducedMotion();
  const [posts, setPosts] = useState<InstagramPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [editing, setEditing] = useState<InstagramPost | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<InstagramPost | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Comes back sorted by sort_order, the same order the homepage uses.
  const load = useCallback(() => {
    fetch('/api/admin/instagram')
      .then((r) => r.json())
      .then((data) => {
        const ok = Array.isArray(data);
        if (ok) setPosts(data);
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

  const openEditor = (post: InstagramPost | null) => {
    setEditing(post);
    setEditorKey((k) => k + 1);
    setEditorOpen(true);
  };

  const handleSaved = (edited: boolean) => {
    setEditorOpen(false);
    toast.success(edited ? 'Post saved' : 'Post added');
    load();
  };

  const askDelete = (post: InstagramPost) => {
    setDeleteTarget(post);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setIsDeleting(true);
    let ok = false;
    try {
      ok = (await fetch(`/api/admin/instagram/${target.id}`, { method: 'DELETE' })).ok;
    } catch {
      ok = false;
    }
    setIsDeleting(false);
    if (ok) {
      setDeleteOpen(false);
      setEditorOpen(false);
      toast.success('Post deleted');
    } else {
      toast.error("Couldn't delete the post", { description: 'Try again in a moment.' });
    }
    load();
  };

  const counts = useMemo(() => {
    const c: Record<PostType, number> = { image: 0, carousel: 0, video: 0 };
    for (const p of posts) if (p.type in c) c[p.type]++;
    return c;
  }, [posts]);

  const visible = useMemo(() => posts.filter((p) => (filter === 'all' || p.type === filter) && matchesSearch(p, search)), [posts, filter, search]);

  const filterOptions: SegmentedOption<Filter>[] = [
    { value: 'all', label: 'All', icon: <LayoutGrid className="max-sm:hidden" />, count: isLoading ? undefined : posts.length },
    ...POST_TYPES.map((t) => {
      const Icon = TYPE_META[t].icon;
      return { value: t, label: TYPE_META[t].label, icon: <Icon className="max-sm:hidden" />, count: isLoading ? undefined : counts[t] };
    }),
  ];

  const showError = loadFailed && !isLoading && posts.length === 0;
  const filtersActive = filter !== 'all' || search.trim() !== '';

  return (
    <>
      <PageHeader
        title="Instagram feed"
        description={
          isLoading || showError
            ? 'Posts shown in the Instagram section on the homepage.'
            : `Posts shown in the Instagram section on the homepage · ${posts.length} post${posts.length === 1 ? '' : 's'}.`
        }
        actions={
          <Button onClick={() => openEditor(null)}>
            <Plus />
            Add post
          </Button>
        }
      />

      {showError ? (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <b className="font-adm-display text-[15px]">Couldn&apos;t load posts</b>
            <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
          </div>
          <Button variant="outline" onClick={retry}>
            <RotateCw />
            Try again
          </Button>
        </Card>
      ) : (
        <>
          <Card className="mb-4 flex flex-wrap items-center gap-3 px-4 py-3.5 sm:px-5">
            <SearchInput
              icon={<Search />}
              placeholder="Search captions or links..."
              aria-label="Search posts"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-[1_1_220px] sm:max-w-[340px]"
            />
            <Segmented ariaLabel="Filter posts by type" options={filterOptions} value={filter} onChange={setFilter} className="max-sm:[&_[role=tab]]:px-2" />
          </Card>

          {isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4" aria-hidden>
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="overflow-hidden">
                  <Skeleton className="aspect-square w-full rounded-none" />
                  <div className="space-y-2 p-3.5">
                    <Skeleton className="h-3.5 w-full" />
                    <Skeleton className="h-3 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : visible.length === 0 ? (
            <Card className="flex flex-col items-center px-6 py-14 text-center">
              <b className="font-adm-display text-[16px]">{filtersActive ? 'No posts found' : 'No posts yet'}</b>
              <p className="mt-1 max-w-[340px] text-[13.5px] text-adm-muted">
                {filtersActive ? 'Try a different search or type.' : 'Add a post to show it in the Instagram section on the homepage.'}
              </p>
              {filtersActive ? (
                <Button
                  variant="outline"
                  className="mt-5"
                  onClick={() => {
                    setFilter('all');
                    setSearch('');
                  }}
                >
                  Clear filters
                </Button>
              ) : (
                <Button className="mt-5" onClick={() => openEditor(null)}>
                  <Plus />
                  Add post
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 xl:grid-cols-4">
              {visible.map((post, i) => (
                <motion.div
                  key={post.id}
                  initial={reduce ? false : { opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.05 + Math.min(i, 12) * 0.04, ease: EASE }}
                >
                  <PostCard post={post} onEdit={() => openEditor(post)} onDelete={() => askDelete(post)} />
                </motion.div>
              ))}
            </div>
          )}
        </>
      )}

      <InstagramEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        sessionKey={editorKey}
        post={editing}
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
          <AlertDialogTitle>Delete this post?</AlertDialogTitle>
          <AlertDialogDescription>It will be removed from the Instagram section on the homepage. This cannot be undone.</AlertDialogDescription>
          {deleteTarget && (
            <div className="mt-4 flex items-center gap-3 rounded-[12px] bg-adm-surface-2 p-2.5 ring-1 ring-inset ring-adm-line">
              <span className="relative size-14 shrink-0 overflow-hidden rounded-[10px] bg-adm-canvas-2">
                <Preview post={deleteTarget} still />
              </span>
              <p className="line-clamp-2 min-w-0 text-[13px] text-adm-ink-2">{deleteTarget.caption || <i className="text-adm-faint">No caption</i>}</p>
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

function PostCard({ post, onEdit, onDelete }: { post: InstagramPost; onEdit: () => void; onDelete: () => void }) {
  const meta = TYPE_META[post.type] ?? TYPE_META.image;
  const Icon = meta.icon;
  return (
    <Card className="group relative flex h-full flex-col overflow-hidden transition-shadow hover:shadow-adm-lg">
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit post ${post.caption ? `“${post.caption.slice(0, 40)}”` : post.postUrl}`}
        className="absolute inset-0 z-[1] rounded-[18px] outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-adm-accent"
      />
      <div className="relative aspect-square overflow-hidden bg-adm-surface-2">
        <Preview post={post} />
        <Badge tone={meta.tone} className="absolute left-2.5 top-2.5 shadow-adm-sm">
          <Icon />
          {meta.label}
          {post.type === 'carousel' && post.images.length > 0 && <span className="font-adm-mono text-[11px]">· {post.images.length}</span>}
        </Badge>
        <span className="absolute bottom-2.5 left-2.5 rounded-full bg-black/55 px-2 py-0.5 font-adm-mono text-[11px] font-semibold text-white backdrop-blur">
          #{post.sort_order}
        </span>
        {/* Bottom corner so they never collide with the type badge on narrow phone cards. */}
        <div className="absolute bottom-2 right-2 z-[2] flex gap-1 transition-opacity md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
          <OverlayAction label="Edit post" onClick={onEdit}>
            <Pencil />
          </OverlayAction>
          <OverlayAction label="Delete post" destructive onClick={onDelete}>
            <Trash2 />
          </OverlayAction>
        </div>
      </div>
      <div className="flex flex-1 flex-col px-3.5 py-3">
        <p className={cn('line-clamp-2 min-h-[2.6em] text-[13px] leading-[1.3]', post.caption ? 'text-adm-ink-2' : 'italic text-adm-faint')}>
          {post.caption || 'No caption'}
        </p>
        <div className="mt-2.5 flex items-center gap-3 text-[12.5px] font-semibold tabular-nums text-adm-muted">
          <span className="inline-flex items-center gap-1" title={`${post.likes ?? 0} likes`}>
            <Heart className="size-3.5 text-adm-accent" />
            {compact.format(post.likes ?? 0)}
          </span>
          <span className="inline-flex items-center gap-1" title={`${post.comments ?? 0} comments`}>
            <MessageCircle className="size-3.5" />
            {compact.format(post.comments ?? 0)}
          </span>
          {post.postUrl && (
            <a
              href={post.postUrl}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Open on Instagram"
              className="relative z-[2] -my-2 -mr-2 ml-auto grid size-9 place-items-center rounded-[9px] text-adm-muted transition-colors hover:bg-adm-surface-2 hover:text-adm-ink"
            >
              <ExternalLink className="size-4" />
            </a>
          )}
        </div>
      </div>
    </Card>
  );
}

/** First image, else the poster, else a frame of the video itself. */
function Preview({ post, still }: { post: InstagramPost; still?: boolean }) {
  const src = post.images?.[0] ?? post.poster ?? '';
  if (src) {
    return (
      <SafeImg
        src={src}
        alt=""
        loading="lazy"
        className={cn('size-full object-cover', !still && 'transition-transform duration-500 group-hover:scale-[1.03]')}
        fallback={<NoPreview />}
      />
    );
  }
  if (post.videoSrc) return <VideoFrame src={post.videoSrc} />;
  return <NoPreview />;
}

function VideoFrame({ src }: { src: string }) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  if (failedSrc === src) return <NoPreview />;
  return (
    <video
      src={`${src}#t=0.1`}
      muted
      playsInline
      preload="metadata"
      onError={() => setFailedSrc(src)}
      className="size-full object-cover"
      aria-hidden
    />
  );
}

function NoPreview() {
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
          className={cn(
            'grid size-9 place-items-center rounded-full bg-white/90 shadow-adm-sm backdrop-blur outline-none transition-colors focus-visible:ring-2 focus-visible:ring-adm-accent [&_svg]:size-4',
            destructive ? 'text-adm-accent-hover hover:bg-adm-accent hover:text-white' : 'text-adm-ink-2 hover:bg-white hover:text-adm-ink',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
