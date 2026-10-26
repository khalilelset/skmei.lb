import * as React from 'react';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { cn } from '@/lib/utils';

export function Section({
  title,
  description,
  icon,
  aside,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon: React.ReactNode;
  aside?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn('min-w-0 rounded-[16px] bg-adm-surface p-4 shadow-adm-md sm:p-5', className)}>
      <header className="mb-4 flex items-start gap-3">
        <span className="grid size-8 shrink-0 place-items-center rounded-[9px] bg-adm-accent-soft text-adm-accent-hover [&_svg]:size-4">{icon}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-adm-display text-[15px] font-bold leading-tight tracking-[-0.01em] text-adm-ink">{title}</h3>
          {description && <p className="mt-0.5 text-[12.5px] leading-snug text-adm-muted">{description}</p>}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className,
  children,
}: {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  error?: string | false;
  hint?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <Label htmlFor={htmlFor} className="gap-1">
        {label}
        {required && <span className="text-adm-accent">*</span>}
      </Label>
      {children}
      {error ? (
        <p className="text-[12px] font-medium text-adm-accent-hover">{error}</p>
      ) : hint ? (
        <p className="truncate text-[12px] text-adm-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Number input with a leading "$". */
export function MoneyInput({ className, ...props }: React.ComponentProps<'input'>) {
  return (
    <div className={cn('relative min-w-0', className)}>
      <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13.5px] font-medium text-adm-muted">$</span>
      <Input type="number" inputMode="decimal" min={0} step="0.01" className="pl-6 tabular-nums" {...props} />
    </div>
  );
}

/** Bordered drop-zone style tile used for image / video upload buttons. */
export const uploadTile =
  'flex flex-col items-center justify-center gap-1.5 rounded-[12px] border-2 border-dashed text-[12px] font-semibold transition-colors';
