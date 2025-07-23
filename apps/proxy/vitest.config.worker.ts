import { defineWorkersProject } from "@cloudflare/vitest-pool-workers/config";
import { defaultExclude } from "vitest/config";

export default defineWorkersProject({
  test: {
    name: "proxy:worker",
    exclude: [
      ...defaultExclude,
      "test/unit/**",
    ],
    include: [
      "./test/worker/**/*.{test,spec}.?(c|m)[jt]s?(x)",
    ],
    poolOptions: {
      workers: {
        singleWorker: true,
        isolatedStorage: true,
        miniflare: {
          compatibilityFlags: ["nodejs_compat"],
          bindings: {
            ENVIRONMENT: "production",
          },
        },
        wrangler: {
          configPath: "./wrangler.jsonc",
        },
      },
    },
  },
});
