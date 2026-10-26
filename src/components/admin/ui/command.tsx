'use client';

import * as React from 'react';
import { Command as CommandPrimitive } from 'cmdk';
import { Dialog as DialogPrimitive } from 'radix-ui';
import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

function CommandDialog({
  open,
  onOpenChange,
  children,
  label = 'Search',
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  label?: string;
}) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-[rgba(29,23,24,.3)] backdrop-blur-[3px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <DialogPrimitive.Content
          aria-describedby={undefined}
          className="fixed left-1/2 top-[12vh] z-50 w-[min(580px,calc(100vw-32px))] -translate-x-1/2 overflow-hidden rounded-[18px] bg-adm-surface font-adm-body text-adm-ink shadow-adm-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95"
        >
          <DialogPrimitive.Title className="sr-only">{label}</DialogPrimitive.Title>
          <CommandPrimitive className="flex flex-col" loop>
            {children}
          </CommandPrimitive>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

function CommandInput({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Input>) {
  return (
    <div className="flex items-center gap-2.5 border-b border-adm-line px-4">
      <Search className="size-[18px] shrink-0 text-adm-muted" />
      <CommandPrimitive.Input
        className={cn('h-[52px] w-full min-w-0 bg-transparent text-base outline-none placeholder:text-[#998E90] sm:text-[15px]', className)}
        {...props}
      />
      <kbd className="rounded-[6px] border border-adm-line-2 border-b-2 bg-white px-1.5 py-1 font-adm-mono text-[11px] leading-none text-adm-muted">Esc</kbd>
    </div>
  );
}

function CommandList({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.List>) {
  return <CommandPrimitive.List className={cn('max-h-[min(380px,56vh)] overflow-y-auto p-1.5', className)} {...props} />;
}

function CommandEmpty(props: React.ComponentProps<typeof CommandPrimitive.Empty>) {
  return <CommandPrimitive.Empty className="px-3 py-7 text-center text-[13.5px] text-adm-muted" {...props} />;
}

function CommandGroup({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Group>) {
  return (
    <CommandPrimitive.Group
      className={cn(
        '[&_[cmdk-group-heading]]:px-2.5 [&_[cmdk-group-heading]]:pb-1 [&_[cmdk-group-heading]]:pt-2.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-bold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-[.07em] [&_[cmdk-group-heading]]:text-adm-muted',
        className,
      )}
      {...props}
    />
  );
}

function CommandItem({ className, ...props }: React.ComponentProps<typeof CommandPrimitive.Item>) {
  return (
    <CommandPrimitive.Item
      className={cn(
        "flex cursor-default select-none items-center gap-2.5 rounded-[10px] px-2.5 py-2 text-[13.5px] font-medium outline-none data-[selected=true]:bg-adm-accent-soft [&_svg]:size-4 [&_svg]:shrink-0 [&_svg]:text-adm-muted data-[selected=true]:[&_svg]:text-adm-accent",
        className,
      )}
      {...props}
    />
  );
}

function CommandFooter({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-3.5 border-t border-adm-line bg-adm-surface-2 px-4 py-2.5 text-xs text-adm-muted">{children}</div>;
}

export { CommandDialog, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem, CommandFooter };
