import { ProductGridSkeleton } from "@/components/ui/loading";

export default function ShopLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      <div className="h-8 w-48 bg-stone-200/80 rounded-lg animate-pulse" />
      <ProductGridSkeleton count={8} />
    </div>
  );
}
