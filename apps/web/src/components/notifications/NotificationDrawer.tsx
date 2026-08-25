"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { api, NotificationItem } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import {
  Bell,
  CheckCheck,
  Package,
  ShoppingBag,
  Store,
  AlertTriangle,
  Info,
  X,
  ChevronRight,
  Trash2
} from "lucide-react";

import { resolveNotificationNavigation } from "@/lib/navigation/notificationResolver";

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshCount: () => void;
  userRole?: "customer" | "seller" | "operations" | "admin";
}

export function NotificationDrawer({
  isOpen,
  onClose,
  onRefreshCount,
  userRole = "customer",
}: NotificationDrawerProps) {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setNotifications([]);
        setLoading(false);
        return;
      }
      const res = await api.getNotifications({ limit: 20 });
      if (res.success && res.data) {
        setNotifications(res.data.notifications || []);
      } else {
        setError(res.error?.message || "Failed to load notifications");
      }
    } catch (err: any) {
      setError(err.message || "Failed to fetch notifications");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read_at: new Date().toISOString() } : item))
      );
      onRefreshCount();
    } catch (e) {
      console.error("[NotificationDrawer] markRead error:", e);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((item) => ({ ...item, read_at: new Date().toISOString() }))
      );
      onRefreshCount();
    } catch (e) {
      console.error("[NotificationDrawer] markAllRead error:", e);
    }
  };

  const handleDeleteNotification = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await api.deleteNotification(id);
      setNotifications((prev) => prev.filter((item) => item.id !== id));
      onRefreshCount();
    } catch (err) {
      console.error("[NotificationDrawer] deleteNotification error:", err);
    }
  };

  const getTargetHref = (item: NotificationItem): string => {
    return resolveNotificationNavigation(item, userRole);
  };

  const getIcon = (type: string) => {
    if (type.includes("ORDER")) return <ShoppingBag size={16} className="text-forest-700" />;
    if (type.includes("STOCK")) return <AlertTriangle size={16} className="text-warning-600" />;
    if (type.includes("SELLER") || type.includes("NURSERY")) return <Store size={16} className="text-purple-700" />;
    if (type.includes("PICKUP") || type.includes("DELIVERY")) return <Package size={16} className="text-blue-700" />;
    return <Info size={16} className="text-ink-500" />;
  };

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div className="fixed inset-0 z-[99999] overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-sm bg-floria-linen h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200 border-l border-floria-border">
        {/* Header */}
        <div className="p-4 border-b border-floria-border flex justify-between items-center bg-floria-soft-sand/60">
          <div className="flex items-center gap-2">
            <Bell size={18} className="text-forest-700" />
            <h2 className="font-serif text-base font-bold text-ink-900">Notifications</h2>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-[10px] font-bold uppercase tracking-wider text-forest-700 hover:text-forest-900 flex items-center gap-1 bg-forest-50 px-2 py-1 rounded-md border border-forest-100"
              title="Mark all as read"
            >
              <CheckCheck size={12} /> Read all
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-1 rounded-lg text-ink-400 hover:text-ink-900 hover:bg-floria-soft-sand transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Content list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {error && (
            <div className="bg-error-50 border border-error-100 rounded-xl p-3 text-xs text-error-700">
              {error}
            </div>
          )}

          {loading ? (
            <div className="py-12 flex justify-center">
              <div className="w-6 h-6 border-2 border-forest-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center space-y-2">
              <Bell size={32} className="mx-auto text-ink-200" />
              <p className="font-serif font-bold text-ink-800 text-sm">You&apos;re all caught up!</p>
              <p className="text-xs text-ink-400">No recent notifications to show.</p>
            </div>
          ) : (
            notifications.map((item) => {
              const isUnread = !item.read_at;
              const href = getTargetHref(item);

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition-all relative group ${
                    isUnread
                      ? "bg-floria-soft-sand/90 border-forest-200 shadow-2xs"
                      : "bg-floria-linen border-floria-border opacity-85"
                  }`}
                >
                  <Link
                    href={href}
                    onClick={() => {
                      if (isUnread) handleMarkRead(item.id);
                      onClose();
                    }}
                    className="block space-y-1 pr-6"
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-floria-sand/80 border border-floria-border flex items-center justify-center flex-shrink-0 shadow-2xs">
                          {getIcon(item.type)}
                        </div>
                        <h3 className="font-bold text-xs text-ink-900 leading-snug">{item.title}</h3>
                      </div>
                      {isUnread && (
                        <span className="w-2 h-2 rounded-full bg-forest-600 flex-shrink-0 mt-1" />
                      )}
                    </div>

                    <p className="text-xs text-ink-600 leading-relaxed pl-9">{item.message}</p>

                    <div className="pl-9 pt-1 flex justify-between items-center text-[10px] text-ink-400">
                      <span>{new Date(item.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
                      <span className="text-forest-700 font-medium flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        View details <ChevronRight size={10} />
                      </span>
                    </div>
                  </Link>

                  <button
                    type="button"
                    onClick={(e) => handleDeleteNotification(e, item.id)}
                    className="absolute top-3 right-3 p-1 rounded-md text-ink-400 hover:text-error-600 hover:bg-error-50 opacity-0 group-hover:opacity-100 transition-all"
                    title="Dismiss notification"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-floria-border bg-floria-soft-sand/40 text-center text-[10px] text-ink-400">
          <span>Floria Notification Dispatch Engine</span>
        </div>
      </div>
    </div>,
    document.body
  );
}
