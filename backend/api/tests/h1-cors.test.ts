// Floria API — H1 CORS Origin Security Test Suite
import { describe, it, expect, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../src/app.js";

describe("H1: CORS Origin Security Allowlist", () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  it("allows legitimate Floria web customer frontend origin with credentials", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://floriaa-web.vercel.app")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe("https://floriaa-web.vercel.app");
    expect(res.headers["access-control-allow-credentials"]).toBe("true");
  });

  it("allows legitimate Floria seller web frontend origin", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://floria-seller-web.vercel.app")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe("https://floria-seller-web.vercel.app");
  });

  it("allows legitimate Floria admin web frontend origin", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://floria-admin-web.vercel.app")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe("https://floria-admin-web.vercel.app");
  });

  it("allows scoped Floria preview deployment subdomains", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://floria-web-git-feat-preview.vercel.app")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBe("https://floria-web-git-feat-preview.vercel.app");
  });

  it("strictly rejects arbitrary third-party .vercel.app origins", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://malicious-crypto-drainer.vercel.app")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });

  it("strictly rejects arbitrary third-party .onrender.com origins", async () => {
    const res = await request(app)
      .options("/health")
      .set("Origin", "https://evil-phishing-app.onrender.com")
      .set("Access-Control-Request-Method", "GET");

    expect(res.headers["access-control-allow-origin"]).toBeUndefined();
  });
});
