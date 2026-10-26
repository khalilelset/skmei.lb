import * as React from 'react';
import { cn } from '@/lib/utils';

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mb-[22px] flex flex-wrap items-end justify-between gap-x-5 gap-y-3', className)}>
      <div className="min-w-0">
        <h1 className="font-adm-display text-[26px] font-bold leading-[1.15] tracking-[-0.025em] text-adm-ink sm:text-[30px]">{title}</h1>
        {description && <p className="mt-1.5 text-[14.5px] text-adm-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  );
}
