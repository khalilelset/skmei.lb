'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Home, Store, Search, ShoppingBag, User, X } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { getTotalItems, openCart } = useCartStore();
  const cartCount = getTotalItems();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/store/products?search=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Search Overlay — input pinned to top so keyboard doesn't cover it */}
      {searchOpen && (
        <>
          <div
            className="lg:hidden fixed inset-0 z-[60] bg-black/50"
            onClick={() => setSearchOpen(false)}
          />
          <div className="lg:hidden fixed top-0 left-0 right-0 z-61 bg-white shadow-lg">
            <form onSubmit={handleSearch} className="flex items-center gap-2 px-3 py-3">
              <button
                type="button"
                onClick={() => setSearchOpen(false)}
                className="p-2 text-brand-gray shrink-0"
                aria-label="Close search"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for watches..."
                  className="w-full pl-9 pr-3 py-2.5 bg-gray-100 rounded-xl text-brand-black placeholder:text-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-red/30 text-sm"
                  autoFocus
                />
              </div>
              <button
                type="submit"
                className="shrink-0 px-4 py-2.5 bg-brand-red text-white rounded-xl font-semibold text-sm"
              >
                Search
              </button>
            </form>
          </div>
        </>
      )}

      {/* Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
        <div className="flex items-center h-16">

          {/* Home */}
          <Link
            href="/"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              isActive('/') ? 'text-brand-red' : 'text-brand-gray'
            }`}
          >
            <Home className="w-6 h-6" />
            <span className="text-[10px] font-medium">Home</span>
          </Link>

          {/* Shop */}
          <Link
            href="/store/products"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              isActive('/store/products') ? 'text-brand-red' : 'text-brand-gray'
            }`}
          >
            <Store className="w-6 h-6" />
            <span className="text-[10px] font-medium">Shop</span>
          </Link>

          {/* Search */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-brand-gray transition-colors"
          >
            <Search className="w-6 h-6" />
            <span className="text-[10px] font-medium">Search</span>
          </button>

          {/* Cart */}
          <button
            onClick={openCart}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              cartCount > 0 ? 'text-brand-red' : 'text-brand-gray'
            }`}
          >
            <div className="relative">
              <ShoppingBag className="w-6 h-6" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-[18px] h-[18px] bg-brand-red text-white text-[9px] rounded-full flex items-center justify-center font-bold border-2 border-white">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-[10px] font-medium">Cart</span>
          </button>

          {/* Account */}
          <Link
            href="/account"
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 transition-colors ${
              isActive('/account') ? 'text-brand-red' : 'text-brand-gray'
            }`}
          >
            <User className="w-6 h-6" />
            <span className="text-[10px] font-medium">Account</span>
          </Link>

        </div>
        {/* Safe area for iPhone notch */}
        <div className="h-[env(safe-area-inset-bottom,0px)] bg-white" />
      </nav>
    </>
  );
}
