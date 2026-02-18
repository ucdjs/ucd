import { fileURLToPath, URL } from "node:url";
import { cloudflareTest } from "@cloudflare/vitest-pool-workers";
import { defineProject } from "vitest/config";

const configPath = fileURLToPath(new URL("./wrangler.jsonc", import.meta.url));
const globalSetupPath = fileURLToPath(new URL("./test/global-setup.ts", import.meta.url));
const apiDistPath = fileURLToPath(new URL("../api/dist", import.meta.url));

export default defineProject({
  test: {
    globalSetup: globalSetupPath,
  },
  plugins: [
    cloudflareTest({
      miniflare: {
        cache: false,
        compatibilityDate: "2025-12-19",
        compatibilityFlags: [
          "nodejs_compat",
          "enable_nodejs_tty_module",
          "enable_nodejs_fs_module",
          "enable_nodejs_http_modules",
          "enable_nodejs_perf_hooks_module",
        ],
        workers: [
          // Configuration for the "auxiliary" Worker under test.
          // Unfortunately, auxiliary Workers cannot load their configuration
          // from `wrangler.toml` files, and must be configured with Miniflare
          // `WorkerOptions`.
          {
            name: "ucdjs-api-testing",
            modules: true,
            scriptPath: `${apiDistPath}/index.js`, // Built by `global-setup.ts`
            compatibilityDate: "2025-12-19",
            compatibilityFlags: [
              "nodejs_compat",
              "enable_nodejs_tty_module",
              "enable_nodejs_fs_module",
              "enable_nodejs_http_modules",
              "enable_nodejs_perf_hooks_module",
            ],
            vars: {
              ENVIRONMENT: "testing",
              API_VERSION: "x.y.z",
            },
            version_metadata: {
              binding: "CF_VERSION_METADATA",
            },
            secrets_store_secrets: [
              {
                binding: "UCDJS_TASK_API_KEY",
                secret_name: "UCDJS_TASK_API_KEY",
                store_id: "673d2913c9314d48a64b6d9e1894ed12",
              },
            ],
            r2_buckets: [
              {
                binding: "UCD_BUCKET",
                bucket_name: "ucdjs-data-preview",
              },
            ],
            unsafe: {
              bindings: [
                {
                  name: "RATE_LIMITER",
                  type: "ratelimit",
                  namespace_id: "1001",
                  simple: {
                    limit: 2000,
                    period: 60,
                  },
                },
              ],
            },
            limits: {
              cpu_ms: 300000,
            },
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
