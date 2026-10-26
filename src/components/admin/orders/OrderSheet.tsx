'use client';

import { useRef } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { Check, CreditCard, Gift, Loader2, Mail, MapPin, Phone, ReceiptText, Trash2, User, XCircle } from 'lucide-react';
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
import { ORDER_STATUS, ORDER_STATUSES, StatusBadge, type OrderStatus } from '@/components/admin/status';
import { cn, formatDate, formatPrice } from '@/lib/utils';
import type { Order } from '@/types';
import { ProductImage, SourceBadge, WhatsAppIcon, displayPhone, fmtTime, sourceOf, unitCount } from './parts';
import { STATUS_TINT } from './StatusMenu';
import { buildReceivedLink } from './whatsapp';

const FLOW: OrderStatus[] = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const EASE = [0.2, 0.8, 0.2, 1] as const;

function SectionLabel({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('mb-2.5 text-[11.5px] font-bold uppercase tracking-[.07em] text-adm-muted', className)}>{children}</h3>;
}

function Panel({ children }: { children: React.ReactNode }) {
  return <div className="divide-y divide-adm-line rounded-[14px] bg-adm-surface-2 px-3.5 py-1 shadow-[inset_0_0_0_1px_var(--color-adm-line)]">{children}</div>;
}

function KV({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <span className="mt-0.5 shrink-0 text-adm-muted [&_svg]:size-4">{icon}</span>
      <div className="min-w-0 flex-1">
        <div className="text-xs text-adm-muted">{label}</div>
        {children}
      </div>
    </div>
  );
}

