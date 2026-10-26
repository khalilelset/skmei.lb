'use client';

import * as React from 'react';
import { Dialog as SheetPrimitive } from 'radix-ui';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { ignoreToastInteractions } from './dialog';

const Sheet = SheetPrimitive.Root;
const SheetTrigger = SheetPrimitive.Trigger;
const SheetClose = SheetPrimitive.Close;

function SheetContent({
  className,
  children,
  side = 'right',
  showClose = true,
  overlayClassName,
  onInteractOutside,
  ...props
}: React.ComponentProps<typeof SheetPrimitive.Content> & {
  side?: 'right' | 'left';
  showClose?: boolean;
  overlayClassName?: string;
}) {
  return (
    <SheetPrimitive.Portal>
      <SheetPrimitive.Overlay
        className={cn(
          'fixed inset-0 z-50 bg-[rgba(29,23,24,.26)] backdrop-blur-[2px] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0',
          overlayClassName,
        )}
      />
      <SheetPrimitive.Content
        data-slot="sheet-content"
        onInteractOutside={ignoreToastInteractions(onInteractOutside)}
        className={cn(
          'fixed inset-y-0 z-50 flex flex-col bg-adm-surface font-adm-body text-adm-ink shadow-adm-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:duration-300 data-[state=open]:duration-500 data-[state=open]:ease-[cubic-bezier(.32,.72,0,1)]',
          side === 'right'
            ? 'right-0 w-[min(560px,100%)] rounded-l-[22px] data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right max-[560px]:rounded-none'
            : 'left-0 w-[min(290px,86vw)] data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left',
          className,
        )}
        {...props}
      >
        {children}
        {showClose && (
          <SheetPrimitive.Close className="absolute right-4 top-4 grid size-9 place-items-center rounded-[10px] text-adm-ink-2 transition-colors hover:bg-[rgba(70,30,32,.06)] focus-visible:outline-2 focus-visible:outline-adm-accent">
            <X className="size-[18px]" />
            <span className="sr-only">Close</span>
          </SheetPrimitive.Close>
        )}
      </SheetPrimitive.Content>
    </SheetPrimitive.Portal>
  );
}

function SheetHeader({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-header" className={cn('relative border-b border-adm-line px-6 pb-4 pt-5 pr-16', className)} {...props} />;
}

function SheetBody({ className, ...props }: React.ComponentProps<'div'>) {
  return <div data-slot="sheet-body" className={cn('flex flex-1 flex-col gap-5 overflow-y-auto overscroll-contain px-6 py-5', className)} {...props} />;
}

function SheetFooter({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="sheet-footer"
      className={cn('flex flex-wrap items-center gap-2.5 border-t border-adm-line bg-adm-surface px-6 py-3.5 pb-[calc(14px+env(safe-area-inset-bottom,0px))]', className)}
      {...props}
    />
  );
}

function SheetTitle({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Title>) {
  return <SheetPrimitive.Title data-slot="sheet-title" className={cn('font-adm-display text-[19px] font-bold tracking-[-0.015em]', className)} {...props} />;
}

function SheetDescription({ className, ...props }: React.ComponentProps<typeof SheetPrimitive.Description>) {
  return <SheetPrimitive.Description data-slot="sheet-description" className={cn('mt-1 text-[13px] text-adm-muted', className)} {...props} />;
}

export { Sheet, SheetTrigger, SheetClose, SheetContent, SheetHeader, SheetBody, SheetFooter, SheetTitle, SheetDescription };
