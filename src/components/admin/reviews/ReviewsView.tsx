'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { MessageSquareText, RotateCw, Search, Star, Trash2, X } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { avatarStyle, initials } from '@/components/admin/dashboard/RecentOrders';
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
import { Card, CardFooter } from '@/components/admin/ui/card';
import { SearchInput } from '@/components/admin/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/admin/ui/tooltip';
import { toast } from '@/components/admin/ui/sonner';
import { cn, formatDate } from '@/lib/utils';

interface Review {
  id: string;
  customer_name: string;
  customer_email: string | null;
  rating: number;
  comment: string | null;
  created_at: string;
  products: { id: string; name: string; slug: string } | null;
}

type SortKey = 'newest' | 'oldest' | 'highest' | 'lowest' | 'customer' | 'product';

const SORT_LABEL: Record<SortKey, string> = {
  newest: 'Newest first',
  oldest: 'Oldest first',
  highest: 'Highest rating',
  lowest: 'Lowest rating',
  customer: 'Customer A–Z',
  product: 'Product A–Z',
};
const SORT_KEYS = Object.keys(SORT_LABEL) as SortKey[];

const STAR_COLORS: Record<number, string> = { 5: '#16a34a', 4: '#65a30d', 3: '#ca8a04', 2: '#ea580c', 1: '#dc2626' };
const STAR_FILL = '#F59E0B';
const STAR_EMPTY = '#DDD6D3';
const EASE = [0.2, 0.8, 0.2, 1] as const;
const NBSP = String.fromCharCode(160);

function sortReviews(list: Review[], key: SortKey) {
  const byText = (a: string, b: string) => a.localeCompare(b, undefined, { sensitivity: 'base' });
  return [...list].sort((a, b) => {
    switch (key) {
      case 'oldest':
        return a.created_at.localeCompare(b.created_at);
      case 'highest':
        return b.rating - a.rating || b.created_at.localeCompare(a.created_at);
      case 'lowest':
        return a.rating - b.rating || b.created_at.localeCompare(a.created_at);
      case 'customer':
        return byText(a.customer_name, b.customer_name);
      case 'product':
        // Reviews whose product was deleted go last.
        if (!a.products || !b.products) return a.products === b.products ? 0 : a.products ? -1 : 1;
        return byText(a.products.name, b.products.name);
      default:
        return b.created_at.localeCompare(a.created_at);
    }
  });
}

function matchesSearch(r: Review, query: string) {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return [r.customer_name, r.customer_email, r.products?.name, r.comment].some((v) => (v ?? '').toLowerCase().includes(q));
}

