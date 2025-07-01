import {
  defineWorkersProject,
} from "@cloudflare/vitest-pool-workers/config";

export default defineWorkersProject({
  test: {
    name: "api",
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
});
