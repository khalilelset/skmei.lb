'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronsUpDown, RotateCw, Search, ShoppingBag, UserRoundCheck, Users } from 'lucide-react';
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
import { ORDERS_CHANGED_EVENT } from '@/components/admin/shell/nav';
import { cn, formatPhoneDisplay, formatPrice } from '@/lib/utils';
import { CustomerStats, CustomerStatsSkeleton } from './CustomerStats';
import { CustomerSheet, DeleteCustomerDialog } from './CustomerSheet';
import { AccountBadge, CustomerAvatar } from './parts';
import {
  SORT_KEYS,
  SORT_LABEL,
  deleteUrl,
  firstOrderOf,
  fmtDay,
  matchesFilter,
  matchesSearch,
  sortCustomers,
  timeAgo,
  type Customer,
  type CustomerFilter,
  type SortKey,
  type SortState,
} from './model';

const EASE = [0.2, 0.8, 0.2, 1] as const;
const NBSP = String.fromCharCode(160);
const DESCRIPTION = 'Everyone who has ordered or created an account, matched by phone number so each person appears once.';

const notifyOrdersChanged = () => window.dispatchEvent(new Event(ORDERS_CHANGED_EVENT));

export function CustomersView() {
  const reduce = useReducedMotion();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [loadedAt, setLoadedAt] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<CustomerFilter>('all');
  const [sort, setSort] = useState<SortState>({ key: '', dir: 'asc' });
  const [selected, setSelected] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCustomers = useCallback(() => {
    fetch('/api/admin/customers')
      .then((r) => r.json())
      .then((data) => {
        const ok = Array.isArray(data);
        if (ok) setCustomers(data);
        setLoadFailed(!ok);
        setLoadedAt(Date.now());
        setIsLoading(false);
      })
      .catch(() => {
        setLoadFailed(true);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadCustomers();
  }, [loadCustomers]);

  const retryLoad = () => {
    setLoadFailed(false);
    setIsLoading(true);
    loadCustomers();
  };

  const openCustomer = (c: Customer) => {
    setSelected(c);
    setSheetOpen(true);
  };

  const counts = useMemo(
    () => ({
      all: customers.length,
      account: customers.filter((c) => matchesFilter(c, 'account')).length,
      'order-only': customers.filter((c) => matchesFilter(c, 'order-only')).length,
    }),
    [customers],
  );

  const visible = useMemo(
    () => sortCustomers(customers.filter((c) => matchesFilter(c, filter) && matchesSearch(c, searchQuery)), sort),
    [customers, filter, searchQuery, sort],
  );

  const handleSort = (key: SortKey) => {
    setSort((s) => ({ key, dir: s.key === key && s.dir === 'asc' ? 'desc' : 'asc' }));
  };

  const filtersActive = filter !== 'all' || searchQuery.trim() !== '';
  const clearFilters = () => {
    setFilter('all');
    setSearchQuery('');
  };

  // Same request as before, now with the merged account id so a matched account is removed too.
  const handleDeleteCustomer = async () => {
    if (!selected) return;
    const target = selected;
    const who = target.name || formatPhoneDisplay(target.phone);
    setIsDeleting(true);
    let res: Response;
    try {
      res = await fetch(deleteUrl(target), { method: 'DELETE' });
    } catch {
      setIsDeleting(false);
      toast.error(`Couldn't delete ${who}`, { description: 'Check your connection and try again.' });
      return;
    }
    setIsDeleting(false);
    setDeleteConfirmOpen(false);
    setSheetOpen(false);
    loadCustomers();
    notifyOrdersChanged();
    if (res.ok) toast.success(`${who} deleted`, { description: 'Their account and orders were removed.' });
    else toast.error(`Couldn't delete ${who}`, { description: 'Refresh to check whether anything was removed.' });
  };

  // Show the live copy of the selected customer (fresh after a reload); fall back to the snapshot once it's gone.
  const sheetCustomer = (selected && customers.find((c) => c.phone === selected.phone)) ?? selected;

  const filterOptions: SegmentedOption<CustomerFilter>[] = [
    // Icons and the longer label drop on phones so all three tabs fit at 390px without scrolling.
    { value: 'all', label: 'All', count: isLoading ? undefined : counts.all, icon: <Users className="max-sm:hidden" /> },
    {
      value: 'account',
      label: (
        <>
          <span className="sm:hidden">Account</span>
          <span className="max-sm:hidden">Has account</span>
        </>
      ),
      count: isLoading ? undefined : counts.account,
      icon: <UserRoundCheck className="max-sm:hidden" />,
      countClassName: 'bg-[#F3EDFF] text-[#6D28D9]',
    },
    {
      value: 'order-only',
      label: 'Order only',
      count: isLoading ? undefined : counts['order-only'],
      icon: <ShoppingBag className="max-sm:hidden" />,
      countClassName: 'bg-[#FEF3E2] text-[#B45309]',
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

  const showError = loadFailed && !isLoading && customers.length === 0;
  const emptyTitle = filtersActive ? 'No customers found' : 'No customers yet';

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            Customers
            {!isLoading && !showError && (
              <motion.span
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 480, damping: 22 }}
                className="inline-grid h-7 min-w-8 place-items-center rounded-full bg-adm-canvas-2 px-2.5 font-adm-mono text-[13px] font-semibold tracking-normal text-adm-ink-2"
              >
                {customers.length}
              </motion.span>
            )}
          </span>
        }
        description={DESCRIPTION}
      />

      {showError && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <b className="font-adm-display text-[15px]">Couldn&apos;t load customers</b>
            <p className="text-[13px] text-adm-muted">Check your connection, then try again.</p>
          </div>
          <Button variant="outline" onClick={retryLoad}>
            <RotateCw />
            Try again
          </Button>
        </Card>
      )}

      {isLoading ? <CustomerStatsSkeleton /> : !showError && <CustomerStats customers={customers} now={loadedAt} />}

      {/* After a failed load the error card above is the only message; an empty list would read as "no customers". */}
      {!showError && (
        <Card className="overflow-hidden">
          <div className="flex flex-wrap items-center gap-3 px-4 py-4 sm:px-5">
            <SearchInput
              icon={<Search />}
              placeholder="Search by name, phone, or email..."
              aria-label="Search customers"
              autoComplete="off"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="min-w-0 flex-[1_1_260px] sm:max-w-[420px]"
            />
            {/* Taller tabs on phones so each one is a comfortable touch target. */}
            <Segmented
              ariaLabel="Filter customers"
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              className="max-sm:[&_[role=tab]]:h-9"
            />
          </div>

          {/* Desktop / tablet: table */}
          <div className="hidden md:block">
            <Table className="min-w-[760px]">
              <TableHeader>
                <tr>
                  <SortHead k="name" sort={sort} onSort={handleSort} />
                  <SortHead k="phone" sort={sort} onSort={handleSort} />
                  <SortHead k="orderCount" sort={sort} onSort={handleSort} align="center" />
                  <SortHead k="totalSpent" sort={sort} onSort={handleSort} align="right" />
                  <SortHead k="firstOrderAt" sort={sort} onSort={handleSort} className="hidden xl:table-cell" />
                  <SortHead k="lastOrderAt" sort={sort} onSort={handleSort} />
                </tr>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableSkeletonRows />
                ) : visible.length === 0 ? (
                  <TableEmpty colSpan={6} title={emptyTitle}>
                    <EmptyBody filtersActive={filtersActive} onClear={clearFilters} />
                  </TableEmpty>
                ) : (
                  visible.map((c, i) => {
                    const first = firstOrderOf(c);
                    return (
                      <MotionRow
                        key={`${c.phone}|${c.accountId ?? ''}`}
                        data-clickable="true"
                        tabIndex={0}
                        aria-label={`Open ${c.name || formatPhoneDisplay(c.phone)}`}
                        onClick={() => openCustomer(c)}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openCustomer(c);
                          }
                        }}
                        {...rowMotion(i)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2.5">
                            <CustomerAvatar name={c.name} />
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="max-w-[200px] truncate font-semibold">{c.name || '—'}</span>
                                {c.hasAccount && <AccountBadge />}
                              </div>
                              <div className="text-xs text-adm-muted">
                                {c.hasAccount ? (c.accountCreatedAt ? `Account since ${fmtDay(c.accountCreatedAt)}` : 'Account holder') : 'Guest checkout'}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium tabular-nums tracking-[.01em]">{formatPhoneDisplay(c.phone)}</div>
                          {c.email ? (
                            <div className="max-w-[230px] truncate text-xs text-adm-muted">{c.email}</div>
                          ) : (
                            <div className="text-xs text-adm-faint">No email</div>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <OrderCount n={c.orderCount} />
                        </TableCell>
                        <TableCell className="text-right font-bold tabular-nums">
                          {c.totalSpent > 0 ? formatPrice(c.totalSpent) : <span className="font-medium text-adm-faint">—</span>}
                        </TableCell>
                        <TableCell className="hidden xl:table-cell">
                          <DateCell iso={first} now={loadedAt} />
                        </TableCell>
                        <TableCell>
                          <DateCell iso={c.lastOrderAt} now={loadedAt} />
                        </TableCell>
                      </MotionRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Phones: stacked cards */}
          <div className="md:hidden">
            <div className="flex items-center justify-between gap-3 border-y border-adm-line bg-adm-surface-2 py-1.5 pl-4 pr-2 text-[12.5px] font-semibold text-adm-muted">
              <span>Customers</span>
              <MobileSort sort={sort} onSort={handleSort} />
            </div>
            {isLoading ? (
              <ListSkeleton />
            ) : visible.length === 0 ? (
              <div className="px-5 py-11 text-center text-[13.5px] text-adm-muted">
                <b className="mb-1 block font-adm-display text-[15px] text-adm-ink">{emptyTitle}</b>
                <EmptyBody filtersActive={filtersActive} onClear={clearFilters} />
              </div>
            ) : (
              <ul>
                {visible.map((c, i) => (
                  <motion.li key={`${c.phone}|${c.accountId ?? ''}`} className="relative border-b border-adm-line last:border-b-0" {...rowMotion(i)}>
                    <button
                      type="button"
                      onClick={() => openCustomer(c)}
                      aria-label={`Open ${c.name || formatPhoneDisplay(c.phone)}`}
                      className="absolute inset-0 transition-colors hover:bg-[#FCF7F6] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-adm-accent active:bg-[#FCF7F6]"
                    />
                    <div className="pointer-events-none relative flex flex-col gap-2 px-4 py-3.5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex min-w-0 items-center gap-2.5">
                          <CustomerAvatar name={c.name} className="size-9 text-xs" />
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className="truncate font-semibold">{c.name || '—'}</span>
                              {c.hasAccount && <AccountBadge className="shrink-0" />}
                            </div>
                            <div className="truncate text-xs tabular-nums text-adm-muted">{formatPhoneDisplay(c.phone)}</div>
                          </div>
                        </div>
                        <div className="shrink-0 pt-0.5 text-right">
                          <div className="font-bold tabular-nums">{c.totalSpent > 0 ? formatPrice(c.totalSpent) : <span className="font-medium text-adm-faint">—</span>}</div>
                          <div className="text-xs text-adm-muted">
                            {c.orderCount} {c.orderCount === 1 ? 'order' : 'orders'}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 pl-[46px] text-[12px] text-adm-muted">
                        <span className="min-w-0 truncate">{c.email ?? 'No email'}</span>
                        <span className="ml-auto shrink-0">{c.lastOrderAt ? `Last order ${fmtDay(c.lastOrderAt)}` : 'No orders yet'}</span>
                      </div>
                    </div>
                  </motion.li>
                ))}
              </ul>
            )}
          </div>

          <CardFooter>
            <span aria-live="polite">{isLoading ? NBSP : `Showing ${visible.length} of ${customers.length} customers`}</span>
            <span className="hidden sm:inline">Click a customer to see their details and orders</span>
          </CardFooter>
        </Card>
      )}

      <CustomerSheet
        customer={sheetCustomer}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onDelete={() => setDeleteConfirmOpen(true)}
        now={loadedAt}
      />

      <DeleteCustomerDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        customer={sheetCustomer}
        isDeleting={isDeleting}
        onConfirm={handleDeleteCustomer}
      />
    </>
  );
}

const MotionRow = motion.create(TableRow);

function OrderCount({ n }: { n: number }) {
  return (
    <span
      className={cn(
        'inline-grid h-6 min-w-7 place-items-center rounded-full px-2 font-adm-mono text-[12px] font-semibold tabular-nums',
        n > 0 ? 'bg-adm-accent-soft text-adm-accent-hover' : 'bg-[#F1EEED] text-adm-faint',
      )}
    >
      {n}
    </span>
  );
}

function DateCell({ iso, now }: { iso: string | null; now: number }) {
  if (!iso) return <span className="text-adm-faint">—</span>;
  return (
    <>
      <div>{fmtDay(iso)}</div>
      <div className="text-xs text-adm-muted">{timeAgo(iso, now)}</div>
    </>
  );
}

function SortHead({
  k,
  sort,
  onSort,
  align,
  className,
}: {
  k: SortKey;
  sort: SortState;
  onSort: (k: SortKey) => void;
  align?: 'right' | 'center';
  className?: string;
}) {
  const active = sort.key === k;
  return (
    <TableHead
      aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
      className={cn('py-[7px]', align === 'right' && 'text-right', align === 'center' && 'text-center', className)}
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
              {k === 'phone' ? 'Phone' : SORT_LABEL[k]}
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
      {filtersActive ? 'Try a different search or filter.' : 'Customers appear here after their first order or sign-up.'}
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
        <tr key={i} aria-hidden>
          <TableCell>
            <div className="flex items-center gap-2.5">
              <Skeleton className="size-[34px] rounded-full" />
              <div className="space-y-1.5">
                <Skeleton className="h-3.5 w-[130px]" />
                <Skeleton className="h-3 w-[90px]" />
              </div>
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-[110px]" />
              <Skeleton className="h-3 w-[140px]" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="mx-auto h-6 w-7 rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-3.5 w-16" />
          </TableCell>
          <TableCell className="hidden xl:table-cell">
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-[86px]" />
              <Skeleton className="h-3 w-[60px]" />
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-[86px]" />
              <Skeleton className="h-3 w-[60px]" />
            </div>
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
        <li key={i} className="flex flex-col gap-2.5 border-b border-adm-line px-4 py-3.5 last:border-b-0">
          <div className="flex items-center gap-2.5">
            <Skeleton className="size-9 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3.5 w-[130px]" />
              <Skeleton className="h-3 w-[100px]" />
            </div>
            <div className="space-y-1.5">
              <Skeleton className="ml-auto h-3.5 w-14" />
              <Skeleton className="ml-auto h-3 w-11" />
            </div>
          </div>
          <Skeleton className="ml-[46px] h-3 w-[200px]" />
        </li>
      ))}
    </ul>
  );
}
