"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.streamNotifications = streamNotifications;
const ioredis_1 = require("ioredis");
const redis_js_1 = require("../config/redis.js");
/**
 * Server-Sent Events (SSE) endpoint for realtime notification delivery.
 * GET /api/v1/notifications/stream
 * Channel-agnostic stream usable by Web EventSource & Native Mobile apps.
 */
async function streamNotifications(req, res) {
    const userId = req.user?.id;
    if (!userId) {
        res.status(401).json({
            success: false,
            error: {
                code: "UNAUTHORIZED",
                message: "Authentication token required for SSE stream",
            },
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
    let subscriber = null;
    let heartbeatTimer = null;
    try {
        subscriber = new ioredis_1.Redis((0, redis_js_1.getRedisOptions)());
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
    }
    catch (err) {
        console.error("[SSE Stream] Redis subscription error:", err?.message);
        res.write(`event: error\ndata: {"message": "Realtime transport degraded"}\n\n`);
    }
    // Cleanup on client disconnect
    req.on("close", async () => {
        if (heartbeatTimer)
            clearInterval(heartbeatTimer);
        if (subscriber) {
            try {
                await subscriber.unsubscribe();
                subscriber.disconnect();
            }
            catch (e) {
                // Ignore disconnect errors
            }
        }
    });
}
