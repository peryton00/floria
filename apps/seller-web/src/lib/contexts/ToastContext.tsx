"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  Loader2,
  X,
} from "lucide-react";

export type ToastType = "success" | "error" | "warning" | "info" | "loading";

export interface ToastOptions {
  duration?: number;
  id?: string;
}

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
  duration?: number;
  createdAt: number;
}

export interface UpdateToastOptions {
  type?: ToastType;
  title?: string;
  description?: string;
  duration?: number;
}

interface ToastContextValue {
  toasts: ToastMessage[];
  toast: {
    success: (
      title: string,
      description?: string,
      options?: ToastOptions,
    ) => string;
    error: (
      title: string,
      description?: string,
      options?: ToastOptions,
    ) => string;
    warning: (
      title: string,
      description?: string,
      options?: ToastOptions,
    ) => string;
    info: (
      title: string,
      description?: string,
      options?: ToastOptions,
    ) => string;
    loading: (
      title: string,
      description?: string,
      options?: ToastOptions,
    ) => string;
    dismiss: (id: string) => void;
    update: (id: string, options: UpdateToastOptions) => void;
  };
}

const ToastContext = createContext<ToastContextValue | null>(null);

const DEFAULT_DURATIONS: Record<ToastType, number> = {
  success: 4000,
  info: 4000,
  warning: 5000,
  error: 6000,
  loading: 0, // persistent until updated/dismissed
};

const MAX_VISIBLE_TOASTS = 3;
const DEDUPE_WINDOW_MS = 1500;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const recentToastsRef = useRef<Map<string, number>>(new Map());

  // Clean up deduplication ref periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      recentToastsRef.current.forEach((time, key) => {
        if (now - time > DEDUPE_WINDOW_MS) {
          recentToastsRef.current.delete(key);
        }
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (
      type: ToastType,
      title: string,
      description?: string,
      options?: ToastOptions,
    ): string => {
      const dedupeKey = `${type}:${title}:${description || ""}`;
      const now = Date.now();
      const lastTime = recentToastsRef.current.get(dedupeKey);

      if (lastTime && now - lastTime < DEDUPE_WINDOW_MS) {
        return options?.id || `toast-${dedupeKey}`;
      }

      recentToastsRef.current.set(dedupeKey, now);

      const id =
        options?.id || `toast-${now}-${Math.random().toString(36).slice(2, 7)}`;
      const duration = options?.duration ?? DEFAULT_DURATIONS[type];

      const newToast: ToastMessage = {
        id,
        type,
        title,
        description,
        duration,
        createdAt: now,
      };

      setToasts((prev) => {
        if (
          prev.some(
            (t) => `${t.type}:${t.title}:${t.description || ""}` === dedupeKey,
          )
        ) {
          return prev;
        }
        return [newToast, ...prev];
      });

      if (duration > 0) {
        setTimeout(() => {
          dismiss(id);
        }, duration);
      }

      return id;
    },
    [dismiss],
  );

  const update = useCallback(
    (id: string, options: UpdateToastOptions) => {
      setToasts((prev) =>
        prev.map((t) => {
          if (t.id !== id) return t;

          const updatedType = options.type || t.type;
          const updatedDuration =
            options.duration !== undefined
              ? options.duration
              : DEFAULT_DURATIONS[updatedType];

          const updated: ToastMessage = {
            ...t,
            type: updatedType,
            title: options.title !== undefined ? options.title : t.title,
            description:
              options.description !== undefined
                ? options.description
                : t.description,
            duration: updatedDuration,
          };

          if (updatedDuration > 0) {
            setTimeout(() => {
              dismiss(id);
            }, updatedDuration);
          }

          return updated;
        }),
      );
    },
    [dismiss],
  );

  // Memoize so `toast` has a stable reference — prevents infinite loops in
  // consumers that list `toast` as a useCallback / useEffect dependency.
  const toastHelpers = useMemo(
    () => ({
      success: (title: string, description?: string, options?: ToastOptions) =>
        addToast("success", title, description, options),
      error: (title: string, description?: string, options?: ToastOptions) =>
        addToast("error", title, description, options),
      warning: (title: string, description?: string, options?: ToastOptions) =>
        addToast("warning", title, description, options),
      info: (title: string, description?: string, options?: ToastOptions) =>
        addToast("info", title, description, options),
      loading: (title: string, description?: string, options?: ToastOptions) =>
        addToast("loading", title, description, options),
      dismiss,
      update,
    }),
    [addToast, dismiss, update],
  );

  const visibleToasts = toasts.slice(0, MAX_VISIBLE_TOASTS);

  return (
    <ToastContext.Provider value={{ toasts, toast: toastHelpers }}>
      {children}
      {/* Toast Viewport Floating Container */}
      <div
        role="region"
        aria-label="Notifications"
        className="fixed top-4 right-4 left-4 sm:left-auto z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none"
      >
        {visibleToasts.map((t) => (
          <ToastItem key={t.id} toast={t} onDismiss={dismiss} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMessage;
  onDismiss: (id: string) => void;
}) {
  const isAlert = toast.type === "error" || toast.type === "warning";

  const getStyle = (type: ToastType) => {
    switch (type) {
      case "success":
        return {
          bg: "bg-white border-l-4 border-l-emerald-600 border border-stone-200 shadow-lg text-stone-900",
          icon: (
            <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
          ),
        };
      case "error":
        return {
          bg: "bg-white border-l-4 border-l-red-600 border border-stone-200 shadow-lg text-stone-900",
          icon: (
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          ),
        };
      case "warning":
        return {
          bg: "bg-white border-l-4 border-l-amber-500 border border-stone-200 shadow-lg text-stone-900",
          icon: (
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
          ),
        };
      case "info":
        return {
          bg: "bg-white border-l-4 border-l-sky-600 border border-stone-200 shadow-lg text-stone-900",
          icon: <Info className="w-5 h-5 text-sky-600 flex-shrink-0 mt-0.5" />,
        };
      case "loading":
        return {
          bg: "bg-white border-l-4 border-l-forest-600 border border-stone-200 shadow-lg text-stone-900",
          icon: (
            <Loader2 className="w-5 h-5 text-forest-600 animate-spin flex-shrink-0 mt-0.5" />
          ),
        };
    }
  };

  const style = getStyle(toast.type);

  return (
    <div
      role={isAlert ? "alert" : "status"}
      aria-live={isAlert ? "assertive" : "polite"}
      className={`pointer-events-auto rounded-xl p-3.5 flex items-start gap-3 transition-all duration-200 ease-out transform translate-y-0 opacity-100 motion-reduce:transition-none motion-reduce:transform-none ${style.bg}`}
    >
      {style.icon}
      <div className="flex-1 min-w-0 pr-1">
        <h4 className="text-xs font-bold text-stone-900 leading-snug">
          {toast.title}
        </h4>
        {toast.description && (
          <p className="text-[11px] text-stone-600 mt-0.5 leading-relaxed">
            {toast.description}
          </p>
        )}
      </div>
      <button
        type="button"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(toast.id)}
        className="min-w-[44px] min-h-[44px] -mr-2 -mt-2.5 flex items-center justify-center text-stone-400 hover:text-stone-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-forest-600 rounded-lg"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
