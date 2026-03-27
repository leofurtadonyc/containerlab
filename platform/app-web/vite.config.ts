import { tmpdir } from "node:os";
import { join } from "node:path";

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

/** Writable in sandboxed/agent environments where `node_modules/.vite` may not be. */
const cacheDir = join(tmpdir(), "vite-cache-platform-app-web");

export default defineConfig({
  cacheDir,
  plugins: [react()],
  test: {
    environment: "jsdom",
    include: ["tests/**/*.test.{ts,tsx}"],
    setupFiles: ["tests/setup.ts"],
  },
  server: {
    host: "0.0.0.0",
    port: 8088,
    proxy: {
      "/api": {
        target: process.env.VITE_DEV_API_PROXY_TARGET ?? "http://app-api:8000",
        changeOrigin: true,
        // Match nginx proxy_read_timeout / verify-core CURL_HTTP_MAX_TIME for slow app-api
        // responses so local dev does not fail with 504 while production is fixed.
        timeout: 120_000,
        proxyTimeout: 120_000,
      },
    },
  },
});
