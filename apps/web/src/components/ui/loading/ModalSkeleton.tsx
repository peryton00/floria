import { Skeleton } from "./Skeleton";

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div aria-busy="true" aria-label="Loading form" className="space-y-4 max-w-md w-full">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-1.5">
          <Skeleton variant="text" className="h-4 w-28" />
          <Skeleton variant="rectangle" className="h-10 w-full rounded-xl" />
        </div>
      ))}
      <Skeleton variant="rectangle" className="h-11 w-full rounded-xl mt-4" />
    </div>
  );
}

export function ModalSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading modal content"
      className="p-6 space-y-6 max-w-lg w-full bg-white rounded-2xl border border-stone-200"
    >
      <div className="flex items-center justify-between border-b border-stone-100 pb-4">
        <Skeleton variant="text" className="h-6 w-48" />
        <Skeleton variant="avatar" className="w-8 h-8 rounded-lg" />
      </div>
      <div className="space-y-3">
        <Skeleton variant="text" className="h-4 w-full" />
        <Skeleton variant="text" className="h-4 w-5/6" />
        <Skeleton variant="text" className="h-4 w-4/5" />
      </div>
      <FormSkeleton fields={3} />
      <div className="flex justify-end gap-3 pt-4 border-t border-stone-100">
        <Skeleton variant="rectangle" className="h-10 w-24 rounded-lg" />
        <Skeleton variant="rectangle" className="h-10 w-28 rounded-lg" />
      </div>
    </div>
  );
}
