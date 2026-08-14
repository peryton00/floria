"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { AddressItem } from "@/components/ui/AddressModal";
import { api } from "@/lib/api";
import { getSupabaseBrowserClient } from "@/lib/supabase/browser";

export interface UserProfile {
  name: string;
  email: string;
  phone: string;
  role?: string;
  avatarUrl?: string;
}

const EMPTY_PROFILE: UserProfile = {
  name: "",
  email: "",
  phone: "",
  role: "customer",
};

const EMPTY_ADDRESSES: AddressItem[] = [];

interface CustomerContextType {
  profile: UserProfile;
  updateProfile: (newProfile: UserProfile) => Promise<void> | void;
  addresses: AddressItem[];
  saveAddress: (address: AddressItem) => Promise<void> | void;
  deleteAddress: (id: string) => Promise<void> | void;
  setDefaultAddress: (id: string) => Promise<void> | void;
  getDefaultAddress: () => AddressItem | undefined;
  refreshCustomerData: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const CustomerContext = createContext<CustomerContextType | undefined>(undefined);

export function CustomerProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile>(EMPTY_PROFILE);
  const [addresses, setAddresses] = useState<AddressItem[]>(EMPTY_ADDRESSES);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const refreshCustomerData = useCallback(async () => {
    try {
      setIsLoading(true);
      const supabase = getSupabaseBrowserClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (session?.user) {
        setIsAuthenticated(true);
        const [profRes, addrRes] = await Promise.all([
          api.getProfile().catch(() => ({ success: false, data: null })),
          api.getAddresses().catch(() => ({ success: false, data: [] })),
        ]);

        if (profRes.success && profRes.data) {
          const u = profRes.data.user || {};
          const p = profRes.data.profile || {};
          setProfile({
            name: p.full_name || u.user_metadata?.full_name || u.user_metadata?.name || u.email?.split("@")[0] || "Customer Account",
            email: u.email || "",
            phone: p.phone || "",
            role: p.role || u.user_metadata?.role || "customer",
            avatarUrl: p.avatar_url || undefined,
          });
        } else {
          setProfile({
            name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || session.user.email?.split("@")[0] || "Customer Account",
            email: session.user.email || "",
            phone: session.user.user_metadata?.phone || "",
            role: session.user.user_metadata?.role || "customer",
          });
        }

        if (addrRes.success && addrRes.data && Array.isArray(addrRes.data)) {
          const mapped: AddressItem[] = addrRes.data.map((a: any) => ({
            id: a.id,
            full_name: a.full_name,
            phone: a.phone,
            line1: a.line1,
            line2: a.line2 || undefined,
            city: a.city,
            state: a.state,
            pincode: a.pincode,
            instructions: a.label || undefined,
            is_default: a.is_default,
          }));
          setAddresses(mapped);
        } else {
          setAddresses([]);
        }
        return;
      } else {
        setIsAuthenticated(false);
        setProfile(EMPTY_PROFILE);
        setAddresses([]);
      }
    } catch (err) {
      console.error("[CustomerContext] Error fetching profile/addresses:", err);
      setIsAuthenticated(false);
      setProfile(EMPTY_PROFILE);
      setAddresses([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCustomerData();

    const supabase = getSupabaseBrowserClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if ((event === "SIGNED_IN" || event === "TOKEN_REFRESHED") && session?.user) {
        await refreshCustomerData();
      } else if (event === "SIGNED_OUT") {
        setIsAuthenticated(false);
        setProfile(EMPTY_PROFILE);
        setAddresses([]);
        setIsLoading(false);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [refreshCustomerData]);

  const updateProfile = async (newProfile: UserProfile) => {
    setProfile(newProfile);
    if (isAuthenticated) {
      const res = await api.updateProfile({
        name: newProfile.name,
        full_name: newProfile.name,
        phone: newProfile.phone,
      });
      if (res.success) {
        await refreshCustomerData();
      }
    }
  };

  const saveAddress = async (addr: AddressItem) => {
    if (isAuthenticated) {
      const payload = {
        full_name: addr.full_name,
        phone: addr.phone,
        line1: addr.line1,
        line2: addr.line2,
        city: addr.city,
        state: addr.state,
        pincode: addr.pincode,
        label: addr.instructions,
        is_default: addr.is_default,
      };

      const isExisting = addr.id && !addr.id.startsWith("addr_");
      const res = isExisting
        ? await api.updateAddress(addr.id, payload)
        : await api.createAddress(payload);

      if (res.success) {
        await refreshCustomerData();
        return;
      } else {
        console.error("[CustomerContext.saveAddress] API call failed:", res.error);
      }
    }

    let updated: AddressItem[];
    if (addr.is_default) {
      updated = addresses.map((a) => ({ ...a, is_default: false }));
    } else {
      updated = [...addresses];
    }

    const idx = updated.findIndex((a) => a.id === addr.id);
    if (idx >= 0) {
      updated[idx] = addr;
    } else {
      updated.push(addr);
    }

    setAddresses(updated);
  };

  const deleteAddress = async (id: string) => {
    if (isAuthenticated) {
      const res = await api.deleteAddress(id);
      if (res.success) {
        await refreshCustomerData();
        return;
      }
    }

    const updated = addresses.filter((a) => a.id !== id);
    setAddresses(updated);
  };

  const setDefaultAddress = async (id: string) => {
    if (isAuthenticated) {
      const res = await api.setDefaultAddress(id);
      if (res.success) {
        await refreshCustomerData();
        return;
      }
    }

    const updated = addresses.map((a) => ({
      ...a,
      is_default: a.id === id,
    }));
    setAddresses(updated);
  };

  const getDefaultAddress = () => {
    return addresses.find((a) => a.is_default) ?? addresses[0];
  };

  return (
    <CustomerContext.Provider
      value={{
        profile,
        updateProfile,
        addresses,
        saveAddress,
        deleteAddress,
        setDefaultAddress,
        getDefaultAddress,
        refreshCustomerData,
        isAuthenticated,
        isLoading,
      }}
    >
      {children}
    </CustomerContext.Provider>
  );
}

export function useCustomer() {
  const context = useContext(CustomerContext);
  if (!context) {
    throw new Error("useCustomer must be used within a CustomerProvider");
  }
  return context;
}
