import { Skeleton } from "./Skeleton";

export interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  columnWidths?: string[];
  className?: string;
}

export function TableRowSkeleton({
  columns = 5,
  columnWidths,
}: {
  columns?: number;
  columnWidths?: string[];
}) {
  return (
    <tr aria-hidden="true" className="border-b border-stone-100">
      {Array.from({ length: columns }).map((_, colIdx) => (
        <td key={colIdx} className="p-4">
          <Skeleton
            variant="text"
            className="h-4 rounded-md"
            style={{
              width:
                columnWidths?.[colIdx] ||
                `${Math.floor(50 + ((colIdx * 17) % 45))}%`,
            }}
          />
        </td>
      ))}
    </tr>
  );
}

export function TableSkeleton({
  rows = 8,
  columns = 5,
  columnWidths,
  className = "",
}: TableSkeletonProps) {
  return (
    <div
      aria-busy="true"
      aria-label="Loading data table"
      className={`w-full bg-white rounded-2xl border border-stone-200/80 overflow-hidden shadow-xs ${className}`}
    >
      {/* Table Header Skeleton */}
      <div className="p-4 border-b border-stone-100 bg-stone-50/70 flex items-center justify-between">
        <Skeleton variant="text" className="h-5 w-44" />
        <Skeleton variant="rectangle" className="h-8 w-24 rounded-lg" />
      </div>

      {/* Desktop Table View */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-stone-200/80 bg-stone-50/40">
              {Array.from({ length: columns }).map((_, i) => (
                <th key={i} className="p-4">
                  <Skeleton variant="text" className="h-3.5 w-20" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rowIdx) => (
              <TableRowSkeleton
                key={rowIdx}
                columns={columns}
                columnWidths={columnWidths}
              />
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards Fallback */}
      <div className="sm:hidden p-4 space-y-3">
        {Array.from({ length: Math.min(rows, 4) }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="p-4 bg-white rounded-xl border border-stone-200 space-y-3"
    >
      <div className="flex items-center justify-between">
        <Skeleton variant="text" className="h-4 w-1/3" />
        <Skeleton variant="rectangle" className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton variant="text" className="h-3.5 w-3/4" />
      <div className="flex items-center justify-between pt-2 border-t border-stone-100">
        <Skeleton variant="text" className="h-4 w-1/4" />
        <Skeleton variant="rectangle" className="h-7 w-20 rounded-lg" />
      </div>
    </div>
  );
}
