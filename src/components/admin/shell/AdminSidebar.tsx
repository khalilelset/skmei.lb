'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ExternalLink, LogOut, Store, Watch } from 'lucide-react';
import { cn } from '@/lib/utils';
import { NAV_GROUPS, isActive } from './nav';

function dialTicks() {
  const lines: React.ReactNode[] = [];
  for (let i = 0; i < 60; i++) {
    const t = (i * 2 * Math.PI) / 60;
    const major = i % 5 === 0;
    const r = 200;
    const r1 = r - (major ? 26 : 11);
    lines.push(
      <line
        key={i}
        x1={(r1 * Math.sin(t)).toFixed(2)}
        y1={(-r1 * Math.cos(t)).toFixed(2)}
        x2={(r * Math.sin(t)).toFixed(2)}
        y2={(-r * Math.cos(t)).toFixed(2)}
        stroke="currentColor"
        strokeWidth={major ? 4 : 2}
        strokeLinecap="round"
      />,
    );
  }
  return lines;
}
const DIAL = dialTicks();

export function AdminSidebar({ pendingCount, onNavigate }: { pendingCount: number | null; onNavigate?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();

  const logout = async () => {
    await fetch('/api/admin/auth/logout', { method: 'POST' });
    router.push('/admin/login');
    router.refresh();
  };

  return (
    <div className="relative isolate flex h-full flex-col overflow-hidden bg-adm-side px-3 pb-3.5 pt-[18px] text-adm-side-text">
      <svg viewBox="-210 -210 420 420" aria-hidden className="pointer-events-none absolute -bottom-[170px] -left-[150px] -z-[1] size-[420px] text-white opacity-[.07]">
        {DIAL}
        <circle r={150} fill="none" stroke="currentColor" strokeWidth={1.5} />
      </svg>

      <div className="flex items-center gap-3 px-2 pb-3">
        <span className="grid size-[38px] shrink-0 place-items-center rounded-[11px] bg-adm-accent text-white shadow-[inset_0_-2px_0_rgba(0,0,0,.22),inset_0_1px_0_rgba(255,255,255,.18)]">
          <Watch className="size-5" strokeWidth={2} />
        </span>
        <div>
          <div className="font-adm-display text-[17px] font-extrabold leading-tight tracking-[-0.01em] text-white">
            SKMEI<b className="text-adm-accent">.</b>LB
          </div>
          <div className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.18em] text-adm-side-dim">Admin</div>
        </div>
      </div>

      <nav aria-label="Admin navigation" className="-mx-1 flex-1 overflow-y-auto px-1 [scrollbar-color:#2A2A2E_transparent] [scrollbar-width:thin]">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <div className="px-3 pb-1.5 pt-3.5 text-[10.5px] font-semibold uppercase tracking-[.16em] text-adm-side-dim">{group.label}</div>
            <ul className="flex flex-col gap-px">
              {group.items.map((item) => {
                const active = isActive(item.href, pathname);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onNavigate}
                      aria-current={active ? 'page' : undefined}
                      className={cn(
                        'group relative flex h-9 items-center gap-3 rounded-[9px] px-3 text-[13.5px] font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-white/70',
                        active ? 'font-semibold text-white' : 'hover:bg-white/[.055] hover:text-white',
                      )}
                    >
                      {active && (
                        <motion.span
                          layoutId="adm-nav-pill"
                          className="absolute inset-0 rounded-[9px] bg-adm-accent shadow-[inset_0_1px_0_rgba(255,255,255,.16),0_6px_14px_-8px_rgba(220,38,38,.8)]"
                          transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                        />
                      )}
                      <Icon className="relative z-[1] size-[17px] transition-transform duration-300 ease-adm-spring group-hover:scale-110" strokeWidth={2} />
                      <span className="relative z-[1]">{item.label}</span>
                      {item.showPendingCount && pendingCount !== null && pendingCount > 0 && (
                        <span
                          title="Pending orders"
                          className={cn(
                            'relative z-[1] ml-auto h-[19px] min-w-5 rounded-full px-1.5 text-center font-adm-mono text-[11px] font-semibold leading-[19px] tabular-nums',
                            active ? 'bg-white/[.22] text-white' : 'bg-adm-accent/[.22] text-[#FCA5A5]',
                          )}
                        >
                          {pendingCount}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-3 flex flex-col gap-px border-t border-adm-side-line pt-3">
        <a
          href="/"
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-9 items-center gap-3 rounded-[9px] px-3 text-[13.5px] font-medium transition-colors hover:bg-white/[.055] hover:text-white"
        >
          <Store className="size-[17px]" strokeWidth={2} />
          View store
          <ExternalLink className="ml-auto size-3.5 opacity-60" />
        </a>
        <button
          type="button"
          onClick={logout}
          className="flex h-9 items-center gap-3 rounded-[9px] px-3 text-left text-[13.5px] font-medium transition-colors hover:bg-white/[.055] hover:text-[#FCA5A5]"
        >
          <LogOut className="size-[17px]" strokeWidth={2} />
          Log out
        </button>
      </div>
    </div>
  );
}
