'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { AdminShell } from '@/components/admin/shell/AdminShell';
import { adminFontVars } from './fonts';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === '/admin/login';

  // Radix portals (menus, dialogs, toasts) render into <body>, so the admin fonts
  // and page background have to live there too while the admin is open.
  useEffect(() => {
    if (isLogin) return;
    const body = document.body;
    const classes = ['adm-root', ...adminFontVars.split(' ')];
    const prevBg = body.style.backgroundColor;
    body.classList.add(...classes);
    body.style.backgroundColor = '#F7F4F2';
    return () => {
      body.classList.remove(...classes);
      body.style.backgroundColor = prevBg;
    };
  }, [isLogin]);

  if (isLogin) return <>{children}</>;

  return (
    <div className={`adm-root ${adminFontVars}`}>
      <AdminShell>{children}</AdminShell>
    </div>
  );
}
