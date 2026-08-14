// Mock for `server-only` package in vitest test environment.
// The real package throws if imported in a browser/client context.
// In tests we want to exercise the server logic without Next.js runtime.
export {};
