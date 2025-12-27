import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineProject } from "vitest/config";

const appRoot = new URL(".", import.meta.url).pathname;

export default defineProject({
  plugins: [
    cloudflareTest({
      miniflare: {
        cache: false,
        compatibilityFlags: [
          "nodejs_compat",
          "enable_nodejs_tty_module",
          "enable_nodejs_fs_module",
          "enable_nodejs_http_modules",
          "enable_nodejs_perf_hooks_module",
        ],
      },
      wrangler: {
        configPath: `${appRoot}/wrangler.jsonc`,
        environment: "testing",
      },
    }),
  ],
});
