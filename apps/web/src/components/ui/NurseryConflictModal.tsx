"use client";

interface NurseryConflictModalProps {
  currentNurseryName: string;
  newNurseryName: string;
  onKeep: () => void;
  onReplace: () => void;
}

/**
 * Shown when a customer tries to add a product from a different nursery
 * than what's already in their cart.
 *
 * Floria MVP: one checkout = one nursery.
 */
export function NurseryConflictModal({
  currentNurseryName,
  newNurseryName,
  onKeep,
  onReplace,
}: NurseryConflictModalProps) {
  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-900/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="nursery-conflict-title"
    >
      <div className="bg-floria-linen rounded-2xl shadow-xl max-w-sm w-full p-6 border border-floria-border">
        {/* Icon */}
        <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center mx-auto mb-4">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-amber-500"
            aria-hidden="true"
          >
            <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z" />
            <path d="M12 9v4" />
            <path d="M12 17h.01" />
          </svg>
        </div>

        <h2
          id="nursery-conflict-title"
          className="font-serif text-lg font-bold text-ink-900 text-center mb-2"
        >
          Replace Cart?
        </h2>

        <p className="text-sm text-ink-500 text-center mb-1">
          Your cart contains items from{" "}
          <span className="font-semibold text-ink-800">{currentNurseryName}</span>.
        </p>
        <p className="text-sm text-ink-500 text-center mb-6">
          Adding items from{" "}
          <span className="font-semibold text-ink-800">{newNurseryName}</span> will
          replace your current cart.
        </p>

        <div className="flex flex-col gap-3">
          <button
            type="button"
            onClick={onReplace}
            className="w-full py-3 bg-forest-800 hover:bg-forest-900 text-white font-bold text-sm rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-forest-800"
          >
            Replace Cart
          </button>
          <button
            type="button"
            onClick={onKeep}
            className="w-full py-3 border border-floria-border hover:bg-floria-soft-sand text-ink-700 font-bold text-sm rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-forest-800/20"
          >
            Keep Current Cart
          </button>
        </div>
      </div>
    </div>
  );
}
