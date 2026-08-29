import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from "react";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { makeRedirectUri } from "expo-auth-session";
import { supabase } from "../supabase";
import { api } from "../api";

// Required for expo-auth-session on Android
WebBrowser.maybeCompleteAuthSession();

export interface CustomerUser {
  id: string;
  email?: string;
  fullName?: string;
  phone?: string;
  role: string;
}

export interface CustomerAuthContextType {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, pass: string) => Promise<void>;
  signUp: (email: string, pass: string, fullName: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
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
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      if (isMountedRef.current) setIsLoading(true);
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.user) {
        if (isMountedRef.current) setUser(null);
        return;
      }

      const res = await api.getProfile();

      if (!isMountedRef.current) return;

      if (res.success && res.data) {
        const u = res.data.user || {};
        const p = res.data.profile || {};
        setUser({
          id: u.id || session.user.id,
          email: u.email || session.user.email,
          fullName:
            p.full_name || u.full_name || session.user.user_metadata?.full_name,
          phone: p.phone || u.phone,
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
      if (isMountedRef.current) setUser(null);
    } finally {
      if (isMountedRef.current) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;

    const init = async () => {
      await refreshProfile();
    };

    init();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event: any, session: any) => {
      if (!active) return;
      if (event === "INITIAL_SESSION") {
        return; // Already handled by init()
      }
      if (session?.user) {
        await refreshProfile();
      } else {
        setUser(null);
        setIsLoading(false);
      }
    });

    return () => {
      active = false;
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

  const parseAuthUrl = (urlString: string) => {
    const params: Record<string, string> = {};
    const queryIndex = urlString.indexOf("?");
    const hashIndex = urlString.indexOf("#");

    if (queryIndex !== -1) {
      const queryString =
        hashIndex !== -1 && hashIndex > queryIndex
          ? urlString.substring(queryIndex + 1, hashIndex)
          : urlString.substring(queryIndex + 1);
      new URLSearchParams(queryString).forEach((val, key) => {
        params[key] = val;
      });
    }

    if (hashIndex !== -1) {
      const hashString = urlString.substring(hashIndex + 1);
      new URLSearchParams(hashString).forEach((val, key) => {
        params[key] = val;
      });
    }

    return params;
  };

  const signInWithGoogle = async () => {
    // In Expo Go, Linking.createURL generates exp://.../--/auth/callback
    // In Standalone builds, it generates floria://auth/callback
    const redirectTo =
      Linking.createURL("auth/callback") ||
      makeRedirectUri({ scheme: "floria", path: "auth/callback" });

    console.log("[Floria Auth] Generated OAuth Redirect URI:", redirectTo);

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        skipBrowserRedirect: true,
        queryParams: {
          prompt: "select_account",
          access_type: "offline",
        },
      },
    });
    if (error || !data.url) {
      throw new Error(error?.message || "Google sign-in failed");
    }
    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type === "success" && result.url) {
      const params = parseAuthUrl(result.url);
      if (params.access_token && params.refresh_token) {
        await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });
      } else if (params.code) {
        await supabase.auth.exchangeCodeForSession(params.code);
      }
      await refreshProfile();
    }
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        signIn,
        signUp,
        signInWithGoogle,
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
