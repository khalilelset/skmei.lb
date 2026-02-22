import Link from "next/link";
import { Category } from "@/types";
import { Watch, Clock, Zap, Smartphone, Gem, ArrowRight } from "lucide-react";

interface CategoryCardProps {
  category: Category;
}

export default function CategoryCard({ category }: CategoryCardProps) {
  // Category icons mapping - Using lucide-react icons
  const categoryIcons: Record<string, React.ReactNode> = {
    digital: <Watch className="w-6 h-6 sm:w-8 sm:h-8" />,
    analog: <Clock className="w-6 h-6 sm:w-8 sm:h-8" />,
    sports: <Zap className="w-6 h-6 sm:w-8 sm:h-8" />,
    smart: <Smartphone className="w-6 h-6 sm:w-8 sm:h-8" />,
    luxury: <Gem className="w-6 h-6 sm:w-8 sm:h-8" />,
  };

  return (
    <Link href={`/store/products?category=${category.slug}`} className="group block h-full">
      <div className="relative overflow-hidden rounded-xl sm:rounded-2xl bg-white shadow-sm hover:shadow-2xl transition-all duration-300 border-2 border-brand-silver hover:border-brand-red h-full">

        {/* Red Accent Hover Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-red to-brand-red-dark opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Red Top Stripe */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-brand-red transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

        <div className="relative p-4 sm:p-6 h-full flex flex-col">

          {/* Icon - Mobile Optimized */}
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-brand-silver-light rounded-xl sm:rounded-2xl flex items-center justify-center text-brand-red group-hover:bg-white/20 group-hover:text-white group-hover:scale-110 transition-all duration-300 mb-3 sm:mb-4">
            {categoryIcons[category.slug] || categoryIcons.analog}
          </div>

          {/* Content */}
          <h3 className="text-base sm:text-lg font-bold text-brand-black group-hover:text-white transition-colors mb-1 sm:mb-2">
            {category.name}
          </h3>
          <p className="text-xs sm:text-sm text-brand-gray group-hover:text-white/90 transition-colors mb-3 sm:mb-4 flex-grow line-clamp-2">
            {category.description}
          </p>

          {/* Product Count & Arrow */}
          <div className="flex items-center justify-between mt-auto">
            <span className="text-xs sm:text-sm font-semibold text-brand-red group-hover:text-white transition-colors">
              {category.productCount} Products
            </span>
            <span className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-brand-silver-light group-hover:bg-white/20 flex items-center justify-center text-brand-red group-hover:text-white transition-all duration-300 group-hover:translate-x-1">
              <ArrowRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
