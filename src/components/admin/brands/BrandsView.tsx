'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronsUpDown, Film, Layers, Loader2, Pencil, Plus, RotateCw, Search, Sparkles, Tags, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
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
import { Card, CardFooter } from '@/components/admin/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/admin/ui/dropdown-menu';
import { SearchInput } from '@/components/admin/ui/input';
import { Segmented, type SegmentedOption } from '@/components/admin/ui/segmented';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { toast } from '@/components/admin/ui/sonner';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/admin/ui/tooltip';
import { cn, formatPrice } from '@/lib/utils';
import { BrandEditor, type SaveResult } from './BrandEditor';
import {
  SORT_KEYS,
  SORT_LABEL,
  fmtDay,
  matchesFilter,
  matchesSearch,
  sortBrands,
  validTiers,
  warrantyText,
  type Brand,
  type BrandFilter,
  type CategoryOption,
  type SortKey,
  type SortState,
} from './model';

const EASE = [0.2, 0.8, 0.2, 1] as const;
const NBSP = String.fromCharCode(160);
const MotionRow = motion.create(TableRow);

export function BrandsView() {
  const reduce = useReducedMotion();
  const [brands, setBrands] = useState<Brand[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<BrandFilter>('all');
  const [sort, setSort] = useState<SortState>({ key: '', dir: 'asc' });
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Brand | null>(null);
  const [sessionKey, setSessionKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // GET /api/admin/brands (same as before; the API returns them ordered by name).
  const load = useCallback(() => {
    fetch('/api/admin/brands')
      .then((r) => r.json())
      .then((data) => {
        const ok = Array.isArray(data);
        if (ok) setBrands(data);
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

  // Category options for the defaults editor.
  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const retryLoad = () => {
    setLoadFailed(false);
    setIsLoading(true);
    load();
  };

  const openCreate = () => {
    setEditing(null);
    setSessionKey((k) => k + 1);
    setEditorOpen(true);
  };

  const openEdit = (b: Brand) => {
    setEditing(b);
    setSessionKey((k) => k + 1);
    setEditorOpen(true);
  };

  const askDelete = (b: Brand) => {
    setDeleteTarget(b);
    setDeleteOpen(true);
  };

  const onSaved = (result: SaveResult, name: string) => {
    setEditorOpen(false);
    load();
    toast.success(result === 'created' ? `${name} added` : `${name} saved`, {
      description: result === 'created' ? 'The brand is now available on products.' : undefined,
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/brands/${target.id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setBrands((prev) => prev.filter((b) => b.id !== target.id));
      setDeleteOpen(false);
      if (editing?.id === target.id) setEditorOpen(false);
      toast.success(`${target.name} deleted`, { description: 'Products using this brand name were not changed.' });
    } catch (err) {
      toast.error(`Couldn't delete ${target.name}`, { description: err instanceof Error ? err.message : 'Check your connection and try again.' });
    } finally {
      setIsDeleting(false);
    }
  };

  const counts = useMemo(
    () => ({
      all: brands.length,
      defaults: brands.filter((b) => matchesFilter(b, 'defaults')).length,
      none: brands.filter((b) => matchesFilter(b, 'none')).length,
    }),
    [brands],
  );

  const visible = useMemo(
    () => sortBrands(brands.filter((b) => matchesFilter(b, filter) && matchesSearch(b, search)), sort),
    [brands, filter, search, sort],
  );

  const handleSort = (key: SortKey) => setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));

  const filtersActive = filter !== 'all' || search.trim() !== '';
  const clearFilters = () => {
    setFilter('all');
    setSearch('');
  };

  const filterOptions: SegmentedOption<BrandFilter>[] = [
    { value: 'all', label: 'All', count: isLoading ? undefined : counts.all },
    {
      value: 'defaults',
      label: (
        <>
          <span className="sm:hidden">Defaults</span>
          <span className="max-sm:hidden">With defaults</span>
        </>
      ),
      count: isLoading ? undefined : counts.defaults,
      icon: <Sparkles className="max-sm:hidden" />,
      countClassName: 'bg-[#ECEEFF] text-[#4338CA]',
    },
    {
      value: 'none',
      label: (
        <>
          <span className="sm:hidden">None</span>
          <span className="max-sm:hidden">No defaults</span>
        </>
      ),
      count: isLoading ? undefined : counts.none,
    },
  ];

  const rowMotion = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.42, delay: 0.1 + Math.min(i, 12) * 0.035, ease: EASE },
        };

  const showError = loadFailed && !isLoading && brands.length === 0;
  const emptyTitle = filtersActive ? 'No brands found' : 'No brands yet';
  const description = isLoading
    ? 'Loading brands...'
    : `${counts.all} brand${counts.all !== 1 ? 's' : ''} in the store · ${counts.defaults} with product defaults`;

  return (
    <>
      <PageHeader
        title="Brands"
        description={description}
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add brand
          </Button>
        }
      />

      {showError && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <b className="font-adm-display text-[15px]">Couldn&apos;t load brands</b>
            <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
          </div>
          <Button variant="outline" onClick={retryLoad}>
            <RotateCw />
            Try again
          </Button>
        </Card>
      )}

      {!showError && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
            <SearchInput
              icon={<Search />}
              placeholder="Search brands..."
              aria-label="Search brands"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-[1_1_240px] sm:max-w-[380px]"
            />
            <Segmented ariaLabel="Filter brands" options={filterOptions} value={filter} onChange={setFilter} className="max-sm:[&_[role=tab]]:h-9" />
          </div>

          {/* Desktop / tablet: table */}
          <div className="hidden md:block">
            <Table className="min-w-[700px]">
              <TableHeader>
                <tr>
                  <SortHead k="name" sort={sort} onSort={handleSort} />
                  <SortHead k="warranty" sort={sort} onSort={handleSort} />
                  <TableHead>Product defaults</TableHead>
                  <SortHead k="created_at" sort={sort} onSort={handleSort} />
                  <TableHead className="w-[1%] text-right">Actions</TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeletonRows />
                ) : visible.length === 0 ? (
                  <TableEmpty colSpan={5} title={emptyTitle}>
                    <EmptyBody filtersActive={filtersActive} onClear={clearFilters} onAdd={openCreate} />
                  </TableEmpty>
                ) : (
                  visible.map((b, i) => (
                    <MotionRow
                      key={b.id}
                      data-clickable="true"
                      tabIndex={0}
                      aria-label={`Edit ${b.name}`}
                      onClick={() => openEdit(b)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openEdit(b);
                        }
                      }}
                      {...rowMotion(i)}
                    >
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Monogram name={b.name} />
                          <div className="min-w-0">
                            <div className="max-w-[260px] truncate font-bold text-adm-accent-hover">{b.name}</div>
                            <div className="max-w-[260px] truncate text-xs text-adm-muted">{defaultsSummary(b)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="text-adm-ink-2">{warrantyText(b) ?? <span className="text-adm-faint">—</span>}</TableCell>
                      <TableCell>
                        <DefaultsBadges brand={b} />
                      </TableCell>
                      <TableCell className="text-adm-ink-2">{fmtDay(b.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon-sm"
                                aria-label={`Edit ${b.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEdit(b);
                                }}
                              >
                                <Pencil />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Edit</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost-destructive"
                                size="icon-sm"
                                aria-label={`Delete ${b.name}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  askDelete(b);
                                }}
                              >
                                <Trash2 />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Delete</TooltipContent>
                          </Tooltip>
                        </div>
                      </TableCell>
                    </MotionRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Phones: stacked cards */}
          <div className="md:hidden">
            <div className="flex items-center justify-between gap-3 border-y border-adm-line bg-adm-surface-2 py-1.5 pl-4 pr-2 text-[12.5px] font-semibold text-adm-muted">
              <span>Brands</span>
              <MobileSort sort={sort} onSort={handleSort} />
            </div>
            {isLoading ? (
              <ListSkeleton />
            ) : visible.length === 0 ? (
              <div className="px-5 py-11 text-center text-[13.5px] text-adm-muted">
                <b className="mb-1 block font-adm-display text-[15px] text-adm-ink">{emptyTitle}</b>
                <EmptyBody filtersActive={filtersActive} onClear={clearFilters} onAdd={openCreate} />
              </div>
            ) : (
              <ul>
                {visible.map((b, i) => (
                  <motion.li key={b.id} className="relative border-b border-adm-line last:border-b-0" {...rowMotion(i)}>
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      aria-label={`Edit ${b.name}`}
                      className="absolute inset-0 transition-colors hover:bg-[#FCF7F6] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-adm-accent active:bg-[#FCF7F6]"
                    />
                    <div className="pointer-events-none relative flex items-start gap-3 py-3.5 pl-4 pr-2">
                      <Monogram name={b.name} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate font-bold text-adm-accent-hover">{b.name}</div>
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-adm-muted">
                          <span>{warrantyText(b) ? `${warrantyText(b)} warranty` : 'No warranty'}</span>
                          <span aria-hidden>·</span>
                          <span>Added {fmtDay(b.created_at)}</span>
                        </div>
                        <div className="mt-2">
                          <DefaultsBadges brand={b} maxTiers={1} emptyText="No product defaults" />
                        </div>
                      </div>
                      <Button
                        variant="ghost-destructive"
                        size="icon"
                        aria-label={`Delete ${b.name}`}
                        className="pointer-events-auto shrink-0"
                        onClick={() => askDelete(b)}
                      >
                        <Trash2 />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          <CardFooter>
            <span aria-live="polite">{isLoading ? NBSP : `Showing ${visible.length} of ${brands.length} brands`}</span>
            <span className="hidden sm:inline">Click a brand to edit it and its product defaults</span>
          </CardFooter>
        </Card>
      )}

      <BrandEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        brand={editing}
        sessionKey={sessionKey}
        categories={categories}
        onSaved={onSaved}
        onDelete={askDelete}
      />

      <AlertDialog
        open={deleteOpen}
        onOpenChange={(o) => {
          if (!isDeleting) setDeleteOpen(o);
        }}
      >
        <AlertDialogContent className="border-t-[3px] border-adm-accent">
          <AlertDialogTitle>Delete brand?</AlertDialogTitle>
          <AlertDialogDescription>
            <b className="font-semibold text-adm-ink">{deleteTarget?.name}</b> will be removed. Products using this brand name will not be affected.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              destructive
              disabled={isDeleting}
              onClick={(e) => {
                e.preventDefault();
                confirmDelete();
              }}
            >
              {isDeleting && <Loader2 className="animate-spin" />}
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function defaultsSummary(b: Brand): string {
  const d = b.defaults;
  if (!d) return 'No product defaults';
  const parts: string[] = [];
  const price = Number(d.price);
  if (d.price && price > 0) parts.push(formatPrice(price));
  if (d.gender) parts.push(d.gender.charAt(0).toUpperCase() + d.gender.slice(1));
  if (d.category) parts.push(d.category.replace(/-/g, ' '));
  const nf = (d.features ?? []).length;
  if (nf) parts.push(`${nf} feature${nf !== 1 ? 's' : ''}`);
  const ns = Object.values(d.specifications ?? {}).filter(Boolean).length;
  if (ns) parts.push(`${ns} spec${ns !== 1 ? 's' : ''}`);
  return parts.length ? parts.join(' · ') : 'Product defaults set';
}

function Monogram({ name, className }: { name: string; className?: string }) {
  const letters = name.replace(/[^A-Za-z0-9]/g, '').slice(0, 2).toUpperCase() || '?';
  return (
    <span
      aria-hidden
      className={cn(
        'grid size-9 shrink-0 place-items-center rounded-[10px] bg-adm-accent-soft font-adm-display text-[12.5px] font-bold tracking-[.02em] text-adm-accent-hover',
        className,
      )}
    >
      {letters}
    </span>
  );
}

function DefaultsBadges({ brand, maxTiers = 2, emptyText = '—' }: { brand: Brand; maxTiers?: number; emptyText?: string }) {
  const d = brand.defaults;
  if (!d) return <span className="text-[12.5px] text-adm-faint">{emptyText}</span>;
  const tiers = validTiers(d);
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      <Badge tone="indigo">
        <Sparkles />
        Set
      </Badge>
      {tiers.slice(0, maxTiers).map((t, i) => (
        <Badge key={i} tone="amber">
          <Layers />
          {t.qty} for {formatPrice(Number(t.price))}
        </Badge>
      ))}
      {tiers.length > maxTiers && <Badge tone="outline">+{tiers.length - maxTiers}</Badge>}
      {d.videoUrl && (
        <Badge tone="neutral" title="Brand video">
          <Film />
          Video
        </Badge>
      )}
    </div>
  );
}

function SortHead({ k, sort, onSort, className }: { k: SortKey; sort: SortState; onSort: (k: SortKey) => void; className?: string }) {
  const active = sort.key === k;
  return (
    <TableHead aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={cn('py-[7px]', className)}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          'group -mx-1.5 inline-flex h-7 items-center gap-1 rounded-[7px] px-1.5 outline-none transition-colors hover:bg-[rgba(70,30,32,.05)] hover:text-adm-ink focus-visible:ring-2 focus-visible:ring-adm-accent/40',
          active && 'text-adm-ink',
        )}
      >
        {SORT_LABEL[k]}
        {active ? (
          sort.dir === 'asc' ? <ArrowUp className="size-3.5" /> : <ArrowDown className="size-3.5" />
        ) : (
          <ChevronsUpDown className="size-3.5 opacity-0 transition-opacity group-hover:opacity-60 group-focus-visible:opacity-60" />
        )}
      </button>
    </TableHead>
  );
}

function MobileSort({ sort, onSort }: { sort: SortState; onSort: (k: SortKey) => void }) {
  const Arrow = sort.dir === 'asc' ? ArrowUp : ArrowDown;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-9 text-[12.5px]">
          <ArrowUpDown />
          {sort.key ? (
            <>
              {SORT_LABEL[sort.key]}
              <Arrow className="size-3.5" />
            </>
          ) : (
            'Sort'
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[200px]">
        <DropdownMenuLabel>Sort by · tap again to flip</DropdownMenuLabel>
        <DropdownMenuRadioGroup value={sort.key}>
          {SORT_KEYS.map((k) => (
            <DropdownMenuRadioItem key={k} value={k} onSelect={() => onSort(k)}>
              {k === 'name' ? 'Name' : SORT_LABEL[k]}
              {sort.key === k && <Arrow className="ml-auto size-3.5" />}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyBody({ filtersActive, onClear, onAdd }: { filtersActive: boolean; onClear: () => void; onAdd: () => void }) {
  return (
    <>
      {filtersActive ? 'Try a different search or filter.' : 'Add your first watch brand to start listing products under it.'}
      <div className="mt-3.5">
        {filtersActive ? (
          <Button variant="outline" size="sm" className="h-9" onClick={onClear}>
            Clear filters
          </Button>
        ) : (
          <Button variant="soft" size="sm" className="h-9" onClick={onAdd}>
            <Tags />
            Add brand
          </Button>
        )}
      </div>
    </>
  );
}

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 6 }).map((_, i) => (
        <tr key={i} aria-hidden>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-9" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-[120px]" />
                <Skeleton className="h-3 w-[170px]" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-[70px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-[110px] rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-[90px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-8 w-[68px]" />
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
        <li key={i} className="flex items-start gap-3 border-b border-adm-line px-4 py-3.5 last:border-b-0">
          <Skeleton className="size-9" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3.5 w-[120px]" />
            <Skeleton className="h-3 w-[190px]" />
            <Skeleton className="h-6 w-[90px] rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
