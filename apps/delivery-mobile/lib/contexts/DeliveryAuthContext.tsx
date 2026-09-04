// Floria Delivery Mobile — Authentication & Courier Role Context (Step 5B.1)
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "../supabase";
import { api } from "../api";

WebBrowser.maybeCompleteAuthSession();

export interface DeliveryAuthContextType {
  user: User | null;
  session: Session | null;
  role: string | null;
  loading: boolean;
  isAuthorizedCourier: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signInWithGoogle: () => Promise<void>;
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

      if (data?.role) {
        setRole(data.role);
      } else {
        const { data: dp } = await supabase
          .from("delivery_partners")
          .select("id, status")
          .eq("user_id", userId)
          .maybeSingle();

        if (dp) {
          setRole("delivery_partner");
        } else {
          setRole("customer");
        }
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

  const signInWithGoogle = useCallback(async () => {
    const redirectTo = makeRedirectUri({ scheme: "floria-delivery", path: "auth/callback" });
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) throw new Error(error?.message || "Google sign-in failed");
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "success" && result.url) {
      const url = new URL(result.url);
      const accessToken = url.searchParams.get("access_token");
      const refreshToken = url.searchParams.get("refresh_token");
      if (accessToken && refreshToken) {
        await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken });
      } else {
        const code = url.searchParams.get("code");
        if (code) await supabase.auth.exchangeCodeForSession(code);
      }
    }
  }, []);

  const isAuthorizedCourier = useMemo(() => {
    return (
      role === "operations" ||
      role === "admin" ||
      role === "super_admin" ||
      role === "courier" ||
      role === "delivery_partner"
    );
  }, [role]);

  const value = useMemo(
    () => ({
      user,
      session,
      role,
      loading,
      isAuthorizedCourier,
      signIn,
      signInWithGoogle,
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
      signInWithGoogle,
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
