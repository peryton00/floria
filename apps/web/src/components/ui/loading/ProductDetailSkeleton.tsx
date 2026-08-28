import { Skeleton } from "./Skeleton";

export function ProductDetailSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading product details"
      className="max-w-6xl mx-auto px-4 py-8 space-y-12"
    >
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery */}
        <div className="space-y-4">
          <Skeleton
            variant="rectangle"
            className="w-full aspect-[4/3] rounded-2xl"
          />
          <div className="flex gap-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton
                key={i}
                variant="rectangle"
                className="w-20 h-20 rounded-xl"
              />
            ))}
          </div>
        </div>

        {/* Right Column: Product Information */}
        <div className="space-y-6">
          <div className="space-y-2">
            <Skeleton variant="rectangle" className="h-5 w-28 rounded-full" />
            <Skeleton variant="text" className="h-8 w-4/5" />
            <Skeleton variant="text" className="h-4 w-1/3" />
          </div>

          {/* Rating & Stock */}
          <div className="flex items-center gap-4 py-2 border-y border-stone-100">
            <Skeleton variant="text" className="h-4 w-28" />
            <Skeleton variant="rectangle" className="h-5 w-24 rounded-md" />
          </div>

          {/* Price */}
          <div className="space-y-1">
            <Skeleton variant="text" className="h-9 w-36" />
            <Skeleton variant="text" className="h-3.5 w-48" />
          </div>

          {/* Nursery Info Box */}
          <div className="p-4 bg-stone-50 rounded-xl space-y-2 border border-stone-200/60">
            <Skeleton variant="text" className="h-4 w-1/2" />
            <Skeleton variant="text" className="h-3.5 w-3/4" />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-full" />
            <Skeleton variant="text" className="h-4 w-2/3" />
          </div>

          {/* Quantity & CTA */}
          <div className="flex items-center gap-4 pt-4">
            <Skeleton variant="rectangle" className="h-12 w-32 rounded-xl" />
            <Skeleton variant="rectangle" className="h-12 flex-1 rounded-xl" />
            <Skeleton variant="rectangle" className="h-12 w-12 rounded-xl" />
          </div>

          {/* Delivery Guarantee Card */}
          <div className="p-4 rounded-xl border border-stone-200/80 space-y-3">
            <Skeleton variant="text" className="h-4 w-1/3" />
            <Skeleton variant="text" className="h-3.5 w-2/3" />
          </div>
        </div>
      </div>

      {/* Tabs & Care Guide / Reviews Skeleton */}
      <div className="space-y-6 pt-8 border-t border-stone-200">
        <div className="flex gap-4 border-b border-stone-200 pb-3">
          <Skeleton variant="rectangle" className="h-6 w-24 rounded-md" />
          <Skeleton variant="rectangle" className="h-6 w-24 rounded-md" />
          <Skeleton variant="rectangle" className="h-6 w-24 rounded-md" />
        </div>
        <div className="space-y-3 max-w-3xl">
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="text" className="h-4 w-5/6" />
          <Skeleton variant="text" className="h-4 w-4/5" />
        </div>
      </div>
    </div>
  );
}
