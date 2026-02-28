"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import {
  ShoppingBag, Search, Menu, X, User, ChevronDown, ChevronRight,
  Timer, Clock, Activity, Watch, Gem, Truck, Shield,
  Tag, Info, Phone,
} from "lucide-react";

const categoryIcons: Record<string, React.ReactNode> = {
  digital: <Timer className="w-4 h-4" />,
  analog:  <Clock className="w-4 h-4" />,
  sports:  <Activity className="w-4 h-4" />,
  smart:   <Watch className="w-4 h-4" />,
  luxury:  <Gem className="w-4 h-4" />,
};

const navigation = [
  {
    name: "Products",
    href: "/store/products",
    icon: <ShoppingBag className="w-4 h-4" />,
    submenu: [
      { name: "Digital Watches",  href: "/store/products?category=digital",  slug: "digital" },
      { name: "Analog Watches",   href: "/store/products?category=analog",   slug: "analog" },
      { name: "Sports Watches",   href: "/store/products?category=sports",   slug: "sports" },
      { name: "Smart Watches",    href: "/store/products?category=smart",    slug: "smart" },
      { name: "Luxury Collection",href: "/store/products?category=luxury",   slug: "luxury" },
    ],
  },
  { name: "Sale",    href: "/store/products?filter=sale", icon: <Tag className="w-4 h-4" /> },
  { name: "About",   href: "/about",   icon: <Info className="w-4 h-4" /> },
  { name: "Contact", href: "/contact", icon: <Phone className="w-4 h-4" /> },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSubmenuOpen, setMobileSubmenuOpen] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const { getTotalItems, openCart } = useCartStore();
  const cartItemsCount = getTotalItems();

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

  const quickLinks = [
    { label: "Digital", href: "/store/products?category=digital" },
    { label: "Sports",  href: "/store/products?category=sports" },
    { label: "Smart",   href: "/store/products?category=smart" },
    { label: "Luxury",  href: "/store/products?category=luxury" },
    { label: "Sale",    href: "/store/products?filter=sale" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-white"
      }`}
    >
      {/* Top Bar */}
      <div className="bg-brand-black border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-0 py-2">
            <div className="flex items-center gap-1.5 px-3 sm:px-5">
              <Truck className="w-3.5 h-3.5 text-brand-red shrink-0" />
              <span className="text-white/80 text-[11px] sm:text-xs font-medium whitespace-nowrap">
                Free Shipping on Orders Over $50
              </span>
            </div>
            <span className="w-px h-3.5 bg-white/20 shrink-0" />
            <div className="flex items-center gap-1.5 px-3 sm:px-5">
              <Shield className="w-3.5 h-3.5 text-brand-red shrink-0" />
              <span className="text-white/80 text-[11px] sm:text-xs font-medium whitespace-nowrap">
                1-Year Warranty on All Watches
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="lg:hidden p-2 -ml-2 text-brand-black hover:text-brand-red transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>

          {/* Logo */}
          <Link href="/" className="flex items-center flex-shrink-0">
            <div className="relative w-36 h-10 sm:w-56 sm:h-14">
              <Image
                src="/images/logo/white.png"
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
                  className="text-brand-black hover:text-brand-red font-medium transition-colors flex items-center gap-1 py-2"
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
                  <div className="absolute top-full left-0 mt-1 w-64 bg-brand-black border border-white/10 rounded-2xl shadow-2xl shadow-black/50 overflow-hidden">
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
                            {categoryIcons[subitem.slug]}
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
              className="hidden lg:flex p-2 text-brand-black hover:text-brand-red transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>
            <Link
              href="/account"
              className="hidden lg:flex p-2 text-brand-black hover:text-brand-red transition-colors"
              aria-label="Account"
            >
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>
            <button
              onClick={openCart}
              className="hidden lg:flex relative p-2 text-brand-black hover:text-brand-red transition-colors"
              aria-label="Shopping cart"
            >
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              <span
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
        <div className="border-t border-brand-silver bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-brand-gray" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for watches..."
                className="w-full pl-12 pr-24 py-3.5 bg-brand-silver-light rounded-xl text-brand-black placeholder:text-brand-gray focus:outline-none focus:ring-2 focus:ring-brand-red/30 border border-brand-silver focus:border-brand-red transition-all"
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
              <span className="text-brand-gray text-xs">Quick:</span>
              {quickLinks.map((item) => (
                <Link
                  key={item.label}
                  href={item.href}
                  onClick={() => setSearchOpen(false)}
                  className="px-3 py-1 text-xs text-brand-gray-dark bg-brand-silver-light hover:bg-brand-red hover:text-white rounded-full transition-colors border border-brand-silver"
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
        className={`lg:hidden fixed inset-0 top-[112px] bg-white z-40 overflow-y-auto transition-transform duration-300 ease-in-out ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
          <nav className="px-4 py-4">
            {navigation.map((item) => (
              <div key={item.name} className="border-b border-brand-silver/50 last:border-0">
                {/* Row */}
                <div className="flex items-center">
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex-1 py-4 text-base font-semibold text-brand-black hover:text-brand-red transition-colors flex items-center gap-3"
                  >
                    <span className="text-brand-red">{item.icon}</span>
                    {item.name}
                  </Link>
                  {item.submenu && (
                    <button
                      onClick={() =>
                        setMobileSubmenuOpen(
                          mobileSubmenuOpen === item.name ? null : item.name
                        )
                      }
                      className="p-3 text-brand-gray hover:text-brand-red transition-colors"
                      aria-label={`Toggle ${item.name} submenu`}
                    >
                      <ChevronDown
                        className={`w-5 h-5 transition-transform duration-200 ${
                          mobileSubmenuOpen === item.name ? "rotate-180 text-brand-red" : ""
                        }`}
                      />
                    </button>
                  )}
                </div>

                {/* Mobile Submenu — grid of category cards */}
                {item.submenu && mobileSubmenuOpen === item.name && (
                  <div className="pb-4 grid grid-cols-2 gap-2.5">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.name}
                        href={subitem.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-3.5 bg-brand-silver/20 hover:bg-brand-red hover:text-white rounded-xl text-sm font-medium text-brand-black transition-all group active:scale-95"
                      >
                        <span className="text-brand-red group-hover:text-white transition-colors shrink-0">
                          {categoryIcons[subitem.slug]}
                        </span>
                        <span className="leading-tight">{subitem.name}</span>
                      </Link>
                    ))}
                    {/* View all card */}
                    <Link
                      href="/store/products"
                      onClick={() => setMobileMenuOpen(false)}
                      className="col-span-2 flex items-center justify-center gap-2 px-4 py-3 bg-brand-black text-white rounded-xl text-sm font-semibold transition-all active:scale-95"
                    >
                      View All Products
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                )}
              </div>
            ))}

            {/* Feedback — bottom of mobile menu */}
            <div className="border-t border-brand-silver/50">
              <Link
                href="/feedback"
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3 py-4 text-base font-semibold text-brand-black hover:text-brand-red transition-colors"
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
        onClick={() => setMobileMenuOpen(false)}
        className={`lg:hidden fixed inset-0 bg-black/50 z-30 top-28 transition-opacity duration-300 ${
          mobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        aria-hidden="true"
      />
    </header>
  );
}
