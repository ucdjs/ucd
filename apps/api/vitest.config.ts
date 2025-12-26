import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineProject } from "vitest/config";
import { aliases } from "../../vitest.aliases";

export default defineProject({
  test: {
    name: "api",
    dir: `./apps/api/test`,
    setupFiles: ["./test/__setup.ts"],
    include: [
      "**/*.{test,spec}.?(c|m)[jt]s?(x)",
    ],
  },
  plugins: [
    cloudflareTest({
      miniflare: {
        compatibilityFlags: ["nodejs_compat"],
        bindings: {
          ENVIRONMENT: "production",
          USE_SVC_BINDING: "false",
        },
      },
      wrangler: {
        configPath: "./wrangler.jsonc",
        environment: "testing",
      },
    }),
  ],
  resolve: {
    alias: aliases,
  },
});
