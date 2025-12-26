import { existsSync, readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, type TestProjectConfiguration } from "vitest/config";
import { aliases } from "./vitest.aliases";

const pkgRoot = (root: string, pkg: string) =>
  fileURLToPath(new URL(`./${root}/${pkg}`, import.meta.url));

const packageProjects = readdirSync(fileURLToPath(new URL("./packages", import.meta.url)))
  .filter((dir) => existsSync(pkgRoot("packages", dir) + "/package.json"))
  .map((dir) => {
    return {
      extends: true,
      test: {
        dir: `./packages/${dir}/test`,
        include: [
          "**/*.{test,spec}.?(c|m)[jt]s?(x)",
        ],
        name: dir,
      },
    } satisfies TestProjectConfiguration;
  });

const appProjects = await Promise.all(readdirSync(fileURLToPath(new URL("./apps", import.meta.url)))
  .filter((dir) => existsSync(pkgRoot("apps", dir) + "/package.json"))
  .map(async (dir) => {
    const base = {
      extends: true,
      test: {
        dir: `./apps/${dir}/test`,
        include: [
          "**/*.{test,spec}.?(c|m)[jt]s?(x)",
        ],
        name: dir,
      },
    } satisfies TestProjectConfiguration;

    if (dir === "api") {
      const apiConfig = await import(pkgRoot("apps", dir) + "/vitest.config.ts").then((m) => m.default)
      return mergeConfig(base, apiConfig)
    }

    return base
  }));

const hiddenLogs: string[] = [];

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      include: ["**/src/**"],
      exclude: [
        "tooling/*"
      ]
    },
    environment: "node",
    mockReset: true,
    setupFiles: [
      "./packages/test-utils/src/msw/vitest-setup.ts",
    ],
    onConsoleLog(log, type) {
      if (type === "stderr") {
        return !hiddenLogs.some((hidden) => log.includes(hidden));
      }

      return false;
    },
    projects: [
      ...packageProjects,
      ...appProjects,
    ]
  },
  esbuild: { target: "es2020" },
  resolve: { alias: aliases },
})
