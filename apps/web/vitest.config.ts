import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/__tests__/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    exclude: ["src/**/*.e2e.test.{ts,tsx}", "node_modules"],
    coverage: {
      reporter: ["text", "lcov"],
      exclude: ["node_modules", "src/__tests__/setup.ts"],
    },
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
      // Mock server-only in tests — it's a no-op outside Next.js server context
      "server-only": resolve(__dirname, "./src/__tests__/__mocks__/server-only.ts"),
    },
  },
});
