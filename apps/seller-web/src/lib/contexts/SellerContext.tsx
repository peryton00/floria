"use client";

import React, { createContext, useContext } from "react";
import type { SellerProfile, SellerStatus } from "@floria/types";
import { api } from "@/lib/api";
import { useSellerAuth } from "./SellerAuthContext";

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
  const auth = useSellerAuth();

  const updateProfile = async (updates: Partial<SellerProfile>) => {
    try {
      const res = await api.updateSellerProfile(updates);
      if (res.success && res.data) {
        await auth.refreshProfile();
      }
    } catch (e) {
      console.error("[SellerContext] updateProfile failed:", e);
    }
  };

  const isProfileCompleted = Boolean(
    auth.sellerProfile?.is_profile_completed ||
    (auth.sellerProfile &&
      auth.sellerProfile.business_name &&
      auth.sellerProfile.business_name !== "New Nursery" &&
      auth.sellerProfile.business_name !== "Nursery Partner" &&
      auth.sellerProfile.contact_phone &&
      auth.sellerProfile.contact_email &&
      (auth.sellerProfile.address_line1 || auth.sellerProfile.address) &&
      (auth.sellerProfile.owner_name || auth.sellerProfile.primary_contact_person))
  );

  return (
    <SellerContext.Provider
      value={{
        sellerProfile: auth.sellerProfile,
        sellerStatus: auth.sellerStatus,
        isLoading: auth.isLoading,
        isLoggedIn: auth.isAuthenticated,
        isApproved: auth.isApproved,
        isPending: auth.isPending,
        isSuspended: auth.isSuspended,
        isProfileCompleted,
        login: async () => {
          await auth.refreshProfile();
        },
        logout: async () => {
          await auth.signOut();
        },
        updateProfile,
        refreshProfile: auth.refreshProfile,
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
