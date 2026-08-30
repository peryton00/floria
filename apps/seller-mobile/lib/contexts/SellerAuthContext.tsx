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

export type SellerOnboardingStatus =
  | "incomplete"
  | "under_review"
  | "needs_correction"
  | "approved"
  | "active"
  | "suspended"
  | "rejected";

export interface SellerProfileData {
  id: string;
  userId: string;
  businessName: string;
  businessDescription?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  logoUrl?: string;
  status: "pending" | "approved" | "suspended" | "rejected";
  onboardingStatus: SellerOnboardingStatus;
  correctionReason?: string;
  role: string;
  isActive: boolean;
  productCount?: number;
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

      // 2. Fetch seller dashboard profile & application status
      const [dashboardRes, appRes, productsRes] = await Promise.allSettled([
        api.getSellerDashboard(),
        api.getSellerApplication(),
        api.getSellerProducts({ limit: 1 }),
      ]);

      let onboardingStatus: SellerOnboardingStatus = "incomplete";
      let status: "pending" | "approved" | "suspended" | "rejected" = "pending";
      let sellerData: any = null;
      let correctionReason = "";
      let productCount = 0;

      if (productsRes.status === "fulfilled" && productsRes.value.success) {
        productCount = Array.isArray(productsRes.value.data)
          ? productsRes.value.data.length
          : 0;
      }

      if (dashboardRes.status === "fulfilled" && dashboardRes.value.success && dashboardRes.value.data?.profile) {
        const p = dashboardRes.value.data.profile;
        sellerData = p;
        status = p.status || "approved";

        if (status === "approved") {
          onboardingStatus = "approved";
        } else if (status === "suspended") {
          onboardingStatus = "suspended";
        } else if (status === "rejected") {
          onboardingStatus = "rejected";
        } else {
          onboardingStatus = "under_review";
        }
      }

      if (appRes.status === "fulfilled" && appRes.value.success && appRes.value.data) {
        const app = appRes.value.data;
        if (!sellerData) sellerData = app;

        if (app.status === "needs_correction") {
          onboardingStatus = "needs_correction";
          correctionReason = app.rejection_reason || "Additional verification documents required.";
        } else if (app.status === "pending" || app.status === "submitted") {
          onboardingStatus = "under_review";
        } else if (app.is_complete === false) {
          onboardingStatus = "incomplete";
        }
      }

      // Check if business has at least minimum operational details
      if (
        !sellerData?.business_name ||
        sellerData.business_name === "Nursery Partner" ||
        sellerData.business_name === "New Nursery" ||
        !sellerData?.contact_phone
      ) {
        if (onboardingStatus !== "needs_correction" && onboardingStatus !== "under_review") {
          onboardingStatus = "incomplete";
        }
      }

      setSeller({
        id: sellerData?.id || session.user.id,
        userId: session.user.id,
        businessName: sellerData?.business_name || fullName,
        businessDescription: sellerData?.business_description,
        email: sellerData?.contact_email || session.user.email || "",
        phone: sellerData?.contact_phone,
        address: sellerData?.address,
        city: sellerData?.city,
        state: sellerData?.state,
        postalCode: sellerData?.postal_code || sellerData?.pincode,
        logoUrl: sellerData?.logo_url,
        status,
        onboardingStatus,
        correctionReason,
        role,
        isActive: status === "approved",
        productCount,
      });
    } catch (err) {
      console.warn("[SellerAuthContext] Profile load warning:", err);
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
    try {
      await supabase.auth.signOut();
    } finally {
      setSeller(null);
    }
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
