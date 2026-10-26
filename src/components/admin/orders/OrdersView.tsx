'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronsUpDown, Globe, MessageCircle, RotateCw, Search } from 'lucide-react';
import { PageHeader } from '@/components/admin/PageHeader';
import { Button } from '@/components/admin/ui/button';
import { Card, CardFooter } from '@/components/admin/ui/card';
import { SearchInput } from '@/components/admin/ui/input';
import { Segmented, type SegmentedOption } from '@/components/admin/ui/segmented';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { Table, TableBody, TableCell, TableEmpty, TableHead, TableHeader, TableRow } from '@/components/admin/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/admin/ui/dropdown-menu';
import { toast } from '@/components/admin/ui/sonner';
import { ORDER_STATUS, ORDER_STATUSES, isOrderStatus, type OrderStatus } from '@/components/admin/status';
import { ORDERS_CHANGED_EVENT } from '@/components/admin/shell/nav';
import { cn, formatPrice } from '@/lib/utils';
import type { Order } from '@/types';
import { CustomerAvatar, ItemThumbs, SourceBadge, customerName, customerSubline, displayPhone, fmtDay, fmtTime, sourceOf, unitCount, type OrderSource } from './parts';
import { StatusMenu } from './StatusMenu';
import { DeleteOrderDialog, OrderSheet } from './OrderSheet';
import { buildWhatsAppLink } from './whatsapp';

type StatusFilter = 'all' | OrderStatus;
type SourceFilter = 'all' | OrderSource;
type SortKey = 'orderNumber' | 'customer' | 'createdAt' | 'items' | 'total';
type SortState = { key: SortKey | ''; dir: 'asc' | 'desc' };

const SORT_LABEL: Record<SortKey, string> = { orderNumber: 'Order', customer: 'Customer', createdAt: 'Date', items: 'Items', total: 'Total' };
const SORT_KEYS = Object.keys(SORT_LABEL) as SortKey[];
const EASE = [0.2, 0.8, 0.2, 1] as const;
const NBSP = String.fromCharCode(160);

function sortValue(o: Order, key: SortKey): string | number {
  switch (key) {
    case 'orderNumber':
      return o.orderNumber;
    case 'customer':
      return customerName(o).trim().toLowerCase();
    case 'createdAt':
      return o.createdAt;
    case 'items':
      return unitCount(o);
    case 'total':
      return o.total;
  }
}

const notifyChanged = () => window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));
const statusLabel = (s: string) => (isOrderStatus(s) ? ORDER_STATUS[s].label : s);

