import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, type TestProjectConfiguration } from "vitest/config";
import { aliases } from "./vitest.aliases";
import { normalize } from "node:path";

const pkgRoot = (root: string, pkg: string) =>
  fileURLToPath(new URL(`./${root}/${pkg}`, import.meta.url));

async function createProjects(root: string): Promise<TestProjectConfiguration[]> {
  try {
    const rootDir = fileURLToPath(new URL(`./${root}`, import.meta.url));
    const dirs = readdirSync(rootDir).filter((dir) => existsSync(normalize(pkgRoot(root, dir) + "/package.json")));

    const promises = dirs.map(async (dir) => {
      const base = {
        extends: true,
        test: {
          dir: `./${root}/${dir}/test`,
          include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
          name: dir,
        },
      } satisfies TestProjectConfiguration;

      const customConfigPath = normalize(pkgRoot(root, dir) + "/vitest.config.ts")

      if (existsSync(customConfigPath)) {
        const safePath = customConfigPath.replace(/^[A-Z]:\\/, "/").replace(/\\/g, "/");

        try {
          const customConfig = await import(safePath).then((m) => m.default);

          return mergeConfig(base, customConfig);
        } catch (err) {
          console.warn(`[vitest] Failed to load custom config for ${root}/${dir} (path: ${customConfigPath}, safe path: ${safePath}):`, err);
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
const pipelinePackageProjects = await createProjects("packages/pipelines");

const appProjects = await createProjects("apps");

const hiddenLogs: string[] = [];

export default defineConfig({
  test: {
    coverage: {
      provider: "istanbul",
      include: ["**/src/**.{js,jsx,ts,tsx}"],
      exclude: ["tooling/*"],
    },
    environment: "node",
    mockReset: true,
    setupFiles: [
      "./packages/test-utils/src/msw/vitest-setup.ts",
      "./packages/test-utils/src/matchers/vitest-setup.ts"
    ],
    onConsoleLog(log, type) {
      if (type === "stderr") {
        return !hiddenLogs.some((hidden) => log.includes(hidden));
      }

      return false;
    },
    projects: [
      ...packageProjects,
      ...pipelinePackageProjects,
      ...appProjects
    ]
  },
  oxc: {
    target: "es2022"
  },
  resolve: { alias: aliases },
});
