"use client";

import { useState, useMemo, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/store/ProductCard";
import { SkeletonGrid } from "@/components/store/SkeletonProductCard";
import { categories, products as staticProducts } from "@/data/products";
import { Product, ProductFilters } from "@/types";
import { SlidersHorizontal, X, ChevronDown, ChevronRight, Home } from "lucide-react";
import Link from "next/link";

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const featuredParam = searchParams.get("featured");
  const filterParam = searchParams.get("filter");
  const searchParam = searchParams.get("search");

  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [availableBrands, setAvailableBrands] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filters, setFilters] = useState<ProductFilters>({
    category: categoryParam || undefined,
    sortBy: "newest",
    search: searchParam || undefined,
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [draftFilters, setDraftFilters] = useState<ProductFilters>({ category: undefined, sortBy: "newest", brands: [] });
  const [isDirty, setIsDirty] = useState(false);


  const updateDraft = (updater: (f: ProductFilters) => ProductFilters) => {
    setDraftFilters(updater);
    setIsDirty(true);
  };

  useEffect(() => {
    Promise.all([
      fetch('/api/products').then((r) => r.json()),
      fetch('/api/brands').then((r) => r.json()),
    ])
      .then(([productsData, brandsData]) => {
        const list = Array.isArray(productsData) && productsData.length > 0 ? productsData : staticProducts;
        setAllProducts(list);
        if (Array.isArray(brandsData) && brandsData.length > 0) {
          setAvailableBrands(brandsData.map((b: { name: string }) => b.name));
        }
        setIsLoading(false);
      })
      .catch(() => { setAllProducts(staticProducts); setIsLoading(false); });
  }, []);

  const filteredProducts = useMemo(() => {
    let result = [...allProducts];

    if (filters.search) {
      const query = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.description.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query)
      );
    }

    if (filters.category) {
      result = result.filter((p) => p.category === filters.category);
    }

    if (filterParam === "new") result = result.filter((p) => p.isNew);
    if (filterParam === "sale") result = result.filter((p) => p.onSale || (p.originalPrice && p.originalPrice > p.price));
    if (filterParam === "bestselling" || featuredParam === "true") result = result.filter((p) => p.isBestseller);
    if (filters.brands && filters.brands.length > 0) result = result.filter((p) => filters.brands!.includes(p.brand));
    if (filters.gender) result = result.filter((p) => p.gender === filters.gender);
    if (filters.minPrice !== undefined) result = result.filter((p) => p.price >= filters.minPrice!);
    if (filters.maxPrice !== undefined) result = result.filter((p) => p.price <= filters.maxPrice!);

    switch (filters.sortBy) {
      case "price-asc": result.sort((a, b) => a.price - b.price); break;
      case "price-desc": result.sort((a, b) => b.price - a.price); break;
      case "popular": result.sort((a, b) => b.reviewCount - a.reviewCount); break;
      default:
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }

    return result;
  }, [allProducts, filters, featuredParam, filterParam]);

  const getPageTitle = () => {
    if (filters.search) return `Search: "${filters.search}"`;
    if (featuredParam === "true" || filterParam === "featured") return "Featured Watches";
    if (filterParam === "bestselling") return "Bestselling Watches";
    if (filterParam === "new") return "New Arrivals";
    if (filterParam === "sale") return "On Sale";
    if (filters.category) {
      const cat = categories.find((c) => c.slug === filters.category);
      return cat?.name || "All Watches";
    }
    return "All Watches";
  };

  const activeFilterCount = [filters.category, filters.gender, filters.minPrice, filters.maxPrice].filter(Boolean).length + (filters.brands?.length ?? 0);

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "popular", label: "Most Popular" },
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" },
  ];

  return (
    <div className="min-h-screen bg-brand-black">

      {/* ── Hero Header ── */}
      <div className="relative text-white py-12 sm:py-16 overflow-hidden">
        <div className="absolute -top-12 right-1/4 w-72 h-72 bg-brand-red/15 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 left-1/3 w-52 h-52 bg-brand-red/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg,#fff 0,#fff 1px,transparent 0,transparent 50%)', backgroundSize: '18px 18px' }} />
        {/* Bottom border */}
        <div className="absolute bottom-0 left-0 right-0 h-px bg-linear-to-r from-transparent via-white/10 to-transparent" />

        <div className="relative z-10 container mx-auto px-4">
          <nav className="flex items-center gap-1.5 text-xs text-white/35 mb-5">
            <Link href="/" className="flex items-center gap-1 hover:text-white/60 transition-colors">
              <Home className="w-3 h-3" />Home
            </Link>
            <ChevronRight className="w-3 h-3" />
            <span className="text-white/60">Products</span>
            {filters.category && (
              <>
                <ChevronRight className="w-3 h-3" />
                <span className="text-white/60 capitalize">{filters.category}</span>
              </>
            )}
          </nav>

          <div className="flex flex-wrap items-end gap-3 sm:gap-5">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-red mb-2">Collection</p>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white leading-none tracking-tight">
                {getPageTitle()}
              </h1>
              <div className="mt-3 h-px w-14 bg-brand-red" />
            </div>

            <div className="mb-1 inline-flex items-center gap-2 bg-white/6 border border-white/10 px-4 py-2 rounded-full text-sm font-medium text-white/50">
              <span className="w-1.5 h-1.5 bg-brand-red rounded-full animate-pulse" />
              {isLoading ? "Loading..." : `${filteredProducts.length} ${filteredProducts.length === 1 ? "product" : "products"} found`}
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">

        {/* Mobile toolbar */}
        <div className="lg:hidden flex gap-3 mb-6">
          <button
            onClick={() => { setDraftFilters({ ...filters }); setIsDirty(false); setIsMobileFilterOpen(true); }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border font-medium text-sm transition-all ${
              activeFilterCount > 0
                ? "border-brand-red text-brand-red bg-brand-red/10"
                : "border-white/15 text-white/70 bg-white/5 hover:border-brand-red hover:text-brand-red"
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeFilterCount > 0 && (
              <span className="w-5 h-5 bg-brand-red text-white text-[10px] rounded-full flex items-center justify-center font-bold">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="flex-1 relative">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as ProductFilters["sortBy"] }))}
              className="w-full appearance-none px-4 py-2.5 bg-white/6 border border-white/12 rounded-xl text-sm text-white font-medium focus:outline-none focus:border-brand-red transition-colors pr-9"
            >
              {sortOptions.map((o) => <option key={o.value} value={o.value} className="bg-brand-black">{o.label}</option>)}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-8">

          {/* ── Desktop Sidebar ── */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="bg-white/4 rounded-2xl border border-white/8 overflow-hidden sticky top-24">
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/8 bg-white/4">
                <h3 className="font-bold text-white flex items-center gap-2 text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-brand-red" />
                  Filters & Sort
                </h3>
                <button
                  onClick={() => setFilters({ category: undefined, gender: undefined, brands: [], sortBy: "newest" })}
                  className="text-xs text-brand-red font-semibold hover:underline transition-colors"
                >
                  Clear all
                </button>
              </div>

              <div className="p-4 space-y-5">
                {/* Sort By */}
                <div>
                  <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Sort By</p>
                  <div className="space-y-0.5">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => setFilters((f) => ({ ...f, sortBy: option.value as ProductFilters["sortBy"] }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                          filters.sortBy === option.value
                            ? "bg-brand-red/15 text-brand-red font-semibold"
                            : "text-white/50 hover:bg-white/6 hover:text-white"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${filters.sortBy === option.value ? "bg-brand-red" : "bg-transparent"}`} />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/8" />

                {/* Category */}
                <div>
                  <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Category</p>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => setFilters((f) => ({ ...f, category: undefined }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                        !filters.category ? "bg-brand-red/15 text-brand-red font-semibold" : "text-white/50 hover:bg-white/6 hover:text-white"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!filters.category ? "bg-brand-red" : "bg-transparent"}`} />
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() => setFilters((f) => ({ ...f, category: category.slug }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                          filters.category === category.slug ? "bg-brand-red/15 text-brand-red font-semibold" : "text-white/50 hover:bg-white/6 hover:text-white"
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${filters.category === category.slug ? "bg-brand-red" : "bg-transparent"}`} />
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/8" />

                {/* Brand */}
                {availableBrands.length > 1 && (
                  <div>
                    <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Brand</p>
                    <div className="space-y-0.5">
                      {availableBrands.map((brand) => {
                        const selected = filters.brands?.includes(brand) ?? false;
                        return (
                          <button
                            key={brand}
                            onClick={() => setFilters((f) => {
                              const curr = f.brands ?? [];
                              return { ...f, brands: selected ? curr.filter((b) => b !== brand) : [...curr, brand] };
                            })}
                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                              selected ? 'bg-brand-red/15 text-brand-red font-semibold' : 'text-white/50 hover:bg-white/6 hover:text-white'
                            }`}
                          >
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${selected ? 'bg-brand-red' : 'bg-transparent'}`} />
                            {brand}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="border-t border-white/8" />

                {/* Gender */}
                <div>
                  <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Gender</p>
                  <div className="space-y-0.5">
                    {([
                      { value: undefined, label: 'All' },
                      { value: 'men', label: 'Men' },
                      { value: 'women', label: 'Women' },
                      { value: 'unisex', label: 'Unisex' },
                    ] as { value: 'men' | 'women' | 'unisex' | undefined; label: string }[]).map((g) => (
                      <button
                        key={g.label}
                        onClick={() => setFilters((f) => ({ ...f, gender: g.value }))}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                          filters.gender === g.value ? 'bg-brand-red/15 text-brand-red font-semibold' : 'text-white/50 hover:bg-white/6 hover:text-white'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${filters.gender === g.value ? 'bg-brand-red' : 'bg-transparent'}`} />
                        {g.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-white/8" />

                {/* Price Range */}
                <div>
                  <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-2">Price Range</p>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/35 text-xs">$</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ""}
                        onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full pl-6 pr-2 py-2 bg-white/6 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-red transition-colors"
                      />
                    </div>
                    <span className="text-white/30 text-sm shrink-0">–</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-white/35 text-xs">$</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ""}
                        onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
                        className="w-full pl-6 pr-2 py-2 bg-white/6 border border-white/10 rounded-lg text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-red transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* ── Main Content ── */}
          <div className="flex-1 min-w-0">
            {/* Desktop toolbar */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <p className="text-sm text-white/40">
                Showing <span className="font-semibold text-white">{filteredProducts.length}</span> products
              </p>
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value as ProductFilters["sortBy"] }))}
                  className="appearance-none pl-4 pr-10 py-2.5 bg-white/6 border border-white/12 rounded-xl text-sm font-medium text-white focus:outline-none focus:border-brand-red transition-colors cursor-pointer"
                >
                  {sortOptions.map((o) => <option key={o.value} value={o.value} className="bg-brand-black">{o.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
              </div>
            </div>

            {/* Products Grid */}
            {isLoading ? (
              <SkeletonGrid count={6} dark />
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-24">
                <div className="w-20 h-20 bg-brand-red/10 border border-brand-red/20 rounded-full flex items-center justify-center mx-auto mb-5">
                  <SlidersHorizontal className="w-9 h-9 text-brand-red" />
                </div>
                <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-brand-red mb-2">No Results</p>
                <h3 className="text-xl font-black text-white mb-2">No products found</h3>
                <p className="text-white/40 mb-6 text-sm">Try adjusting your filters or search terms</p>
                <button
                  onClick={() => setFilters({ category: undefined, gender: undefined, brands: [], sortBy: "newest" })}
                  className="group relative inline-flex items-center gap-2 overflow-hidden bg-brand-red text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-brand-red-dark transition-colors"
                >
                  <span aria-hidden className="absolute inset-0 -translate-x-full -skew-x-12 bg-white/15 group-hover:animate-shimmer-sweep pointer-events-none" />
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Mobile Filter Sheet ── */}
      {isMobileFilterOpen && (
        <>
          <div className="fixed inset-0 bg-black/70 z-50" onClick={() => setIsMobileFilterOpen(false)} />
          <div className="fixed bottom-16 top-[92px] left-0 right-0 bg-[#111] z-55 rounded-t-3xl flex flex-col border-t border-white/10">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-white/10 shrink-0">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-brand-red" />
                Filters & Sort
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 text-white/40 hover:text-white rounded-full hover:bg-white/10 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 min-h-0 p-5 space-y-6">
              {/* Sort By */}
              <div>
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3">Sort By</p>
                <div className="grid grid-cols-2 gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() => updateDraft((f) => ({ ...f, sortBy: option.value as ProductFilters["sortBy"] }))}
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        draftFilters.sortBy === option.value
                          ? "bg-brand-red text-white shadow-md shadow-brand-red/25"
                          : "bg-white/6 text-white/50 border border-white/10 hover:border-brand-red hover:text-brand-red"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3">Category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateDraft((f) => ({ ...f, category: undefined }))}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      !draftFilters.category
                        ? "bg-brand-red text-white shadow-md shadow-brand-red/25"
                        : "bg-white/6 text-white/50 border border-white/10 hover:border-brand-red hover:text-brand-red"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => updateDraft((f) => ({ ...f, category: category.slug }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        draftFilters.category === category.slug
                          ? "bg-brand-red text-white shadow-md shadow-brand-red/25"
                          : "bg-white/6 text-white/50 border border-white/10 hover:border-brand-red hover:text-brand-red"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Brand */}
              {availableBrands.length > 1 && (
                <div>
                  <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3">Brand</p>
                  <div className="flex flex-wrap gap-2">
                    {availableBrands.map((brand) => {
                      const selected = draftFilters.brands?.includes(brand) ?? false;
                      return (
                        <button
                          key={brand}
                          onClick={() => updateDraft((f) => {
                            const curr = f.brands ?? [];
                            return { ...f, brands: selected ? curr.filter((b) => b !== brand) : [...curr, brand] };
                          })}
                          className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                            selected
                              ? 'bg-brand-red text-white shadow-md shadow-brand-red/25'
                              : 'bg-white/6 text-white/50 border border-white/10 hover:border-brand-red hover:text-brand-red'
                          }`}
                        >
                          {brand}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Gender */}
              <div>
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3">Gender</p>
                <div className="flex gap-2">
                  {([
                    { value: undefined, label: 'All' },
                    { value: 'men', label: 'Men' },
                    { value: 'women', label: 'Women' },
                    { value: 'unisex', label: 'Unisex' },
                  ] as { value: 'men' | 'women' | 'unisex' | undefined; label: string }[]).map((g) => (
                    <button
                      key={g.label}
                      onClick={() => updateDraft((f) => ({ ...f, gender: g.value }))}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        draftFilters.gender === g.value
                          ? 'bg-brand-red text-white shadow-md shadow-brand-red/25'
                          : 'bg-white/6 text-white/50 border border-white/10 hover:border-brand-red hover:text-brand-red'
                      }`}
                    >
                      {g.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <p className="text-[10px] font-bold text-white/35 uppercase tracking-widest mb-3">Price Range</p>
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={draftFilters.minPrice ?? ''}
                      onChange={(e) => updateDraft((f) => ({ ...f, minPrice: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full pl-7 pr-3 py-3 bg-white/6 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>
                  <span className="text-white/30 text-sm">–</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/35 text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={draftFilters.maxPrice ?? ''}
                      onChange={(e) => updateDraft((f) => ({ ...f, maxPrice: e.target.value ? Number(e.target.value) : undefined }))}
                      className="w-full pl-7 pr-3 py-3 bg-white/6 border border-white/10 rounded-xl text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>
                </div>
              </div>

              <div className="h-4" />
            </div>

            {/* Action buttons */}
            <div className="shrink-0 border-t border-white/10 p-4 pb-safe flex gap-3 bg-[#111]">
              <button
                onClick={() => {
                  const reset: ProductFilters = { category: undefined, gender: undefined, brands: [], sortBy: "newest" };
                  setFilters(reset);
                  setDraftFilters(reset);
                  setIsDirty(false);
                }}
                className="flex-1 py-3 border-2 border-white/15 rounded-xl text-sm font-semibold text-white/50 hover:border-brand-red hover:text-brand-red transition-colors"
              >
                Clear All
              </button>
              {isDirty && (
                <button
                  onClick={() => { setFilters({ ...draftFilters }); setIsDirty(false); setIsMobileFilterOpen(false); }}
                  className="flex-1 py-3 bg-brand-red text-white rounded-xl text-sm font-semibold hover:bg-brand-red-dark transition-colors shadow-lg shadow-brand-red/20"
                >
                  Apply Changes
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductsLoading() {
  return (
    <div className="min-h-screen bg-brand-black">
      <div className="relative py-12 sm:py-16 overflow-hidden">
        <div className="absolute -top-12 right-1/4 w-72 h-72 bg-brand-red/15 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 container mx-auto px-4">
          <div className="h-2 w-20 bg-white/8 rounded-full animate-pulse mb-3" />
          <div className="h-12 w-56 bg-white/10 rounded-lg animate-pulse mb-3" />
          <div className="h-px w-14 bg-brand-red/40" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <SkeletonGrid count={6} dark />
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent />
    </Suspense>
  );
}