function Stepper({ status }: { status: string }) {
  const reduce = useReducedMotion();
  const idx = FLOW.indexOf(status as OrderStatus);
  const cancelled = idx < 0;
  const fill = idx <= 0 ? 0 : (idx / (FLOW.length - 1)) * 100;

  return (
    <>
      <ol className="relative grid grid-cols-5" aria-label="Order progress">
        <span aria-hidden className="absolute left-[10%] right-[10%] top-3 h-[3px] rounded-full bg-adm-line">
          <motion.span
            className="block h-full rounded-full bg-adm-accent"
            initial={reduce ? false : { width: 0 }}
            animate={{ width: `${fill}%` }}
            transition={{ duration: 0.7, ease: EASE }}
          />
        </span>
        {FLOW.map((s, i) => {
          const state = cancelled ? 'off' : i < idx ? 'done' : i === idx ? 'current' : 'todo';
          return (
            <li key={s} className="relative flex flex-col items-center gap-[7px] text-center" aria-current={state === 'current' ? 'step' : undefined}>
              <span
                className={cn(
                  'grid size-[26px] place-items-center rounded-full text-white transition-[background-color,box-shadow] duration-300',
                  state === 'done' && 'bg-adm-accent',
                  state === 'current' && 'bg-adm-surface shadow-[inset_0_0_0_2px_var(--color-adm-accent),0_0_0_5px_var(--color-adm-accent-soft)]',
                  state === 'todo' && 'bg-adm-surface shadow-[inset_0_0_0_2px_var(--color-adm-line-2)]',
                  state === 'off' && 'bg-[#F4F1F0] shadow-[inset_0_0_0_2px_#E2D9D6]',
                )}
              >
                {state === 'done' && <Check className="size-[13px]" strokeWidth={3} />}
                {state === 'current' && (
                  <motion.span
                    className="size-[9px] rounded-full bg-adm-accent"
                    animate={reduce ? undefined : { scale: [1, 0.7, 1] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                  />
                )}
              </span>
              <span className={cn('text-[11.5px] font-semibold', state === 'done' || state === 'current' ? 'text-adm-ink' : 'text-adm-muted')}>
                {ORDER_STATUS[s].label}
              </span>
            </li>
          );
        })}
      </ol>
      {cancelled && (
        <div className="mt-3.5 flex items-start gap-2.5 rounded-xl bg-[#F4F1F0] px-3 py-2.5 text-[#57534E]">
          <XCircle className="mt-px size-[17px] shrink-0" />
          <div>
            <b className="block text-[13.5px] text-adm-ink">Order cancelled</b>
            <span className="text-[12.5px]">Pick another status below to reopen it.</span>
          </div>
        </div>
      )}
    </>
  );
}

export interface OrderSheetProps {
  /** The order to show (kept while the sheet animates closed). */
  order: Order | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  draftStatus: string;
  onDraftChange: (status: OrderStatus) => void;
  isSaving: boolean;
  saved: boolean;
  /** WhatsApp link for the picked status, shown as "Notify customer" after saving. */
  notifyLink: string | null;
  onSave: () => void;
  onCancel: () => void;
  onDone: () => void;
  onDelete: () => void;
}

export function OrderSheet({
  order,
  open,
  onOpenChange,
  draftStatus,
  onDraftChange,
  isSaving,
  saved,
  notifyLink,
  onSave,
  onCancel,
  onDone,
  onDelete,
}: OrderSheetProps) {
  const reduce = useReducedMotion();
  const contentRef = useRef<HTMLDivElement>(null);
  // The orders API returns the raw column name (coupon_code), not the camelCase field in the Order type.
  const couponCode = order ? order.couponCode ?? (order as Order & { coupon_code?: string | null }).coupon_code ?? null : null;

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
        {order && (
          <>
            <SheetHeader className="pt-[calc(20px+env(safe-area-inset-top,0px))] max-sm:pl-[18px]">
              <div className="flex flex-wrap items-center gap-2.5">
                <SheetTitle className="font-adm-mono text-[19px] font-semibold tracking-[-0.02em]">{order.orderNumber}</SheetTitle>
                <SourceBadge source={sourceOf(order)} />
                <motion.span
                  key={order.status}
                  className="inline-flex"
                  initial={reduce ? false : { scale: 0.82 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 520, damping: 18 }}
                >
                  <StatusBadge status={order.status} />
                </motion.span>
              </div>
              <SheetDescription>
                Placed {formatDate(order.createdAt)} at {fmtTime(order.createdAt)}
              </SheetDescription>
            </SheetHeader>

            <SheetBody className="gap-[22px] pb-7 max-sm:px-[18px]">
              <section>
                <SectionLabel>Progress</SectionLabel>
                <Stepper status={order.status} />
              </section>

              <div className="grid gap-3 sm:grid-cols-2">
                <section className="min-w-0">
                  <SectionLabel>Customer</SectionLabel>
                  <Panel>
                    <KV icon={<User />} label="Name">
                      <div className="wrap-break-word font-semibold">
                        {order.customer.firstName} {order.customer.lastName}
                      </div>
                    </KV>
                    {order.customer.phone && (
                      <KV icon={<Phone />} label="Phone">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold tabular-nums tracking-[.01em]">{displayPhone(order.customer.phone)}</span>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button asChild variant="whatsapp" size="icon" className="-my-1 size-9">
                                <a
                                  href={buildReceivedLink(order)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  aria-label="Send the 'order received' message on WhatsApp"
                                >
                                  <WhatsAppIcon className="size-[17px]" />
                                </a>
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Send &ldquo;order received&rdquo; on WhatsApp</TooltipContent>
                          </Tooltip>
                        </div>
                      </KV>
                    )}
                    <KV icon={<Mail />} label="Email">
                      {order.customer.email ? (
                        <div className="break-all font-semibold">{order.customer.email}</div>
                      ) : (
                        <div className="font-medium text-adm-muted">No email on file</div>
                      )}
                    </KV>
                  </Panel>
                </section>

                <section className="min-w-0">
                  <SectionLabel>Delivery</SectionLabel>
                  <Panel>
                    <KV icon={<MapPin />} label="Address">
                      <div className="wrap-break-word font-semibold">
                        {[order.shippingAddress.area, order.shippingAddress.city, order.shippingAddress.street].filter(Boolean).join(', ') || '—'}
                      </div>
                      <div className="text-[13px] text-adm-muted">Lebanon</div>
                    </KV>
                    {order.paymentMethod && (
                      <KV icon={<CreditCard />} label="Payment">
                        <div className="font-semibold capitalize">{order.paymentMethod}</div>
                      </KV>
                    )}
                  </Panel>
                </section>
              </div>

              <section>
                <SectionLabel>Items ordered ({unitCount(order)})</SectionLabel>
                <div className="flex flex-col gap-2">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex items-center gap-3.5 rounded-[14px] p-2.5 shadow-[inset_0_0_0_1px_var(--color-adm-line)]">
                      <span className="relative grid size-[60px] shrink-0 place-items-center overflow-hidden rounded-xl bg-[#F8F6F5]">
                        <ProductImage
                          key={item.image}
                          src={item.image}
                          alt={item.productName}
                          sizes="60px"
                          className="object-contain p-1"
                          fallback={<ReceiptText className="size-6 text-[#D6CDCB]" />}
                        />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold leading-snug">{item.productName}</div>
                        {item.box && (
                          <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-[#FFF3EA] px-2 py-0.5 text-xs font-semibold text-[#9A3412]">
                            <Gift className="size-3" />
                            {item.box.code ?? 'Gift Box'}
                            {item.box.price > 0 ? ` (+${formatPrice(item.box.price)})` : ' (Free)'}
                          </span>
                        )}
                        <div className="mt-1.5 flex items-center gap-2 text-[12.5px] text-adm-muted">
                          <span className="rounded-full bg-adm-canvas-2 px-2 py-px text-xs font-bold tabular-nums text-adm-ink-2">×{item.quantity}</span>
                          {formatPrice(item.price)} each
                        </div>
                      </div>
                      <div className="shrink-0 font-bold tabular-nums">{formatPrice(item.price * item.quantity)}</div>
                    </div>
                  ))}
                </div>

                <dl className="pt-2 tabular-nums">
                  <div className="flex justify-between gap-3 py-[5px]">
                    <dt className="text-adm-muted">Subtotal</dt>
                    <dd>{formatPrice(order.subtotal)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 py-[5px]">
                    <dt className="text-adm-muted">Shipping</dt>
                    <dd className={cn(order.shipping === 0 && 'font-semibold text-[#15803D]')}>
                      {order.shipping === 0 ? 'FREE' : formatPrice(order.shipping)}
                    </dd>
                  </div>
                  {(order.discount ?? 0) > 0 && (
                    <div className="flex justify-between gap-3 py-[5px] text-[#15803D]">
                      <dt>
                        Discount
                        {couponCode && (
                          <span className="ml-1.5 rounded-md bg-[#E6F6EC] px-1.5 py-px font-adm-mono text-[11.5px]">{couponCode}</span>
                        )}
                      </dt>
                      <dd className="font-semibold">-{formatPrice(order.discount ?? 0)}</dd>
                    </div>
                  )}
                  <div className="mt-1.5 flex items-baseline justify-between gap-3 border-t border-dashed border-adm-line-2 pt-3">
                    <dt className="text-[15px] font-bold">Total</dt>
                    <dd className="font-adm-display text-[20px] font-bold tracking-[-0.02em] text-adm-accent">{formatPrice(order.total)}</dd>
                  </div>
                </dl>
              </section>

              {order.notes && (
                <section className="rounded-[14px] bg-[#FFF8EB] px-3.5 py-3 text-[#7A4A06] shadow-[inset_0_0_0_1px_#F6E2B8]">
                  <SectionLabel className="mb-1 text-[#92400E]">Customer notes</SectionLabel>
                  <p className="whitespace-pre-line wrap-break-word leading-relaxed">{order.notes}</p>
                </section>
              )}

              <section>
                <SectionLabel>Update status</SectionLabel>
                <div role="radiogroup" aria-label="New status" className="flex flex-wrap gap-2">
                  {ORDER_STATUSES.map((s) => {
                    const checked = draftStatus === s;
                    return (
                      <button
                        key={s}
                        type="button"
                        role="radio"
                        aria-checked={checked}
                        onClick={() => onDraftChange(s)}
                        className={cn(
                          'inline-flex h-9 items-center gap-[7px] rounded-full px-3.5 text-[12.5px] font-semibold outline-none transition-[background-color,color,box-shadow,transform] duration-200 ease-adm-spring focus-visible:ring-2 focus-visible:ring-adm-accent/40',
                          checked
                            ? cn(STATUS_TINT[s], 'scale-[1.03] shadow-[inset_0_0_0_1.5px_currentColor]')
                            : 'bg-adm-surface text-adm-muted shadow-[inset_0_0_0_1.5px_var(--color-adm-line-2)] hover:text-adm-ink hover:shadow-[inset_0_0_0_1.5px_#D5CAC7]',
                        )}
                      >
                        <span aria-hidden className="size-[7px] rounded-full" style={{ background: ORDER_STATUS[s].dot }} />
                        {ORDER_STATUS[s].label}
                      </button>
                    );
                  })}
                </div>
              </section>
            </SheetBody>

            <SheetFooter className="max-sm:px-[18px]">
              <Button variant="ghost-destructive" onClick={onDelete} className="px-2.5 max-sm:order-last max-sm:w-full">
                <Trash2 />
                Delete order
              </Button>
              {saved ? (
                <>
                  <span role="status" className="inline-flex items-center gap-2 text-[13px] font-semibold text-[#16A34A] max-sm:w-full max-sm:justify-center">
                    <motion.span
                      className="grid size-5 place-items-center rounded-full bg-[#22C55E] text-white"
                      initial={reduce ? false : { scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 520, damping: 16 }}
                    >
                      <Check className="size-3" strokeWidth={3} />
                    </motion.span>
                    Status updated!
                  </span>
                  <span className="flex-1 max-sm:hidden" />
                  {notifyLink && (
                    <Button variant="whatsapp" className="max-sm:flex-1" onClick={() => window.open(notifyLink, '_blank')}>
                      <WhatsAppIcon />
                      Notify customer
                    </Button>
                  )}
                  <Button variant="outline" className="max-sm:flex-1" onClick={onDone}>
                    Done
                  </Button>
                </>
              ) : (
                <>
                  <span className="flex-1 max-sm:hidden" />
                  <Button variant="outline" className="max-sm:flex-1" onClick={onCancel}>
                    Cancel
                  </Button>
                  <Button className="max-sm:flex-1" disabled={isSaving || draftStatus === order.status} onClick={onSave}>
                    {isSaving && <Loader2 className="animate-spin" />}
                    {isSaving ? 'Saving…' : 'Save status'}
                  </Button>
                </>
              )}
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

export function DeleteOrderDialog({
  open,
  onOpenChange,
  orderNumber,
  isDeleting,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orderNumber?: string;
  isDeleting: boolean;
  onConfirm: () => void;
}) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogTitle>Delete order?</AlertDialogTitle>
        <AlertDialogDescription>
          This will permanently delete order <strong className="font-adm-mono font-semibold text-adm-ink">{orderNumber}</strong>. This action
          cannot be undone.
        </AlertDialogDescription>
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
            {isDeleting ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
