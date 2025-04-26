import { existsSync, readdirSync } from "node:fs";
import { defineConfig } from "vitest/config";

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
  "[shortcodes]",
  "[versions]",
]

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["**/src/**"],
    },
    setupFiles: [
      "./test/global-setup/msw.ts",
    ],
    onConsoleLog(log, type) {
      if (type === "stderr") {
        return !hiddenLogs.some((hidden) => log.includes(hidden));
      }

      return false;
    },
    workspace: [
      {
        extends: true,
        test: {
          include: ["./packages/utils/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
          name: "utils",
          environment: "node",
          mockReset: true,
        },
        esbuild: { target: "es2020" },
        resolve: { alias: aliases },
      },
      {
        extends: true,
        test: {
          include: ["./packages/cli/**/*.{test,spec}.?(c|m)[jt]s?(x)"],
          name: "cli",
          environment: "node",
          mockReset: true,
        },
        esbuild: { target: "es2020" },
        resolve: { alias: aliases },
      },
    ]
  }
})
