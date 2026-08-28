"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[Floria/cart]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-6">
      <h2 className="text-xl font-bold text-ink-900 mb-2">
        Cart couldn&apos;t load
      </h2>
      <p className="text-sm text-ink-500 mb-6">
        Something went wrong loading your cart.
      </p>
      <div className="flex gap-3">
        <button
          onClick={reset}
          className="px-6 py-2.5 bg-forest-700 text-white text-sm font-semibold rounded-full hover:bg-forest-800 transition-colors"
        >
          Try again
        </button>
        <Link
          href="/"
          className="px-6 py-2.5 border border-floria-border text-ink-700 text-sm font-semibold rounded-full hover:bg-floria-soft-sand transition-colors"
        >
          Go home
        </Link>
      </div>
    </div>
  );
}
