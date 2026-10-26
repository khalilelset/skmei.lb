import * as React from 'react';
import { cn } from '@/lib/utils';

const fieldBase =
  'w-full min-w-0 rounded-[10px] border border-adm-line-2 bg-adm-surface text-base text-adm-ink sm:text-[13.5px] outline-none transition-[border-color,box-shadow] placeholder:text-[#998E90] focus-visible:border-[#E9928B] focus-visible:ring-[3px] focus-visible:ring-adm-accent/20 disabled:cursor-not-allowed disabled:opacity-60 aria-invalid:border-adm-accent aria-invalid:ring-adm-accent/20';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return <input type={type} data-slot="input" className={cn(fieldBase, 'h-[38px] px-3', className)} {...props} />;
}

function Textarea({ className, ...props }: React.ComponentProps<'textarea'>) {
  return <textarea data-slot="textarea" className={cn(fieldBase, 'min-h-20 px-3 py-2 leading-relaxed', className)} {...props} />;
}

function SearchInput({ className, icon, ...props }: React.ComponentProps<'input'> & { icon?: React.ReactNode }) {
  return (
    <label className={cn('relative flex min-w-0 items-center', className)}>
      <span className="pointer-events-none absolute left-3 text-adm-muted [&_svg]:size-4">{icon}</span>
      <input type="search" data-slot="input" className={cn(fieldBase, 'h-[38px] pl-9 pr-3')} {...props} />
    </label>
  );
}

export { Input, Textarea, SearchInput, fieldBase };
