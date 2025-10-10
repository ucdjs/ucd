import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, type TestProjectConfiguration } from "vitest/config";

const root = fileURLToPath(new URL("./", import.meta.url));

const pkgRoot = (pkg: string) =>
  fileURLToPath(new URL(`./packages/${pkg}`, import.meta.url));

const alias = (pkg: string) => `${pkgRoot(pkg)}/src`;

const aliases = readdirSync(fileURLToPath(new URL("./packages", import.meta.url)))
  .filter((dir) => existsSync(pkgRoot(dir) + "/package.json"))
  .reduce<Record<string, string>>(
    (acc, pkg) => {
      acc[`@ucdjs/${pkg}`] = alias(pkg);
      return acc;
    }, {
    "#test-utils/msw": alias("test-utils") + "/msw.ts",
    "#test-utils/mock-store": alias("test-utils") + "/mock-store/index.ts",
    "#test-utils": alias("test-utils") + "/index.ts",
    "#internal/test-utils/conditions": fileURLToPath(new URL("./test/utils/conditions.ts", import.meta.url)),
  });

const hiddenLogs: string[] = [];

const packageProjects = readdirSync(fileURLToPath(new URL("./packages", import.meta.url)))
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

const workerUnitProjects = readdirSync(fileURLToPath(new URL("./apps", import.meta.url)))
  .map((dir) => {
    return {
      extends: true,
      test: {
        include: [`./apps/${dir}/test/unit/**/*.{test,spec}.?(c|m)[jt]s?(x)`],
        name: `${dir}:unit`,
      },
    } satisfies TestProjectConfiguration;
  });

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
      ...workerUnitProjects,
      "./apps/api/vitest.config.worker.ts",
    ]
  },
  esbuild: { target: "es2020" },
  resolve: { alias: aliases },
})
