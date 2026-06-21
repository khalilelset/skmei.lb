"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import {
  ShoppingBag, Search, Menu, X, User, ChevronDown, ChevronRight,
  Timer, Clock, Activity, Watch, Gem, Truck, Shield,
  Tag, Info, Phone, Glasses,
  Zap, Smartphone, Heart, Star, Package, Users, Sun, Flame, Award, Layers, Sparkles,
  type LucideProps,
} from "lucide-react";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/utils";

type IconComp = React.ComponentType<LucideProps>;
const ICON_MAP: Record<string, IconComp> = {
  Watch, Timer, Clock, Activity, Zap, Gem, Smartphone, Heart, Star,
  Shield, Package, Users, Tag, Sun, Flame, Award, Layers, Sparkles,
};
import Marquee from "react-fast-marquee";


const staticNavigation = [
  { name: "Sale",    href: "/store/products?filter=sale", icon: <Tag className="w-4 h-4" /> },
  { name: "About",   href: "/about",   icon: <Info className="w-4 h-4" /> },
  { name: "Contact", href: "/contact", icon: <Phone className="w-4 h-4" /> },
];

interface NavCategory { id: string; name: string; slug: string; icon?: string | null; }
interface NavSubItem { name: string; href: string; slug: string; icon?: string | null; }
interface NavItem { name: string; href: string; icon: React.ReactNode; submenu?: NavSubItem[]; }

