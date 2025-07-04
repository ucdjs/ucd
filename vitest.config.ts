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
    },
    {
      "#msw-utils": `${root}/test/msw-utils/msw.ts`,
    });

const hiddenLogs = [
  "[safeJsonParse]",
  "[ucd-store]",
  "[ucd-files]",
]

const workspaces = readdirSync(new URL("./packages", import.meta.url).pathname)
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

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      include: ["**/src/**"],
    },
    environment: "node",
    mockReset: true,
    setupFiles: [
      "./test/global-setup/msw.ts",
    ],
    onConsoleLog(log, type) {
      if (type === "stderr") {
        return !hiddenLogs.some((hidden) => log.includes(hidden));
      }

      return false;
    },
    projects: [
      ...workspaces,
      "./apps/proxy",
      "./apps/api"
    ]
  },
  esbuild: { target: "es2020" },
  resolve: { alias: aliases },
})
