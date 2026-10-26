'use client';

import { type ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDownUp, Check, GripVertical, Layers, Loader2, Plus, RotateCw, Search, SearchX, X } from 'lucide-react';
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
import { Segmented } from '@/components/admin/ui/segmented';
import { toast } from '@/components/admin/ui/sonner';
import { CategoryCard, CategoryCardSkeleton } from './CategoryCard';
import { CategoryEditor, type SaveResult } from './CategoryEditor';
import { ReorderList } from './ReorderList';
import { type Category, readError, storeOrder } from './model';

type Filter = 'all' | 'no-image' | 'no-icon';

// The old table could sort by name, slug, description and order; same choices here.
const SORTS = {
  store: { label: 'Store order', fn: null },
  'name-asc': { label: 'Name A–Z', fn: (a: Category, b: Category) => a.name.localeCompare(b.name) },
  'name-desc': { label: 'Name Z–A', fn: (a: Category, b: Category) => b.name.localeCompare(a.name) },
  slug: { label: 'Slug A–Z', fn: (a: Category, b: Category) => a.slug.localeCompare(b.slug) },
  description: { label: 'Description A–Z', fn: (a: Category, b: Category) => (a.description ?? '').localeCompare(b.description ?? '') },
} as const;
type SortKey = keyof typeof SORTS;

const plural = (n: number) => `${n} categor${n === 1 ? 'y' : 'ies'}`;

