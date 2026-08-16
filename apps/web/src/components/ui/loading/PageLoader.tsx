import React from "react";
import { Spinner } from "./Spinner";

export function PageLoader({ label = "Loading page content..." }: { label?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-3 text-center"
    >
      <Spinner size="lg" ariaHidden />
      <p className="text-xs font-semibold text-stone-500 uppercase tracking-wider">{label}</p>
    </div>
  );
}

export function SectionLoader({ label = "Loading..." }: { label?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      className="py-12 flex flex-col items-center justify-center space-y-2"
    >
      <Spinner size="md" ariaHidden />
      <p className="text-xs text-stone-500">{label}</p>
    </div>
  );
}
