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
  | "ERROR";

export interface SellerAuthContextType {
  sellerProfile: SellerProfile | null;
  sellerStatus: SellerStatus | null;
  authState: AuthState;
  isLoading: boolean;
  isAuthenticated: boolean;
  isApproved: boolean;
  isPending: boolean;
  isSuspended: boolean;
  isProfileCompleted: boolean;
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
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(
    null,
  );
  const [authState, setAuthState] = useState<AuthState>("INITIALIZING");
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.user) {
        setSellerProfile(null);
        setAuthState("UNAUTHENTICATED");
        return;
      }

      const res = await api.getSellerProfile();
      if (res.success && res.data) {
        setSellerProfile(res.data as SellerProfile);
        setAuthState("AUTHENTICATED");
      } else if (res.error?.code === "AUTH_REQUIRED") {
        setSellerProfile(null);
        setAuthState("SESSION_EXPIRED");
      } else if (res.error?.code === "FORBIDDEN") {
        // Authenticated user is not a seller (e.g. customer identity)
        setSellerProfile(null);
        setAuthState("AUTHENTICATED");
      } else {
        setSellerProfile(null);
        setAuthState("AUTHENTICATED");
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
      if (
        (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") &&
        session?.user
      ) {
        await refreshProfile();
      } else if (event === "SIGNED_OUT") {
        setSellerProfile(null);
        setAuthState("UNAUTHENTICATED");
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const signOut = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setSellerProfile(null);
    setAuthState("UNAUTHENTICATED");
  };

  const sellerStatus = sellerProfile?.status ?? null;

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
        isLoading,
        isAuthenticated: authState === "AUTHENTICATED" && !!sellerProfile,
        isApproved: sellerStatus === "approved",
        isPending: sellerStatus === "pending",
        isSuspended: sellerStatus === "suspended",
        isProfileCompleted,
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
