import React from "react";
import { Spinner } from "./Spinner";

export function InlineLoader({ children = "Loading..." }: { children?: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 text-stone-600 text-xs font-medium">
      <Spinner size="xs" ariaHidden />
      <span>{children}</span>
    </div>
  );
}

export function SearchLoader() {
  return (
    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pointer-events-none">
      <Spinner size="xs" ariaHidden />
    </div>
  );
}
