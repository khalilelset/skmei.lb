'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { ChevronDown, ChevronRight, LogOut, Menu, Search, Store } from 'lucide-react';
import { Button } from '@/components/admin/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/admin/ui/dropdown-menu';
import { pageTitle } from './nav';

const ADMIN_EMAIL = 'skmei.lb@gmail.com';

export function AdminTopBar({ onMenu, onSearch }: { onMenu: () => void; onSearch: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [shortcut] = useState(() =>
    typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent) ? '⌘K' : 'Ctrl K',
  );

  const logout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-[#E7E5E4] bg-white/[.86] px-4 backdrop-blur-[14px] backdrop-saturate-150 sm:gap-3 lg:px-7">
      <Button variant="ghost" size="icon" className="-ml-1.5 lg:hidden" onClick={onMenu} aria-label="Open menu">
        <Menu className="size-5" />
      </Button>

      <nav aria-label="Breadcrumb" className="hidden min-w-0 items-center gap-1.5 text-[13.5px] text-adm-muted md:flex">
        <span>Admin</span>
        <ChevronRight className="size-3.5 text-[#B9AEB0]" />
        <span className="truncate font-semibold text-adm-ink">{pageTitle(pathname)}</span>
      </nav>

      <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
        <Link href="/admin" aria-label="SKMEI.LB admin home" className="block h-9 shrink-0 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-adm-accent/40 sm:h-10">
          {/* white.png is the dark-lettered version, made for light backgrounds. Sized inline because
              globals.css has an unlayered `img { height: auto }` that beats Tailwind height classes. */}
          <Image src="/images/logo/white.png" alt="SKMEI.LB" width={1080} height={376} priority style={{ height: '100%', width: 'auto' }} />
        </Link>

        <button
          type="button"
          onClick={onSearch}
          aria-label="Search pages, orders and products"
          className="hidden h-[38px] w-[min(380px,30vw)] items-center gap-2.5 rounded-[10px] border border-[#E7E5E4] bg-[#FAFAF9] pl-3 pr-2 text-left text-[13.5px] text-[#A8A29E] outline-none transition-[border-color,background-color,box-shadow] hover:border-[#D6D3D1] hover:bg-white focus-visible:border-[#F87171] focus-visible:bg-white focus-visible:ring-[3px] focus-visible:ring-adm-accent/15 md:flex"
        >
          <Search className="size-4 shrink-0" />
          <span className="flex-1 truncate">Search orders, products…</span>
          <kbd suppressHydrationWarning className="rounded-[6px] border border-[#E7E5E4] border-b-2 bg-white px-1.5 py-1 font-adm-mono text-[11px] leading-none text-adm-muted">
            {shortcut}
          </kbd>
        </button>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onSearch} aria-label="Search">
          <Search className="size-5" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex h-[42px] items-center gap-2.5 rounded-[12px] border border-transparent p-[3px] outline-none transition-colors hover:border-[#E7E5E4] hover:bg-[#F5F5F4] focus-visible:ring-2 focus-visible:ring-adm-accent/40 data-[state=open]:border-[#E7E5E4] data-[state=open]:bg-[#F5F5F4] sm:pr-2"
            >
              <span className="relative grid size-[34px] place-items-center rounded-[10px] bg-adm-side font-adm-display text-xs font-extrabold tracking-[.02em] text-white after:absolute after:-bottom-0.5 after:-right-0.5 after:size-2.5 after:rounded-full after:border-2 after:border-white after:bg-[#22C55E]">
                SK
              </span>
              <span className="hidden flex-col text-left leading-tight sm:flex">
                <b className="text-[13px] font-semibold text-adm-ink">Admin</b>
                <small className="text-[11.5px] text-adm-muted">{ADMIN_EMAIL}</small>
              </span>
              <ChevronDown className="hidden size-[15px] text-[#A8A29E] sm:block" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-60">
            <DropdownMenuLabel className="normal-case tracking-normal">
              <span className="block text-[13.5px] font-semibold text-adm-ink">SKMEI.LB Admin</span>
              <span className="block text-xs font-normal text-adm-muted">{ADMIN_EMAIL}</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => window.open('/', '_blank', 'noopener,noreferrer')}>
              <Store />
              View store
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={logout}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