export function ReviewsView() {
  const reduce = useReducedMotion();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [filterRating, setFilterRating] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('newest');

  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadReviews = useCallback(() => {
    fetch('/api/admin/reviews')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((d: { reviews?: Review[] }) => {
        setReviews(d.reviews ?? []);
        setLoadFailed(false);
        setIsLoading(false);
      })
      .catch(() => {
        setLoadFailed(true);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const retryLoad = () => {
    setLoadFailed(false);
    setIsLoading(true);
    loadReviews();
  };

  const starCounts = useMemo(() => {
    const m: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    reviews.forEach((r) => {
      m[r.rating] = (m[r.rating] ?? 0) + 1;
    });
    return m;
  }, [reviews]);

  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;

  const visible = useMemo(
    () => sortReviews(reviews.filter((r) => (!filterRating || r.rating === filterRating) && matchesSearch(r, search)), sort),
    [reviews, filterRating, search, sort],
  );

  const askDelete = (r: Review) => {
    setDeleteTarget(r);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setIsDeleting(true);
    let ok = false;
    try {
      const res = await fetch(`/api/admin/reviews/${target.id}`, { method: 'DELETE' });
      ok = res.ok;
    } catch {
      ok = false;
    }
    setIsDeleting(false);
    if (ok) {
      setReviews((prev) => prev.filter((r) => r.id !== target.id));
      setDeleteOpen(false);
      toast.success('Review deleted', { description: `${target.customer_name}'s review was removed and the product rating updated.` });
    } else {
      toast.error("Couldn't delete the review", { description: 'Try again in a moment.' });
    }
  };

  const toggleRating = (star: number) => setFilterRating((cur) => (cur === star ? null : star));

  const rowMotion = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.42, delay: 0.08 + Math.min(i, 12) * 0.035, ease: EASE },
        };

  const showError = loadFailed && !isLoading && reviews.length === 0;
  const searching = search.trim() !== '';
  const emptyTitle = searching ? 'No reviews found' : filterRating ? `No ${filterRating}-star reviews` : 'No reviews yet';
  const emptyBody =
    searching || filterRating ? (
      <>
        Try a different search or rating.
        <div className="mt-3.5">
          <Button
            variant="outline"
            size="sm"
            className="h-9"
            onClick={() => {
              setSearch('');
              setFilterRating(null);
            }}
          >
            Clear filters
          </Button>
        </div>
      </>
    ) : (
      'Reviews customers leave on product pages will show up here.'
    );

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            Product reviews
            {!isLoading && !showError && (
              <motion.span
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 480, damping: 22 }}
                className="inline-grid h-7 min-w-8 place-items-center rounded-full bg-adm-canvas-2 px-2.5 font-adm-mono text-[13px] font-semibold tracking-normal text-adm-ink-2"
              >
                {reviews.length}
              </motion.span>
            )}
          </span>
        }
        description="What customers say about your watches. Deleting a review recalculates the product's rating."
      />

      {showError ? (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <b className="font-adm-display text-[15px]">Couldn&apos;t load reviews</b>
            <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
          </div>
          <Button variant="outline" onClick={retryLoad}>
            <RotateCw />
            Try again
          </Button>
        </Card>
      ) : (
        <>
          {/* Summary + per-star filters */}
          <div className="mb-4 grid grid-cols-5 gap-2.5 sm:gap-3 lg:grid-cols-[minmax(220px,1.35fr)_repeat(5,minmax(0,1fr))]">
            <Card className="col-span-5 flex items-center gap-4 px-5 py-4 lg:col-span-1">
              {isLoading ? (
                <>
                  <Skeleton className="h-12 w-16" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </>
              ) : (
                <>
                  <span className="font-adm-display text-[42px] font-bold leading-none tracking-[-0.03em] text-adm-ink tabular-nums">
                    {avg === null ? '—' : avg.toFixed(1)}
                  </span>
                  <div className="min-w-0">
                    <Stars value={avg ?? 0} size={17} />
                    <p className="mt-1 text-[13px] text-adm-muted">
                      {reviews.length === 0 ? 'No reviews yet' : `Average of ${reviews.length} review${reviews.length === 1 ? '' : 's'}`}
                    </p>
                  </div>
                </>
              )}
            </Card>

            {[5, 4, 3, 2, 1].map((star) => {
              const count = starCounts[star] ?? 0;
              const share = reviews.length ? count / reviews.length : 0;
              const active = filterRating === star;
              const color = STAR_COLORS[star];
              return (
                <button
                  key={star}
                  type="button"
                  aria-pressed={active}
                  aria-label={`${active ? 'Show all ratings' : `Show only ${star}-star reviews`} (${count})`}
                  onClick={() => toggleRating(star)}
                  disabled={isLoading}
                  className={cn(
                    'group relative min-w-0 overflow-hidden rounded-[14px] bg-adm-surface px-2 py-3 text-center shadow-adm-md outline-none ring-2 ring-transparent transition-[box-shadow,transform] duration-150 hover:-translate-y-px focus-visible:ring-adm-accent/40 sm:rounded-[18px] sm:px-3 sm:py-4 lg:text-left',
                    'disabled:pointer-events-none',
                  )}
                  style={active ? { boxShadow: `0 0 0 2px ${color}, 0 8px 20px -10px ${color}80` } : undefined}
                >
                  {isLoading ? (
                    <Skeleton className="mx-auto h-7 w-8 lg:mx-0" />
                  ) : (
                    <span className="block font-adm-display text-[22px] font-bold leading-none tabular-nums sm:text-[26px]" style={{ color }}>
                      {count}
                    </span>
                  )}
                  <span className="mt-2 flex items-center justify-center gap-0.5 lg:justify-start">
                    <span className="text-[12px] font-semibold text-adm-ink-2 sm:hidden">{star}</span>
                    <Star className="size-3 fill-current sm:hidden" style={{ color: STAR_FILL }} aria-hidden />
                    <span className="hidden sm:inline-flex">
                      <Stars value={star} max={star} size={12} />
                    </span>
                  </span>
                  <span className="mt-1 hidden text-[12px] text-adm-muted sm:block">
                    {star} star{star > 1 ? 's' : ''}
                    {!isLoading && reviews.length > 0 && <span className="text-adm-faint"> · {Math.round(share * 100)}%</span>}
                  </span>
                  <span aria-hidden className="absolute inset-x-0 bottom-0 h-[3px] bg-adm-canvas-2">
                    <motion.span
                      className="block h-full origin-left"
                      style={{ background: color }}
                      initial={reduce ? false : { scaleX: 0 }}
                      animate={{ scaleX: share }}
                      transition={{ duration: 0.7, ease: EASE, delay: 0.1 }}
                    />
                  </span>
                </button>
              );
            })}
          </div>

          <Card className="overflow-hidden">
            <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
              <SearchInput
                icon={<Search />}
                placeholder="Search customer, product or comment..."
                aria-label="Search reviews"
                autoComplete="off"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="min-w-0 flex-[1_1_240px] sm:max-w-[360px]"
              />
              {filterRating && (
                <button
                  type="button"
                  onClick={() => setFilterRating(null)}
                  className="inline-flex h-8 items-center gap-1.5 rounded-full pl-3 pr-2 text-[12.5px] font-semibold text-white outline-none transition-opacity hover:opacity-90 focus-visible:ring-[3px] focus-visible:ring-adm-accent/30"
                  style={{ background: STAR_COLORS[filterRating] }}
                  aria-label="Clear rating filter"
                >
                  Filtering: {filterRating} ★
                  <X className="size-3.5 opacity-80" />
                </button>
              )}
              <div className="ml-auto">
                <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  <SelectTrigger aria-label="Sort reviews" className="w-[168px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent align="end">
                    {SORT_KEYS.map((k) => (
                      <SelectItem key={k} value={k}>
                        {SORT_LABEL[k]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Desktop / tablet: table */}
            <div className="hidden md:block">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <tr>
                    <TableHead>Customer</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Rating</TableHead>
                    <TableHead>Comment</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">
                      <span className="sr-only">Actions</span>
                    </TableHead>
                  </tr>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableSkeletonRows />
                  ) : visible.length === 0 ? (
                    <TableEmpty colSpan={7} title={emptyTitle}>
                      {emptyBody}
                    </TableEmpty>
                  ) : (
                    visible.map((r, i) => (
                      <MotionRow key={r.id} {...rowMotion(i)}>
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <Avatar name={r.customer_name} />
                            <span className="max-w-[160px] truncate font-semibold text-adm-ink">{r.customer_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-[12.5px] text-adm-muted">
                          {r.customer_email ? <span className="block max-w-[200px] truncate">{r.customer_email}</span> : <span className="text-adm-faint">—</span>}
                        </TableCell>
                        <TableCell>
                          <span className="block max-w-[200px] truncate text-adm-ink-2">{r.products?.name ?? '—'}</span>
                        </TableCell>
                        <TableCell>
                          <RatingCell rating={r.rating} />
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <Comment text={r.comment} className="max-w-[320px]" />
                        </TableCell>
                        <TableCell className="text-[12.5px] text-adm-muted">{formatDate(r.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button variant="ghost-destructive" size="icon-sm" aria-label={`Delete review by ${r.customer_name}`} onClick={() => askDelete(r)}>
                                <Trash2 />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete review</TooltipContent>
                          </Tooltip>
                        </TableCell>
                      </MotionRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Phones: stacked cards */}
            <div className="border-t border-adm-line md:hidden">
              {isLoading ? (
                <ListSkeleton />
              ) : visible.length === 0 ? (
                <div className="px-5 py-11 text-center text-[13.5px] text-adm-muted">
                  <b className="mb-1 block font-adm-display text-[15px] text-adm-ink">{emptyTitle}</b>
                  {emptyBody}
                </div>
              ) : (
                <ul>
                  {visible.map((r, i) => (
                    <motion.li key={r.id} className="border-b border-adm-line px-4 py-3.5 last:border-b-0" {...rowMotion(i)}>
                      <div className="flex items-start gap-3">
                        <Avatar name={r.customer_name} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <b className="block truncate text-[14px] font-semibold text-adm-ink">{r.customer_name}</b>
                              <span className="block truncate text-[12px] text-adm-muted">{r.customer_email ?? '—'}</span>
                            </div>
                            <Button
                              variant="ghost-destructive"
                              size="icon"
                              className="-mr-2 -mt-1.5"
                              aria-label={`Delete review by ${r.customer_name}`}
                              onClick={() => askDelete(r)}
                            >
                              <Trash2 />
                            </Button>
                          </div>
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                            <RatingCell rating={r.rating} />
                            <span className="text-[12px] text-adm-faint">{formatDate(r.created_at)}</span>
                          </div>
                          {r.products?.name && <p className="mt-1.5 truncate text-[12.5px] font-medium text-adm-ink-2">{r.products.name}</p>}
                          <Comment text={r.comment} className="mt-1.5" />
                        </div>
                      </div>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>

            <CardFooter>
              <span aria-live="polite">{isLoading ? NBSP : `Showing ${visible.length} of ${reviews.length} reviews`}</span>
              <span className="hidden sm:inline">Click a star card to filter by rating</span>
            </CardFooter>
          </Card>
        </>
      )}

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!isDeleting) setDeleteOpen(o);
        }}
      >
        <AlertDialogContent className="border-t-[3px] border-adm-accent">
          <AlertDialogTitle>Delete review?</AlertDialogTitle>
          <AlertDialogDescription>This will permanently remove the review and recalculate the product rating.</AlertDialogDescription>
          {deleteTarget && (
            <div className="mt-4 rounded-[12px] bg-adm-surface-2 px-4 py-3 ring-1 ring-inset ring-adm-line">
              <div className="flex items-center justify-between gap-3">
                <b className="truncate text-[13.5px] font-semibold">{deleteTarget.customer_name}</b>
                <Stars value={deleteTarget.rating} size={13} />
              </div>
              {deleteTarget.products?.name && <p className="mt-0.5 truncate text-[12.5px] text-adm-muted">{deleteTarget.products.name}</p>}
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

const MotionRow = motion.create(TableRow);

/** Five stars; fractional values fill the last star partially (used for the average). */
function Stars({ value, max = 5, size = 14 }: { value: number; max?: number; size?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5" role="img" aria-label={`${value.toFixed(1).replace(/\.0$/, '')} out of 5 stars`}>
      {Array.from({ length: max }).map((_, i) => {
        const fill = Math.max(0, Math.min(1, value - i));
        return (
          <span key={i} className="relative inline-block" style={{ width: size, height: size }}>
            <Star className="absolute inset-0" style={{ width: size, height: size, color: STAR_EMPTY, fill: STAR_EMPTY }} strokeWidth={0} />
            {fill > 0 && (
              <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star style={{ width: size, height: size, color: STAR_FILL, fill: STAR_FILL }} strokeWidth={0} />
              </span>
            )}
          </span>
        );
      })}
    </span>
  );
}

function RatingCell({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Stars value={rating} size={14} />
      <span className="text-[12px] font-semibold text-adm-muted tabular-nums">{rating}/5</span>
    </span>
  );
}

function Comment({ text, className }: { text: string | null; className?: string }) {
  if (!text) {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-[12.5px] italic text-adm-faint', className)}>
        <MessageSquareText className="size-3.5" />
        No comment
      </span>
    );
  }
  return <p className={cn('line-clamp-2 text-[13px] leading-snug text-adm-ink-2', className)}>{text}</p>;
}

function Avatar({ name }: { name: string }) {
  return (
    <span
      aria-hidden
      className="grid size-9 shrink-0 place-items-center rounded-full font-adm-display text-[13px] font-bold"
      style={avatarStyle(name)}
    >
      {initials(name)}
    </span>
  );
}

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} aria-hidden>
          <TableCell>
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-9 rounded-full" />
              <Skeleton className="h-4 w-[110px]" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-[140px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-[150px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-[100px]" />
          </TableCell>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-[240px]" />
              <Skeleton className="h-3.5 w-[160px]" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-[100px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto size-8" />
          </TableCell>
        </tr>
      ))}
    </>
  );
}

function ListSkeleton() {
  return (
    <ul aria-hidden>
      {Array.from({ length: 5 }).map((_, i) => (
        <li key={i} className="flex gap-3 border-b border-adm-line px-4 py-3.5 last:border-b-0">
          <Skeleton className="size-9 shrink-0 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-[130px]" />
            <Skeleton className="h-3 w-[100px]" />
            <Skeleton className="h-3.5 w-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
