import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, type TestProjectConfiguration, type TestProjectInlineConfiguration } from "vitest/config";
import { aliases } from "./vitest.aliases";
import { normalize } from "node:path";

const pkgRoot = (root: string, pkg: string) =>
  fileURLToPath(new URL(`./${root}/${pkg}`, import.meta.url));

interface CreateProjectsOptions {
  root: string;
  extend?: (projects: TestProjectConfiguration[]) => TestProjectConfiguration[];
}

async function createProjects(options: CreateProjectsOptions): Promise<TestProjectConfiguration[]> {
  try {
    const rootDir = fileURLToPath(new URL(`./${options.root}`, import.meta.url));
    const dirs = readdirSync(rootDir).filter((dir) => existsSync(normalize(pkgRoot(options.root, dir) + "/package.json")));

    const promises = dirs.map(async (dir) => {
      const base = {
        extends: true,
        test: {
          dir: `./${options.root}/${dir}/test`,
          include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
          name: dir,
        },
      } satisfies TestProjectConfiguration;

      const customConfigPath = normalize(pkgRoot(options.root, dir) + "/vitest.config.ts")

      if (existsSync(customConfigPath)) {
        const safePath = customConfigPath.replace(/^[A-Z]:\\/, "/").replace(/\\/g, "/");

        try {
          const customConfig = await import(safePath).then((m) => m.default);

          return mergeConfig(base, customConfig);
        } catch (err) {
          console.warn(`[vitest] Failed to load custom config for ${options.root}/${dir} (path: ${customConfigPath}, safe path: ${safePath}):`, err);
          return base;
        }
      }

      return base;
    });

    const projects = await Promise.all(promises);

    // Apply extend function if provided
    if (options.extend) {
      return options.extend(projects);
    }

    return projects;
  } catch (err) {
    console.warn(`[vitest] Failed to scan ${options.root} directory:`, err);
    return [];
  }
}

const packageProjects = await createProjects({ root: "packages" });
const appProjects = await createProjects({
  root: "apps",
  extend(projects) {
    const apiProject = projects.find((p): p is TestProjectInlineConfiguration => {
      return typeof p === "object" && p !== null && !("then" in p) && p.test?.name === "api";
    });

    if (apiProject == null) {
      throw new Error("API project not found in apps");
    }

    // Clone the apiProject but change the test directory to the contract tests
    const apiContractProject = {
      ...apiProject,
      test: {
        ...apiProject.test,
        dir: "./apps/api/test/msw-contract",
        name: "api:contract",
      },
    } satisfies TestProjectConfiguration;

    projects.push(apiContractProject);

    return projects
  },
});

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
    projects: [...packageProjects, ...appProjects],
  },
  esbuild: { target: "es2020" },
  resolve: { alias: aliases },
});
