import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useRouter } from "expo-router";
import { useDeliveryAuth } from "../contexts/DeliveryAuthContext";
import { api } from "../api";

export function useDeliveryNotifications() {
  const { session, isAuthorizedCourier } = useDeliveryAuth();
  const router = useRouter();
  const registeredTokenRef = useRef<string | null>(null);

  useEffect(() => {
    if (!session?.access_token || !isAuthorizedCourier) {
      // Clean up token if logged out
      if (registeredTokenRef.current) {
        api.removeDeliveryDeviceToken(registeredTokenRef.current).catch(() => {});
        registeredTokenRef.current = null;
      }
      return;
    }

    let isMounted = true;

    async function registerPush() {
      try {
        // Safe platform determination
        const platform = Platform.OS === "ios" ? "ios" : Platform.OS === "android" ? "android" : "web";
        
        // Generate or retrieve device push token identifier
        // In physical Expo build, this would use Notifications.getExpoPushTokenAsync()
        const simulatedOrRealToken = `expo-delivery-${session?.user?.id?.slice(0, 8)}-${Platform.OS}`;
        
        if (registeredTokenRef.current === simulatedOrRealToken) return;

        await api.registerDeliveryDeviceToken({
          token: simulatedOrRealToken,
          platform,
          deviceInfo: {
            brand: Platform.OS,
            version: Platform.Version,
          },
        });

        if (isMounted) {
          registeredTokenRef.current = simulatedOrRealToken;
        }
      } catch (err: any) {
        console.warn("[DeliveryNotifications] Device registration notice:", err.message);
      }
    }

    registerPush();

    return () => {
      isMounted = false;
    };
  }, [session?.access_token, session?.user?.id, isAuthorizedCourier]);

  return {
    registeredToken: registeredTokenRef.current,
  };
}