export function OrdersView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const statusParam = searchParams.get('status');
  const qParam = searchParams.get('q');
  const openParam = searchParams.get('open');
  const reduce = useReducedMotion();

  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [searchQuery, setSearchQuery] = useState(qParam ?? '');
  const [selectedStatus, setSelectedStatus] = useState<StatusFilter>(() => (statusParam && isOrderStatus(statusParam) ? statusParam : 'all'));
  const [selectedSource, setSelectedSource] = useState<SourceFilter>('all');
  const [sort, setSort] = useState<SortState>({ key: '', dir: 'asc' });
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState('');
  const [isSavingStatus, setIsSavingStatus] = useState(false);
  const [statusSaved, setStatusSaved] = useState(false);
  const [inlineUpdating, setInlineUpdating] = useState<Record<string, boolean>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Deep links (?status=, ?q=) can change while this page stays mounted, e.g. from ⌘K search.
  const [seenParams, setSeenParams] = useState({ status: statusParam, q: qParam });
  if (seenParams.status !== statusParam || seenParams.q !== qParam) {
    setSeenParams({ status: statusParam, q: qParam });
    if (statusParam !== seenParams.status && statusParam && isOrderStatus(statusParam)) setSelectedStatus(statusParam);
    if (qParam !== seenParams.q && qParam !== null) setSearchQuery(qParam);
  }

  const loadOrders = useCallback(() => {
    fetch('/api/admin/orders')
      .then((r) => r.json())
      .then((data) => {
        setOrders(Array.isArray(data) ? data : []);
        setLoadFailed(!Array.isArray(data));
        setIsLoading(false);
      })
      .catch(() => {
        setLoadFailed(true);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadOrders();
  }, [loadOrders]);

  const retryLoad = () => {
    setLoadFailed(false);
    setIsLoading(true);
    loadOrders();
  };

  const handleRowClick = (order: Order) => {
    setSelectedOrder(order);
    setUpdatingStatus(order.status);
    setStatusSaved(false);
    setSheetOpen(true);
  };

  // ?open=<orderId> opens that order once the list has loaded.
  const [openedFor, setOpenedFor] = useState<string | null>(null);
  if (!isLoading && openParam !== openedFor) {
    setOpenedFor(openParam);
    const target = openParam ? orders.find((o) => o.id === openParam) : undefined;
    if (target) handleRowClick(target);
  }

  const closeSheet = () => {
    setSheetOpen(false);
    if (searchParams.has('open')) {
      const next = new URLSearchParams(searchParams.toString());
      next.delete('open');
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    }
  };

  const statusCounts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: orders.length, pending: 0, confirmed: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0 };
    for (const o of orders) if (isOrderStatus(o.status)) c[o.status]++;
    return c;
  }, [orders]);

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const name = `${order.customer.firstName} ${order.customer.lastName}`;
      const matchesSearch =
        order.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) || name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = selectedStatus === 'all' || order.status === selectedStatus;
      const matchesSource = selectedSource === 'all' || (order.source ?? 'website') === selectedSource;
      return matchesSearch && matchesStatus && matchesSource;
    });
  }, [orders, searchQuery, selectedStatus, selectedSource]);

  const visibleOrders = useMemo(() => {
    const { key, dir } = sort;
    if (!key) return filteredOrders;
    return [...filteredOrders].sort((a, b) => {
      const av = sortValue(a, key);
      const bv = sortValue(b, key);
      if (av < bv) return dir === 'asc' ? -1 : 1;
      if (av > bv) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredOrders, sort]);

  const handleSort = (key: SortKey) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const filtersActive = selectedStatus !== 'all' || selectedSource !== 'all' || searchQuery !== '';
  const clearFilters = () => {
    setSelectedStatus('all');
    setSelectedSource('all');
    setSearchQuery('');
    if (searchParams.has('status') || searchParams.has('q')) router.replace(pathname, { scroll: false });
  };

  /* ---------- Actions (same requests and WhatsApp behavior as before) ---------- */

  const handleInlineStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const order = orders.find((o) => o.id === orderId);
    setInlineUpdating((prev) => ({ ...prev, [orderId]: true }));
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus as Order['status'] } : o)));
    let res: Response;
    try {
      res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
    } catch {
      setInlineUpdating((prev) => ({ ...prev, [orderId]: false }));
      toast.error(`Couldn't update ${order?.orderNumber ?? 'the order'}`, { description: 'Check your connection and try again.' });
      loadOrders();
      return;
    }
    setInlineUpdating((prev) => ({ ...prev, [orderId]: false }));
    if (!res.ok) {
      // Put the real status back and don't message the customer about a change that wasn't saved.
      toast.error(`Couldn't update ${order?.orderNumber ?? 'the order'}`, { description: 'The status was not changed. Please try again.' });
      loadOrders();
      return;
    }
    notifyChanged();
    toast.success(`${order?.orderNumber ?? 'Order'} marked as ${statusLabel(newStatus).toLowerCase()}`);
    if (order) {
      const waLink = buildWhatsAppLink(order, newStatus);
      if (waLink) window.open(waLink, '_blank');
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedOrder || !updatingStatus) return;
    setIsSavingStatus(true);
    let res: Response;
    try {
      res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: updatingStatus }),
      });
    } catch {
      setIsSavingStatus(false);
      toast.error(`Couldn't update ${selectedOrder.orderNumber}`, { description: 'Check your connection and try again.' });
      return;
    }
    setIsSavingStatus(false);
    if (!res.ok) {
      toast.error(`Couldn't update ${selectedOrder.orderNumber}`, { description: 'The status was not changed. Please try again.' });
      return;
    }
    setStatusSaved(true);
    loadOrders();
    notifyChanged();
    toast.success(`${selectedOrder.orderNumber} marked as ${statusLabel(updatingStatus).toLowerCase()}`);
    const waLink = buildWhatsAppLink(selectedOrder, updatingStatus);
    if (waLink) window.open(waLink, '_blank');
  };

  const handleDeleteOrder = async () => {
    if (!selectedOrder) return;
    setIsDeleting(true);
    let res: Response;
    try {
      res = await fetch(`/api/admin/orders/${selectedOrder.id}`, { method: 'DELETE' });
    } catch {
      setIsDeleting(false);
      toast.error(`Couldn't delete ${selectedOrder.orderNumber}`, { description: 'Check your connection and try again.' });
      return;
    }
    setIsDeleting(false);
    setDeleteConfirmOpen(false);
    closeSheet();
    loadOrders();
    notifyChanged();
    if (res.ok) toast.success(`Order ${selectedOrder.orderNumber} deleted`);
    else toast.error(`Couldn't delete ${selectedOrder.orderNumber}`, { description: 'Refresh to check whether it was removed.' });
  };

  // Show the live copy of the selected order (fresh after a reload); fall back to the snapshot once it's gone.
  const sheetOrder = (selectedOrder && orders.find((o) => o.id === selectedOrder.id)) ?? selectedOrder;

  /* ---------- Filter options ---------- */

  const statusOptions: SegmentedOption<StatusFilter>[] = [
    { value: 'all', label: 'All', count: statusCounts.all },
    ...ORDER_STATUSES.map((s) => ({ value: s, label: ORDER_STATUS[s].label, count: statusCounts[s], countClassName: ORDER_STATUS[s].countClass })),
  ];
  const sourceOptions: SegmentedOption<SourceFilter>[] = [
    { value: 'all', label: 'All sources' },
    { value: 'website', label: 'Website', icon: <Globe /> },
    { value: 'whatsapp', label: 'WhatsApp', icon: <MessageCircle /> },
  ];

  const rowMotion = (i: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.42, delay: Math.min(i, 12) * 0.035, ease: EASE },
        };

  const showError = loadFailed && !isLoading && orders.length === 0;

  return (
    <>
      <PageHeader title="Orders" description="View and manage all customer orders. Click an order to see everything about it." />

      {showError && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <b className="font-adm-display text-[15px]">Couldn&apos;t load orders</b>
            <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
          </div>
          <Button variant="outline" onClick={retryLoad}>
            <RotateCw />
            Try again
          </Button>
        </Card>
      )}

      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
          <Segmented ariaLabel="Filter by status" options={statusOptions} value={selectedStatus} onChange={setSelectedStatus} />
          <div className="flex flex-wrap items-center gap-3">
            <SearchInput
              icon={<Search />}
              placeholder="Search by order number or customer name"
              aria-label="Search orders"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-[1_1_260px] sm:max-w-[420px]"
            />
            <Segmented ariaLabel="Filter by source" options={sourceOptions} value={selectedSource} onChange={setSelectedSource} />
          </div>
        </div>

        {/* Desktop / tablet: table */}
        <div className="hidden md:block">
          <Table className="min-w-[880px]">
            <TableHeader>
              <tr>
                <SortHead k="orderNumber" sort={sort} onSort={handleSort} />
                <SortHead k="customer" sort={sort} onSort={handleSort} />
                <SortHead k="createdAt" sort={sort} onSort={handleSort} />
                <SortHead k="items" sort={sort} onSort={handleSort} />
                <TableHead>Source</TableHead>
                <SortHead k="total" sort={sort} onSort={handleSort} align="right" />
                <TableHead>Status</TableHead>
              </tr>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableSkeletonRows />
              ) : showError ? null : visibleOrders.length === 0 ? (
                <TableEmpty colSpan={7} title={filtersActive || orders.length > 0 ? 'No orders found' : 'No orders yet'}>
                  <EmptyBody filtersActive={filtersActive} onClear={clearFilters} />
                </TableEmpty>
              ) : (
                visibleOrders.map((o, i) => {
                  const name = customerName(o);
                  return (
                    <MotionRow
                      key={o.id}
                      data-clickable="true"
                      tabIndex={0}
                      aria-label={`Open order ${o.orderNumber}`}
                      onClick={() => handleRowClick(o)}
                      onKeyDown={(e: React.KeyboardEvent) => {
                        if (e.key === 'Enter') handleRowClick(o);
                      }}
                      {...rowMotion(i)}
                    >
                      <TableCell>
                        <span className="font-adm-mono text-[12.5px] font-semibold tracking-[-0.01em] text-adm-accent-hover">{o.orderNumber}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2.5">
                          <CustomerAvatar name={name} />
                          <div className="min-w-0">
                            <div className="max-w-[220px] truncate font-semibold">{name}</div>
                            <div className="max-w-[220px] truncate text-xs text-adm-muted">{customerSubline(o)}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>{fmtDay(o.createdAt)}</div>
                        <div className="text-xs text-adm-muted">{fmtTime(o.createdAt)}</div>
                      </TableCell>
                      <TableCell>
                        <ItemThumbs order={o} />
                      </TableCell>
                      <TableCell>
                        <SourceBadge source={sourceOf(o)} />
                      </TableCell>
                      <TableCell className="text-right font-bold tabular-nums">{formatPrice(o.total)}</TableCell>
                      <TableCell>
                        <StatusMenu
                          status={o.status}
                          orderNumber={o.orderNumber}
                          disabled={!!inlineUpdating[o.id]}
                          onChange={(s) => handleInlineStatusChange(o.id, s)}
                        />
                      </TableCell>
                    </MotionRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Phones: stacked list */}
        <div className="md:hidden">
          <div className="flex items-center justify-between gap-3 border-y border-adm-line bg-adm-surface-2 py-1.5 pl-4 pr-2 text-[12.5px] font-semibold text-adm-muted">
            <span>Orders</span>
            <MobileSort sort={sort} onSort={handleSort} />
          </div>
          {isLoading ? (
            <ListSkeleton />
          ) : showError ? null : visibleOrders.length === 0 ? (
            <div className="px-5 py-11 text-center text-[13.5px] text-adm-muted">
              <b className="mb-1 block font-adm-display text-[15px] text-adm-ink">
                {filtersActive || orders.length > 0 ? 'No orders found' : 'No orders yet'}
              </b>
              <EmptyBody filtersActive={filtersActive} onClear={clearFilters} />
            </div>
          ) : (
            <ul>
              {visibleOrders.map((o, i) => {
                const name = customerName(o);
                return (
                  <motion.li key={o.id} className="relative border-b border-adm-line last:border-b-0" {...rowMotion(i)}>
                    <button
                      type="button"
                      onClick={() => handleRowClick(o)}
                      aria-label={`Open order ${o.orderNumber}`}
                      className="absolute inset-0 transition-colors hover:bg-[#FCF7F6] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-adm-accent active:bg-[#FCF7F6]"
                    />
                    <div className="pointer-events-none relative flex flex-col gap-2.5 px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <CustomerAvatar name={name} className="size-9 text-xs" />
                          <div className="min-w-0">
                            <div className="truncate font-semibold">{name}</div>
                            {o.customer.phone && <div className="truncate text-xs tabular-nums text-adm-ink-2">{displayPhone(o.customer.phone)}</div>}
                            <div className="truncate text-xs text-adm-muted">
                              <span className="font-adm-mono font-semibold text-adm-accent-hover">{o.orderNumber}</span>
                              {' · '}
                              {fmtDay(o.createdAt)}, {fmtTime(o.createdAt)}
                            </div>
                          </div>
                        </div>
                        <div className="shrink-0 pt-0.5 text-right font-bold tabular-nums">{formatPrice(o.total)}</div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 text-[12.5px] text-adm-ink-2">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <ItemThumbs order={o} />
                          <SourceBadge source={sourceOf(o)} className="h-[22px] px-2 text-[11px]" />
                        </div>
                        <div className="pointer-events-auto">
                          <StatusMenu
                            status={o.status}
                            orderNumber={o.orderNumber}
                            disabled={!!inlineUpdating[o.id]}
                            onChange={(s) => handleInlineStatusChange(o.id, s)}
                            className="h-8"
                          />
                        </div>
                      </div>
                    </div>
                  </motion.li>
                );
              })}
            </ul>
          )}
        </div>

        <CardFooter>
          <span aria-live="polite">{isLoading ? NBSP : `Showing ${visibleOrders.length} of ${orders.length} orders`}</span>
          <span className="hidden sm:inline">Click a row to see the full order</span>
        </CardFooter>
      </Card>

      <OrderSheet
        order={sheetOrder}
        open={sheetOpen}
        onOpenChange={(open) => {
          if (open) setSheetOpen(true);
          else closeSheet();
        }}
        draftStatus={updatingStatus}
        onDraftChange={(s) => {
          setUpdatingStatus(s);
          // Picking another status after a save brings the Save button back.
          if (statusSaved) setStatusSaved(false);
        }}
        isSaving={isSavingStatus}
        saved={statusSaved}
        notifyLink={selectedOrder && statusSaved ? buildWhatsAppLink(selectedOrder, updatingStatus) : null}
        onSave={handleUpdateStatus}
        onCancel={closeSheet}
        onDone={() => {
          closeSheet();
          setStatusSaved(false);
        }}
        onDelete={() => setDeleteConfirmOpen(true)}
      />

      <DeleteOrderDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        orderNumber={selectedOrder?.orderNumber}
        isDeleting={isDeleting}
        onConfirm={handleDeleteOrder}
      />
    </>
  );
}

const MotionRow = motion.create(TableRow);

function SortHead({
  k,
  sort,
  onSort,
  align,
}: {
  k: SortKey;
  sort: SortState;
  onSort: (k: SortKey) => void;
  align?: 'right';
}) {
  const active = sort.key === k;
  return (
    <TableHead
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('py-[7px]', align === 'right' && 'text-right')}
    >
      <button
        type="button"
        onClick={() => onSort(k)}
        className={cn(
          'group -mx-1.5 inline-flex h-7 items-center gap-1 rounded-[7px] px-1.5 outline-none transition-colors hover:bg-[rgba(70,30,32,.05)] hover:text-adm-ink focus-visible:ring-2 focus-visible:ring-adm-accent/40',
          active && 'text-adm-ink',
          align === 'right' && 'flex-row-reverse',
        )}
      >
        {SORT_LABEL[k]}
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

function EmptyBody({ filtersActive, onClear }: { filtersActive: boolean; onClear: () => void }) {
  return (
    <>
      {filtersActive ? 'Try adjusting your filters.' : 'New orders will show up here.'}
      {filtersActive && (
        <div className="mt-3.5">
          <Button variant="outline" size="sm" className="h-9" onClick={onClear}>
            Clear filters
          </Button>
        </div>
      )}
    </>
  );
}

function TableSkeletonRows() {
  return (
    <>
      {Array.from({ length: 8 }).map((_, i) => (
        <tr key={i}>
          <TableCell>
            <Skeleton className="h-3.5 w-[70px]" />
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-[30px] rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-[120px]" />
                <Skeleton className="h-3 w-[70px]" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-[86px]" />
              <Skeleton className="h-3 w-[54px]" />
            </div>
          </TableCell>
          <TableCell>
            <div className="flex items-center gap-2">
              <Skeleton className="size-7 rounded-[9px]" />
              <Skeleton className="h-3.5 w-[44px]" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-[78px] rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-3.5 w-[56px]" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-7 w-[100px] rounded-full" />
          </TableCell>
        </tr>
      ))}
    </>
  );
}

function ListSkeleton() {
  return (
    <ul aria-hidden>
      {Array.from({ length: 6 }).map((_, i) => (
        <li key={i} className="flex flex-col gap-3 border-b border-adm-line px-4 py-3.5 last:border-b-0">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-[130px]" />
              <Skeleton className="h-3 w-[170px]" />
            </div>
            <Skeleton className="h-3.5 w-[52px]" />
          </div>
          <div className="flex items-center justify-between">
            <Skeleton className="h-7 w-[150px] rounded-[9px]" />
            <Skeleton className="h-8 w-[104px] rounded-full" />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Shown by the page's Suspense boundary while search params resolve. */
export function OrdersFallback() {
  return (
    <>
      <PageHeader title="Orders" description="View and manage all customer orders. Click an order to see everything about it." />
      <Card className="overflow-hidden">
        <div className="flex flex-col gap-3 px-4 py-4 sm:px-5">
          <Skeleton className="h-10 w-full max-w-[640px] rounded-xl" />
          <Skeleton className="h-[38px] w-full max-w-[420px]" />
        </div>
        <div className="space-y-3 border-t border-adm-line px-5 py-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-full" />
          ))}
        </div>
      </Card>
    </>
  );
}
