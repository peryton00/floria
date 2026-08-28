"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { SellerProfile, SellerStatus } from "@floria/types";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export interface SellerContextType {
  sellerProfile: SellerProfile | null;
  sellerStatus: SellerStatus | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isApproved: boolean;
  isPending: boolean;
  isSuspended: boolean;
  isProfileCompleted: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (updates: Partial<SellerProfile>) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const SellerContext = createContext<SellerContextType | undefined>(undefined);

export function SellerProvider({ children }: { children: React.ReactNode }) {
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        const res = await api.getSellerProfile();
        if (res.success && res.data) {
          setSellerProfile(res.data as SellerProfile);
          return;
        }
      }
      setSellerProfile(null);
    } catch (e) {
      console.warn("[SellerContext] refreshProfile error:", e);
      setSellerProfile(null);
    }
  }, []);

  useEffect(() => {
    refreshProfile().then(() => setIsLoading(false));

    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        await refreshProfile();
      } else if (event === "SIGNED_OUT") {
        setSellerProfile(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshProfile]);

  const login = async () => {
    await refreshProfile();
  };

  const logout = async () => {
    const supabase = getSupabaseBrowserClient();
    await supabase.auth.signOut();
    setSellerProfile(null);
  };

  const updateProfile = async (updates: Partial<SellerProfile>) => {
    try {
      const res = await api.updateSellerProfile(updates);
      if (res.success && res.data) {
        setSellerProfile(res.data as SellerProfile);
      }
    } catch (e) {
      console.error("[SellerContext] updateProfile failed:", e);
    }
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
      (sellerProfile.address_line1 || sellerProfile.address) &&
      (sellerProfile.owner_name || sellerProfile.primary_contact_person))
  );

  return (
    <SellerContext.Provider
      value={{
        sellerProfile,
        sellerStatus,
        isLoading,
        isLoggedIn: !!sellerProfile,
        isApproved: sellerStatus === "approved",
        isPending: sellerStatus === "pending",
        isSuspended: sellerStatus === "suspended",
        isProfileCompleted,
        login,
        logout,
        updateProfile,
        refreshProfile,
      }}
    >
      {children}
    </SellerContext.Provider>
  );
}


export function useSeller(): SellerContextType {
  const context = useContext(SellerContext);
  if (!context) {
    throw new Error("useSeller must be used within a SellerProvider");
  }
  return context;
}
