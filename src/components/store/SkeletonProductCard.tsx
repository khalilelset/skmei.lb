/**
 * SkeletonProductCard — shimmer placeholder that mirrors ProductCard layout.
 * Uses the global .skeleton-shimmer class (defined in globals.css).
 */
export default function SkeletonProductCard() {
  return (
    <div className="bg-white rounded-xl sm:rounded-2xl shadow-sm overflow-hidden border border-brand-silver">
      {/* Image area */}
      <div className="relative aspect-square overflow-hidden">
        <div className="skeleton-shimmer absolute inset-0" />
      </div>

      {/* Content */}
      <div className="p-3 sm:p-4 space-y-2.5">
        {/* Category label */}
        <div className="skeleton-shimmer h-3 w-14 rounded-full" />

        {/* Product name — two lines */}
        <div className="space-y-1.5">
          <div className="skeleton-shimmer h-4 w-full rounded" />
          <div className="skeleton-shimmer h-4 w-3/4 rounded" />
        </div>

        {/* Star rating row */}
        <div className="flex items-center gap-1 pt-0.5">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-shimmer w-3 h-3 rounded-sm" />
          ))}
          <div className="skeleton-shimmer h-3 w-8 rounded ml-1" />
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 pt-1">
          <div className="skeleton-shimmer h-5 w-20 rounded" />
          <div className="skeleton-shimmer h-4 w-12 rounded" />
        </div>

        {/* Add to Cart button — mobile */}
        <div className="skeleton-shimmer h-9 w-full rounded-lg lg:hidden" />
      </div>
    </div>
  );
}

/** N skeleton cards in the products grid layout. */
export function SkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      {[...Array(count)].map((_, i) => (
        <SkeletonProductCard key={i} />
      ))}
    </div>
  );
}

/** Skeleton for BestsellingSection (horizontal scroll mobile / 4-col desktop). */
export function SkeletonBestselling({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-3 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
      {[...Array(count)].map((_, i) => (
        <div key={i} className="shrink-0 w-64 sm:w-auto">
          <SkeletonProductCard />
        </div>
      ))}
    </div>
  );
}
