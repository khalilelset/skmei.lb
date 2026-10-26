import * as React from 'react';
import { cn } from '@/lib/utils';

function Table({ className, wrapperClassName, ...props }: React.ComponentProps<'table'> & { wrapperClassName?: string }) {
  return (
    <div data-slot="table-container" className={cn('relative w-full overflow-x-auto overscroll-x-contain', wrapperClassName)}>
      <table data-slot="table" className={cn('w-full border-separate border-spacing-0 text-[13.5px]', className)} {...props} />
    </div>
  );
}

function TableHeader({ className, ...props }: React.ComponentProps<'thead'>) {
  return <thead data-slot="table-header" className={className} {...props} />;
}

function TableBody({ className, ...props }: React.ComponentProps<'tbody'>) {
  return <tbody data-slot="table-body" className={cn('[&_tr:last-child>td]:border-b-0', className)} {...props} />;
}

function TableRow({ className, ...props }: React.ComponentProps<'tr'>) {
  return (
    <tr
      data-slot="table-row"
      className={cn('transition-colors [&>td]:transition-colors hover:[&>td]:bg-[#FCF7F6] data-[clickable=true]:cursor-pointer focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-adm-accent', className)}
      {...props}
    />
  );
}

function TableHead({ className, ...props }: React.ComponentProps<'th'>) {
  return (
    <th
      data-slot="table-head"
      className={cn(
        'whitespace-nowrap border-y border-adm-line bg-adm-surface-2 px-3.5 py-2.5 text-left text-[12.5px] font-semibold text-adm-muted first:pl-5 last:pr-5',
        className,
      )}
      {...props}
    />
  );
}

function TableCell({ className, ...props }: React.ComponentProps<'td'>) {
  return (
    <td
      data-slot="table-cell"
      className={cn('whitespace-nowrap border-b border-adm-line px-3.5 py-[11px] align-middle first:pl-5 last:pr-5', className)}
      {...props}
    />
  );
}

function TableEmpty({ colSpan, title, children }: { colSpan: number; title: string; children?: React.ReactNode }) {
  return (
    <tr>
      <td colSpan={colSpan} className="px-5 py-11 text-center text-[13.5px] text-adm-muted">
        <b className="mb-1 block font-adm-display text-[15px] text-adm-ink">{title}</b>
        {children}
      </td>
    </tr>
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell, TableEmpty };
