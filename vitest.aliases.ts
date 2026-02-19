import { readdirSync, existsSync } from "node:fs";
// We use NodeURL to avoid issues with types when, worker tests files are open.
import { fileURLToPath, URL as NodeURL } from "node:url";

const SCOPE_OVERRIDES: Record<string, string> = {
  "shared": "@ucdjs-internal",
  "shared-ui": "@ucdjs-internal",
  "worker-utils": "@ucdjs-internal",
}

const pkgRoot = (root: string, pkg: string) =>
  fileURLToPath(new NodeURL(`./${root}/${pkg}`, import.meta.url));

const alias = (root: string, pkg: string) => `${pkgRoot(root, pkg)}/src`;

function collectAliasesFromRoot(root: string): Record<string, string> {
  const rootDir = fileURLToPath(new NodeURL(`./${root}`, import.meta.url));
  const dirs = readdirSync(rootDir)
    .filter((dir) => existsSync(pkgRoot(root, dir) + "/package.json"));

  return dirs.reduce<Record<string, string>>(
    (acc, pkg) => {
      let scope = "@ucdjs";

      if (SCOPE_OVERRIDES[pkg]) {
        scope = SCOPE_OVERRIDES[pkg];
      }

      acc[`${scope}/${pkg}`] = alias(root, pkg);
      return acc;
    }, {}
  );
}

export const aliases = {
  ...collectAliasesFromRoot("packages"),
  ...collectAliasesFromRoot("packages/pipelines"),
  "#test-utils/msw": alias("packages", "test-utils") + "/msw.ts",
  "#test-utils/mock-store": alias("packages", "test-utils") + "/mock-store/index.ts",
  "#test-utils/fs-bridges": alias("packages", "test-utils") + "/fs-bridges/index.ts",
  "#test-utils/pipelines": alias("packages", "test-utils") + "/pipelines/index.ts",
  "#test-utils": alias("packages", "test-utils") + "/index.ts",
  "#internal/test-utils/conditions": fileURLToPath(new NodeURL("./test/utils/conditions.ts", import.meta.url)),
};
