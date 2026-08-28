// Floria Delivery Mobile — Authentication & Courier Role Context (Step 5B.1)
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { api } from "../api";

export interface DeliveryAuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  isAuthorizedCourier: boolean;
  signIn: (
    email: string,
    password: string,
  ) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const DeliveryAuthContext = createContext<DeliveryAuthContextType | null>(null);

export function DeliveryAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("user_profiles")
        .select("role")
        .eq("id", userId)
        .maybeSingle();

      if (error || !data) {
        setRole(null);
      } else {
        setRole(data.role || "customer");
      }
    } catch {
      setRole(null);
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user?.id) {
      await fetchProfile(user.id);
    }
  }, [user?.id, fetchProfile]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setRole(null);
        setLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signIn = useCallback(
    async (email: string, password: string) => {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) return { success: false, error: error.message };
        if (data.user) {
          await fetchProfile(data.user.id);
        }
        return { success: true };
      } catch (e: any) {
        return { success: false, error: e.message || "Failed to sign in" };
      }
    },
    [fetchProfile],
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
  }, []);

  const isAuthorizedCourier = useMemo(() => {
    return role === "operations" || role === "admin" || role === "super_admin";
  }, [role]);

  const value = useMemo(
    () => ({
      user,
      session,
      role,
      loading,
      isAuthorizedCourier,
      signIn,
      signOut,
      refreshProfile,
    }),
    [
      user,
      session,
      role,
      loading,
      isAuthorizedCourier,
      signIn,
      signOut,
      refreshProfile,
    ],
  );

  return (
    <DeliveryAuthContext.Provider value={value}>
      {children}
    </DeliveryAuthContext.Provider>
  );
}

export function useDeliveryAuth(): DeliveryAuthContextType {
  const context = useContext(DeliveryAuthContext);
  if (!context) {
    throw new Error(
      "useDeliveryAuth must be used within a DeliveryAuthProvider",
    );
  }
  return context;
}
