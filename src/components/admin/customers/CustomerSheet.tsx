'use client';

import { useRef } from 'react';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';
import { CalendarDays, ChevronRight, Copy, Loader2, Mail, MapPin, Phone, ShoppingBag, Trash2, UserRound } from 'lucide-react';
import { Badge } from '@/components/admin/ui/badge';
import { Button } from '@/components/admin/ui/button';
import { Sheet, SheetBody, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle } from '@/components/admin/ui/sheet';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from '@/components/admin/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/admin/ui/tooltip';
import { toast } from '@/components/admin/ui/sonner';
import { CountUp } from '@/components/admin/fx/CountUp';
import { StatusBadge } from '@/components/admin/status';
import { cn, formatDate, formatPhoneDisplay, formatPrice, phoneToWaNumber } from '@/lib/utils';
import { AccountBadge, CustomerAvatar, WhatsAppIcon } from './parts';
import { customerSince, fmtDay, orderLabel, savedAddresses, timeAgo, type Customer } from './model';

const EASE = [0.2, 0.8, 0.2, 1] as const;
const int = (n: number) => Math.round(n).toLocaleString('en-US');

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('mb-2.5 text-[11.5px] font-bold uppercase tracking-[.07em] text-adm-muted', className)}>{children}</h3>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-adm-line rounded-[14px] bg-adm-surface-2 px-3.5 py-1 shadow-[inset_0_0_0_1px_var(--color-adm-line)]">{children}</div>;
}

function KV({ icon, label, children, actions }: { icon: React.ReactNode; label: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2.5">
      <span className="shrink-0 self-start pt-0.5 text-adm-muted [&_svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-adm-muted">{label}</div>
        {children}
      </div>
      {actions && <div className="-my-1 flex shrink-0 items-center gap-1">{actions}</div>}
    </div>
  );
}

function IconAction({ label, children }: { label: string; children: React.ReactElement }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}

async function copy(text: string, what: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(`${what} copied`);
  } catch {
    toast.error(`Couldn't copy the ${what.toLowerCase()}`);
  }
}

function Tile({ label, tint, ink, children, sub }: { label: string; tint: string; ink?: string; children: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-[14px] px-3 py-2.5" style={{ background: tint }}>
      <div className="text-[11.5px] font-semibold text-adm-ink-2">{label}</div>
      <div className="truncate font-adm-display text-[17px] font-bold leading-tight tracking-[-0.02em] tabular-nums sm:text-[19px]" style={{ color: ink }}>
        {children}
      </div>
      {sub && <div className="mt-0.5 truncate text-[11.5px] text-adm-muted">{sub}</div>}
    </div>
  );
}

export interface CustomerSheetProps {
  /** The customer to show (kept while the sheet animates closed). */
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDelete: () => void;
  /** Time the list was loaded, for "3 days ago" labels. */
  now: number;
}

