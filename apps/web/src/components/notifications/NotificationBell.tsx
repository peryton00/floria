"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { NotificationDrawer } from "./NotificationDrawer";

interface NotificationBellProps {
  userRole?: "customer" | "seller" | "operations" | "admin";
}

export function NotificationBell({ userRole = "customer" }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setUnreadCount(0);
        return;
      }
      const res = await api.getUnreadNotificationCount();
      if (res.success && res.data) {
        setUnreadCount(res.data.unreadCount || 0);
      }
    } catch {
      // Silently ignore if unauthenticated or network error
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();

    let unsubscribe = () => {};
    let channel: BroadcastChannel | null = null;

    try {
      if (typeof window !== "undefined" && "BroadcastChannel" in window) {
        channel = new BroadcastChannel("floria_notifications");
        channel.onmessage = (event) => {
          if (event.data?.type === "REFRESH_NOTIFICATIONS" || event.data?.type === "NEW_NOTIFICATION") {
            fetchUnreadCount();
          }
        };
      }
    } catch {
      // BroadcastChannel unavailable
    }

    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.access_token) {
          fetchUnreadCount();
        } else {
          setUnreadCount(0);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    } catch {
      // Ignore if Supabase is unavailable in current context
    }

    // Conservative 60-second fallback poll
    const interval = setInterval(fetchUnreadCount, 60000);

    return () => {
      unsubscribe();
      clearInterval(interval);
      if (channel) channel.close();
    };
  }, [fetchUnreadCount]);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="relative p-2 rounded-xl text-ink-600 hover:text-forest-700 hover:bg-cream-100/60 transition-colors focus:outline-none focus:ring-2 focus:ring-forest-700"
        aria-label={`View Notifications (${unreadCount} unread)`}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-4 h-4 px-1 rounded-full bg-forest-700 text-white font-mono font-bold text-[9px] flex items-center justify-center border border-white shadow-2xs">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      <NotificationDrawer
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        onRefreshCount={fetchUnreadCount}
        userRole={userRole}
      />
    </>
  );
}
