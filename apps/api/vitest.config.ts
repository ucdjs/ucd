import { fileURLToPath, URL } from "node:url";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineProject } from "vitest/config";

const configPath = fileURLToPath(new URL("./wrangler.jsonc", import.meta.url));

export default defineProject({
  plugins: [
    cloudflareTest({
      miniflare: {
        cache: false,
        compatibilityDate: "2026-02-18",
        compatibilityFlags: [
          "nodejs_compat",
          "enable_nodejs_tty_module",
          "enable_nodejs_fs_module",
          "enable_nodejs_http_modules",
          "enable_nodejs_perf_hooks_module",
        ],
      },
      wrangler: {
        configPath,
        environment: "testing",
      },
    }),
  ],
});
