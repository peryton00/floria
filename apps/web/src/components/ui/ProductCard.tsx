// Floria — ProductCard component
import Link from "next/link";
import Image from "next/image";
import type { ProductListing } from "@floria/types";
import { Badge } from "@/components/ui/Badge";

interface ProductCardProps {
  listing: ProductListing;
}

export function formatINR(paise: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise / 100);
}

export function ProductCard({ listing }: ProductCardProps) {
  const { product, inventory, primary_image, seller } = listing;
  const isOutOfStock = inventory.stock_quantity === 0;
  const isLowStock = !isOutOfStock && inventory.stock_quantity <= inventory.low_stock_threshold;

  return (
    <Link
      href={`/products/${product.slug}`}
      className={[
        "group relative flex flex-col h-full",
        "bg-white rounded-2xl overflow-hidden",
        "border border-ink-100",
        "hover:border-forest-300 hover:-translate-y-1 hover:shadow-md",
        "transition-all duration-300 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-forest-700",
      ].join(" ")}
    >
      <div className="relative aspect-square w-full overflow-hidden bg-cream-50 select-none">
        <Image
          src={primary_image?.url || "/floria-logo.png"}
          alt={primary_image?.alt_text || product.name}
          fill
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          className="object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
        />
        {isOutOfStock && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="error">Out of Stock</Badge>
          </div>
        )}
        {!isOutOfStock && isLowStock && (
          <div className="absolute top-3 left-3 z-10">
            <Badge variant="warning">Only {inventory.stock_quantity} left</Badge>
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col p-4">
        <p className="text-[10px] font-medium uppercase tracking-wider text-ink-400 mb-1 select-none">
          {seller.business_name}
        </p>
        <h3 className="font-sans text-sm font-semibold text-ink-900 leading-snug mb-2 line-clamp-2 group-hover:text-forest-700 transition-colors">
          {product.name}
        </h3>
        <div className="flex-1" />
        <div className="flex items-center justify-between pt-2 border-t border-ink-50">
          <span className="font-serif text-base font-bold text-forest-800">
            {formatINR(inventory.price_paise)}
          </span>
          <span
            className="text-xs font-semibold text-forest-700 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300 ease-out"
            aria-hidden="true"
          >
            View →
          </span>
        </div>
      </div>
    </Link>
  );
}
