/* eslint-disable no-console */
// @ts-check

import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findWorkspaceRoot(startDir = __dirname) {
  let currentDir = startDir;

  while (currentDir !== path.dirname(currentDir)) {
    const pnpmWorkspace = path.join(currentDir, "pnpm-workspace.yaml");
    const packageJson = path.join(currentDir, "package.json");

    if (existsSync(pnpmWorkspace)) {
      return currentDir;
    }

    if (existsSync(packageJson)) {
      try {
        const pkg = JSON.parse(readFileSync(packageJson, "utf8"));
        if (pkg.workspaces) {
          return currentDir;
        }
      } catch { }
    }

    currentDir = path.dirname(currentDir);
  }

  throw new Error("Could not find workspace root. Make sure you have pnpm-workspace.yaml or package.json with workspaces field.");
}

/**
 * @param {string} workspaceRoot
 */
function discoverWorkspacePackages(workspaceRoot) {
  const packages = new Map();
  const packagesDir = path.join(workspaceRoot, "packages");

  if (existsSync(packagesDir)) {
    const entries = readdirSync(packagesDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const packageJsonPath = path.join(packagesDir, entry.name, "package.json");

        if (existsSync(packageJsonPath)) {
          try {
            const pkg = JSON.parse(readFileSync(packageJsonPath, "utf8"));
            if (pkg.name) {
              packages.set(pkg.name, `packages/${entry.name}`);
            }
          } catch { }
        }
      }
    }
  }

  return packages;
}

const workspaceRoot = findWorkspaceRoot();
console.info(`🔍 Found workspace root: ${workspaceRoot}`);

const workspacePackages = discoverWorkspacePackages(workspaceRoot);
console.info(`🌙 Moonbeam loaded - found ${workspacePackages.size} workspace packages`);

for (const [name, path] of workspacePackages) {
  console.info(`  📦 ${name} -> ${path}`);
}

/**
 * @param {string} specifier
 * @param {import("node:module").ResolveHookContext} context
 * @param {Parameters<import('module').ResolveHook>["2"]} nextResolve
 */
export async function resolve(specifier, context, nextResolve) {
  if (workspacePackages.has(specifier)) {
    const packagePath = workspacePackages.get(specifier);
    const srcPath = path.join(workspaceRoot, packagePath, "src");
    const indexPath = path.join(srcPath, "index.ts");

    if (existsSync(indexPath)) {
      return {
        shortCircuit: true,
        url: pathToFileURL(indexPath).href,
      };
    }

    // fallback to dist
    const distPath = path.join(workspaceRoot, packagePath, "dist", "index.js");
    if (existsSync(distPath)) {
      return {
        shortCircuit: true,
        url: pathToFileURL(distPath).href,
      };
    }
  }

  // handle subpath imports
  for (const [packageName, packagePath] of workspacePackages) {
    if (specifier.startsWith(`${packageName}/`)) {
      const subpath = specifier.slice(packageName.length + 1);
      const srcPath = path.join(workspaceRoot, packagePath, "src", `${subpath}.ts`);

      if (existsSync(srcPath)) {
        return {
          shortCircuit: true,
          url: pathToFileURL(srcPath).href,
        };
      }

      const distPath = path.join(workspaceRoot, packagePath, "dist", `${subpath}.js`);
      if (existsSync(distPath)) {
        return {
          shortCircuit: true,
          url: pathToFileURL(distPath).href,
        };
      }
    }
  }

  // fallback to default resolution
  return nextResolve(specifier, context);
}
