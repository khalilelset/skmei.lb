'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function PageviewTracker() {
  const pathname = usePathname();

  useEffect(() => {
    const payload = JSON.stringify({ url: pathname, referrer: document.referrer || null });
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([payload], { type: 'application/json' }));
    } else {
      fetch('/api/track', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
    }
  }, [pathname]);

  return null;
}
