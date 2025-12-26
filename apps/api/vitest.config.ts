import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineProject } from "vitest/config";

const appRoot = new URL(".", import.meta.url).pathname;

export default defineProject({
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
        configPath: `${appRoot}/wrangler.jsonc`,
        environment: "testing",
      },
    }),
  ],
});
