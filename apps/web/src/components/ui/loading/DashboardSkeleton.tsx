import { Skeleton } from "./Skeleton";
import { KpiSkeleton, ChartSkeleton } from "./ChartSkeleton";
import { TableSkeleton } from "./TableSkeleton";

export function AdminDashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading admin dashboard" className="space-y-6 max-w-7xl mx-auto">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <Skeleton variant="text" className="h-8 w-64" />
          <Skeleton variant="text" className="h-4 w-96" />
        </div>
        <Skeleton variant="rectangle" className="h-10 w-36 rounded-xl" />
      </div>

      {/* KPI 4-Card Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>

      {/* Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton height="300px" />
        </div>
        <div className="bg-white rounded-2xl border border-stone-200/80 p-6 space-y-4 shadow-xs">
          <Skeleton variant="text" className="h-5 w-40" />
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton variant="avatar" className="w-10 h-10 rounded-xl" />
                <div className="flex-1 space-y-1">
                  <Skeleton variant="text" className="h-4 w-3/4" />
                  <Skeleton variant="text" className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Table Section */}
      <TableSkeleton rows={6} columns={6} />
    </div>
  );
}

export function SellerDashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading seller dashboard" className="space-y-6 max-w-6xl mx-auto">
      <div className="p-6 bg-stone-100/70 rounded-2xl space-y-3 border border-stone-200">
        <Skeleton variant="text" className="h-6 w-48" />
        <Skeleton variant="text" className="h-4 w-80" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TableSkeleton rows={4} columns={4} />
        <TableSkeleton rows={4} columns={4} />
      </div>
    </div>
  );
}

export function OperationsDashboardSkeleton() {
  return (
    <div aria-busy="true" aria-label="Loading operations dashboard" className="space-y-6 max-w-7xl mx-auto">
      <div className="space-y-2">
        <Skeleton variant="text" className="h-7 w-56" />
        <Skeleton variant="text" className="h-4 w-72" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <KpiSkeleton />
        <KpiSkeleton />
        <KpiSkeleton />
      </div>

      <TableSkeleton rows={8} columns={5} />
    </div>
  );
}
