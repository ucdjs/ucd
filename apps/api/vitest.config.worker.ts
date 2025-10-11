import { defineWorkersProject } from "@cloudflare/vitest-pool-workers/config";
import { defaultExclude } from "vitest/config";
import { aliases } from "../../vitest.aliases";

export default defineWorkersProject({
  test: {
    name: "api:worker",
    setupFiles: ["./test/__setup.ts"],
    exclude: [
      ...defaultExclude,
      "test/unit/**",
    ],
    include: [
      "./test/**/*.{test,spec}.?(c|m)[jt]s?(x)",
    ],
    poolOptions: {
      workers: {
        singleWorker: true,
        isolatedStorage: true,
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
      },
    },
  },
  resolve: {
    alias: aliases,
  },
});
