"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/store/cartStore";
import { ShoppingBag, Search, Menu, X, User, ChevronDown } from "lucide-react";

const navigation = [
  {
    name: "Products",
    href: "/store/products",
    submenu: [
      { name: "Digital Watches", href: "/store/products?category=digital" },
      { name: "Analog Watches", href: "/store/products?category=analog" },
      { name: "Sports Watches", href: "/store/products?category=sports" },
      { name: "Smart Watches", href: "/store/products?category=smart" },
      { name: "Luxury Collection", href: "/store/products?category=luxury" },
    ],
  },
  { name: "Sale", href: "/store/products?filter=sale" },
  { name: "About", href: "/about" },
  { name: "Contact", href: "/contact" },
];

export default function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [scrolled, setScrolled] = useState(false);
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);

  const { getTotalItems, openCart } = useCartStore();
  const cartItemsCount = getTotalItems();

  // Handle scroll for sticky header
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
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
    { label: "Sports", href: "/store/products?category=sports" },
    { label: "Smart", href: "/store/products?category=smart" },
    { label: "Luxury", href: "/store/products?category=luxury" },
    { label: "Sale", href: "/store/products?filter=sale" },
  ];

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "bg-white shadow-md" : "bg-white"
      }`}
    >
      {/* Top Bar - Free Shipping Notice */}
      <div className="bg-brand-black text-brand-white py-2 px-4 text-center text-xs sm:text-sm">
        <p className="font-medium">
          🚚 Free Shipping on Orders Over $50 | 1-Year Warranty on All Watches
        </p>
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
            {mobileMenuOpen ? (
              <X className="h-6 w-6" />
            ) : (
              <Menu className="h-6 w-6" />
            )}
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
                className="relative group"
                onMouseEnter={() => item.submenu && setActiveSubmenu(item.name)}
                onMouseLeave={() => setActiveSubmenu(null)}
              >
                <Link
                  href={item.href}
                  className="text-brand-black hover:text-brand-red font-medium transition-colors flex items-center gap-1"
                >
                  {item.name}
                  {item.submenu && <ChevronDown className="h-4 w-4" />}
                </Link>

                {/* Dropdown Menu */}
                {item.submenu && activeSubmenu === item.name && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white shadow-xl rounded-lg py-2 border border-brand-silver">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.name}
                        href={subitem.href}
                        className="block px-4 py-2 text-sm text-brand-black hover:bg-brand-red hover:text-white transition-colors"
                      >
                        {subitem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Search Button — hidden on mobile (in bottom nav) */}
            <button
              onClick={() => setSearchOpen(!searchOpen)}
              className="hidden lg:flex p-2 text-brand-black hover:text-brand-red transition-colors"
              aria-label="Search"
            >
              <Search className="h-5 w-5 sm:h-6 sm:w-6" />
            </button>

            {/* Account — hidden on mobile (in bottom nav) */}
            <Link
              href="/account"
              className="hidden lg:flex p-2 text-brand-black hover:text-brand-red transition-colors"
              aria-label="Account"
            >
              <User className="h-5 w-5 sm:h-6 sm:w-6" />
            </Link>

            {/* Cart — hidden on mobile (in bottom nav) */}
            <button
              onClick={openCart}
              className="hidden lg:flex relative p-2 text-brand-black hover:text-brand-red transition-colors"
              aria-label={`Shopping cart with ${cartItemsCount} items`}
            >
              <ShoppingBag className="h-5 w-5 sm:h-6 sm:w-6" />
              {cartItemsCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-brand-red text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {cartItemsCount > 9 ? "9+" : cartItemsCount}
                </span>
              )}
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[112px] bg-white z-40 overflow-y-auto">
          <nav className="px-4 py-6 space-y-4">
            {navigation.map((item) => (
              <div key={item.name}>
                <Link
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block py-3 text-lg font-medium text-brand-black hover:text-brand-red transition-colors border-b border-brand-silver"
                >
                  {item.name}
                </Link>
                {item.submenu && (
                  <div className="pl-4 mt-2 space-y-2">
                    {item.submenu.map((subitem) => (
                      <Link
                        key={subitem.name}
                        href={subitem.href}
                        onClick={() => setMobileMenuOpen(false)}
                        className="block py-2 text-brand-gray hover:text-brand-red transition-colors"
                      >
                        {subitem.name}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
        </div>
      )}

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="lg:hidden fixed inset-0 bg-black/50 z-30 top-[112px]"
          aria-hidden="true"
        />
      )}
    </header>
  );
}
