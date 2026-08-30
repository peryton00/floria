"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import type { SellerProfile, SellerStatus } from "@floria/types";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export type AuthState =
  | "INITIALIZING"
  | "AUTHENTICATED"
  | "UNAUTHENTICATED"
  | "SESSION_EXPIRED"
  | "UNDER_REVIEW"
  | "NEEDS_CORRECTION"
  | "REJECTED"
  | "SUSPENDED"
  | "ERROR";

export interface SellerAuthContextType {
  sellerProfile: SellerProfile | null;
  sellerStatus: SellerStatus | null;
  authState: AuthState;
  statusMessage: string | null;
  correctionReason: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  isPending: boolean;
  isSuspended: boolean;
  isProfileCompleted: boolean;
  signIn: (identifier: string, pass: string) => Promise<{ success: boolean; error?: string }>;
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
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [sellerStatus, setSellerStatus] = useState<SellerStatus | null>(null);
  const [authState, setAuthState] = useState<AuthState>("INITIALIZING");
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = typeof window !== "undefined" ? localStorage.getItem("floria_seller_token") : null;
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!token && !session?.user) {
        setSellerProfile(null);
        setSellerStatus(null);
        setAuthState("UNAUTHENTICATED");
        return;
      }

      const res = await api.getSellerProfile();
      if (res.success && res.data) {
        const profile = res.data as SellerProfile;
        setSellerProfile(profile);
        setSellerStatus(profile.status);

        if (profile.status === "approved" || profile.status === "active") {
          setAuthState("AUTHENTICATED");
        } else if (profile.status === "under_review" || profile.status === "pending" || profile.status === "application_submitted") {
          setAuthState("UNDER_REVIEW");
          setStatusMessage("Your seller application is still under review.");
        } else if (profile.status === "needs_correction") {
          setAuthState("NEEDS_CORRECTION");
          setStatusMessage("Your application requires correction.");
        } else if (profile.status === "rejected") {
          setAuthState("REJECTED");
          setStatusMessage("Your seller application was not approved.");
        } else if (profile.status === "suspended" || profile.status === "deactivated") {
          setAuthState("SUSPENDED");
          setStatusMessage("Your seller account is currently unavailable.");
        } else {
          setAuthState("AUTHENTICATED");
        }
      } else if (res.error?.code === "AUTH_REQUIRED") {
        setSellerProfile(null);
        setSellerStatus(null);
        setAuthState("SESSION_EXPIRED");
        if (typeof window !== "undefined") localStorage.removeItem("floria_seller_token");
      } else {
        setSellerProfile(null);
        setAuthState("UNAUTHENTICATED");
      }
    } catch {
      setSellerProfile(null);
      setAuthState("ERROR");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshProfile();

    const supabase = getSupabaseBrowserClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        await refreshProfile();
      } else if (event === "SIGNED_OUT") {
        if (typeof window !== "undefined") localStorage.removeItem("floria_seller_token");
        setSellerProfile(null);
        setSellerStatus(null);
        setAuthState("UNAUTHENTICATED");
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signIn = async (identifier: string, pass: string): Promise<{ success: boolean; error?: string }> => {
    setIsLoading(true);
    setStatusMessage(null);
    setCorrectionReason(null);

    try {
      const res = await api.loginSeller(identifier.trim(), pass);

      if (res.success && res.data) {
        const { token, seller } = res.data;
        if (typeof window !== "undefined" && token) {
          localStorage.setItem("floria_seller_token", token);
        }
        setSellerProfile(seller);
        setSellerStatus(seller.status);
        setAuthState("AUTHENTICATED");
        return { success: true };
      }

      // Handle specific account status errors
      const errCode = res.error?.code;
      const errMsg = res.error?.message || "Invalid nursery credentials.";

      if (errCode === "SELLER_UNDER_REVIEW") {
        setAuthState("UNDER_REVIEW");
        setStatusMessage("Your seller application is still under review.");
        return { success: false, error: "Your seller application is still under review." };
      }
      if (errCode === "SELLER_NEEDS_CORRECTION") {
        setAuthState("NEEDS_CORRECTION");
        const reason = (res.error as any)?.data?.reason || "Please update your nursery application details.";
        setCorrectionReason(reason);
        setStatusMessage(`Your application requires correction: ${reason}`);
        return { success: false, error: `Your application requires correction: ${reason}` };
      }
      if (errCode === "SELLER_REJECTED") {
        setAuthState("REJECTED");
        setStatusMessage("Your seller application was not approved.");
        return { success: false, error: "Your seller application was not approved." };
      }
      if (errCode === "SELLER_SUSPENDED") {
        setAuthState("SUSPENDED");
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
    if (typeof window !== "undefined") {
      localStorage.removeItem("floria_seller_token");
    }
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setSellerProfile(null);
    setSellerStatus(null);
    setAuthState("UNAUTHENTICATED");
  };

  const isApproved = sellerStatus === "approved" || sellerStatus === "active";
  const isPending =
    sellerStatus === "pending" ||
    sellerStatus === "under_review" ||
    sellerStatus === "application_submitted";
  const isSuspended = sellerStatus === "suspended" || sellerStatus === "deactivated";

  const isProfileCompleted = Boolean(
    sellerProfile?.is_profile_completed ||
    (sellerProfile &&
      sellerProfile.business_name &&
      sellerProfile.business_name !== "New Nursery" &&
      sellerProfile.business_name !== "Nursery Partner" &&
      sellerProfile.contact_phone &&
      sellerProfile.contact_email &&
      (sellerProfile.address_line1 || sellerProfile.address)),
  );

  return (
    <SellerAuthContext.Provider
      value={{
        sellerProfile,
        sellerStatus,
        authState,
        statusMessage,
        correctionReason,
        isLoading,
        isAuthenticated: authState === "AUTHENTICATED" && isApproved,
        isApproved,
        isPending,
        isSuspended,
        isProfileCompleted,
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