export function CategoriesView() {
  const reduce = useReducedMotion();

  /* ---------- Data ---------- */
  const [categories, setCategories] = useState<Category[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [productCounts, setProductCounts] = useState<Map<string, number> | null>(null);

  const load = useCallback(() => {
    fetch('/api/admin/categories')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => {
        setCategories(Array.isArray(data) ? data : []);
        setStatus('ready');
      })
      .catch(() => setStatus((s) => (s === 'ready' ? 'ready' : 'error')));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // Read-only: how many products sit in each category (shown on cards and in the delete prompt).
  useEffect(() => {
    fetch('/api/admin/products')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!Array.isArray(data)) return;
        const counts = new Map<string, number>();
        for (const p of data as { category?: string }[]) {
          if (p.category) counts.set(p.category, (counts.get(p.category) ?? 0) + 1);
        }
        setProductCounts(counts);
      })
      .catch(() => {});
  }, []);

  const retry = () => {
    setStatus('loading');
    load();
  };

  const ordered = useMemo(() => storeOrder(categories), [categories]);
  const position = useMemo(() => new Map(ordered.map((c, i) => [c.id, i + 1])), [ordered]);
  const countFor = (slug: string) => (productCounts ? (productCounts.get(slug) ?? 0) : undefined);

  /* ---------- Filters ---------- */
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');
  const [sort, setSort] = useState<SortKey>('store');
  const ready = status === 'ready';

  const filterOptions = useMemo(
    () => [
      { value: 'all' as const, label: 'All', count: ready ? categories.length : undefined },
      { value: 'no-image' as const, label: 'No image', count: ready ? categories.filter((c) => !c.image).length : undefined },
      { value: 'no-icon' as const, label: 'No icon', count: ready ? categories.filter((c) => !c.icon).length : undefined },
    ],
    [categories, ready],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = ordered.filter((c) => {
      const matchesSearch =
        !q || c.name.toLowerCase().includes(q) || c.slug.toLowerCase().includes(q) || (c.description ?? '').toLowerCase().includes(q);
      const matchesFilter = filter === 'all' || (filter === 'no-image' ? !c.image : !c.icon);
      return matchesSearch && matchesFilter;
    });
    const fn = SORTS[sort].fn;
    return fn ? [...list].sort(fn) : list;
  }, [ordered, query, filter, sort]);

  const filtersActive = !!query.trim() || filter !== 'all';
  const clearFilters = () => {
    setQuery('');
    setFilter('all');
  };

  /* ---------- Editor ---------- */
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Category | null>(null);
  const [editorSession, setEditorSession] = useState(0);

  const openAdd = () => {
    setEditing(null);
    setEditorSession((n) => n + 1);
    setEditorOpen(true);
  };
  const openEdit = (cat: Category) => {
    setEditing(cat);
    setEditorSession((n) => n + 1);
    setEditorOpen(true);
  };
  const onSaved = (result: SaveResult, name: string) => {
    setEditorOpen(false);
    toast.success(result === 'created' ? 'Category added' : 'Changes saved', { description: name });
    load();
  };

  /* ---------- Delete ---------- */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteCount = deleteTarget ? countFor(deleteTarget.slug) : undefined;

  const askDelete = (cat: Category) => {
    setDeleteTarget(cat);
    setDeleteOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/categories/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('Category deleted', { description: deleteTarget.name });
      setDeleteOpen(false);
      setEditorOpen(false);
      load();
    } catch (err) {
      toast.error("Couldn't delete the category", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- Reorder mode ---------- */
  const [reorderMode, setReorderMode] = useState(false);
  const [reorderList, setReorderList] = useState<Category[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const enterReorder = () => {
    setReorderList(storeOrder(categories));
    setReorderMode(true);
  };
  const saveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const res = await fetch('/api/admin/categories/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: reorderList.map((c, i) => ({ id: c.id, sortOrder: i })) }),
      });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('Category order saved');
      setReorderMode(false);
      // Reflect the new order right away, then refresh from the server.
      setCategories(reorderList.map((c, i) => ({ ...c, sort_order: i })));
      load();
    } catch (err) {
      toast.error("Couldn't save the order", {
        description: `${err instanceof Error ? err.message : 'Request failed'}. Make sure the sort_order column exists in your categories table.`,
      });
    } finally {
      setIsSavingOrder(false);
    }
  };

  /* ---------- Render ---------- */
  const missingImages = categories.filter((c) => !c.image).length;
  const description =
    status === 'loading'
      ? 'Loading categories…'
      : reorderMode
        ? 'Drag categories into the order customers see them in the store.'
        : `${plural(categories.length)} in the store${missingImages ? ` · ${missingImages} without an image` : ''}`;

  return (
    <>
      <PageHeader
        title={reorderMode ? 'Reorder categories' : 'Categories'}
        description={description}
        actions={
          reorderMode ? (
            <>
              <Button variant="outline" onClick={() => setReorderMode(false)} disabled={isSavingOrder}>
                Cancel
              </Button>
              <Button onClick={saveOrder} disabled={isSavingOrder}>
                {isSavingOrder ? <Loader2 className="animate-spin" /> : <Check />}
                {isSavingOrder ? 'Saving…' : 'Save order'}
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" onClick={enterReorder} disabled={status !== 'ready' || categories.length < 2}>
                <GripVertical />
                Reorder
              </Button>
              <Button onClick={openAdd}>
                <Plus />
                Add category
              </Button>
            </>
          )
        }
      />

      {reorderMode ? (
        <>
          <p className="mb-3 text-[13px] text-adm-muted">
            Drag rows by the handle, or use the arrows. Categories appear in this order in the store. Click{' '}
            <b className="text-adm-ink-2">Save order</b> when done.
          </p>
          <Card className="overflow-hidden">
            <ReorderList items={reorderList} onChange={setReorderList} />
          </Card>
        </>
      ) : (
        <>
          {/* Toolbar */}
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <SearchInput
              icon={<Search />}
              placeholder="Search name, slug or description"
              aria-label="Search categories"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              className="order-1 min-w-0 flex-1 sm:w-[320px] sm:flex-none"
            />
            <Segmented
              ariaLabel="Filter categories"
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              className="order-3 w-full min-w-0 sm:order-2 sm:w-auto"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" aria-label={`Sort: ${SORTS[sort].label}`} className="order-2 sm:order-3 sm:ml-auto">
                  <ArrowDownUp />
                  <span className="max-sm:sr-only">{SORTS[sort].label}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                  {(Object.keys(SORTS) as SortKey[]).map((k) => (
                    <DropdownMenuRadioItem key={k} value={k}>
                      {SORTS[k].label}
                    </DropdownMenuRadioItem>
                  ))}
                </DropdownMenuRadioGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div className="mb-4 flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-adm-muted">
            <span>
              {status === 'loading'
                ? 'Loading...'
                : `Showing ${filtered.length} of ${plural(categories.length)}${sort === 'store' ? ' · store order' : ''}`}
            </span>
            {filtersActive && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex h-7 items-center gap-1 rounded-[8px] px-2 font-semibold text-adm-accent-hover transition-colors hover:bg-adm-accent-soft"
              >
                <X className="size-3.5" />
                Clear filters
              </button>
            )}
          </div>

          {status === 'error' ? (
            <Card className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
              <div>
                <b className="font-adm-display text-[15px]">Couldn&apos;t load categories</b>
                <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
              </div>
              <Button variant="outline" onClick={retry}>
                <RotateCw />
                Try again
              </Button>
            </Card>
          ) : status === 'loading' ? (
            <CategoryGrid>
              {Array.from({ length: 5 }, (_, i) => (
                <CategoryCardSkeleton key={i} />
              ))}
            </CategoryGrid>
          ) : filtered.length === 0 ? (
            <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="flex flex-col items-center px-6 py-14 text-center">
                <span className="mb-3 grid size-12 place-items-center rounded-[14px] bg-adm-accent-soft text-adm-accent-hover">
                  {categories.length === 0 ? <Layers className="size-6" /> : <SearchX className="size-6" />}
                </span>
                <b className="font-adm-display text-[17px]">{categories.length === 0 ? 'No categories yet' : 'No categories found'}</b>
                <p className="mt-1 text-[13.5px] text-adm-muted">
                  {categories.length === 0 ? 'Add one to group your watches in the store.' : 'Try another search or filter.'}
                </p>
                <div className="mt-4">
                  {categories.length === 0 ? (
                    <Button onClick={openAdd}>
                      <Plus />
                      Add category
                    </Button>
                  ) : (
                    <Button variant="outline" onClick={clearFilters}>
                      <X />
                      Clear filters
                    </Button>
                  )}
                </div>
              </Card>
            </motion.div>
          ) : (
            <CategoryGrid>
              {filtered.map((c, i) => (
                <CategoryCard
                  key={c.id}
                  category={c}
                  index={i}
                  position={position.get(c.id) ?? i + 1}
                  productCount={countFor(c.slug)}
                  onEdit={() => openEdit(c)}
                  onDelete={() => askDelete(c)}
                />
              ))}
            </CategoryGrid>
          )}
        </>
      )}

      <CategoryEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        sessionKey={editorSession}
        category={editing}
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
          <AlertDialogTitle>Delete category?</AlertDialogTitle>
          <AlertDialogDescription>
            <b className="font-semibold text-adm-ink">{deleteTarget?.name}</b> will be permanently deleted. This cannot be undone.
            {!!deleteCount && (
              <span className="mt-2 block rounded-[10px] bg-[#FEF3E2] px-3 py-2 text-[13px] text-[#92400E]">
                {deleteCount === 1 ? '1 product is' : `${deleteCount} products are`} still in this category.
              </span>
            )}
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

function CategoryGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(200px,1fr))] sm:gap-4">{children}</div>;
}
