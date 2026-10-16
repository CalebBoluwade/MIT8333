import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  test: {
    environment: "jsdom",
    setupFiles: "./tests/setup.ts",
    globalSetup: "./tests/global-setup.ts",
    env: { TURSO_DATABASE_URL: "file:./test.db" },
    fileParallelism: false,
  },
});
