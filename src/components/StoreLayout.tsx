'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import CartDrawer from '@/components/store/CartDrawer';
import FloatingWhatsApp from '@/components/store/FloatingWhatsApp';
import BottomNav from '@/components/store/BottomNav';
import { useCartStore } from '@/store/cartStore';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  // Rehydrate cart from localStorage after mount (prevents SSR hydration mismatch)
  useEffect(() => {
    useCartStore.persist.rehydrate();
  }, []);
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith('/admin');

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main className="min-h-screen pt-28 pb-16 lg:pb-0">
        {children}
      </main>
      <Footer />
      <CartDrawer />
      <FloatingWhatsApp />
      <BottomNav />
    </>
  );
}
