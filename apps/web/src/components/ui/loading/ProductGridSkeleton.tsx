import { Skeleton } from "./Skeleton";

export function ProductCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-2xl border border-stone-200/80 p-3 flex flex-col justify-between space-y-3 shadow-xs"
    >
      {/* Image Skeleton */}
      <div className="relative w-full aspect-[4/3] rounded-xl overflow-hidden bg-stone-100">
        <Skeleton variant="image" className="w-full h-full" />
        <Skeleton variant="rectangle" className="absolute top-2 left-2 w-16 h-5 rounded-md" />
      </div>

      {/* Nursery Tag */}
      <Skeleton variant="text" className="h-3 w-1/3" />

      {/* Product Title */}
      <div className="space-y-1.5 pt-1">
        <Skeleton variant="text" className="h-4 w-5/6" />
        <Skeleton variant="text" className="h-4 w-3/4" />
      </div>

      {/* Rating & Stock */}
      <div className="flex items-center gap-2 pt-1">
        <Skeleton variant="text" className="h-3 w-16" />
        <Skeleton variant="text" className="h-3 w-12" />
      </div>

      {/* Price & Action */}
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-5 w-20" />
          <Skeleton variant="text" className="h-3 w-12" />
        </div>
        <Skeleton variant="rectangle" className="h-9 w-24 rounded-lg" />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product listings"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6"
    >
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
