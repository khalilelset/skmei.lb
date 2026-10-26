'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronsUpDown, Gift, Loader2, Package, Pencil, Plus, RotateCw, Search, Trash2 } from 'lucide-react';
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
import { Button } from '@/components/admin/ui/button';
import { Card } from '@/components/admin/ui/card';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { toast } from '@/components/admin/ui/sonner';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/admin/ui/tooltip';
import { cn } from '@/lib/utils';
import { BoxEditor, type SaveResult } from './BoxEditor';
import { BoxThumb, BrandCell, TypeBadge } from './parts';
import {
  GLOBAL,
  SORT_KEYS,
  SORT_LABEL,
  fmtDay,
  matchesBox,
  nextSort,
  priceLabel,
  sortBoxes,
  type BoxItem,
  type BrandOption,
  type SortKey,
  type SortState,
  type TypeFilter,
} from './model';

const EASE = [0.2, 0.8, 0.2, 1] as const;
const MotionRow = motion.create(TableRow);

export function BoxesView() {
  const reduce = useReducedMotion();
  const [boxes, setBoxes] = useState<BoxItem[]>([]);
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [brandFilter, setBrandFilter] = useState('all');
  const [sort, setSort] = useState<SortState>({ key: '', dir: 'asc' });

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorBusy, setEditorBusy] = useState(false);
  const [editing, setEditing] = useState<BoxItem | null>(null);
  const [sessionKey, setSessionKey] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<BoxItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  /** `silent` = refresh after a save/delete: keep the current list on failure and just warn. */
  const load = useCallback((silent = false) => {
    // Brands load independently so a boxes error never blocks the dropdowns.
    fetch('/api/admin/brands')
      .then((r) => r.json())
      .then((data: unknown) => {
        if (Array.isArray(data)) {
          setBrands(
            data
              .filter((b): b is { id: unknown; name?: unknown } => !!b && typeof b === 'object' && 'id' in b)
              .map((b) => ({ id: String(b.id), name: String(b.name ?? '') })),
          );
        }
      })
      .catch(() => {});

    fetch('/api/admin/boxes')
      .then(async (r) => {
        const data: unknown = await r.json();
        if (!r.ok || !Array.isArray(data)) throw new Error('load failed');
        return data as BoxItem[];
      })
      .then((data) => {
        setBoxes(data);
        setLoadFailed(false);
      })
      .catch(() => {
        if (silent) toast.error("Couldn't refresh the list", { description: 'Reload the page to see the latest boxes.' });
        else setLoadFailed(true);
      })
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const retry = () => {
    setIsLoading(true);
    setLoadFailed(false);
    load();
  };

  // ---- filtering -------------------------------------------------------------------------------
  const visible = useMemo(() => sortBoxes(boxes.filter((b) => matchesBox(b, typeFilter, brandFilter, search)), sort), [boxes, typeFilter, brandFilter, search, sort]);

  const typeOptions = useMemo<SegmentedOption<TypeFilter>[]>(() => {
    const base = boxes.filter((b) => matchesBox(b, 'all', brandFilter, search));
    return [
      { value: 'all', label: 'All', count: base.length },
      { value: 'standard', label: 'Standard', icon: <Package />, count: base.filter((b) => b.type === 'standard').length },
      { value: 'gift', label: 'Gift', icon: <Gift />, count: base.filter((b) => b.type === 'gift').length },
    ];
  }, [boxes, brandFilter, search]);

  const activeFilters = (typeFilter !== 'all' ? 1 : 0) + (brandFilter !== 'all' ? 1 : 0) + (search.trim() ? 1 : 0);
  const clearFilters = () => {
    setTypeFilter('all');
    setBrandFilter('all');
    setSearch('');
  };

  const standardCount = boxes.filter((b) => b.type === 'standard').length;
  const giftCount = boxes.length - standardCount;
  const description = isLoading
    ? 'Standard and gift boxes offered at checkout'
    : loadFailed
      ? 'Standard and gift boxes offered at checkout'
      : `${boxes.length} box${boxes.length === 1 ? '' : 'es'} offered at checkout · ${standardCount} standard · ${giftCount} gift`;

  // ---- actions ---------------------------------------------------------------------------------
  const openCreate = () => {
    setEditing(null);
    setSessionKey((k) => k + 1);
    setEditorOpen(true);
  };

  const openEdit = (box: BoxItem) => {
    setEditing(box);
    setSessionKey((k) => k + 1);
    setEditorOpen(true);
  };

  const onSaved = (result: SaveResult, code: string) => {
    setEditorOpen(false);
    toast.success(result === 'created' ? 'Box added' : 'Changes saved', { description: code });
    load(true);
  };

  const askDelete = (box: BoxItem) => {
    setDeleteTarget(box);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    const target = deleteTarget;
    if (!target) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/boxes/${encodeURIComponent(target.id)}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `HTTP ${res.status}`);
      }
      setDeleteOpen(false);
      if (editing?.id === target.id) setEditorOpen(false);
      setBoxes((list) => list.filter((b) => b.id !== target.id));
      toast.success('Box deleted', { description: target.code });
      load(true);
    } catch (err) {
      toast.error("Couldn't delete the box", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsDeleting(false);
    }
  };

  const rowMotion = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.42, delay: 0.1 + Math.min(i, 12) * 0.035, ease: EASE },
        };

  const emptyTitle = activeFilters > 0 ? 'No boxes match the current filters' : 'No boxes yet';
  const emptyBody = <EmptyBody filtered={activeFilters > 0} onClear={clearFilters} onAdd={openCreate} />;

  return (
    <>
      <PageHeader
        title="Watch boxes"
        description={description}
        actions={
          <Button onClick={openCreate}>
            <Plus />
            Add box
          </Button>
        }
      />

      {loadFailed && !isLoading ? (
        <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <b className="font-adm-display text-[15px]">Couldn&apos;t load boxes</b>
            <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
          </div>
          <Button variant="outline" onClick={retry}>
            <RotateCw />
            Try again
          </Button>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          {/* ---------- Toolbar ---------- */}
          <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
            <SearchInput
              icon={<Search />}
              placeholder="Search by code or brand..."
              aria-label="Search boxes"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-[1_1_240px] sm:max-w-[340px]"
            />
            <Segmented ariaLabel="Filter by type" options={typeOptions} value={typeFilter} onChange={setTypeFilter} className="max-sm:[&_[role=tab]]:h-9" />
            <Select value={brandFilter} onValueChange={setBrandFilter}>
              <SelectTrigger aria-label="Filter by brand" className="w-full sm:w-[190px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All brands</SelectItem>
                <SelectItem value={GLOBAL}>Global (no brand)</SelectItem>
                {brands.map((b) => (
                  <SelectItem key={b.id} value={b.id}>
                    {b.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2 max-sm:w-full max-sm:justify-between sm:ml-auto">
              {activeFilters > 0 && (
                <Button variant="ghost-destructive" size="sm" className="h-9" onClick={clearFilters}>
                  Clear filters ({activeFilters})
                </Button>
              )}
              {!isLoading && (
                <span className="whitespace-nowrap text-[12.5px] font-medium text-adm-muted tabular-nums">
                  {visible.length} of {boxes.length} boxes
                </span>
              )}
            </div>
          </div>

          {/* ---------- Desktop / tablet: table ---------- */}
          <div className="hidden md:block">
            <Table className="min-w-[680px]">
              <TableHeader>
                <tr>
                  <SortHead k="code" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} label="Box" />
                  <SortHead k="type" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} />
                  <SortHead k="brandName" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} />
                  <SortHead k="price" sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} label="Price addition" align="right" />
                  <TableHead className="w-[1%] text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeletonRows />
                ) : visible.length === 0 ? (
                  <TableEmpty colSpan={5} title={emptyTitle}>
                    {emptyBody}
                  </TableEmpty>
                ) : (
                  visible.map((b, i) => (
                    <MotionRow
                      key={b.id}
                      data-clickable="true"
                      tabIndex={0}
                      aria-label={`Edit box ${b.code}`}
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
                          <BoxThumb box={b} />
                          <div className="min-w-0">
                            <div className="max-w-[260px] truncate font-adm-mono text-[13px] font-bold tracking-[-0.01em] text-adm-ink">{b.code}</div>
                            {fmtDay(b.createdAt) && <div className="text-xs text-adm-muted">Added {fmtDay(b.createdAt)}</div>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <TypeBadge type={b.type} />
                      </TableCell>
                      <TableCell>
                        <BrandCell box={b} />
                      </TableCell>
                      <TableCell className="text-right">
                        <PriceText price={b.price} />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                aria-label={`Edit ${b.code}`}
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
                                size="icon"
                                aria-label={`Delete ${b.code}`}
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

          {/* ---------- Phones: stacked cards ---------- */}
          <div className="md:hidden">
            <div className="flex items-center justify-between gap-3 border-y border-adm-line bg-adm-surface-2 py-1.5 pl-4 pr-2 text-[12.5px] font-semibold text-adm-muted">
              <span>Boxes</span>
              <MobileSort sort={sort} onSort={(k) => setSort((s) => nextSort(s, k))} />
            </div>
            {isLoading ? (
              <ListSkeleton />
            ) : visible.length === 0 ? (
              <div className="px-5 py-11 text-center text-[13.5px] text-adm-muted">
                <b className="mb-1 block font-adm-display text-[15px] text-adm-ink">{emptyTitle}</b>
                {emptyBody}
              </div>
            ) : (
              <ul>
                {visible.map((b, i) => (
                  <motion.li key={b.id} className="relative border-b border-adm-line last:border-b-0" {...rowMotion(i)}>
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      aria-label={`Edit box ${b.code}`}
                      className="absolute inset-0 transition-colors hover:bg-[#FCF7F6] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-adm-accent active:bg-[#FCF7F6]"
                    />
                    <div className="pointer-events-none relative flex items-center gap-3 py-3 pl-4 pr-2">
                      <BoxThumb box={b} className="size-14" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="truncate font-adm-mono text-[13.5px] font-bold tracking-[-0.01em] text-adm-ink">{b.code}</span>
                          <PriceText price={b.price} className="shrink-0 text-[13.5px]" />
                        </div>
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                          <TypeBadge type={b.type} />
                          <BrandCell box={b} />
                        </div>
                      </div>
                      <Button
                        variant="ghost-destructive"
                        size="icon"
                        aria-label={`Delete ${b.code}`}
                        className="pointer-events-auto relative"
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
        </Card>
      )}

      <BoxEditor
        open={editorOpen}
        onOpenChange={(o) => {
          if (!o && editorBusy) return;
          setEditorOpen(o);
        }}
        sessionKey={sessionKey}
        box={editing}
        brands={brands}
        onBusyChange={setEditorBusy}
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
          <AlertDialogTitle>Delete this box?</AlertDialogTitle>
          <AlertDialogDescription>
            <b className="font-adm-mono font-semibold text-adm-ink">{deleteTarget?.code}</b> will be removed from checkout and permanently deleted. This
            cannot be undone.
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

function PriceText({ price, className }: { price: number; className?: string }) {
  return <span className={cn('font-bold tabular-nums', price > 0 ? 'text-adm-accent-hover' : 'text-adm-muted', className)}>{priceLabel(price)}</span>;
}

function SortHead({
  k,
  sort,
  onSort,
  label,
  align,
}: {
  k: SortKey;
  sort: SortState;
  onSort: (k: SortKey) => void;
  label?: string;
  align?: 'right';
}) {
  const active = sort.key === k;
  return (
    <TableHead aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'} className={cn('py-[7px]', align === 'right' && 'text-right')}>
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          'group -mx-1.5 inline-flex h-7 items-center gap-1 rounded-[7px] px-1.5 outline-none transition-colors hover:bg-[rgba(70,30,32,.05)] hover:text-adm-ink focus-visible:ring-2 focus-visible:ring-adm-accent/40',
          active && 'text-adm-ink',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {label ?? SORT_LABEL[k]}
        {active ? (
          sort.dir === 'asc' ? (
            <ArrowUp className="size-3.5" />
          ) : (
            <ArrowDown className="size-3.5" />
          )
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
              {SORT_LABEL[k]}
              {sort.key === k && <Arrow className="ml-auto size-3.5" />}
            </DropdownMenuRadioItem>
          ))}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function EmptyBody({ filtered, onClear, onAdd }: { filtered: boolean; onClear: () => void; onAdd: () => void }) {
  return (
    <>
      {filtered ? 'Try a different search or filter.' : 'Add a standard box (free) and any gift boxes customers can pick at checkout.'}
      <div className="mt-3.5">
        {filtered ? (
          <Button variant="outline" size="sm" className="h-9" onClick={onClear}>
            Clear filters
          </Button>
        ) : (
          <Button size="sm" className="h-9" onClick={onAdd}>
            <Plus />
            Add box
          </Button>
        )}
      </div>
    </>
  );
}

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 4 }, (_, i) => (
        <tr key={i}>
          <TableCell>
            <div className="flex items-center gap-3">
              <Skeleton className="size-12 rounded-[12px]" />
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-[90px]" />
                <Skeleton className="h-3 w-[110px]" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-[86px] rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-3.5 w-[80px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-3.5 w-14" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-8 w-[76px]" />
          </TableCell>
        </tr>
      ))}
    </>
  );
}

function ListSkeleton() {
  return (
    <ul>
      {Array.from({ length: 4 }, (_, i) => (
        <li key={i} className="flex items-center gap-3 border-b border-adm-line px-4 py-3 last:border-b-0">
          <Skeleton className="size-14 rounded-[12px]" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex justify-between">
              <Skeleton className="h-3.5 w-[90px]" />
              <Skeleton className="h-3.5 w-12" />
            </div>
            <Skeleton className="h-6 w-[150px] rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
