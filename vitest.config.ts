import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, type TestProjectConfiguration } from "vitest/config";
import { aliases } from "./vitest.aliases";

const pkgRoot = (root: string, pkg: string) =>
  fileURLToPath(new URL(`./${root}/${pkg}`, import.meta.url));

async function createProjects(root: string): Promise<TestProjectConfiguration[]> {
  try {
    const rootDir = fileURLToPath(new URL(`./${root}`, import.meta.url));
    const dirs = readdirSync(rootDir).filter((dir) => existsSync(pkgRoot(root, dir) + "/package.json"));

    const promises = dirs.map(async (dir) => {
      const base = {
        extends: true,
        test: {
          dir: `./${root}/${dir}/test`,
          include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
          name: dir,
        },
      } satisfies TestProjectConfiguration;

      const customConfigPath = pkgRoot(root, dir) + "/vitest.config.ts";

      if (existsSync(customConfigPath)) {
        try {
          const customConfig = await import(customConfigPath).then((m) => m.default);

          return mergeConfig(base, customConfig);
        } catch (error) {
          console.warn(`[vitest] Failed to load custom config for ${root}/${dir}:`, error);
          return base;
        }
      }

      return base;
    });

    return Promise.all(promises);
  } catch (err) {
    console.warn(`[vitest] Failed to scan ${root} directory:`, err);
    return [];
  }
}

const packageProjects = await createProjects("packages");
const appProjects = await createProjects("apps");

const hiddenLogs: string[] = [];

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      include: ["**/src/**"],
      exclude: ["tooling/*"],
    },
    environment: "node",
    mockReset: true,
    setupFiles: ["./packages/test-utils/src/msw/vitest-setup.ts"],
    onConsoleLog(log, type) {
      if (type === "stderr") {
        return !hiddenLogs.some((hidden) => log.includes(hidden));
      }

      return false;
    },
    projects: [...packageProjects, ...appProjects],
  },
  esbuild: { target: "es2020" },
  resolve: { alias: aliases },
});
