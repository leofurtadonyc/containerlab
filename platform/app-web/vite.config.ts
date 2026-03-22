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
      },
    },
  },
});
