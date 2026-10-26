'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDownUp, Check, GripVertical, Loader2, Plus, RotateCw, Search, SearchX, Watch, X } from 'lucide-react';
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
import { Chips, Segmented } from '@/components/admin/ui/segmented';
import { toast } from '@/components/admin/ui/sonner';
import type { Product } from '@/types';
import { ProductCard, ProductCardSkeleton } from './ProductCard';
import { ProductEditor, type SaveResult } from './ProductEditor';
import { ReorderList } from './ReorderList';
import { type BrandOption, type CategoryOption, readError, stockLevel } from './model';

type StockFilter = 'all' | 'in-stock' | 'low-stock' | 'out-of-stock' | 'hidden';

const SORTS = {
  store: { label: 'Store order', fn: null },
  'name-asc': { label: 'Name A–Z', fn: (a: Product, b: Product) => a.name.localeCompare(b.name) },
  'name-desc': { label: 'Name Z–A', fn: (a: Product, b: Product) => b.name.localeCompare(a.name) },
  'price-asc': { label: 'Price: low to high', fn: (a: Product, b: Product) => a.price - b.price },
  'price-desc': { label: 'Price: high to low', fn: (a: Product, b: Product) => b.price - a.price },
  'stock-asc': { label: 'Stock: low to high', fn: (a: Product, b: Product) => a.stock - b.stock },
  'stock-desc': { label: 'Stock: high to low', fn: (a: Product, b: Product) => b.stock - a.stock },
  brand: { label: 'Brand A–Z', fn: (a: Product, b: Product) => (a.brand ?? '').localeCompare(b.brand ?? '') },
  category: { label: 'Category A–Z', fn: (a: Product, b: Product) => (a.category ?? '').localeCompare(b.category ?? '') },
} as const;
type SortKey = keyof typeof SORTS;

