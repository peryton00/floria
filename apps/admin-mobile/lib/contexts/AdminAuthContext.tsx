import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "../supabase";
import { api } from "../api";

WebBrowser.maybeCompleteAuthSession();

export interface AdminUserData {
  id: string;
  email: string;
  fullName: string;
  role: string;
}

export interface AdminAuthContextType {
  admin: AdminUserData | null;
  isAuthenticated: boolean;
  isAuthorizedAdmin: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
  undefined,
);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUserData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setAdmin(null);
        return;
      }

      const profileRes = await api.getProfile();

      if (profileRes.success && profileRes.data) {
        const u = profileRes.data.user || {};
        const p = profileRes.data.profile || {};
        const role = p.role || u.role || "customer";

        setAdmin({
          id: u.id || session.user.id,
          email: u.email || session.user.email || "",
          fullName:
            p.full_name ||
            u.full_name ||
            session.user.user_metadata?.full_name ||
            "Platform Admin",
          role,
        });
      } else {
        setAdmin({
          id: session.user.id,
          email: session.user.email || "",
          fullName: session.user.user_metadata?.full_name || "Platform Admin",
          role: "customer",
        });
      }
    } catch {
      setAdmin(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event: any, session: any) => {
      if (session?.user) {
        await refreshProfile();
      } else {
        setAdmin(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signIn = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: pass,
      });
      if (error || !data.user) {
        throw new Error(error?.message || "Invalid administrative credentials");
      }
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setAdmin(null);
  };

  const signInWithGoogle = async () => {
    const redirectTo = makeRedirectUri({ scheme: "floria-admin", path: "auth/callback" });
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
      await refreshProfile();
    }
  };

  const isAuthorizedAdmin = Boolean(
    admin && (admin.role === "admin" || admin.role === "super_admin"),
  );

  return (
    <AdminAuthContext.Provider
      value={{
        admin,
        isAuthenticated: !!admin,
        isAuthorizedAdmin,
        isLoading,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
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
