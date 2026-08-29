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

export interface SellerProfileData {
  id: string;
  businessName: string;
  email: string;
  phone?: string;
  status: "pending" | "approved" | "suspended" | "rejected";
  role: string;
}

export interface SellerAuthContextType {
  seller: SellerProfileData | null;
  isAuthenticated: boolean;
  isAuthorizedSeller: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SellerAuthContext = createContext<SellerAuthContextType | undefined>(
  undefined,
);

export function SellerAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [seller, setSeller] = useState<SellerProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setSeller(null);
        return;
      }

      // 1. Fetch user role
      const profileRes = await api.getProfile();
      let role = "customer";
      let fullName = session.user.user_metadata?.full_name || "Nursery Partner";

      if (profileRes.success && profileRes.data) {
        const u = profileRes.data.user || {};
        const p = profileRes.data.profile || {};
        role = p.role || u.role || "customer";
        fullName = p.full_name || u.full_name || fullName;
      }

      // 2. Fetch seller dashboard profile
      const dashboardRes = await api.getSellerDashboard();
      if (dashboardRes.success && dashboardRes.data?.profile) {
        const p = dashboardRes.data.profile;
        setSeller({
          id: p.id || session.user.id,
          businessName: p.business_name || fullName,
          email: p.email || session.user.email || "",
          phone: p.phone,
          status: p.verification_status || p.status || "approved",
          role,
        });
      } else {
        setSeller({
          id: session.user.id,
          businessName: fullName,
          email: session.user.email || "",
          status: "approved",
          role,
        });
      }
    } catch {
      setSeller(null);
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
        setSeller(null);
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
        throw new Error(error?.message || "Invalid nursery credentials");
      }
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSeller(null);
  };

  const signInWithGoogle = async () => {
    const redirectTo = makeRedirectUri({ scheme: "floria-seller", path: "auth/callback" });
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

  const isAuthorizedSeller = Boolean(
    seller &&
    (seller.role === "seller" ||
      seller.role === "admin" ||
      seller.role === "super_admin"),
  );

  return (
    <SellerAuthContext.Provider
      value={{
        seller,
        isAuthenticated: !!seller,
        isAuthorizedSeller,
        isLoading,
        signIn,
        signInWithGoogle,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </SellerAuthContext.Provider>
  );
}

export function useSellerAuth(): SellerAuthContextType {
  const context = useContext(SellerAuthContext);
  if (!context) {
    throw new Error("useSellerAuth must be used within a SellerAuthProvider");
  }
  return context;
}