export default function Header() {
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const [dbCategories, setDbCategories] = useState<NavCategory[]>([]);

  useEffect(() => {
    fetch('/api/categories')
      .then((r) => r.json())
      .then((data) => setDbCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const navigation: NavItem[] = [
    {
      name: "Products",
      href: "/store/products",
      icon: <ShoppingBag className="w-4 h-4" />,
      submenu: dbCategories.length > 0
        ? dbCategories.map((c) => ({ name: c.name, href: `/store/products?category=${c.slug}`, slug: c.slug, icon: c.icon }))
        : undefined,
    },
    {
      name: "Sunglasses",
      href: "/store/sunglasses",
      icon: <Glasses className="w-4 h-4" />,
    },
    ...staticNavigation,
  ];

  const quickLinks = [
    ...dbCategories.slice(0, 4).map((c) => ({ label: c.name, href: `/store/products?category=${c.slug}` })),
    { label: "Sale", href: "/store/products?filter=sale" },
  ];

  const { getTotalItems, openCart, bump, mobileMenuOpen, toggleMobileMenu, closeMobileMenu: closeMenu } = useCartStore();
  const cartItemsCount = getTotalItems();
  const badgeRef = useRef<HTMLSpanElement>(null);

  // Animate the badge whenever a new item is added
  useEffect(() => {
    if (bump === 0) return;
    const el = badgeRef.current;
    if (!el) return;
    el.classList.remove('cart-bump');
    void el.offsetWidth; // force reflow to restart animation
    el.classList.add('cart-bump');
  }, [bump]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileMenuOpen]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSearchOpen(false);
      window.location.href = `/store/products?search=${encodeURIComponent(searchQuery)}`;
    }
  };


  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] transition-all duration-500 ${
        scrolled && !mobileMenuOpen
          ? "bg-[#1a1a1a]/95 lg:backdrop-blur-md shadow-2xl shadow-black/60 border-b border-white/6"
          : "bg-brand-black"
      }`}
    >
      {/* Top Bar */}
      <div className="bg-brand-black py-1 overflow-hidden">
        {/* Desktop: static centered */}
        <div className="hidden md:flex items-center justify-center gap-0">
          <div className="flex items-center gap-1 px-6">
            <Truck className="w-3 h-3 text-brand-red shrink-0" />
            <span className="text-white/70 text-[10px] font-medium whitespace-nowrap">
              Free Shipping on Orders Over ${FREE_SHIPPING_THRESHOLD}
            </span>
          </div>
          <span className="w-px h-3 bg-white/20 shrink-0" />
          <div className="flex items-center gap-1 px-6">
            <Shield className="w-3 h-3 text-brand-red shrink-0" />
            <span className="text-white/70 text-[10px] font-medium whitespace-nowrap">
              1-Year Warranty on All Skmei Watches
            </span>
          </div>
        </div>

        {/* Mobile: scrolling marquee */}
        <div className="md:hidden">
          <Marquee speed={40} gradient={false} pauseOnHover>
            <div className="flex items-center">
              <div className="flex items-center gap-1 px-6">
                <Truck className="w-3 h-3 text-brand-red shrink-0" />
                <span className="text-white/70 text-[10px] font-medium whitespace-nowrap">
                  Free Shipping on Orders Over ${FREE_SHIPPING_THRESHOLD}
                </span>
              </div>
              <span className="w-px h-3 bg-white/20 shrink-0" />
              <div className="flex items-center gap-1 px-6">
                <Shield className="w-3 h-3 text-brand-red shrink-0" />
                <span className="text-white/70 text-[10px] font-medium whitespace-nowrap">
                  1-Year Warranty on All Skmei Watches
                </span>
              </div>
              <span className="w-px h-3 bg-white/20 shrink-0" />
            </div>
          </Marquee>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative flex items-center justify-between h-16 sm:h-20">

          {/* Mobile Menu Button */}
          <button
            onClick={() => toggleMobileMenu()}
            className="lg:hidden p-2 -ml-2 text-white/80 hover:text-brand-red transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo — absolutely centered on mobile, normal flow on desktop */}
          <Link href="/" className="absolute left-1/2 -translate-x-1/2 flex items-center flex-shrink-0 lg:static lg:translate-x-0">
            <div className="relative w-36 h-10 sm:w-56 sm:h-14">
              <Image
                src="/images/logo/black.png"
                alt="SKMEI.LB"
                fill
                className="object-contain"
                priority
              />
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center space-x-8">
            {navigation.map((item) => (
              <div
                key={item.name}
                className="relative"
                onMouseEnter={() => item.submenu && setActiveSubmenu(item.name)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <Link
                  href={item.href}
                  className="text-white/80 hover:text-white font-medium transition-colors flex items-center gap-1 py-2"
                >
                  {item.name}
                  {item.submenu && (
                    <ChevronDown
                      className={`h-4 w-4 transition-transform duration-200 ${
                        activeSubmenu === item.name ? "rotate-180 text-brand-red" : ""
                      }`}
                    />
                  )}
                </Link>

                {/* Desktop Dropdown */}
                {item.submenu && activeSubmenu === item.name && (
                  <div className="absolute top-full left-0 mt-1 w-64 z-10 bg-brand-black border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
                    {/* Header */}
                    <div className="px-4 py-3 border-b border-white/10">
                      <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest">
                        Browse Categories
                      </p>
                    </div>

                    {/* Category links */}
                    <div className="p-2">
                      {item.submenu.map((subitem) => (
                        <Link
                          key={subitem.name}
                          href={subitem.href}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm text-white/65 hover:bg-brand-red hover:text-white transition-all group"
                        >
                          <span className="w-8 h-8 rounded-lg bg-white/8 group-hover:bg-white/20 flex items-center justify-center text-brand-red group-hover:text-white transition-colors shrink-0">
                            {(() => { const Ic = ICON_MAP[subitem.icon ?? ''] ?? Watch; return <Ic className="w-4 h-4" />; })()}
                          </span>
                          {subitem.name}
                          <ChevronRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                        </Link>
                      ))}
                    </div>

                    {/* Footer link */}
                    <div className="px-2 pb-2 border-t border-white/10 pt-2">
                      <Link
                        href="/store/products"
                        className="flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold text-white/40 hover:text-white hover:bg-white/8 transition-all"
                      >
                        View All Products
                        <ChevronRight className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden lg:flex p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <Link
              href="/account"
              className="flex p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Account"
            >
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <button
              onClick={openCart}
              className="hidden lg:flex relative p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              <span
                ref={badgeRef}
                suppressHydrationWarning
                className={`absolute -top-1 -right-1 bg-brand-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center transition-opacity ${cartItemsCount > 0 ? 'opacity-100' : 'opacity-0'}`}
              >
                {cartItemsCount > 9 ? "9+" : cartItemsCount || ''}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar Dropdown */}
      {searchOpen && (
        <div className="border-t border-white/8 bg-brand-black/98 backdrop-blur-md shadow-2xl">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-white/30" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for watches..."
                className="w-full pl-12 pr-24 py-3.5 bg-white/6 border border-white/10 rounded-xl text-white placeholder:text-white/30 focus:outline-none focus:ring-0 focus:border-white/10 transition-all"
                autoFocus
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2 bg-brand-red text-white rounded-lg font-medium hover:bg-brand-red-dark transition-colors text-sm"
                aria-label="Submit search"
              >
                Search
              </button>
            </form>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-white/30 text-xs">Quick:</span>
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSearchOpen(false)}
                  className="px-3 py-1 text-xs text-white/50 bg-white/6 hover:bg-brand-red hover:text-white rounded-full transition-colors border border-white/10"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Mobile Menu — slide from left */}
      <div
        className={`lg:hidden fixed inset-0 top-[88px] bg-brand-black z-[55] overflow-y-auto transition-transform duration-300 ease-in-out border-t border-white/10 ${
          mobileMenuOpen ? 'translate-x-0 pointer-events-auto' : '-translate-x-full pointer-events-none'
        }`}
      >
          <nav className="px-4 pt-4 pb-20">
            {navigation.map((item) => (
              <div key={item.name} className="border-b border-white/6 last:border-0">
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={() => closeMenu()}
                    className="flex-1 py-4 text-base font-semibold text-white/80 hover:text-white transition-colors flex items-center gap-3"
                  >
                    <span className="text-brand-red">{item.icon}</span>
                    {item.name}
                  </Link>
                  {item.submenu && (
                    <button
                      onClick={() => setMobileSubmenuOpen(mobileSubmenuOpen === item.name ? null : item.name)}
                      className="p-3 text-white/40 hover:text-brand-red transition-colors"
                      aria-label={`Toggle ${item.name} submenu`}
                    >
                      <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${mobileSubmenuOpen === item.name ? "rotate-180 text-brand-red" : ""}`} />
                    </button>
                  )}
                </div>

                {item.submenu && mobileSubmenuOpen === item.name && (
                  <div className="pb-4 grid grid-cols-2 gap-2.5">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.name}
                        href={subitem.href}
                        onClick={() => closeMenu()}
                        className="flex items-center gap-2.5 px-4 py-3.5 bg-white/6 hover:bg-brand-red hover:text-white rounded-xl text-sm font-medium text-white/70 transition-all group active:scale-95 border border-white/8"
                      >
                        <span className="text-brand-red group-hover:text-white transition-colors shrink-0">
                          {(() => { const Ic = ICON_MAP[subitem.icon ?? ''] ?? Watch; return <Ic className="w-4 h-4" />; })()}
                        </span>
                        <span className="leading-tight">{subitem.name}</span>
                      </Link>
                    ))}
                    <Link
                      href="/store/products"
                      onClick={() => closeMenu()}
                      className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-brand-red text-white rounded-xl text-sm font-bold transition-all active:scale-95 hover:bg-brand-red-dark"
                    >
                      View All Products
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            ))}

            <div className="border-t border-white/6">
              <Link
                href="/#feedback"
                onClick={() => closeMenu()}
                className="flex items-center gap-3 py-4 text-base font-semibold text-white/70 hover:text-brand-red transition-colors"
              >
                <svg className="w-4 h-4 text-brand-red" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
                Feedback
              </Link>
            </div>
          </nav>
      </div>

      {/* Mobile Menu Overlay — fade in/out */}
      <div
        onClick={() => closeMenu()}
        className={`lg:hidden fixed inset-0 bg-black/60 z-[52] top-0 transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />
    </header>
  );
}
