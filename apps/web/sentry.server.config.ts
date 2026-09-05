// Floria Web App — Sentry Server Configuration
import * as Sentry from "@sentry/nextjs";

const SENTRY_DSN =
  process.env.SENTRY_DSN_WEB ||
  process.env.NEXT_PUBLIC_SENTRY_DSN ||
  process.env.SENTRY_DSN;

if (SENTRY_DSN) {
  Sentry.init({
    dsn: SENTRY_DSN,
    // Conservative 10% sample rate for free tier quota preservation
    tracesSampleRate: 0.1,
    environment: process.env.NODE_ENV || "development",
    debug: false,
  });
}