export function CustomerSheet({ customer, open, onOpenChange, onDelete, now }: CustomerSheetProps) {
  const reduce = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);

  const since = customer ? customerSince(customer) : null;
  const addresses = customer?.hasAccount ? savedAddresses(customer) : [];
  const wa = customer ? phoneToWaNumber(customer.phone) : '';

  const item = (i: number) =>
    reduce
      ? {}
      : { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, delay: 0.08 + Math.min(i, 10) * 0.04, ease: EASE } };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={contentRef}
        className="text-[14px] leading-normal"
        onOpenAutoFocus={(e) => {
          // Focus the panel itself so the first button's tooltip doesn't pop open.
          e.preventDefault();
          contentRef.current?.focus();
        }}
      >
        {customer && (
          <>
            <SheetHeader className="pt-[calc(20px+env(safe-area-inset-top,0px))] max-sm:pl-[18px]">
              <div className="flex items-center gap-3.5">
                <CustomerAvatar name={customer.name} className="size-12 text-[15px]" />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <SheetTitle className="wrap-break-word">{customer.name || 'Unknown'}</SheetTitle>
                    {customer.hasAccount && <AccountBadge />}
                  </div>
                  <SheetDescription className="mt-0.5">
                    {since ? `Customer since ${formatDate(since)}` : customer.hasAccount ? 'Has an account' : 'Guest customer'}
                  </SheetDescription>
                </div>
              </div>
            </SheetHeader>

            <SheetBody className="gap-[22px] pb-7 max-sm:px-[18px]">
              <motion.section className="grid grid-cols-3 gap-2" {...item(0)}>
                <Tile label="Orders" tint="#FFF1EF" ink="#B91C1C">
                  <CountUp value={customer.orderCount} format={int} duration={0.8} />
                </Tile>
                <Tile label="Total spent" tint="#ECFAF1" ink="#15803D">
                  {customer.orderCount > 0 ? <CountUp value={customer.totalSpent} format={formatPrice} duration={0.8} /> : '—'}
                </Tile>
                <Tile label="Last order" tint="#F4F1F0" sub={customer.lastOrderAt ? timeAgo(customer.lastOrderAt, now) : 'No orders yet'}>
                  <span className="text-[14px] sm:text-[15px]">{customer.lastOrderAt ? fmtDay(customer.lastOrderAt) : '—'}</span>
                </Tile>
              </motion.section>

              <motion.section {...item(1)}>
                <SectionLabel>Contact</SectionLabel>
                <Panel>
                  <KV
                    icon={<Phone />}
                    label="Phone"
                    actions={
                      <>
                        <IconAction label="Copy phone number">
                          <Button variant="ghost" size="icon" aria-label="Copy phone number" onClick={() => copy(formatPhoneDisplay(customer.phone), 'Phone number')}>
                            <Copy className="size-[15px]" />
                          </Button>
                        </IconAction>
                        <IconAction label="Call">
                          <Button asChild variant="ghost" size="icon">
                            <a href={`tel:+${wa}`} aria-label={`Call ${formatPhoneDisplay(customer.phone)}`}>
                              <Phone className="size-[15px]" />
                            </a>
                          </Button>
                        </IconAction>
                        <IconAction label="Chat on WhatsApp">
                          <Button asChild variant="whatsapp" size="icon">
                            <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer" aria-label="Chat on WhatsApp">
                              <WhatsAppIcon className="size-[17px]" />
                            </a>
                          </Button>
                        </IconAction>
                      </>
                    }
                  >
                    <div className="font-semibold tabular-nums tracking-[.01em]">{formatPhoneDisplay(customer.phone)}</div>
                  </KV>
                  <KV
                    icon={<Mail />}
                    label="Email"
                    actions={
                      customer.email ? (
                        <>
                          <IconAction label="Copy email">
                            <Button variant="ghost" size="icon" aria-label="Copy email" onClick={() => copy(customer.email!, 'Email')}>
                              <Copy className="size-[15px]" />
                            </Button>
                          </IconAction>
                          <IconAction label="Send an email">
                            <Button asChild variant="ghost" size="icon">
                              <a href={`mailto:${customer.email}`} aria-label={`Email ${customer.email}`}>
                                <Mail className="size-[15px]" />
                              </a>
                            </Button>
                          </IconAction>
                        </>
                      ) : undefined
                    }
                  >
                    {customer.email ? (
                      <div className="break-all font-semibold">{customer.email}</div>
                    ) : (
                      <div className="font-medium text-adm-muted">No email on file</div>
                    )}
                  </KV>
                </Panel>
              </motion.section>

              {customer.hasAccount && (
                <motion.section {...item(2)}>
                  <SectionLabel>Account</SectionLabel>
                  <Panel>
                    <KV icon={<CalendarDays />} label="Account created">
                      <div className="font-semibold">
                        {customer.accountCreatedAt ? formatDate(customer.accountCreatedAt) : '—'}
                        {customer.accountCreatedAt && (
                          <span className="ml-1.5 text-[12.5px] font-medium text-adm-muted">· {timeAgo(customer.accountCreatedAt, now)}</span>
                        )}
                      </div>
                    </KV>
                    <KV icon={<MapPin />} label={`Saved addresses (${addresses.length})`}>
                      {addresses.length === 0 ? (
                        <div className="font-medium text-adm-muted">No saved addresses</div>
                      ) : (
                        <ul className="mt-1 flex flex-col gap-1.5">
                          {addresses.map((a, i) => (
                            <li key={i} className="flex flex-wrap items-center gap-x-2 gap-y-1 font-semibold wrap-break-word">
                              <span className="min-w-0">{a.line || '—'}</span>
                              {a.isDefault && (
                                <Badge tone="outline" className="h-5 px-2 text-[10.5px]">
                                  Default
                                </Badge>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </KV>
                  </Panel>
                </motion.section>
              )}

              <motion.section {...item(3)}>
                <SectionLabel>Orders ({customer.orders.length})</SectionLabel>
                {customer.orders.length === 0 ? (
                  <div className="flex items-start gap-3 rounded-[14px] bg-adm-surface-2 px-3.5 py-3 text-[13px] text-adm-muted shadow-[inset_0_0_0_1px_var(--color-adm-line)]">
                    <ShoppingBag className="mt-px size-4 shrink-0" />
                    <span>
                      <b className="block text-[13.5px] text-adm-ink">No orders yet</b>
                      {customer.hasAccount ? 'This customer created an account but hasn’t placed an order.' : 'Nothing to show here.'}
                    </span>
                  </div>
                ) : (
                  <ul className="flex flex-col gap-2">
                    {customer.orders.map((o, i) => (
                      <motion.li key={o.id} {...item(4 + i)}>
                        <Link
                          href={`/admin/orders?open=${encodeURIComponent(o.id)}`}
                          aria-label={`Open order ${orderLabel(o.id)}`}
                          className="group flex min-h-[56px] items-center gap-3 rounded-[14px] px-3.5 py-2.5 shadow-[inset_0_0_0_1px_var(--color-adm-line)] outline-none transition-[background-color,box-shadow] hover:bg-adm-surface-2 hover:shadow-[inset_0_0_0_1px_var(--color-adm-line-2)] focus-visible:ring-2 focus-visible:ring-adm-accent/40"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="font-adm-mono text-[12.5px] font-semibold tracking-[-0.01em] text-adm-accent-hover">{orderLabel(o.id)}</div>
                            <div className="truncate text-xs text-adm-muted">
                              {fmtDay(o.createdAt)} · {timeAgo(o.createdAt, now)}
                            </div>
                          </div>
                          <StatusBadge status={o.status} className="max-[380px]:hidden" />
                          <div className="shrink-0 text-right font-bold tabular-nums">{formatPrice(o.total)}</div>
                          <ChevronRight className="size-4 shrink-0 text-[#B3A7A9] transition-[transform,color] duration-300 ease-adm-spring group-hover:translate-x-0.5 group-hover:text-adm-accent" />
                        </Link>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </motion.section>
            </SheetBody>

            <SheetFooter className="max-sm:px-[18px]">
              <Button variant="ghost-destructive" onClick={onDelete} className="px-2.5 max-sm:order-last max-sm:w-full">
                <Trash2 />
                Delete customer
              </Button>
              <span className="flex-1 max-sm:hidden" />
              <Button variant="outline" className="max-sm:flex-1" onClick={() => onOpenChange(false)}>
                Close
              </Button>
              <Button asChild className="max-sm:flex-1">
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener noreferrer">
                  <WhatsAppIcon />
                  WhatsApp
                </a>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function DeleteCustomerDialog({
  open,
  onOpenChange,
  customer,
  isDeleting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customer: Customer | null;
  isDeleting: boolean;
  onConfirm: () => void;
}) {
  const who = customer?.name || (customer ? formatPhoneDisplay(customer.phone) : '');
  const n = customer?.orderCount ?? 0;
  return (
    <AlertDialog open={open} onOpenChange={(o) => !isDeleting && onOpenChange(o)}>
      <AlertDialogContent>
        <AlertDialogTitle>Delete customer?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete <strong className="font-semibold text-adm-ink">{who}</strong> and{' '}
          <strong className="font-semibold text-adm-ink">all their orders</strong>. This action cannot be undone.
        </AlertDialogDescription>
        <ul className="mt-4 flex flex-col gap-2 rounded-[14px] bg-adm-accent-soft px-3.5 py-3 text-[13px] text-[#7F1D1D]">
          {customer?.hasAccount && (
            <li className="flex items-center gap-2.5">
              <UserRound className="size-4 shrink-0 text-adm-accent" />
              Their account and saved addresses
            </li>
          )}
          <li className="flex items-start gap-2.5">
            <ShoppingBag className="mt-px size-4 shrink-0 text-adm-accent" />
            <span>
              {n > 0 ? `${n} ${n === 1 ? 'order' : 'orders'}` : 'Any orders'} placed with {customer ? formatPhoneDisplay(customer.phone) : 'this number'}
              <span className="block text-[12px] text-[#9F1239]/80">Cancelled orders with this number are deleted too.</span>
            </span>
          </li>
        </ul>
        <AlertDialogFooter className="max-sm:*:flex-1">
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            destructive
            disabled={isDeleting}
            onClick={(e) => {
              // Keep the dialog open (showing "Deleting…") until the request finishes.
              e.preventDefault();
              onConfirm();
            }}
          >
            {isDeleting ? <Loader2 className="animate-spin" /> : <Trash2 />}
            {isDeleting ? 'Deleting…' : 'Delete customer'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
