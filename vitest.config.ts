import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    setupFiles: ["./tests/setup.ts"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "."),
      // cf. tests/server-only-stub.ts
      "server-only": path.resolve(__dirname, "tests/server-only-stub.ts"),
    },
  },
});
