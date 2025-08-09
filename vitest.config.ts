import { existsSync, readdirSync } from "node:fs";
import { defineConfig, type TestProjectConfiguration } from "vitest/config";

const root = new URL("./", import.meta.url).pathname;

const pkgRoot = (pkg: string) =>
  new URL(`./packages/${pkg}`, import.meta.url).pathname;
const alias = (pkg: string) => `${pkgRoot(pkg)}/src`;

const aliases = readdirSync(new URL("./packages", import.meta.url).pathname)
  .filter((dir) => existsSync(pkgRoot(dir) + "/package.json"))
  .reduce<Record<string, string>>(
    (acc, pkg) => {
      acc[`@ucdjs/${pkg}`] = alias(pkg);
      return acc;
    }, {});

const hiddenLogs = [
  "[safeJsonParse]",
  "[ucd-store]",
  "[ucd-files]",
  "[worker-shared]"
]

const packageProjects = readdirSync(new URL("./packages", import.meta.url).pathname)
  .filter((dir) => existsSync(pkgRoot(dir) + "/package.json"))
  .map((dir) => {
    return {
      extends: true,
      test: {
        include: [`./packages/${dir}/**/*.{test,spec}.?(c|m)[jt]s?(x)`],
        name: dir,
      }
    } satisfies TestProjectConfiguration;
  });

const workerUnitProjects = readdirSync(new URL("./apps", import.meta.url).pathname)
  .map((dir) => {
    return {
      extends: true,
      test: {
        include: [`./apps/${dir}/test/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)`],
        name: `${dir}:unit`,
      },
    } satisfies TestProjectConfiguration;
  })

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
      "@ucdjs/test-utils-internal/msw/global-setup",
    ],
    onConsoleLog(log, type) {
      if (type === "stderr") {
        return !hiddenLogs.some((hidden) => log.includes(hidden));
      }

      return false;
    },
    projects: [
      ...packageProjects,
      ...workerUnitProjects,
      "./apps/api/vitest.config.worker.ts",
    ]
  },
  esbuild: { target: "es2020" },
  resolve: { alias: aliases },
})
