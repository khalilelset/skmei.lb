'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Ban, CalendarX2, Check, CircleCheck, Copy, Globe, Pencil, Plus, RotateCw, Search, Ticket, Trash2 } from 'lucide-react';
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
import { CouponEditor } from './CouponEditor';
import {
  SORT_LABEL,
  STATUS_LABEL,
  brandList,
  expiryHint,
  fmtDay,
  fmtExpiry,
  matchesSearch,
  sortCoupons,
  statusOf,
  type Coupon,
  type CouponFilter,
  type CouponStatus,
  type SortKey,
} from './model';

const EASE = [0.2, 0.8, 0.2, 1] as const;
const NBSP = String.fromCharCode(160);
const SORT_KEYS = Object.keys(SORT_LABEL) as SortKey[];
const JSON_HEADERS = { 'Content-Type': 'application/json' };

export function CouponsView() {
  const reduce = useReducedMotion();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadFailed, setLoadFailed] = useState(false);
  const [now, setNow] = useState(0);
  const [brandOptions, setBrandOptions] = useState<string[] | null>(null);
  const [brandsFailed, setBrandsFailed] = useState(false);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<CouponFilter>('all');
  const [sort, setSort] = useState<SortKey>('newest');
  const [busy, setBusy] = useState<ReadonlySet<string>>(() => new Set());

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorKey, setEditorKey] = useState(0);
  const [editing, setEditing] = useState<Coupon | null>(null);
  const [editorNow, setEditorNow] = useState(0);

  const [deleteTarget, setDeleteTarget] = useState<Coupon | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadCoupons = useCallback(() => {
    fetch('/api/admin/coupons')
      .then((r) => r.json())
      .then((data) => {
        const ok = Array.isArray(data);
        if (ok) setCoupons(data);
        setLoadFailed(!ok);
        setNow(Date.now());
        setIsLoading(false);
      })
      .catch(() => {
        setLoadFailed(true);
        setIsLoading(false);
      });
  }, []);

  useEffect(() => {
    loadCoupons();
  }, [loadCoupons]);

  useEffect(() => {
    fetch('/api/admin/brands')
      .then((r) => r.json())
      .then((data: { name: string }[]) => {
        const ok = Array.isArray(data);
        setBrandOptions(ok ? data.map((b) => b.name) : []);
        setBrandsFailed(!ok);
      })
      .catch(() => {
        setBrandOptions([]);
        setBrandsFailed(true);
      });
  }, []);

  const retryLoad = () => {
    setLoadFailed(false);
    setIsLoading(true);
    loadCoupons();
  };

  const openEditor = (c: Coupon | null) => {
    setEditing(c);
    setEditorKey((k) => k + 1);
    setEditorNow(Date.now());
    setEditorOpen(true);
  };

  const handleSaved = (code: string, edited: boolean) => {
    setEditorOpen(false);
    toast.success(edited ? `${code} saved` : `${code} created`);
    loadCoupons();
  };

  const handleToggle = async (c: Coupon) => {
    if (busy.has(c.id)) return;
    const next = !c.active;
    setBusy((s) => new Set(s).add(c.id));
    setCoupons((list) => list.map((x) => (x.id === c.id ? { ...x, active: next } : x)));
    let ok = false;
    try {
      const res = await fetch(`/api/admin/coupons/${c.id}`, {
        method: 'PATCH',
        headers: JSON_HEADERS,
        body: JSON.stringify({ active: next }),
      });
      ok = res.ok;
    } catch {
      ok = false;
    }
    if (!ok) setCoupons((list) => list.map((x) => (x.id === c.id ? { ...x, active: c.active } : x)));
    setBusy((s) => {
      const n = new Set(s);
      n.delete(c.id);
      return n;
    });
    if (ok) {
      toast.success(next ? `${c.code} is active` : `${c.code} is disabled`, {
        description: next ? 'Customers can use it at checkout again.' : 'Customers can’t use it until you turn it back on.',
      });
    } else {
      toast.error(`Couldn't update ${c.code}`, { description: 'Check your connection and try again.' });
    }
    loadCoupons();
  };

  const askDelete = (c: Coupon) => {
    setDeleteTarget(c);
    setDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    const target = deleteTarget;
    setIsDeleting(true);
    let ok = false;
    try {
      const res = await fetch(`/api/admin/coupons/${target.id}`, { method: 'DELETE' });
      ok = res.ok;
    } catch {
      ok = false;
    }
    setIsDeleting(false);
    if (ok) {
      setDeleteOpen(false);
      setEditorOpen(false);
      toast.success(`${target.code} deleted`);
    } else {
      toast.error(`Couldn't delete ${target.code}`, { description: 'Try again in a moment.' });
    }
    loadCoupons();
  };

  const counts = useMemo(() => {
    const c = { all: coupons.length, active: 0, disabled: 0, expired: 0 };
    for (const x of coupons) c[statusOf(x, now)]++;
    return c;
  }, [coupons, now]);

  const visible = useMemo(
    () => sortCoupons(coupons.filter((c) => (filter === 'all' || statusOf(c, now) === filter) && matchesSearch(c, search)), sort),
    [coupons, filter, search, sort, now],
  );

  const filtersActive = filter !== 'all' || search.trim() !== '';
  const clearFilters = () => {
    setFilter('all');
    setSearch('');
  };

  const filterOptions: SegmentedOption<CouponFilter>[] = [
    // No count on "All": the title pill already shows the total, and it keeps the four tabs inside 390px.
    { value: 'all', label: 'All', icon: <Ticket className="max-sm:hidden" /> },
    {
      value: 'active',
      label: 'Active',
      count: isLoading ? undefined : counts.active,
      icon: <CircleCheck className="max-sm:hidden" />,
      countClassName: 'bg-[#E6F6EC] text-[#15803D]',
    },
    {
      value: 'disabled',
      label: 'Disabled',
      count: isLoading ? undefined : counts.disabled,
      icon: <Ban className="max-sm:hidden" />,
      countClassName: 'bg-[#F1EEED] text-[#57534E]',
    },
    {
      value: 'expired',
      label: 'Expired',
      count: isLoading ? undefined : counts.expired,
      icon: <CalendarX2 className="max-sm:hidden" />,
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

  const showError = loadFailed && !isLoading && coupons.length === 0;
  const emptyTitle = filtersActive ? 'No coupons found' : 'No coupons yet';
  const emptyBody = (
    <EmptyBody filtersActive={filtersActive} onClear={clearFilters} onAdd={() => openEditor(null)} />
  );

  return (
    <>
      <PageHeader
        title={
          <span className="inline-flex items-center gap-3">
            Coupons
            {!isLoading && !showError && (
              <motion.span
                initial={reduce ? false : { opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 480, damping: 22 }}
                className="inline-grid h-7 min-w-8 place-items-center rounded-full bg-adm-canvas-2 px-2.5 font-adm-mono text-[13px] font-semibold tracking-normal text-adm-ink-2"
              >
                {coupons.length}
              </motion.span>
            )}
          </span>
        }
        description={
          isLoading || showError
            ? 'Discount codes customers enter at checkout.'
            : `Discount codes customers enter at checkout · ${counts.active} working right now.`
        }
        actions={
          <Button onClick={() => openEditor(null)}>
            <Plus />
            Add coupon
          </Button>
        }
      />

      {showError && (
        <Card className="mb-4 flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <b className="font-adm-display text-[15px]">Couldn&apos;t load coupons</b>
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
              placeholder="Search by code or brand..."
              aria-label="Search coupons"
              autoComplete="off"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="min-w-0 flex-[1_1_240px] sm:max-w-[360px]"
            />
            <Segmented
              ariaLabel="Filter coupons by status"
              options={filterOptions}
              value={filter}
              onChange={setFilter}
              className="max-sm:[&_[role=tab]]:h-9 max-sm:[&_[role=tab]]:px-2"
            />
            <div className="ml-auto max-md:hidden">
              <SortSelect sort={sort} onSort={setSort} />
            </div>
          </div>

          {/* Desktop / tablet: table */}
          <div className="hidden md:block">
            <Table className="min-w-[880px]">
              <TableHeader>
                <tr>
                  <TableHead>Code</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Applies to</TableHead>
                  <TableHead>Sale items</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
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
                  visible.map((c, i) => {
                    const status = statusOf(c, now);
                    return (
                      <MotionRow
                        key={c.id}
                        data-clickable="true"
                        tabIndex={0}
                        aria-label={`Edit coupon ${c.code}`}
                        onClick={() => openEditor(c)}
                        onKeyDown={(e: React.KeyboardEvent) => {
                          if (e.target !== e.currentTarget) return;
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            openEditor(c);
                          }
                        }}
                        {...rowMotion(i)}
                      >
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <CodeText code={c.code} muted={status !== 'active'} />
                            <CopyButton code={c.code} />
                          </div>
                          <div className="text-xs text-adm-muted">Added {fmtDay(c.created_at)}</div>
                        </TableCell>
                        <TableCell>
                          <DiscountText coupon={c} />
                        </TableCell>
                        <TableCell className="whitespace-normal">
                          <BrandBadges coupon={c} />
                        </TableCell>
                        <TableCell>
                          <SaleBadge on={c.apply_on_sale} />
                        </TableCell>
                        <TableCell>
                          <ExpiryText coupon={c} now={now} />
                        </TableCell>
                        <TableCell>
                          <div className="flex w-[150px] items-center justify-between gap-3" onClick={(e) => e.stopPropagation()}>
                            <StatusBadge status={status} />
                            {status !== 'expired' && (
                              <ActiveSwitch coupon={c} disabled={busy.has(c.id)} onToggle={() => handleToggle(c)} />
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="inline-flex items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                            <IconAction label="Edit coupon" onClick={() => openEditor(c)}>
                              <Pencil />
                            </IconAction>
                            <IconAction label="Delete coupon" destructive onClick={() => askDelete(c)}>
                              <Trash2 />
                            </IconAction>
                          </div>
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
              <span>Coupons</span>
              <SortSelect sort={sort} onSort={setSort} compact />
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
                {visible.map((c, i) => {
                  const status = statusOf(c, now);
                  return (
                    <motion.li key={c.id} className="relative border-b border-adm-line last:border-b-0" {...rowMotion(i)}>
                      <button
                        type="button"
                        onClick={() => openEditor(c)}
                        aria-label={`Edit coupon ${c.code}`}
                        className="absolute inset-0 transition-colors hover:bg-[#FCF7F6] focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-adm-accent active:bg-[#FCF7F6]"
                      />
                      <div className="pointer-events-none relative flex flex-col gap-2.5 px-4 py-3.5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className="flex min-w-0 items-center gap-1">
                              <CodeText code={c.code} muted={status !== 'active'} className="truncate" />
                              <CopyButton code={c.code} className="pointer-events-auto" />
                            </div>
                            <DiscountText coupon={c} inline />
                          </div>
                          <StatusBadge status={status} className="mt-1.5 shrink-0" />
                        </div>
                        <div className="flex flex-wrap items-center gap-1.5">
                          <BrandBadges coupon={c} />
                          <SaleBadge on={c.apply_on_sale} />
                        </div>
                        <div className="flex items-center justify-between gap-3">
                          <span className={cn('min-w-0 text-[12px]', status === 'expired' ? 'font-semibold text-adm-accent-hover' : 'text-adm-muted')}>
                            {c.expires_at ? `Expires ${fmtExpiry(c.expires_at)}` : 'Never expires'}
                            {c.expires_at && now > 0 && <span className="block font-normal text-adm-muted">{expiryHint(c.expires_at, now)}</span>}
                          </span>
                          <div className="pointer-events-auto flex shrink-0 items-center gap-1">
                            {status !== 'expired' && (
                              <ActiveSwitch coupon={c} disabled={busy.has(c.id)} onToggle={() => handleToggle(c)} className="mr-2" />
                            )}
                            <Button variant="ghost" size="icon" aria-label={`Edit ${c.code}`} onClick={() => openEditor(c)}>
                              <Pencil />
                            </Button>
                            <Button variant="ghost-destructive" size="icon" aria-label={`Delete ${c.code}`} onClick={() => askDelete(c)}>
                              <Trash2 />
                            </Button>
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
            <span aria-live="polite">{isLoading ? NBSP : `Showing ${visible.length} of ${coupons.length} coupons`}</span>
            <span className="hidden sm:inline">Click a coupon to edit it · expired codes come back when you move the date</span>
          </CardFooter>
        </Card>
      )}

      <CouponEditor
        key={editorKey}
        open={editorOpen}
        onOpenChange={setEditorOpen}
        coupon={editing}
        coupons={coupons}
        brandOptions={brandOptions}
        brandsFailed={brandsFailed}
        now={editorNow}
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
          <AlertDialogTitle>Delete coupon?</AlertDialogTitle>
          <AlertDialogDescription>
            <b className="font-adm-mono font-bold tracking-[.08em] text-adm-accent-hover">{deleteTarget?.code}</b> will be permanently deleted and
            customers won&apos;t be able to use it anymore. This cannot be undone.
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

function CodeText({ code, muted, className }: { code: string; muted?: boolean; className?: string }) {
  return (
    <span
      className={cn(
        'font-adm-mono text-[14px] font-bold tracking-[.1em]',
        muted ? 'text-adm-ink-2' : 'text-adm-accent',
        className,
      )}
    >
      {code}
    </span>
  );
}

function CopyButton({ code, className }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const onClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      toast.success(`${code} copied`);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(`Couldn't copy ${code}`);
    }
  };
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Copy code ${code}`}
          onClick={onClick}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn('shrink-0 text-adm-muted max-md:size-9', className)}
        >
          {copied ? <Check className="text-[#16A34A]" /> : <Copy className="size-3.5" />}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied' : 'Copy code'}</TooltipContent>
    </Tooltip>
  );
}

function DiscountText({ coupon, inline }: { coupon: Coupon; inline?: boolean }) {
  const cap = coupon.max_discount != null ? `up to ${formatPrice(Number(coupon.max_discount))}` : 'No cap';
  if (inline) {
    return (
      <div className="text-[12.5px] text-adm-muted">
        <b className="font-semibold text-adm-ink">{coupon.discount}% off</b> · {cap}
      </div>
    );
  }
  return (
    <>
      <div className="font-adm-display text-[15px] font-bold tabular-nums tracking-[-0.01em]">
        {coupon.discount}%<span className="ml-1 font-adm-body text-[12.5px] font-semibold text-adm-muted">off</span>
      </div>
      <div className="text-xs text-adm-muted">{cap}</div>
    </>
  );
}

function BrandBadges({ coupon }: { coupon: Coupon }) {
  const brands = brandList(coupon);
  if (brands.length === 0) {
    return (
      <Badge tone="green">
        <Globe />
        All brands
      </Badge>
    );
  }
  const shown = brands.slice(0, 2);
  const rest = brands.slice(2);
  return (
    <span className="inline-flex flex-wrap items-center gap-1">
      {shown.map((b) => (
        <Badge key={b} tone="blue" className="max-w-[140px]">
          <span className="truncate">{b}</span>
        </Badge>
      ))}
      {rest.length > 0 && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span tabIndex={0} className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-adm-accent/40" onClick={(e) => e.stopPropagation()}>
              <Badge tone="outline">+{rest.length}</Badge>
            </span>
          </TooltipTrigger>
          <TooltipContent>{rest.join(', ')}</TooltipContent>
        </Tooltip>
      )}
    </span>
  );
}

function SaleBadge({ on }: { on: boolean }) {
  return on ? <Badge tone="blue">Sale items included</Badge> : <Badge tone="amber">Full price only</Badge>;
}

function ExpiryText({ coupon, now }: { coupon: Coupon; now: number }) {
  if (!coupon.expires_at) {
    return (
      <>
        <div className="text-adm-faint">Never</div>
        <div className="text-xs text-adm-faint">No end date</div>
      </>
    );
  }
  const expired = now > 0 && new Date(coupon.expires_at).getTime() < now;
  return (
    <>
      <div className={cn(expired && 'font-semibold text-adm-accent-hover')}>{fmtExpiry(coupon.expires_at)}</div>
      {now > 0 && <div className="text-xs text-adm-muted">{expiryHint(coupon.expires_at, now)}</div>}
    </>
  );
}

const STATUS_STYLE: Record<CouponStatus, { tone: 'green' | 'neutral' | 'red'; dot: string }> = {
  active: { tone: 'green', dot: '#16A34A' },
  disabled: { tone: 'neutral', dot: '#A39698' },
  expired: { tone: 'red', dot: '#DC2626' },
};

function StatusBadge({ status, className }: { status: CouponStatus; className?: string }) {
  const s = STATUS_STYLE[status];
  return (
    <Badge tone={s.tone} dot={s.dot} className={className}>
      {STATUS_LABEL[status]}
    </Badge>
  );
}

function ActiveSwitch({
  coupon,
  disabled,
  onToggle,
  className,
}: {
  coupon: Coupon;
  disabled?: boolean;
  onToggle: () => void;
  className?: string;
}) {
  return (
    <Tooltip>
      {/* Wrapper span: TooltipTrigger stamps its own data-state on its child, which would override
          the switch's checked/unchecked state (and its colors). */}
      <TooltipTrigger asChild>
        <span className={cn('inline-flex', className)}>
          {/* The ::after pad grows the 22px switch to a ~36px touch target without changing the layout. */}
          <Switch
            checked={coupon.active}
            disabled={disabled}
            onCheckedChange={onToggle}
            aria-label={coupon.active ? `Disable ${coupon.code}` : `Enable ${coupon.code}`}
            className="relative after:absolute after:-inset-[7px] after:content-['']"
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>{coupon.active ? 'Turn off' : 'Turn on'}</TooltipContent>
    </Tooltip>
  );
}

function IconAction({
  label,
  destructive,
  onClick,
  children,
}: {
  label: string;
  destructive?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant={destructive ? 'ghost-destructive' : 'ghost'}
          size="icon-sm"
          aria-label={label}
          onClick={onClick}
          onKeyDown={(e) => e.stopPropagation()}
          className={cn(!destructive && 'text-adm-muted')}
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
        aria-label="Sort coupons"
        className={cn(compact ? 'h-9 w-auto gap-1.5 border-0 bg-transparent px-2 text-[12.5px] font-semibold text-adm-ink-2 shadow-none' : 'w-[176px]')}
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end" className={cn(compact && 'min-w-[180px]')}>
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
      {filtersActive ? 'Try a different search or filter.' : 'Create a discount code to share with customers.'}
      <div className="mt-3.5">
        {filtersActive ? (
          <Button variant="outline" size="sm" className="h-9" onClick={onClear}>
            Clear filters
          </Button>
        ) : (
          <Button variant="soft" size="sm" className="h-9" onClick={onAdd}>
            <Plus />
            Add coupon
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
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-[110px]" />
              <Skeleton className="h-3 w-[90px]" />
            </div>
          </TableCell>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-12" />
              <Skeleton className="h-3 w-16" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-[92px] rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-[120px] rounded-full" />
          </TableCell>
          <TableCell>
            <div className="space-y-1.5">
              <Skeleton className="h-3.5 w-[86px]" />
              <Skeleton className="h-3 w-[70px]" />
            </div>
          </TableCell>
          <TableCell>
            <Skeleton className="h-6 w-[150px] rounded-full" />
          </TableCell>
          <TableCell>
            <Skeleton className="ml-auto h-7 w-[60px]" />
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
        <li key={i} className="flex flex-col gap-2.5 border-b border-adm-line px-4 py-3.5 last:border-b-0">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <Skeleton className="h-4 w-[120px]" />
              <Skeleton className="h-3 w-[140px]" />
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div className="flex gap-1.5">
            <Skeleton className="h-6 w-[90px] rounded-full" />
            <Skeleton className="h-6 w-[110px] rounded-full" />
          </div>
          <Skeleton className="h-3 w-[160px]" />
        </li>
      ))}
    </ul>
  );
}
