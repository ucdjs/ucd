import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { readConfigFile, sys } from "typescript";

const tsconfigPath = fileURLToPath(new URL("./tooling/tsconfig/base.json", import.meta.url));
const tsconfigDir = dirname(tsconfigPath);
const { config, error } = readConfigFile(tsconfigPath, sys.readFile);

if (error) {
  throw new Error(`Failed to read ${tsconfigPath}: ${String(error.messageText)}`);
}

const baseUrl = config.compilerOptions?.baseUrl ?? ".";
const paths = (config.compilerOptions?.paths ?? {}) as Record<string, string[]>;

const normalizedEntries = Object.entries(paths).flatMap(([find, targets]) => {
  const target = targets[0];

  if (!target) {
    return [];
  }

  const normalizedFind = find.includes("*") ? find.replace(/\*.*$/, "") : find;
  const normalizedTarget = target.includes("*") ? target.replace(/\*.*$/, "") : target;
  const replacement = resolve(tsconfigDir, baseUrl, normalizedTarget);

  return [[
    normalizedFind,
    normalizedFind.endsWith("/") ? `${replacement}/` : replacement,
  ] as const];
});

export const aliases = normalizedEntries
  .map(([find, replacement]) => {
    return { find, replacement };
  })
  .sort((a, b) => b.find.length - a.find.length);
