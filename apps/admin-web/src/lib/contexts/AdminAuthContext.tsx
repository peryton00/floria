"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { UserRole } from "@floria/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";
import { api } from "@/lib/api";

export type AuthState =
  | "INITIALIZING"
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "SESSION_EXPIRED"
  | "ERROR";

export interface AdminUser {
  id: string;
  email?: string;
  role: UserRole | "super_admin";
  fullName?: string;
}

export interface AdminAuthContextType {
  user: AdminUser | null;
  authState: AuthState;
  isLoading: boolean;
  isAdmin: boolean;
  signOut: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [authState, setAuthState] = useState<AuthState>("INITIALIZING");
  const [isLoading, setIsLoading] = useState(true);

  const refreshAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setUser(null);
        setAuthState("UNAUTHENTICATED");
        return;
      }

      const res = await api.getProfile();
      if (res.success && res.data) {
        const u = res.data.user || {};
        const p = res.data.profile || {};
        const role = p.role || u.role || "customer";

        setUser({
          id: u.id || session.user.id,
          email: u.email || session.user.email,
          role,
          fullName: p.full_name || u.full_name,
        });
        setAuthState("AUTHENTICATED");
      } else if (res.error?.code === "AUTH_REQUIRED") {
        setUser(null);
        setAuthState("SESSION_EXPIRED");
      } else {
        setUser({
          id: session.user.id,
          email: session.user.email,
          role: "customer",
        });
        setAuthState("AUTHENTICATED");
      }
    } catch {
      setUser(null);
      setAuthState("ERROR");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAuth();

    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user
      ) {
        await refreshAuth();
      } else if (event === "SIGNED_OUT") {
        setUser(null);
        setAuthState("UNAUTHENTICATED");
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshAuth]);

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setUser(null);
    setAuthState("UNAUTHENTICATED");
  };

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        authState,
        isLoading,
        isAdmin,
        signOut,
        refreshAuth,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth(): AdminAuthContextType {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}
