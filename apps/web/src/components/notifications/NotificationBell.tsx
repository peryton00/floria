"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { api } from "@/lib/api";
import { NotificationDrawer } from "./NotificationDrawer";

interface NotificationBellProps {
  userRole?: "customer" | "seller" | "operations" | "admin";
}

export function NotificationBell({ userRole = "customer" }: NotificationBellProps) {
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    try {
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
    // Poll unread count every 15 seconds
    const interval = setInterval(fetchUnreadCount, 15000);
    return () => clearInterval(interval);
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
