// Floria Delivery Mobile — OAuth callback deep-link handler
// Receives floria-delivery://auth/callback from Supabase Google OAuth.
import { useEffect } from "react";
import { useRouter, useLocalSearchParams } from "expo-router";
import { supabase } from "../../lib/supabase";

export default function AuthCallbackScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ code?: string; access_token?: string; refresh_token?: string }>();

  useEffect(() => {
    (async () => {
      try {
        if (params.access_token && params.refresh_token) {
          await supabase.auth.setSession({
            access_token: params.access_token,
            refresh_token: params.refresh_token,
          });
        } else if (params.code) {
          await supabase.auth.exchangeCodeForSession(params.code);
        }
      } catch {
        // Session already handled by openAuthSessionAsync
      } finally {
        router.replace("/(tabs)" as any);
      }
    })();
  }, []);

  return null;
}
