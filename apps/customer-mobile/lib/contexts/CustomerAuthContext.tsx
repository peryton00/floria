import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { supabase } from "../supabase";
import { api } from "../api";

export interface CustomerUser {
  id: string;
  email?: string;
  fullName?: string;
  role: string;
}

export interface CustomerAuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, fullName: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(
  undefined,
);

export function CustomerAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    try {
      setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        setUser(null);
        return;
      }

      const res = await api.getProfile();

      if (res.success && res.data) {
        const u = res.data.user || {};
        const p = res.data.profile || {};
        setUser({
          id: u.id || session.user.id,
          email: u.email || session.user.email,
          fullName:
            p.full_name || u.full_name || session.user.user_metadata?.full_name,
          role: p.role || u.role || "customer",
        });
      } else {
        setUser({
          id: session.user.id,
          email: session.user.email,
          fullName: session.user.user_metadata?.full_name,
          role: "customer",
        });
      }
    } catch {
      setUser(null);
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
        setUser(null);
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
        throw new Error(error?.message || "Invalid credentials");
      }
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const signUp = async (email: string, pass: string, fullName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: pass,
        options: {
          data: { full_name: fullName.trim() },
        },
      });
      if (error || !data.user) {
        throw new Error(error?.message || "Failed to register account");
      }
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signOut,
        refreshProfile,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth(): CustomerAuthContextType {
  const context = useContext(CustomerAuthContext);
  if (!context) {
    throw new Error(
      "useCustomerAuth must be used within a CustomerAuthProvider",
    );
  }
  return context;
}
