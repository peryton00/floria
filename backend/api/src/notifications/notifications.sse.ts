// Floria API — Realtime Notification SSE Stream Transport
import { Request, Response } from "express";
import { Redis } from "ioredis";
import { getRedisOptions } from "../config/redis.js";

/**
 * Server-Sent Events (SSE) endpoint for realtime notification delivery.
 * GET /api/v1/notifications/stream
 * Channel-agnostic stream usable by Web EventSource & Native Mobile apps.
 */
export async function streamNotifications(req: Request, res: Response) {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({
      success: false,
      error: { code: "UNAUTHORIZED", message: "Authentication token required for SSE stream" },
    });
    return;
  }

  // Set SSE Headers
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });

  // Initial comment ping
  res.write(`: floria realtime notification stream connected\n\n`);

  let subscriber: Redis | null = null;
  let heartbeatTimer: NodeJS.Timeout | null = null;

  try {
    subscriber = new Redis(getRedisOptions());
    const channel = `floria:notifications:${userId}`;

    await subscriber.subscribe(channel);

    subscriber.on("message", (subscribedChannel, message) => {
      if (subscribedChannel === channel) {
        res.write(`event: notification.created\ndata: ${message}\n\n`);
      }
    });

    // Periodic heartbeat every 15s to keep connection alive through proxies
    heartbeatTimer = setInterval(() => {
      res.write(`: ping\n\n`);
    }, 15000);

  } catch (err: any) {
    console.error("[SSE Stream] Redis subscription error:", err?.message);
    res.write(`event: error\ndata: {"message": "Realtime transport degraded"}\n\n`);
  }

  // Cleanup on client disconnect
  req.on("close", async () => {
    if (heartbeatTimer) clearInterval(heartbeatTimer);
    if (subscriber) {
      try {
        await subscriber.unsubscribe();
        subscriber.disconnect();
      } catch (e) {
        // Ignore disconnect errors
      }
    }
  });
}
