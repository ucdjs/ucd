import { existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, type TestProjectConfiguration } from "vitest/config";
import { aliases } from "./vitest.aliases.ts";
import { normalize } from "node:path";

const pkgRoot = (root: string, pkg: string) =>
  fileURLToPath(new URL(`./${root}/${pkg}`, import.meta.url));

function isRecord(value: unknown): value is Record<string, unknown> {
  return value != null && typeof value === "object";
}

function isPromiseLike(value: unknown): value is PromiseLike<unknown> {
  return isRecord(value) && typeof value.then === "function";
}

function getNestedProjects(config: unknown): TestProjectConfiguration[] | null {
  if (!isRecord(config)) {
    return null;
  }

  const testConfig = config.test;

  if (!isRecord(testConfig) || !Array.isArray(testConfig.projects)) {
    return null;
  }

  return testConfig.projects as TestProjectConfiguration[];
}

async function createProjects(root: string): Promise<TestProjectConfiguration[]> {
  try {
    const rootDir = fileURLToPath(new URL(`./${root}`, import.meta.url));
    const dirs = readdirSync(rootDir).filter((dir) => existsSync(normalize(pkgRoot(root, dir) + "/package.json")));

    const promises = dirs.map(async (dir) => {
      const base = {
        extends: true,
        resolve: {
          alias: aliases,
        },
        test: {
          dir: `./${root}/${dir}/test`,
          include: ["**/*.{test,spec}.?(c|m)[jt]s?(x)"],
          name: dir,
        },
      } satisfies TestProjectConfiguration;
      const nestedBase = {
        extends: true,
        resolve: {
          alias: aliases,
        },
        test: {
          dir: `./${root}/${dir}/test`,
        },
      } satisfies TestProjectConfiguration;

      const customConfigPath = normalize(pkgRoot(root, dir) + "/vitest.config.ts")

      if (existsSync(customConfigPath)) {
        const safePath = customConfigPath.replace(/^[A-Z]:\\/, "/").replace(/\\/g, "/");

        try {
          const customConfig = await import(safePath).then((m) => m.default);
          const nestedProjects = getNestedProjects(customConfig);

          if (nestedProjects) {
            return nestedProjects.map((project) => {
              if (typeof project === "string" || typeof project === "function" || isPromiseLike(project)) {
                return project;
              }

              return mergeConfig(nestedBase, project);
            });
          }

          return mergeConfig(base, customConfig);
        } catch (err) {
          console.warn(`[vitest] Failed to load custom config for ${root}/${dir} (path: ${customConfigPath}, safe path: ${safePath}):`, err);
          return base;
        }
      }

      return base;
    });

    return (await Promise.all(promises)).flat();
  } catch (err) {
    console.warn(`[vitest] Failed to scan ${root} directory:`, err);
    return [];
  }
}

const packageProjects = await createProjects("packages");
const pipelinePackageProjects = await createProjects("packages/pipelines");
const toolingProjects = await createProjects("tooling");

const appProjects = await createProjects("apps");

const hiddenLogs: string[] = [];

export default defineConfig({
  test: {
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
      ...toolingProjects,
      ...appProjects
    ]
  },
  oxc: {
    target: "es2024"
  },
  resolve: { alias: aliases },
});
