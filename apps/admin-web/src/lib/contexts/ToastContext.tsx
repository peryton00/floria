"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export interface ToastContextType {
  toasts: ToastItem[];
  toast: {
    success: (title: string, message?: string) => void;
    error: (title: string, message?: string) => void;
    info: (title: string, message?: string) => void;
    warning: (title: string, message?: string) => void;
  };
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback(
    (type: ToastType, title: string, message?: string, duration = 4000) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, message, duration }]);

      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, duration);
    },
    [],
  );

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = {
    success: (title: string, message?: string) =>
      addToast("success", title, message),
    error: (title: string, message?: string) =>
      addToast("error", title, message),
    info: (title: string, message?: string) => addToast("info", title, message),
    warning: (title: string, message?: string) =>
      addToast("warning", title, message),
  };

  return (
    <ToastContext.Provider value={{ toasts, toast, removeToast }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`pointer-events-auto p-4 rounded-xl shadow-lg border text-sm flex items-start justify-between gap-3 transition-all ${
              t.type === "success"
                ? "bg-forest-800 text-white border-forest-900"
                : t.type === "error"
                  ? "bg-terracotta-800 text-white border-terracotta-900"
                  : t.type === "warning"
                    ? "bg-warning-500 text-ink-900 border-warning-700"
                    : "bg-ink-800 text-white border-ink-900"
            }`}
          >
            <div>
              <div className="font-bold text-xs uppercase tracking-wider">
                {t.title}
              </div>
              {t.message && (
                <div className="text-xs opacity-90 mt-0.5">{t.message}</div>
              )}
            </div>
            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className="opacity-70 hover:opacity-100 text-xs uppercase font-bold"
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}
