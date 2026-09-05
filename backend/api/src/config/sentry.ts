// Floria API — Sentry Production Error Tracking & Performance Monitoring Configuration
import * as Sentry from "@sentry/node";

let isSentryInitialized = false;

export function initSentry(): void {
  if (isSentryInitialized) return;

  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    if (process.env.NODE_ENV === "production") {
      console.warn("[Sentry] SENTRY_DSN is not configured. Error tracking disabled.");
    }
    return;
  }

  try {
    Sentry.init({
      dsn,
      environment: process.env.NODE_ENV || "development",
      // Conservative sample rate to stay well within free tier event quota
      tracesSampleRate: 0.1,
      integrations: [],
    });
    isSentryInitialized = true;
    console.info("[Sentry] Sentry error tracking initialized for Floria API.");
  } catch (err: any) {
    console.warn(`[Sentry] Initialization notice: ${err?.message}`);
  }
}

export function captureExceptionWithTags(
  error: any,
  tags: Record<string, string | number | boolean | undefined> = {},
  extra: Record<string, any> = {},
): string | undefined {
  if (!process.env.SENTRY_DSN) return undefined;
  try {
    return Sentry.captureException(error, {
      tags: Object.fromEntries(
        Object.entries(tags).filter(([_, v]) => v !== undefined)
      ) as Record<string, string>,
      extra,
    });
  } catch (err) {
    console.warn("[Sentry] Failed to capture exception:", err);
    return undefined;
  }
}

export function captureMessageWithTags(
  message: string,
  level: Sentry.SeverityLevel = "warning",
  tags: Record<string, string | number | boolean | undefined> = {},
  extra: Record<string, any> = {},
): string | undefined {
  if (!process.env.SENTRY_DSN) return undefined;
  try {
    return Sentry.captureMessage(message, {
      level,
      tags: Object.fromEntries(
        Object.entries(tags).filter(([_, v]) => v !== undefined)
      ) as Record<string, string>,
      extra,
    });
  } catch (err) {
    console.warn("[Sentry] Failed to capture message:", err);
    return undefined;
  }
}

export { Sentry };
