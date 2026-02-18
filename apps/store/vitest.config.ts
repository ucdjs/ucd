import { fileURLToPath, URL } from "node:url";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineProject } from "vitest/config";

const configPath = fileURLToPath(new URL("./wrangler.jsonc", import.meta.url));
const globalSetupPath = fileURLToPath(new URL("./test/global-setup.ts", import.meta.url));
const apiDistPath = fileURLToPath(new URL("../api/dist", import.meta.url));

const compatDate = "2025-12-19";

const nodeCompatibilityFlags = [
  "nodejs_compat",
  "enable_nodejs_tty_module",
  "enable_nodejs_fs_module",
  "enable_nodejs_http_modules",
  "enable_nodejs_perf_hooks_module",
];
export default defineProject({
  test: {
    globalSetup: globalSetupPath,
  },
  plugins: [
    cloudflareTest({
      miniflare: {
        cache: false,
        compatibilityDate: compatDate,
        compatibilityFlags: nodeCompatibilityFlags,
        workers: [
          // Configuration for the "auxiliary" Worker under test.
          // Unfortunately, auxiliary Workers cannot load their configuration
          // from `wrangler.toml` files, and must be configured with Miniflare
          // `WorkerOptions`.
          {
            name: "ucdjs-api-testing",
            modules: true,
            // The build script has already built the API Worker to `../api/dist`, so we can point directly to the built script here.
            scriptPath: `${apiDistPath}/index.js`,
            compatibilityDate: compatDate,
            compatibilityFlags: nodeCompatibilityFlags,
          },
        ],
      },
      wrangler: {
        configPath,
        environment: "testing",
      },
    }),
  ],
});
