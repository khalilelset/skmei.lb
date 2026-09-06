'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import CartDrawer from '@/components/store/CartDrawer';
import FloatingWhatsApp from '@/components/store/FloatingWhatsApp';
import BottomNav from '@/components/store/BottomNav';
import CartToast from '@/components/store/CartToast';
import { useCartStore } from '@/store/cartStore';
import PageviewTracker from '@/components/store/PageviewTracker';

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
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 pt-[88px] sm:pt-[104px] pb-16 lg:pb-0 bg-brand-black">
          {children}
        </main>
        <Footer />
        {/* Spacer so footer is not hidden behind the fixed BottomNav on mobile */}
        <div className="h-16 bg-brand-black lg:hidden" />
      </div>
      <PageviewTracker />
      <CartDrawer />
      <FloatingWhatsApp />
      <BottomNav />
      <CartToast />
    </>
  );
}
