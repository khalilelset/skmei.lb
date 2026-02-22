"use client";

import { useState, useMemo, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/store/ProductCard";
import { products, categories } from "@/data/products";
import { ProductFilters } from "@/types";
import { SlidersHorizontal, X, ChevronDown } from "lucide-react";

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get("category");
  const featuredParam = searchParams.get("featured");
  const filterParam = searchParams.get("filter");
  const searchParam = searchParams.get("search");

  const [filters, setFilters] = useState<ProductFilters>({
    category: categoryParam || undefined,
    sortBy: "newest",
    search: searchParam || undefined,
  });
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

  const filteredProducts = useMemo(() => {
    let result = [...products];

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

    if (featuredParam === "true" || filterParam === "featured") {
      result = result.filter((p) => p.isFeatured);
    }
    if (filterParam === "new") {
      result = result.filter((p) => p.isNew);
    }
    if (filterParam === "sale") {
      result = result.filter((p) => p.originalPrice && p.originalPrice > p.price);
    }

    if (filters.minPrice !== undefined) {
      result = result.filter((p) => p.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== undefined) {
      result = result.filter((p) => p.price <= filters.maxPrice!);
    }

    switch (filters.sortBy) {
      case "price-asc":
        result.sort((a, b) => a.price - b.price);
        break;
      case "price-desc":
        result.sort((a, b) => b.price - a.price);
        break;
      case "popular":
        result.sort((a, b) => b.reviewCount - a.reviewCount);
        break;
      case "newest":
      default:
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
    }

    return result;
  }, [filters, featuredParam, filterParam]);

  const getPageTitle = () => {
    if (filters.search) return `Search: "${filters.search}"`;
    if (featuredParam === "true" || filterParam === "featured") return "Featured Watches";
    if (filterParam === "new") return "New Arrivals";
    if (filterParam === "sale") return "On Sale";
    if (filters.category) {
      const cat = categories.find((c) => c.slug === filters.category);
      return cat?.name || "All Watches";
    }
    return "All Watches";
  };

  const activeFilterCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
  ].filter(Boolean).length;

  const sortOptions = [
    { value: "newest", label: "Newest First" },
    { value: "popular", label: "Most Popular" },
    { value: "price-asc", label: "Price: Low → High" },
    { value: "price-desc", label: "Price: High → Low" },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Header */}
      <div className="bg-brand-black text-white py-10">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl sm:text-4xl font-bold mb-1">{getPageTitle()}</h1>
          <p className="text-brand-gray-light text-sm sm:text-base">
            {filteredProducts.length} {filteredProducts.length === 1 ? "product" : "products"} found
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Mobile toolbar */}
        <div className="lg:hidden flex gap-3 mb-6">
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className={`flex items-center gap-2 px-4 py-2.5 bg-white border rounded-xl shadow-sm font-medium text-sm transition-all ${
              activeFilterCount > 0
                ? "border-brand-red text-brand-red"
                : "border-gray-200 text-brand-black hover:border-brand-red hover:text-brand-red"
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
              onChange={(e) =>
                setFilters((f) => ({ ...f, sortBy: e.target.value as ProductFilters["sortBy"] }))
              }
              className="w-full appearance-none px-4 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm text-brand-black font-medium focus:outline-none focus:border-brand-red transition-colors pr-9"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
          </div>
        </div>

        <div className="flex gap-8">
          {/* Desktop Sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-24">
              {/* Sidebar header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-brand-black flex items-center gap-2 text-sm">
                  <SlidersHorizontal className="w-4 h-4 text-brand-red" />
                  Filters & Sort
                </h3>
                <button
                  onClick={() => setFilters({ category: undefined, sortBy: "newest" })}
                  className="text-xs text-brand-red hover:text-brand-red font-semibold transition-colors hover:underline"
                >
                  Clear all
                </button>
              </div>

              <div className="p-4 space-y-5">
                {/* Sort By */}
                <div>
                  <p className="text-[10px] font-bold text-brand-gray uppercase tracking-widest mb-2">Sort By</p>
                  <div className="space-y-0.5">
                    {sortOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() =>
                          setFilters((f) => ({ ...f, sortBy: option.value as ProductFilters["sortBy"] }))
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                          filters.sortBy === option.value
                            ? "bg-brand-red/10 text-brand-red font-semibold"
                            : "text-brand-gray hover:bg-gray-50 hover:text-brand-black"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            filters.sortBy === option.value ? "bg-brand-red" : "bg-transparent"
                          }`}
                        />
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Category */}
                <div>
                  <p className="text-[10px] font-bold text-brand-gray uppercase tracking-widest mb-2">Category</p>
                  <div className="space-y-0.5">
                    <button
                      onClick={() => setFilters((f) => ({ ...f, category: undefined }))}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                        !filters.category
                          ? "bg-brand-red/10 text-brand-red font-semibold"
                          : "text-brand-gray hover:bg-gray-50 hover:text-brand-black"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${!filters.category ? "bg-brand-red" : "bg-transparent"}`} />
                      All Categories
                    </button>
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() =>
                          setFilters((f) => ({ ...f, category: category.slug }))
                        }
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2 ${
                          filters.category === category.slug
                            ? "bg-brand-red/10 text-brand-red font-semibold"
                            : "text-brand-gray hover:bg-gray-50 hover:text-brand-black"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                            filters.category === category.slug ? "bg-brand-red" : "bg-transparent"
                          }`}
                        />
                        {category.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="border-t border-gray-100" />

                {/* Price Range */}
                <div>
                  <p className="text-[10px] font-bold text-brand-gray uppercase tracking-widest mb-2">Price Range</p>
                  <div className="flex gap-2 items-center">
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-gray text-xs">$</span>
                      <input
                        type="number"
                        placeholder="Min"
                        value={filters.minPrice || ""}
                        onChange={(e) =>
                          setFilters((f) => ({
                            ...f,
                            minPrice: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-colors"
                      />
                    </div>
                    <span className="text-brand-gray text-sm shrink-0">–</span>
                    <div className="relative flex-1">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-brand-gray text-xs">$</span>
                      <input
                        type="number"
                        placeholder="Max"
                        value={filters.maxPrice || ""}
                        onChange={(e) =>
                          setFilters((f) => ({
                            ...f,
                            maxPrice: e.target.value ? Number(e.target.value) : undefined,
                          }))
                        }
                        className="w-full pl-6 pr-2 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-brand-red focus:ring-1 focus:ring-brand-red/20 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Desktop toolbar */}
            <div className="hidden lg:flex items-center justify-between mb-6">
              <p className="text-sm text-brand-gray">
                Showing <span className="font-semibold text-brand-black">{filteredProducts.length}</span> products
              </p>
              <div className="relative">
                <select
                  value={filters.sortBy}
                  onChange={(e) =>
                    setFilters((f) => ({ ...f, sortBy: e.target.value as ProductFilters["sortBy"] }))
                  }
                  className="appearance-none pl-4 pr-10 py-2.5 bg-white border border-gray-200 rounded-xl shadow-sm text-sm font-medium text-brand-black focus:outline-none focus:border-brand-red transition-colors cursor-pointer"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-gray pointer-events-none" />
              </div>
            </div>

            {/* Products Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20">
                <div className="w-20 h-20 bg-brand-red/10 rounded-full flex items-center justify-center mx-auto mb-5">
                  <SlidersHorizontal className="w-9 h-9 text-brand-red" />
                </div>
                <h3 className="text-xl font-bold text-brand-black mb-2">No products found</h3>
                <p className="text-brand-gray mb-6">Try adjusting your filters or search terms</p>
                <button
                  onClick={() => setFilters({ category: undefined, sortBy: "newest" })}
                  className="px-6 py-2.5 bg-brand-red text-white rounded-xl font-semibold hover:bg-brand-red/90 transition-colors"
                >
                  Clear Filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filter Sheet */}
      {isMobileFilterOpen && (
        <>
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsMobileFilterOpen(false)}
          />
          <div className="fixed bottom-0 left-0 right-0 bg-white z-50 rounded-t-3xl max-h-[88vh] flex flex-col">
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1 shrink-0">
              <div className="w-10 h-1 bg-gray-300 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 pt-2 pb-4 border-b border-gray-100 shrink-0">
              <h3 className="font-bold text-brand-black text-lg flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-brand-red" />
                Filters & Sort
              </h3>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="p-2 text-brand-gray hover:text-brand-black rounded-full hover:bg-gray-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto flex-1 p-5 space-y-6">
              {/* Sort By */}
              <div>
                <p className="text-[10px] font-bold text-brand-gray uppercase tracking-widest mb-3">Sort By</p>
                <div className="grid grid-cols-2 gap-2">
                  {sortOptions.map((option) => (
                    <button
                      key={option.value}
                      onClick={() =>
                        setFilters((f) => ({ ...f, sortBy: option.value as ProductFilters["sortBy"] }))
                      }
                      className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        filters.sortBy === option.value
                          ? "bg-brand-red text-white shadow-md shadow-brand-red/25"
                          : "bg-gray-100 text-brand-gray hover:bg-gray-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <p className="text-[10px] font-bold text-brand-gray uppercase tracking-widest mb-3">Category</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilters((f) => ({ ...f, category: undefined }))}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      !filters.category
                        ? "bg-brand-red text-white shadow-md shadow-brand-red/25"
                        : "bg-gray-100 text-brand-gray hover:bg-gray-200"
                    }`}
                  >
                    All
                  </button>
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() =>
                        setFilters((f) => ({ ...f, category: category.slug }))
                      }
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                        filters.category === category.slug
                          ? "bg-brand-red text-white shadow-md shadow-brand-red/25"
                          : "bg-gray-100 text-brand-gray hover:bg-gray-200"
                      }`}
                    >
                      {category.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Range */}
              <div>
                <p className="text-[10px] font-bold text-brand-gray uppercase tracking-widest mb-3">Price Range</p>
                <div className="flex gap-3 items-center">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Min"
                      value={filters.minPrice || ""}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          minPrice: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                      className="w-full pl-7 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>
                  <span className="text-brand-gray text-sm">–</span>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-gray text-sm">$</span>
                    <input
                      type="number"
                      placeholder="Max"
                      value={filters.maxPrice || ""}
                      onChange={(e) =>
                        setFilters((f) => ({
                          ...f,
                          maxPrice: e.target.value ? Number(e.target.value) : undefined,
                        }))
                      }
                      className="w-full pl-7 pr-3 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-brand-red transition-colors"
                    />
                  </div>
                </div>
              </div>

              {/* extra bottom space for action buttons */}
              <div className="h-4" />
            </div>

            {/* Action buttons — pinned above bottom nav */}
            <div className="shrink-0 border-t border-gray-100 p-4 pb-safe flex gap-3 bg-white">
              <button
                onClick={() => setFilters({ category: undefined, sortBy: "newest" })}
                className="flex-1 py-3 border-2 border-gray-200 rounded-xl text-sm font-semibold text-brand-gray hover:border-brand-red hover:text-brand-red transition-colors"
              >
                Clear All
              </button>
              <button
                onClick={() => setIsMobileFilterOpen(false)}
                className="flex-1 py-3 bg-brand-red text-white rounded-xl text-sm font-semibold hover:bg-brand-red/90 transition-colors shadow-lg shadow-brand-red/20"
              >
                Show {filteredProducts.length} Results
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function ProductsLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-brand-black py-10">
        <div className="container mx-auto px-4">
          <div className="h-9 w-48 bg-white/20 rounded-lg animate-pulse mb-2" />
          <div className="h-5 w-32 bg-white/10 rounded animate-pulse" />
        </div>
      </div>
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl shadow-sm p-4 animate-pulse">
              <div className="aspect-square bg-gray-200 rounded-xl mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2" />
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          ))}
        </div>
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
