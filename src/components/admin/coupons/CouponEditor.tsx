'use client';

import * as React from 'react';
import { useState } from 'react';
import { AlertTriangle, CalendarClock, Check, Globe, Loader2, Percent, Tags, TicketPercent, Trash2 } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/admin/ui/dialog';
import { Input } from '@/components/admin/ui/input';
import { Skeleton } from '@/components/admin/ui/skeleton';
import { Switch } from '@/components/admin/ui/switch';
import { toast } from '@/components/admin/ui/sonner';
import { cn, formatPrice } from '@/lib/utils';
import { AffixInput, Field, Section } from './fields';
import {
  EMPTY_FORM,
  buildPayload,
  fmtDay,
  fmtExpiry,
  formFromCoupon,
  localDateInput,
  summaryParts,
  validateForm,
  type Coupon,
  type CouponForm,
} from './model';

const DAY = 86_400_000;

export function CouponEditor({
  open,
  onOpenChange,
  coupon,
  coupons,
  brandOptions,
  brandsFailed,
  now,
  onSaved,
  onDelete,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** null = creating a new coupon. */
  coupon: Coupon | null;
  coupons: Coupon[];
  /** null while the brand list is still loading. */
  brandOptions: string[] | null;
  brandsFailed: boolean;
  /** Time the editor was opened (for the date picker's min and "already expired" warnings). */
  now: number;
  onSaved: (code: string, edited: boolean) => void;
  onDelete: (coupon: Coupon) => void;
}) {
  const isEdit = coupon !== null;
  const [initial] = useState<CouponForm>(() => (coupon ? formFromCoupon(coupon) : EMPTY_FORM));
  const [form, setForm] = useState<CouponForm>(initial);
  const [saving, setSaving] = useState(false);

  const set = <K extends keyof CouponForm>(key: K, value: CouponForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const errors = validateForm(form, coupons, coupon?.id ?? null);
  const hasErrors = !!(errors.code || errors.discount || errors.max_discount);
  const dirty = JSON.stringify(form) !== JSON.stringify(initial);
  const canSave = form.code.trim() !== '' && form.discount !== '' && !hasErrors && !saving && (!isEdit || dirty);

  // Saved as midnight UTC of the picked day — same conversion the store's validator compares against.
  const expiryMs = form.expires_at ? new Date(form.expires_at).getTime() : null;
  const expiryInPast = expiryMs !== null && expiryMs < now;

  const save = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!canSave) return;
    setSaving(true);
    const body = buildPayload(form, coupon);
    const code = form.code.trim().toUpperCase();
    try {
      const res = await fetch(isEdit ? `/api/admin/coupons/${coupon.id}` : '/api/admin/coupons', {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setSaving(false);
        toast.error(isEdit ? `Couldn't save ${code}` : `Couldn't create ${code}`, { description: err.error ?? res.statusText });
        return;
      }
      setSaving(false);
      onSaved(code, isEdit);
    } catch {
      setSaving(false);
      toast.error(isEdit ? `Couldn't save ${code}` : `Couldn't create ${code}`, { description: 'Check your connection and try again.' });
    }
  };

  const toggleBrand = (name: string) =>
    set('brands', form.brands.includes(name) ? form.brands.filter((b) => b !== name) : [...form.brands, name]);

  const presetDays = (days: number) => set('expires_at', localDateInput(Date.now() + days * DAY));
  const presetMonths = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    set('expires_at', localDateInput(d.getTime()));
  };

  const options = brandOptions ?? [];
  // Brands saved on the coupon that no longer exist stay selectable so editing never drops them silently.
  const missing = form.brands.filter((b) => !options.includes(b));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!saving) onOpenChange(o);
      }}
    >
      <DialogContent
        onOpenAutoFocus={(e) => {
          // Don't pop the phone keyboard straight away; Tab still lands on the code field.
          e.preventDefault();
          (e.currentTarget as HTMLElement | null)?.focus();
        }}
        className={cn(
          'w-[min(640px,calc(100vw-32px))] max-h-[min(92dvh,920px)]',
          'max-sm:inset-0 max-sm:h-dvh max-sm:max-h-none max-sm:w-full max-sm:translate-x-0 max-sm:translate-y-0 max-sm:rounded-none',
        )}
      >
        <form noValidate onSubmit={save} className="flex min-h-0 flex-1 flex-col">
          <DialogHeader className="max-sm:pt-[max(20px,env(safe-area-inset-top))]">
            <DialogTitle>{isEdit ? 'Edit coupon' : 'New coupon'}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? `Created ${fmtDay(coupon.created_at)}. Changes apply to the next checkout that uses this code.`
                : 'Customers type this code at checkout to get a percentage off.'}
            </DialogDescription>
          </DialogHeader>

          <DialogBody className="space-y-4 bg-adm-canvas px-4 sm:px-6">
            <TicketPreview form={form} />

            <Section icon={<TicketPercent />} title="Code & discount" description="Codes are saved in capitals; the percentage comes off eligible items.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Coupon code" htmlFor="cp-code" required error={errors.code} className="sm:col-span-2">
                  <Input
                    id="cp-code"
                    placeholder="e.g. SUMMER20"
                    autoComplete="off"
                    autoCapitalize="characters"
                    spellCheck={false}
                    value={form.code}
                    aria-invalid={!!errors.code || undefined}
                    onChange={(e) => set('code', e.target.value.toUpperCase())}
                    className="font-adm-mono font-bold uppercase tracking-[.12em]"
                  />
                </Field>
                <Field label="Discount" htmlFor="cp-discount" required error={errors.discount} hint="Percent off, 1 to 100.">
                  <AffixInput
                    id="cp-discount"
                    suffix="%"
                    inputMode="decimal"
                    min={1}
                    max={100}
                    placeholder="e.g. 15"
                    value={form.discount}
                    aria-invalid={!!errors.discount || undefined}
                    onChange={(e) => set('discount', e.target.value)}
                  />
                </Field>
                <Field label="Max discount" htmlFor="cp-cap" error={errors.max_discount} hint="Leave empty for no cap.">
                  <AffixInput
                    id="cp-cap"
                    prefix="$"
                    inputMode="decimal"
                    min={0}
                    step={0.5}
                    placeholder="e.g. 12"
                    value={form.max_discount}
                    aria-invalid={!!errors.max_discount || undefined}
                    onChange={(e) => set('max_discount', e.target.value)}
                  />
                </Field>
              </div>
            </Section>

            <Section icon={<Tags />} title="Where it applies" description="Pick brands to limit the code to them. Nothing picked means every brand.">
              <div role="group" aria-label="Brands" className="flex flex-wrap gap-2">
                <BrandChip active={form.brands.length === 0} onClick={() => set('brands', [])} icon={<Globe />}>
                  All brands
                </BrandChip>
                {brandOptions === null
                  ? Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-9 w-[84px] rounded-full" />)
                  : options.map((name) => (
                      <BrandChip key={name} active={form.brands.includes(name)} onClick={() => toggleBrand(name)}>
                        {name}
                      </BrandChip>
                    ))}
                {missing.map((name) => (
                  <BrandChip key={`missing-${name}`} active onClick={() => toggleBrand(name)} title="This brand no longer exists">
                    <span className="line-through decoration-1">{name}</span>
                  </BrandChip>
                ))}
              </div>
              {brandsFailed && (
                <p className="mt-2.5 text-[12px] font-medium text-[#B45309]">Couldn&apos;t load brands. Close and reopen to try again.</p>
              )}

              <label
                htmlFor="cp-sale"
                className="mt-4 flex cursor-pointer items-center justify-between gap-4 rounded-[12px] border border-adm-line bg-adm-surface-2 px-3.5 py-3"
              >
                <span className="min-w-0">
                  <span className="block text-[13.5px] font-semibold text-adm-ink">Apply on sale items</span>
                  <span className="block text-[12.5px] leading-snug text-adm-muted">
                    {form.apply_on_sale ? 'Discount applies to all items, including those on sale.' : 'Discount only applies to full-price items.'}
                  </span>
                </span>
                <Switch id="cp-sale" checked={form.apply_on_sale} onCheckedChange={(v) => set('apply_on_sale', v)} />
              </label>
            </Section>

            <Section icon={<CalendarClock />} title="Expiry" description="Optional. The code stops working when this day begins (00:00 UTC).">
              <div className="flex flex-wrap items-end gap-2">
                <Field label="Expires on" htmlFor="cp-expiry" className="min-w-[180px] flex-1">
                  <Input
                    id="cp-expiry"
                    type="date"
                    min={now ? localDateInput(now) : undefined}
                    value={form.expires_at}
                    onChange={(e) => set('expires_at', e.target.value)}
                  />
                </Field>
                <div className="flex flex-wrap gap-1.5">
                  <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => presetDays(7)}>
                    1 week
                  </Button>
                  <Button type="button" variant="outline" size="sm" className="h-9" onClick={() => presetMonths(1)}>
                    1 month
                  </Button>
                  <Button
                    type="button"
                    variant={form.expires_at ? 'ghost' : 'soft'}
                    size="sm"
                    className="h-9"
                    onClick={() => set('expires_at', '')}
                    aria-pressed={!form.expires_at}
                  >
                    Never
                  </Button>
                </div>
              </div>
              {expiryInPast && (
                <p className="mt-3 flex items-start gap-2 rounded-[10px] bg-[#FEF3E2] px-3 py-2 text-[12.5px] font-medium text-[#B45309]">
                  <AlertTriangle className="mt-px size-4 shrink-0" />
                  This date has already started, so the coupon will show as expired and won&apos;t work at checkout.
                </p>
              )}
            </Section>
          </DialogBody>

          <DialogFooter className="px-4 sm:px-6 max-sm:pb-[max(14px,env(safe-area-inset-bottom))]">
            {isEdit && (
              <Button type="button" variant="ghost-destructive" className="mr-auto" disabled={saving} onClick={() => onDelete(coupon)}>
                <Trash2 />
                Delete
              </Button>
            )}
            <Button type="button" variant="outline" disabled={saving} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!canSave}>
              {saving ? <Loader2 className="animate-spin" /> : <Check />}
              {saving ? (isEdit ? 'Saving...' : 'Creating...') : isEdit ? 'Save changes' : 'Create coupon'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BrandChip({
  active,
  icon,
  children,
  ...props
}: Omit<React.ComponentProps<'button'>, 'type'> & { active: boolean; icon?: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      className={cn(
        'inline-flex h-9 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 text-[13px] font-semibold outline-none transition-colors focus-visible:ring-2 focus-visible:ring-adm-accent/40 [&_svg]:size-3.5',
        active
          ? 'border-[#F5B5AE] bg-adm-accent-soft text-adm-accent-hover'
          : 'border-adm-line-2 bg-adm-surface text-adm-ink-2 hover:border-[#D5CAC7] hover:bg-adm-surface-2',
      )}
      {...props}
    >
      {active ? <Check /> : icon}
      {children}
    </button>
  );
}

/** Live "ticket" showing how the code reads, built from the same summary as the list. */
function TicketPreview({ form }: { form: CouponForm }) {
  const hasCode = form.code.trim() !== '';
  const parts = summaryParts(
    {
      discount: form.discount,
      max_discount: form.max_discount,
      brands: form.brands,
      apply_on_sale: form.apply_on_sale,
      expiresLabel: form.expires_at ? fmtExpiry(`${form.expires_at}T00:00:00Z`) : null,
    },
    formatPrice,
  );
  return (
    <div className="relative flex overflow-hidden rounded-[16px] bg-adm-surface shadow-adm-md" aria-label="Coupon preview">
      <div className="flex w-[96px] shrink-0 flex-col items-center justify-center bg-[linear-gradient(160deg,#EF4444,#B91C1C)] px-2 py-4 text-white sm:w-[116px]">
        <Percent className="mb-1 size-4 opacity-70" />
        <span className="max-w-full truncate font-adm-display text-[28px] font-bold leading-none tracking-[-0.03em] tabular-nums sm:text-[32px]">
          {form.discount || '—'}
          <span className="text-[16px] sm:text-[18px]">%</span>
        </span>
        <span className="mt-1 text-[10.5px] font-bold uppercase tracking-[.16em] text-white/80">off</span>
      </div>
      <div className="relative min-w-0 flex-1 border-l-2 border-dashed border-adm-line-2 px-4 py-3.5">
        <span aria-hidden className="absolute -left-[9px] -top-2 size-4 rounded-full bg-adm-canvas" />
        <span aria-hidden className="absolute -bottom-2 -left-[9px] size-4 rounded-full bg-adm-canvas" />
        <div className="text-[11px] font-semibold uppercase tracking-[.1em] text-adm-muted">Preview</div>
        <div className={cn('truncate font-adm-mono text-[17px] font-bold tracking-[.1em]', hasCode ? 'text-adm-accent' : 'text-adm-faint')}>
          {hasCode ? form.code.trim() : 'YOURCODE'}
        </div>
        <p className="mt-0.5 text-[12.5px] leading-snug text-adm-muted">{parts.join(' · ')}</p>
      </div>
    </div>
  );
}
