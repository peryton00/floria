import { Skeleton } from "./Skeleton";

export function KpiSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="p-5 bg-white rounded-2xl border border-stone-200/80 shadow-xs flex flex-col justify-between space-y-3"
    >
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-3.5 w-24" />
        <Skeleton variant="avatar" className="w-9 h-9 rounded-xl" />
      </div>
      <div className="space-y-1">
        <Skeleton variant="text" className="h-7 w-32" />
        <Skeleton variant="text" className="h-3.5 w-20" />
      </div>
    </div>
  );
}

export function ChartSkeleton({ height = "280px" }: { height?: string }) {
  return (
    <div
      aria-hidden="true"
      className="p-6 bg-white rounded-2xl border border-stone-200/80 shadow-xs space-y-6"
    >
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <Skeleton variant="text" className="h-5 w-40" />
          <Skeleton variant="text" className="h-3.5 w-28" />
        </div>
        <div className="flex gap-2">
          <Skeleton variant="rectangle" className="h-7 w-16 rounded-md" />
          <Skeleton variant="rectangle" className="h-7 w-16 rounded-md" />
        </div>
      </div>

      {/* Visual Chart Bars / Lines Placeholder */}
      <div className="flex items-end justify-between gap-3 pt-4 border-b border-stone-200" style={{ height }}>
        {[40, 65, 30, 85, 55, 75, 90, 45, 60, 80, 50, 70].map((h, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
            <Skeleton
              variant="rectangle"
              className="w-full rounded-t-md"
              style={{ height: `${h}%` }}
            />
            <Skeleton variant="text" className="h-3 w-6 mt-2" />
          </div>
        ))}
      </div>
    </div>
  );
}
