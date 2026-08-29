// Floria — OAuth callback deep-link handler
// This route receives the `floria://auth/callback` redirect from Supabase Google OAuth.
// expo-web-browser's openAuthSessionAsync captures the URL before it opens this screen,
// so this page is only hit in edge cases. It redirects to home.
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