/** Same order the store uses: display order, then newest first. */
function storeOrder(list: Product[]) {
  return [...list].sort((a, b) => {
    const ao = a.sortOrder ?? 0;
    const bo = b.sortOrder ?? 0;
    return ao !== bo ? ao - bo : new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function ProductsView() {
  const reduce = useReducedMotion();
  const searchParams = useSearchParams();
  const qParam = searchParams.get('q') ?? '';

  /* ---------- Data ---------- */
  const [products, setProducts] = useState<Product[]>([]);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [brands, setBrands] = useState<BrandOption[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);

  const loadProducts = useCallback(() => {
    fetch('/api/admin/products')
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setStatus('ready');
      })
      .catch(() => setStatus((s) => (s === 'ready' ? 'ready' : 'error')));
  }, []);

  useEffect(() => {
    loadProducts();
  }, [loadProducts]);

  useEffect(() => {
    fetch('/api/admin/brands')
      .then((r) => r.json())
      .then((data) => setBrands(Array.isArray(data) ? data : []))
      .catch(() => {});
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const retry = () => {
    setStatus('loading');
    loadProducts();
  };

  /* ---------- Filters (search is prefilled from ?q=, e.g. from the ⌘K menu) ---------- */
  const [query, setQuery] = useState(qParam);
  const [seenQ, setSeenQ] = useState(qParam);
  if (qParam !== seenQ) {
    setSeenQ(qParam);
    setQuery(qParam);
  }
  const [category, setCategory] = useState('all');
  const [stock, setStock] = useState<StockFilter>('all');
  const [sort, setSort] = useState<SortKey>('store');

  const categoryName = useMemo(() => new Map(categories.map((c) => [c.slug, c.name])), [categories]);

  // Counts stay hidden until the products have loaded, so "0" never shows by mistake.
  const ready = status === 'ready';
  const categoryOptions = useMemo(() => {
    const count = (slug: string) => (ready ? products.filter((p) => p.category === slug).length : undefined);
    return [
      { value: 'all', label: 'All', count: ready ? products.length : undefined },
      ...categories.map((c) => ({ value: c.slug, label: c.name, count: count(c.slug) })),
    ];
  }, [categories, products, ready]);

  const hiddenCount = products.filter((p) => p.isVisible === false).length;
  const stockOptions = useMemo(() => {
    const n = (lvl: string) => (ready ? products.filter((p) => stockLevel(p.stock) === lvl).length : undefined);
    return [
      { value: 'all' as const, label: 'All', count: ready ? products.length : undefined },
      { value: 'in-stock' as const, label: 'In stock', count: n('in-stock'), countClassName: 'bg-[#E6F6EC] text-[#15803D]' },
      { value: 'low-stock' as const, label: 'Low stock', count: n('low-stock'), countClassName: 'bg-[#FEF3E2] text-[#B45309]' },
      { value: 'out-of-stock' as const, label: 'Out of stock', count: n('out-of-stock') },
      { value: 'hidden' as const, label: 'Hidden', count: ready ? hiddenCount : undefined, countClassName: 'bg-[#F1EEED] text-[#57534E]' },
    ];
  }, [products, ready, hiddenCount]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = products.filter((p) => {
      const matchesSearch =
        !q || p.name.toLowerCase().includes(q) || (p.sku ?? '').toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q);
      const matchesCategory = category === 'all' || p.category === category;
      const matchesStock = stock === 'all' ? true : stock === 'hidden' ? p.isVisible === false : stockLevel(p.stock) === stock;
      return matchesSearch && matchesCategory && matchesStock;
    });
    const fn = SORTS[sort].fn;
    return fn ? [...list].sort(fn) : list;
  }, [products, query, category, stock, sort]);

  const filtersActive = !!query.trim() || category !== 'all' || stock !== 'all';
  const clearFilters = () => {
    setQuery('');
    setCategory('all');
    setStock('all');
  };

  /* ---------- Editor ---------- */
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<Product | null>(null);
  const [editorSession, setEditorSession] = useState(0);

  const openAdd = () => {
    setEditing(null);
    setEditorSession((n) => n + 1);
    setEditorOpen(true);
  };
  const openEdit = (product: Product) => {
    setEditing(product);
    setEditorSession((n) => n + 1);
    setEditorOpen(true);
  };
  const onSaved = (result: SaveResult, name: string) => {
    setEditorOpen(false);
    toast.success(result === 'created' ? 'Product added' : 'Changes saved', { description: name });
    loadProducts();
  };

  /* ---------- Delete ---------- */
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const askDelete = (product: Product) => {
    setDeleteTarget(product);
    setDeleteOpen(true);
  };
  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('Product deleted', { description: deleteTarget.name });
      setDeleteOpen(false);
      setEditorOpen(false);
      loadProducts();
    } catch (err) {
      toast.error("Couldn't delete the product", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsDeleting(false);
    }
  };

  /* ---------- Reorder mode ---------- */
  const [reorderMode, setReorderMode] = useState(false);
  const [ordered, setOrdered] = useState<Product[]>([]);
  const [isSavingOrder, setIsSavingOrder] = useState(false);

  const enterReorder = () => {
    setOrdered(storeOrder(products));
    setReorderMode(true);
  };
  const saveOrder = async () => {
    setIsSavingOrder(true);
    try {
      const res = await fetch('/api/admin/products/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: ordered.map((p, i) => ({ id: p.id, sortOrder: i })) }),
      });
      if (!res.ok) throw new Error(await readError(res));
      toast.success('Store order saved');
      setReorderMode(false);
      loadProducts();
    } catch (err) {
      toast.error("Couldn't save the order", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setIsSavingOrder(false);
    }
  };

  /* ---------- Render ---------- */
  const description =
    status === 'loading'
      ? 'Loading your catalog…'
      : reorderMode
        ? 'Drag products into the order customers see them in the store.'
        : `${products.length} products in the store${hiddenCount ? ` · ${hiddenCount} hidden` : ''}`;

  return (
    <>
      <PageHeader
        title={reorderMode ? 'Reorder products' : 'Products'}
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
              <Button variant="outline" onClick={enterReorder} disabled={status !== 'ready' || products.length < 2}>
                <GripVertical />
                Reorder
              </Button>
              <Button onClick={openAdd}>
                <Plus />
                Add product
              </Button>
            </>
          )
        }
      />

      {reorderMode ? (
        <>
          <p className="mb-3 text-[13px] text-adm-muted">
            Drag rows by the handle, or use the arrows. Products appear in this order in the store. Click <b className="text-adm-ink-2">Save order</b> when
            done.
          </p>
          <Card className="overflow-hidden">
            <ReorderList items={ordered} onChange={setOrdered} />
          </Card>
        </>
      ) : (
        <>
          {/* Toolbar */}
          <div className="mb-3 flex flex-wrap items-center gap-2.5">
            <SearchInput
              icon={<Search />}
              placeholder="Search name, SKU or brand"
              aria-label="Search products"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              className="order-1 min-w-0 flex-1 sm:w-[320px] sm:flex-none"
            />
            <Segmented
              ariaLabel="Filter by stock"
              options={stockOptions}
              value={stock}
              onChange={setStock}
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
          <Chips ariaLabel="Filter by category" options={categoryOptions} value={category} onChange={setCategory} className="mb-3" />

          <div className="mb-4 flex min-h-6 flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-adm-muted">
            <span>{status === 'loading' ? 'Loading...' : `Showing ${filtered.length} of ${products.length} products`}</span>
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
                <b className="font-adm-display text-[15px]">Couldn&apos;t load products</b>
                <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
              </div>
              <Button variant="outline" onClick={retry}>
                <RotateCw />
                Try again
              </Button>
            </Card>
          ) : status === 'loading' ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-4">
              {Array.from({ length: 8 }, (_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <motion.div initial={reduce ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="flex flex-col items-center px-6 py-14 text-center">
                <span className="mb-3 grid size-12 place-items-center rounded-[14px] bg-adm-accent-soft text-adm-accent-hover">
                  {products.length === 0 ? <Watch className="size-6" /> : <SearchX className="size-6" />}
                </span>
                <b className="font-adm-display text-[17px]">{products.length === 0 ? 'No products yet' : 'No products found'}</b>
                <p className="mt-1 text-[13.5px] text-adm-muted">
                  {products.length === 0 ? 'Add your first watch to start selling.' : 'Try another name, category or stock filter.'}
                </p>
                <div className="mt-4">
                  {products.length === 0 ? (
                    <Button onClick={openAdd}>
                      <Plus />
                      Add product
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
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-4">
              {filtered.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  index={i}
                  categoryName={categoryName.get(p.category) ?? p.category}
                  onEdit={() => openEdit(p)}
                  onDelete={() => askDelete(p)}
                />
              ))}
            </div>
          )}
        </>
      )}

      <ProductEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        sessionKey={editorSession}
        product={editing}
        brands={brands}
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
          <AlertDialogTitle>Delete product?</AlertDialogTitle>
          <AlertDialogDescription>
            <b className="font-semibold text-adm-ink">{deleteTarget?.name}</b> will be permanently deleted. This cannot be undone.
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

export function ProductsSkeleton() {
  return (
    <>
      <PageHeader title="Products" description="Loading your catalog…" />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] sm:gap-4">
        {Array.from({ length: 8 }, (_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </>
  );
}
