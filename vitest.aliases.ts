import { readdirSync, existsSync } from "node:fs";
// We use NodeURL to avoid issues with types when, worker tests files are open.
import { fileURLToPath, URL as NodeURL } from "node:url";

const pkgRoot = (pkg: string) =>
  fileURLToPath(new NodeURL(`./packages/${pkg}`, import.meta.url));


const alias = (pkg: string) => `${pkgRoot(pkg)}/src`;

export const aliases = readdirSync(fileURLToPath(new NodeURL("./packages", import.meta.url)))
  .filter((dir) => existsSync(pkgRoot(dir) + "/package.json"))
  .reduce<Record<string, string>>(
    (acc, pkg) => {
      acc[`@ucdjs/${pkg}`] = alias(pkg);
      return acc;
    }, {
    "#test-utils/msw": alias("test-utils") + "/msw.ts",
    "#test-utils/mock-store": alias("test-utils") + "/mock-store/index.ts",
    "#test-utils": alias("test-utils") + "/index.ts",
    "#internal/test-utils/conditions": fileURLToPath(new NodeURL("./test/utils/conditions.ts", import.meta.url)),
  });
