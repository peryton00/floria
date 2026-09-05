// Floria API — Sentry Error Tracking Verification Tests
import { describe, it, expect, vi, beforeEach } from "vitest";

const mockInit = vi.fn();
const mockCaptureException = vi.fn().mockReturnValue("mock-event-id");
const mockCaptureMessage = vi.fn().mockReturnValue("mock-message-id");

vi.mock("@sentry/node", () => ({
  init: (...args: any[]) => mockInit(...args),
  captureException: (...args: any[]) => mockCaptureException(...args),
  captureMessage: (...args: any[]) => mockCaptureMessage(...args),
}));

import {
  initSentry,
  captureExceptionWithTags,
  captureMessageWithTags,
} from "../src/config/sentry.js";

describe("Task 5: Sentry Error Tracking & Tagging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should initialize Sentry when SENTRY_DSN is present", () => {
    process.env.SENTRY_DSN = "https://mockpublickey@o12345.ingest.sentry.io/67890";

    initSentry();

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({
        dsn: "https://mockpublickey@o12345.ingest.sentry.io/67890",
        tracesSampleRate: 0.1,
      })
    );
  });

  it("should correctly capture exceptions with custom tags and extra context", () => {
    process.env.SENTRY_DSN = "https://mockpublickey@o12345.ingest.sentry.io/67890";

    const testError = new Error("Database deadlock");
    captureExceptionWithTags(
      testError,
      { feature: "checkout-rpc", operation: "place_order_atomic" },
      { order_id: "ord-test" }
    );

    expect(mockCaptureException).toHaveBeenCalledWith(
      testError,
      expect.objectContaining({
        tags: {
          feature: "checkout-rpc",
          operation: "place_order_atomic",
        },
        extra: {
          order_id: "ord-test",
        },
      })
    );
  });

  it("should correctly capture messages with custom severity and tags", () => {
    process.env.SENTRY_DSN = "https://mockpublickey@o12345.ingest.sentry.io/67890";

    captureMessageWithTags(
      "Redis rate limit fallback activated",
      "warning",
      { feature: "rate-limit", store: "redis", fallback: "memory" },
      { key: "rl:auth:127.0.0.1" }
    );

    expect(mockCaptureMessage).toHaveBeenCalledWith(
      "Redis rate limit fallback activated",
      expect.objectContaining({
        level: "warning",
        tags: {
          feature: "rate-limit",
          store: "redis",
          fallback: "memory",
        },
        extra: {
          key: "rl:auth:127.0.0.1",
        },
      })
    );
  });
});
