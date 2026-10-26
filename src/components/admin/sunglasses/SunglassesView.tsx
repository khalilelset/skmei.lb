'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Eye, EyeOff, Glasses, House, ImageOff, Pencil, Plus, RotateCw, Search, Trash2 } from 'lucide-react';
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
import { SearchInput } from '@/components/admin/ui/input';
import { Segmented, type SegmentedOption } from '@/components/admin/ui/segmented';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/admin/ui/select';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { Switch } from '@/components/admin/ui/switch';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/admin/ui/tooltip';
import { toast } from '@/components/admin/ui/sonner';
import { cn, formatPrice } from '@/lib/utils';
import type { Sunglasses } from '@/types';
import {
  GENDER_LABEL,
  SORT_LABEL,
  firstImage,
  isShown,
  matchesSearch,
  sortRows,
  stockTone,
  type SortKey,
  type VisFilter,
} from './model';
import { Swatches } from './parts';
import { SafeImg } from './SafeImg';
import { SunglassesEditor, type SaveResult } from './SunglassesEditor';

const EASE = [0.2, 0.8, 0.2, 1] as const;
const NBSP = String.fromCharCode(160);
const SORT_KEYS = Object.keys(SORT_LABEL) as SortKey[];
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function SunglassesView() {
  const reduce = useReducedMotion();
  const [rows, setRows] = useState<Sunglasses[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<VisFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set());

  // Homepage "Sunglasses" section switch (site setting).
  const [sectionVisible, setSectionVisible] = useState(true);
  const [sectionLoaded, setSectionLoaded] = useState(false);
  const [savingSection, setSavingSection] = useState(false);

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [editing, setEditing] = useState<Sunglasses | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Sunglasses | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const load = useCallback(() => {
    fetch('/api/admin/sunglasses')
      .then((r) => r.json())
      .then((data) => {
        const ok = Array.isArray(data);
        if (ok) setRows(data);
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

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((data: { sunglasses_section_visible?: unknown }) => {
        if (typeof data?.sunglasses_section_visible === 'boolean') setSectionVisible(data.sunglasses_section_visible);
        setSectionLoaded(true);
      })
      .catch(() => setSectionLoaded(true));
  }, []);

  const retryLoad = () => {
    setLoadFailed(false);
    setIsLoading(true);
    load();
  };

  /* ---------- Homepage section ---------- */
  const toggleSection = async (checked: boolean) => {
    setSectionVisible(checked);
    setSavingSection(true);
    let ok = false;
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ sunglasses_section_visible: checked }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    setSavingSection(false);
    if (ok) {
      toast.success(checked ? 'Sunglasses section is on the homepage' : 'Sunglasses section hidden from the homepage');
    } else {
      setSectionVisible(!checked);
      toast.error("Couldn't update the homepage section", { description: 'Check your connection and try again.' });
    }
  };

  /* ---------- Editor ---------- */
  const openEditor = (sg: Sunglasses | null) => {
    setEditing(sg);
    setEditorKey((k) => k + 1);
    setEditorOpen(true);
  };

  const handleSaved = (result: SaveResult, name: string) => {
    setEditorOpen(false);
    toast.success(result === 'created' ? `${name} added` : `${name} saved`);
    load();
  };

  /* ---------- Row visibility ---------- */
  const handleToggleVisible = async (sg: Sunglasses) => {
    if (busy.has(sg.id)) return;
    const next = !isShown(sg);
    setBusy((s) => new Set(s).add(sg.id));
    setRows((list) => list.map((x) => (x.id === sg.id ? { ...x, isVisible: next } : x)));
    let ok = false;
    try {
      const res = await fetch(`/api/admin/sunglasses/${sg.id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ is_visible: next }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (!ok) setRows((list) => list.map((x) => (x.id === sg.id ? { ...x, isVisible: sg.isVisible } : x)));
    setBusy((s) => {
      const n = new Set(s);
      n.delete(sg.id);
      return n;
    });
    if (ok) toast.success(next ? `${sg.name} is visible in the store` : `${sg.name} is hidden from the store`);
    else toast.error(`Couldn't update ${sg.name}`, { description: 'Check your connection and try again.' });
    load();
  };

  /* ---------- Delete ---------- */
  const askDelete = (sg: Sunglasses) => {
    setDeleteTarget(sg);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setIsDeleting(true);
    let ok = false;
    try {
      const res = await fetch(`/api/admin/sunglasses/${target.id}`, { method: 'DELETE' });
      ok = res.ok;
    } catch {
      ok = false;
    }
    setIsDeleting(false);
    if (ok) {
      setDeleteOpen(false);
      setEditorOpen(false);
      toast.success(`${target.name} deleted`);
    } else {
      toast.error(`Couldn't delete ${target.name}`, { description: 'Try again in a moment.' });
    }
    load();
  };

  /* ---------- Derived ---------- */
  const counts = useMemo(() => {
    const visible = rows.filter(isShown).length;
    return { all: rows.length, visible, hidden: rows.length - visible };
  }, [rows]);

  const shownRows = useMemo(
    () =>
      sortRows(
        rows.filter((r) => (filter === 'all' || (filter === 'visible') === isShown(r)) && matchesSearch(r, search)),
        sort,
      ),
    [rows, filter, search, sort],
  );

  const brandSuggestions = useMemo(() => Array.from(new Set(['SKMEI', ...rows.map((r) => r.brand).filter(Boolean)])), [rows]);

  const filtersActive = filter !== 'all' || search.trim() !== '';
  const clearFilters = () => {
    setFilter('all');
    setSearch('');
  };

  const filterOptions: SegmentedOption<VisFilter>[] = [
    { value: 'all', label: 'All', icon: <Glasses className="max-sm:hidden" /> },
    {
      value: 'visible',
      label: 'Visible',
      count: isLoading ? undefined : counts.visible,
      icon: <Eye className="max-sm:hidden" />,
      countClassName: 'bg-[#E6F6EC] text-[#15803D]',
    },
    {
      value: 'hidden',
      label: 'Hidden',
      count: isLoading ? undefined : counts.hidden,
      icon: <EyeOff className="max-sm:hidden" />,
      countClassName: 'bg-[#F1EEED] text-[#57534E]',
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

  const showError = loadFailed && !isLoading && rows.length === 0;
  const emptyTitle = filtersActive ? 'No sunglasses found' : 'No sunglasses yet';
  const emptyBody = <EmptyBody filtersActive={filtersActive} onClear={clearFilters} onAdd={() => openEditor(null)} />;

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            Sunglasses
            {!isLoading && !showError && (
              <motion.span
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 480, damping: 22 }}
                className="inline-grid h-7 min-w-8 place-items-center rounded-full bg-adm-canvas-2 px-2.5 font-adm-mono text-[13px] font-semibold tracking-normal text-adm-ink-2"
              >
                {rows.length}
              </motion.span>
            )}
          </span>
        }
        description={
          isLoading || showError
            ? 'Sunglasses with per-color variants, each with its own photos.'
            : `Per-color variants, each with its own photos · ${counts.visible} of ${counts.all} visible in the store.`
        }
        actions={
          <>
            <SectionSwitch visible={sectionVisible} loaded={sectionLoaded} saving={savingSection} onToggle={toggleSection} />
            <Button onClick={() => openEditor(null)} className="max-sm:h-11 max-sm:flex-1">
              <Plus />
              Add sunglasses
            </Button>
          </>
        }
      />

      {showError && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <b className="font-adm-display text-[15px]">Couldn&apos;t load sunglasses</b>
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
              placeholder="Search by name or brand..."
              aria-label="Search sunglasses"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-[1_1_240px] sm:max-w-[360px]"
            />
            <Segmented
              ariaLabel="Filter by store visibility"
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              className="max-sm:[&_[role=tab]]:h-9 max-sm:[&_[role=tab]]:px-2.5"
            />
            <div className="ml-auto max-md:hidden">
              <SortSelect sort={sort} onSort={setSort} />
            </div>
          </div>

          {/* Desktop / tablet: table */}
          <div className="hidden md:block">
            <Table className="min-w-[860px]">
              <TableHeader>
                <tr>
                  <TableHead>Sunglasses</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Stock</TableHead>
                  <TableHead>Colors</TableHead>
                  <TableHead>In store</TableHead>
                  <TableHead className="text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </tr>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeletonRows />
                ) : shownRows.length === 0 ? (
                  <TableEmpty colSpan={6} title={emptyTitle}>
                    {emptyBody}
                  </TableEmpty>
                ) : (
                  shownRows.map((sg, i) => (
                    <MotionRow
                      key={sg.id}
                      data-clickable="true"
                      tabIndex={0}
                      aria-label={`Edit ${sg.name}`}
                      onClick={() => openEditor(sg)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.target !== e.currentTarget) return;
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openEditor(sg);
                        }
                      }}
                      {...rowMotion(i)}
                    >
                      <TableCell className="whitespace-normal">
                        <div className="flex min-w-[220px] items-center gap-3">
                          <Thumb sg={sg} className="size-12" />
                          <div className="min-w-0">
                            <div className={cn('font-semibold leading-snug text-adm-ink', !isShown(sg) && 'text-adm-ink-2')}>{sg.name}</div>
                            <div className="text-xs text-adm-muted">
                              {sg.brand}
                              {sg.gender && ` · ${GENDER_LABEL[sg.gender] ?? sg.gender}`}
                            </div>
                            <Labels sg={sg} className="mt-1" />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <PriceText sg={sg} />
                      </TableCell>
                      <TableCell>
                        <StockBadge n={sg.stock} />
                      </TableCell>
                      <TableCell className="whitespace-normal">
                        <div className="max-w-[170px]" onClick={(e) => e.stopPropagation()}>
                          <Swatches variants={sg.variants} />
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex w-[118px] items-center gap-2.5" onClick={(e) => e.stopPropagation()}>
                          <VisibleSwitch sg={sg} disabled={busy.has(sg.id)} onToggle={() => handleToggleVisible(sg)} />
                          <span className={cn('text-[12.5px] font-semibold', isShown(sg) ? 'text-[#15803D]' : 'text-adm-muted')}>
                            {isShown(sg) ? 'Visible' : 'Hidden'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="inline-flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                          <IconAction label="Edit" data-action="edit" onClick={() => openEditor(sg)}>
                            <Pencil />
                          </IconAction>
                          <IconAction label="Delete" destructive onClick={() => askDelete(sg)}>
                            <Trash2 />
                          </IconAction>
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
              <span>Sunglasses</span>
              <SortSelect sort={sort} onSort={setSort} compact />
            </div>
            {isLoading ? (
              <ListSkeleton />
            ) : shownRows.length === 0 ? (
              <div className="px-5 py-11 text-center text-[13.5px] text-adm-muted">
                <b className="mb-1 block font-adm-display text-[15px] text-adm-ink">{emptyTitle}</b>
                {emptyBody}
              </div>
            ) : (
              <ul>
                {shownRows.map((sg, i) => (
                  <motion.li key={sg.id} className="relative border-b border-adm-line last:border-b-0" {...rowMotion(i)}>
                    <button
                      type="button"
                      onClick={() => openEditor(sg)}
                      aria-label={`Edit ${sg.name}`}
                      className="absolute inset-0 transition-colors hover:bg-[#FCF7F6] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-adm-accent active:bg-[#FCF7F6]"
                    />
                    <div className="pointer-events-none relative flex gap-3 px-4 py-3.5">
                      <Thumb sg={sg} className="size-16" />
                      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <div className="truncate font-semibold text-adm-ink">{sg.name}</div>
                            <div className="truncate text-xs text-adm-muted">
                              {sg.brand}
                              {sg.gender && ` · ${GENDER_LABEL[sg.gender] ?? sg.gender}`}
                            </div>
                          </div>
                          <PriceText sg={sg} align="right" />
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <Swatches variants={sg.variants} max={5} />
                          <Labels sg={sg} />
                        </div>
                        <div className="flex items-center justify-between gap-2">
                          <StockBadge n={sg.stock} long />
                          <div className="pointer-events-auto flex shrink-0 items-center gap-0.5">
                            <VisibleSwitch sg={sg} disabled={busy.has(sg.id)} onToggle={() => handleToggleVisible(sg)} className="mr-2.5" />
                            <Button variant="ghost" size="icon" aria-label={`Edit ${sg.name}`} onClick={() => openEditor(sg)} className="text-adm-muted">
                              <Pencil />
                            </Button>
                            <Button variant="ghost-destructive" size="icon" aria-label={`Delete ${sg.name}`} onClick={() => askDelete(sg)}>
                              <Trash2 />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          <CardFooter>
            <span aria-live="polite">{isLoading ? NBSP : `Showing ${shownRows.length} of ${rows.length}`}</span>
            <span className="hidden sm:inline">Click a row to edit · the switch shows or hides it in the store</span>
          </CardFooter>
        </Card>
      )}

      <SunglassesEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        sessionKey={editorKey}
        item={editing}
        brandSuggestions={brandSuggestions}
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
          <AlertDialogTitle>Delete sunglasses?</AlertDialogTitle>
          <AlertDialogDescription>
            <b className="font-semibold text-adm-ink">{deleteTarget?.name}</b> and all {deleteTarget?.variants.length ?? 0} of its color
            variants will be permanently deleted. This cannot be undone.
          </AlertDialogDescription>
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
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

const MotionRow = motion.create(TableRow);

function SectionSwitch({
  visible,
  loaded,
  saving,
  onToggle,
}: {
  visible: boolean;
  loaded: boolean;
  saving: boolean;
  onToggle: (checked: boolean) => void;
}) {
  return (
    <label
      htmlFor="sv-section-visible"
      className={cn(
        'flex min-h-11 cursor-pointer select-none items-center gap-3 rounded-[14px] border bg-adm-surface py-1.5 pl-2 pr-3.5 shadow-adm-sm transition-colors max-sm:w-full',
        visible ? 'border-[#C9EBD3]' : 'border-adm-line-2',
        !loaded && 'cursor-default',
      )}
    >
      <span
        className={cn(
          'grid size-8 shrink-0 place-items-center rounded-[10px] transition-colors [&_svg]:size-4',
          visible ? 'bg-[#E6F6EC] text-[#16A34A]' : 'bg-adm-canvas-2 text-adm-muted',
        )}
      >
        <House />
      </span>
      <span className="min-w-0 flex-1 leading-tight">
        <b className="block text-[13px] text-adm-ink">Homepage section</b>
        <span className="block text-[11.5px] text-adm-muted">{!loaded ? 'Loading...' : visible ? 'Visible on website' : 'Hidden from website'}</span>
      </span>
      <Switch
        id="sv-section-visible"
        checked={visible}
        disabled={!loaded || saving}
        onCheckedChange={onToggle}
        aria-label="Show the sunglasses section on the homepage"
        className="data-[state=checked]:bg-[#22C55E]"
      />
    </label>
  );
}

function Thumb({ sg, className }: { sg: Sunglasses; className?: string }) {
  const src = firstImage(sg);
  const placeholder = (
    <span className="grid size-full place-items-center text-adm-faint">
      {src ? <ImageOff className="size-[18px]" /> : <Glasses className="size-5" />}
    </span>
  );
  return (
    <span className={cn('relative block shrink-0 overflow-hidden rounded-[12px] border border-adm-line bg-adm-surface-2', className)}>
      {src ? <SafeImg src={src} alt="" loading="lazy" className="size-full object-cover" fallback={placeholder} /> : placeholder}
      {!isShown(sg) && (
        <span className="absolute inset-0 grid place-items-center bg-white/55 text-adm-ink-2 backdrop-blur-[1px]">
          <EyeOff className="size-4" />
        </span>
      )}
    </span>
  );
}

function PriceText({ sg, align }: { sg: Sunglasses; align?: 'right' }) {
  return (
    <div className={cn('shrink-0', align === 'right' && 'text-right')}>
      <div className="font-adm-display text-[15px] font-bold tabular-nums tracking-[-0.01em] text-adm-ink">{formatPrice(sg.price)}</div>
      {sg.originalPrice ? <div className="text-xs tabular-nums text-adm-muted line-through">{formatPrice(sg.originalPrice)}</div> : null}
    </div>
  );
}

function StockBadge({ n, long }: { n: number; long?: boolean }) {
  const tone = stockTone(n);
  const dot = tone === 'red' ? '#DC2626' : tone === 'amber' ? '#F59E0B' : '#16A34A';
  return (
    <Badge tone={tone} dot={dot} className="tabular-nums">
      {n === 0 ? 'Out of stock' : long ? `${n} in stock` : n}
    </Badge>
  );
}

function Labels({ sg, className }: { sg: Sunglasses; className?: string }) {
  if (!sg.isNew && !sg.isBestseller && !sg.onSale) return null;
  return (
    <span className={cn('inline-flex flex-wrap items-center gap-1', className)}>
      {sg.isNew && <Badge tone="red">New</Badge>}
      {sg.isBestseller && <Badge tone="blue">Bestseller</Badge>}
      {sg.onSale && <Badge tone="amber">On sale</Badge>}
    </span>
  );
}

function VisibleSwitch({
  sg,
  disabled,
  onToggle,
  className,
}: {
  sg: Sunglasses;
  disabled?: boolean;
  onToggle: () => void;
  className?: string;
}) {
  const on = isShown(sg);
  return (
    <Tooltip>
      {/* The tooltip trigger is a wrapper span: TooltipTrigger stamps its own data-state on its child,
          which would override the switch's checked/unchecked state (and its colors). */}
      <TooltipTrigger asChild>
        <span className={cn('inline-flex', className)}>
          {/* The ::after pad grows the 22px switch to a ~36px touch target without changing the layout. */}
          <Switch
            checked={on}
            disabled={disabled}
            onCheckedChange={onToggle}
            aria-label={on ? `Hide ${sg.name} from the store` : `Show ${sg.name} in the store`}
            className="relative after:absolute after:-inset-[7px] after:content-[''] data-[state=checked]:bg-[#22C55E]"
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>{on ? 'Hide from store' : 'Show in store'}</TooltipContent>
    </Tooltip>
  );
}

function IconAction({
  label,
  destructive,
  onClick,
  children,
  ...rest
}: {
  label: string;
  destructive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
  'data-action'?: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={destructive ? 'ghost-destructive' : 'ghost'}
          size="icon"
          aria-label={label}
          onClick={onClick}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn(!destructive && 'text-adm-muted')}
          {...rest}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

function SortSelect({ sort, onSort, compact }: { sort: SortKey; onSort: (k: SortKey) => void; compact?: boolean }) {
  return (
    <Select value={sort} onValueChange={(v) => onSort(v as SortKey)}>
      <SelectTrigger
        aria-label="Sort sunglasses"
        className={cn(compact ? 'h-9 w-auto gap-1.5 border-0 bg-transparent px-2 text-[12.5px] font-semibold text-adm-ink-2 shadow-none' : 'w-[188px]')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className={cn(compact && 'min-w-[190px]')}>
        {SORT_KEYS.map((k) => (
          <SelectItem key={k} value={k}>
            {SORT_LABEL[k]}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function EmptyBody({ filtersActive, onClear, onAdd }: { filtersActive: boolean; onClear: () => void; onAdd: () => void }) {
  return (
    <>
      {filtersActive ? 'Try a different search or filter.' : 'Add your first pair, then a color for each frame.'}
      <div className="mt-3.5">
        {filtersActive ? (
          <Button variant="outline" size="sm" className="h-9" onClick={onClear}>
            Clear filters
          </Button>
        ) : (
          <Button variant="soft" size="sm" className="h-9" onClick={onAdd}>
            <Plus />
            Add sunglasses
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
              <Skeleton className="size-12 rounded-[12px]" />
              <div className="space-y-1.5">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[90px]" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-4 w-14" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-12 rounded-full" />
          </TableCell>
          <TableCell>
            <div className="flex gap-1">
              {Array.from({ length: 3 }).map((__, j) => (
                <Skeleton key={j} className="size-[18px] rounded-full" />
              ))}
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-[22px] w-[90px] rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-8 w-[72px]" />
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
          <Skeleton className="size-16 shrink-0 rounded-[12px]" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex justify-between gap-3">
              <Skeleton className="h-4 w-[130px]" />
              <Skeleton className="h-4 w-12" />
            </div>
            <Skeleton className="h-3 w-[90px]" />
            <Skeleton className="h-6 w-[110px] rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}
