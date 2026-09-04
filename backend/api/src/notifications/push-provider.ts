// Floria API — Push Notification Dispatch Engine (P1 Native Push)
import { deviceTokenRepository } from "../database/repositories/device-token.repository.js";

export interface PushNotificationMessage {
  to: string;
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: string;
  channelId?: string;
  priority?: "default" | "normal" | "high";
}

export class PushNotificationProvider {
  private readonly EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";
  private readonly DEFAULT_CHANNEL = "floria-delivery-dispatch";

  /**
   * Dispatch push notification to all active devices registered to a user or delivery partner.
   */
  async sendToUser(
    userId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<{ sent: number; failed: number }> {
    try {
      const tokens = await deviceTokenRepository.findActiveTokensByUserId(userId);
      if (!tokens.length) {
        return { sent: 0, failed: 0 };
      }

      const messages: PushNotificationMessage[] = tokens.map((t) => ({
        to: t.token,
        title,
        body,
        data: data || {},
        sound: "default",
        channelId: this.DEFAULT_CHANNEL,
        priority: "high",
      }));

      return await this.dispatchBatch(messages);
    } catch (err: any) {
      console.warn(`[PushProvider] sendToUser failed for user '${userId}':`, err.message);
      return { sent: 0, failed: 1 };
    }
  }

  /**
   * Dispatch push notification specifically to a delivery partner by partnerId.
   */
  async sendToPartner(
    partnerId: string,
    title: string,
    body: string,
    data?: Record<string, any>,
  ): Promise<{ sent: number; failed: number }> {
    try {
      const tokens = await deviceTokenRepository.findActiveTokensByPartnerId(partnerId);
      if (!tokens.length) {
        return { sent: 0, failed: 0 };
      }

      const messages: PushNotificationMessage[] = tokens.map((t) => ({
        to: t.token,
        title,
        body,
        data: data || {},
        sound: "default",
        channelId: this.DEFAULT_CHANNEL,
        priority: "high",
      }));

      return await this.dispatchBatch(messages);
    } catch (err: any) {
      console.warn(`[PushProvider] sendToPartner failed for partner '${partnerId}':`, err.message);
      return { sent: 0, failed: 1 };
    }
  }

  /**
   * Dispatches a batch of push messages to Expo Push API / FCM / APNs.
   */
  private async dispatchBatch(
    messages: PushNotificationMessage[],
  ): Promise<{ sent: number; failed: number }> {
    if (!messages.length) return { sent: 0, failed: 0 };

    let sent = 0;
    let failed = 0;

    try {
      // In production or test environment with network connectivity
      const response = await fetch(this.EXPO_PUSH_URL, {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Accept-Encoding": "gzip, deflate",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(messages),
      });

      if (!response.ok) {
        console.warn(`[PushProvider] Push gateway returned HTTP ${response.status}`);
        return { sent: 0, failed: messages.length };
      }

      const result = await response.json();
      const receipts = result.data || [];

      for (let i = 0; i < receipts.length; i++) {
        const receipt = receipts[i];
        if (receipt.status === "ok") {
          sent++;
        } else {
          failed++;
          const errorDetails = receipt.details?.error;
          if (
            errorDetails === "DeviceNotRegistered" ||
            errorDetails === "InvalidCredentials"
          ) {
            // Automatically clean up stale or unregistered token
            const badToken = messages[i]?.to;
            if (badToken) {
              await deviceTokenRepository.deactivateToken(badToken);
              console.info(`[PushProvider] Deactivated unregistered device token: ${badToken.slice(0, 12)}...`);
            }
          }
        }
      }
    } catch (netErr: any) {
      // Graceful degradation when offline or simulated
      console.warn("[PushProvider] Push dispatch network error:", netErr.message);
      failed = messages.length;
    }

    return { sent, failed };
  }
}

export const pushNotificationProvider = new PushNotificationProvider();
