import { Skeleton } from "./Skeleton";

export function NurseryCardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="bg-white rounded-2xl border border-stone-200/80 p-5 flex flex-col justify-between space-y-4 shadow-xs"
    >
      <div className="flex items-start gap-4">
        {/* Nursery Logo Avatar */}
        <Skeleton variant="avatar" className="w-14 h-14 rounded-xl" />
        <div className="flex-1 space-y-2">
          <Skeleton variant="text" className="h-5 w-3/4" />
          <Skeleton variant="text" className="h-3 w-1/2" />
          <div className="flex items-center gap-2 pt-1">
            <Skeleton variant="text" className="h-3.5 w-14" />
            <Skeleton variant="text" className="h-3.5 w-20" />
          </div>
        </div>
      </div>

      <div className="space-y-2 pt-2 border-t border-stone-100">
        <Skeleton variant="text" className="h-3.5 w-full" />
        <Skeleton variant="text" className="h-3.5 w-4/5" />
      </div>

      <div className="flex items-center justify-between pt-2">
        <Skeleton variant="rectangle" className="h-4 w-24 rounded-full" />
        <Skeleton variant="rectangle" className="h-9 w-28 rounded-lg" />
      </div>
    </div>
  );
}

export function NurseryGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading nurseries"
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
    >
      {Array.from({ length: count }).map((_, i) => (
        <NurseryCardSkeleton key={i} />
      ))}
    </div>
  );
}
