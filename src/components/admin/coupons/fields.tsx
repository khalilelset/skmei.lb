import * as React from 'react';
import { Input } from '@/components/admin/ui/input';
import { Label } from '@/components/admin/ui/label';
import { cn } from '@/lib/utils';

export function Section({
  title,
  description,
  icon,
  className,
  children,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon: React.ReactNode;
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
        <p role="alert" className="text-[12px] font-medium text-adm-accent-hover">
          {error}
        </p>
      ) : hint ? (
        <p className="text-[12px] leading-snug text-adm-muted">{hint}</p>
      ) : null}
    </div>
  );
}

/** Number input with a fixed prefix ("$") or suffix ("%"). */
export function AffixInput({
  prefix,
  suffix,
  className,
  ...props
}: React.ComponentProps<'input'> & { prefix?: string; suffix?: string }) {
  return (
    <div className={cn('relative min-w-0', className)}>
      {prefix && (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[13.5px] font-medium text-adm-muted">{prefix}</span>
      )}
      <Input type="number" className={cn('tabular-nums', prefix && 'pl-6', suffix && 'pr-8')} {...props} />
      {suffix && (
        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[13.5px] font-semibold text-adm-muted">{suffix}</span>
      )}
    </div>
  );
}
