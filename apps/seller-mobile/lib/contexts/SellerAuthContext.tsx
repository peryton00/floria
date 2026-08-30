import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "../supabase";
import { api } from "../api";
import type { SellerStatus } from "@floria/types";

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
  publicSellerId?: string;
  username?: string;
  businessName: string;
  businessDescription?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  gstNumber?: string;
  logoUrl?: string;
  status: SellerStatus;
  onboardingStatus: SellerOnboardingStatus;
  correctionReason?: string;
  statusMessage?: string;
  role: string;
  isActive: boolean;
  productCount?: number;
}

export interface SellerAuthContextType {
  seller: SellerProfileData | null;
  isAuthenticated: boolean;
  isAuthorizedSeller: boolean;
  isLoading: boolean;
  statusMessage: string | null;
  signIn: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SellerAuthContext = createContext<SellerAuthContextType | undefined>(
  undefined,
);

let memorySellerToken: string | null = null;

export function getSellerMobileToken(): string | null {
  return memorySellerToken;
}

export function setSellerMobileToken(token: string | null) {
  memorySellerToken = token;
}

export function SellerAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [seller, setSeller] = useState<SellerProfileData | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = getSellerMobileToken();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!token && !session?.user) {
        setSeller(null);
        return;
      }

      // Fetch seller profile & application status from API
      const [profileRes, appRes, productsRes] = await Promise.allSettled([
        api.getSellerProfile(),
        api.getSellerApplicationStatus(),
        api.getSellerProducts({ limit: 1 }),
      ]);

      if (profileRes.status === "fulfilled" && profileRes.value.success && profileRes.value.data) {
        const p = profileRes.value.data;
        const status: SellerStatus = p.status || "under_review";
        let onboardingStatus: SellerOnboardingStatus = "under_review";
        let correctionReason = "";

        if (status === "approved" || status === "active") {
          onboardingStatus = "approved";
        } else if (status === "suspended" || status === "deactivated") {
          onboardingStatus = "suspended";
        } else if (status === "rejected") {
          onboardingStatus = "rejected";
        } else if (status === "needs_correction") {
          onboardingStatus = "needs_correction";
        } else {
          onboardingStatus = "under_review";
        }

        if (appRes.status === "fulfilled" && appRes.value.success && appRes.value.data) {
          const app = appRes.value.data;
          if (app.status === "needs_correction") {
            onboardingStatus = "needs_correction";
            correctionReason = app.correction_reason || "Additional verification documents required.";
          }
        }

        let productCount = 0;
        if (productsRes.status === "fulfilled" && productsRes.value.success && Array.isArray(productsRes.value.data)) {
          productCount = productsRes.value.data.length;
        }

        const isApproved = status === "approved" || status === "active";

        setSeller({
          id: p.id,
          userId: p.user_id || p.id,
          publicSellerId: p.public_seller_id,
          username: p.username,
          businessName: p.business_name || "Nursery Partner",
          businessDescription: p.business_description,
          email: p.contact_email || "",
          phone: p.contact_phone,
          address: p.address,
          city: p.city,
          state: p.state,
          postalCode: p.pincode || p.postal_code,
          gstNumber: p.gst_number,
          logoUrl: p.logo_url,
          status,
          onboardingStatus,
          correctionReason,
          role: "seller",
          isActive: isApproved,
          productCount,
        });
      } else {
        setSeller(null);
      }
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
      } else if (!getSellerMobileToken()) {
        setSeller(null);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signIn = async (
    identifier: string,
    pass: string,
  ): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      const res = await api.loginSeller(identifier.trim(), pass);

      if (res.success && res.data) {
        const { token, seller: profile } = res.data;
        if (token) {
          setSellerMobileToken(token);
        }
        await refreshProfile();
        return { success: true };
      }

      const errCode = res.error?.code;
      const errMsg = res.error?.message || "Invalid nursery credentials.";

      if (errCode === "SELLER_UNDER_REVIEW") {
        setStatusMessage("Your seller application is still under review.");
        return { success: false, error: "Your seller application is still under review." };
      }
      if (errCode === "SELLER_NEEDS_CORRECTION") {
        const reason = (res.error as any)?.data?.reason || "Please update your nursery application details.";
        setStatusMessage(`Your application requires correction: ${reason}`);
        return { success: false, error: `Your application requires correction: ${reason}` };
      }
      if (errCode === "SELLER_REJECTED") {
        setStatusMessage("Your seller application was not approved.");
        return { success: false, error: "Your seller application was not approved." };
      }
      if (errCode === "SELLER_SUSPENDED") {
        setStatusMessage("Your seller account is currently unavailable.");
        return { success: false, error: "Your seller account is currently unavailable." };
      }

      return { success: false, error: errMsg };
    } catch (e: any) {
      return { success: false, error: e.message || "Failed to sign in." };
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setSellerMobileToken(null);
      await supabase.auth.signOut();
    } finally {
      setSeller(null);
      setStatusMessage(null);
    }
  };

  const isAuthorizedSeller = Boolean(
    seller &&
    seller.isActive &&
    (seller.status === "approved" || seller.status === "active"),
  );

  return (
    <SellerAuthContext.Provider
      value={{
        seller,
        isAuthenticated: !!seller && isAuthorizedSeller,
        isAuthorizedSeller,
        isLoading,
        statusMessage,
        signIn,
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
