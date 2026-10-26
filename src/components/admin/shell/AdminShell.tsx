'use client';

import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { LayoutGroup, motion, useReducedMotion } from 'framer-motion';
import { Sheet, SheetContent, SheetTitle } from '@/components/admin/ui/sheet';
import { Toaster } from '@/components/admin/ui/sonner';
import { TooltipProvider } from '@/components/admin/ui/tooltip';
import { AdminSidebar } from './AdminSidebar';
import { AdminTopBar } from './AdminTopBar';
import { CommandMenu } from './CommandMenu';
import { ORDERS_CHANGED_EVENT } from './nav';

function usePendingCount(pathname: string) {
  const [count, setCount] = useState<number | null>(null);
  const load = useCallback(() => {
    fetch('/api/admin/orders/pending-count')
      .then((r) => (r.ok ? r.json() : null))
      .then((d: { count?: number } | null) => {
        if (d && typeof d.count === 'number') setCount(d.count);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    load();
  }, [load, pathname]);
  useEffect(() => {
    window.addEventListener(ORDERS_CHANGED_EVENT, load);
    return () => window.removeEventListener(ORDERS_CHANGED_EVENT, load);
  }, [load]);
  return count;
}

export function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const reduce = useReducedMotion();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const pending = usePendingCount(pathname);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <TooltipProvider delayDuration={300}>
      <div className="min-h-dvh bg-adm-canvas font-adm-body text-[14px] text-adm-ink antialiased lg:pl-[264px]">
        <aside className="fixed inset-y-0 left-0 z-40 hidden w-[264px] lg:block">
          <LayoutGroup id="adm-side-desktop">
            <AdminSidebar pendingCount={pending} />
          </LayoutGroup>
        </aside>

        <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
          <SheetContent side="left" showClose={false} className="overflow-hidden rounded-r-[20px] bg-adm-side p-0 lg:hidden">
            <SheetTitle className="sr-only">Admin menu</SheetTitle>
            <LayoutGroup id="adm-side-mobile">
              <AdminSidebar pendingCount={pending} onNavigate={() => setMenuOpen(false)} />
            </LayoutGroup>
          </SheetContent>
        </Sheet>

        <div className="min-w-0">
          <AdminTopBar onMenu={() => setMenuOpen(true)} onSearch={() => setSearchOpen(true)} />
          <motion.main
            key={pathname}
            initial={reduce ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.2, 0.8, 0.2, 1] }}
            className="mx-auto w-full max-w-[1360px] px-4 pb-14 pt-6 lg:px-7"
          >
            {children}
          </motion.main>
        </div>

        <CommandMenu open={searchOpen} onOpenChange={setSearchOpen} />
        <Toaster />
      </div>
    </TooltipProvider>
  );
}
