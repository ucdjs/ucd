/* eslint-disable no-console */
// @ts-check

import { existsSync, globSync, readFileSync } from "node:fs";
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

  const packageJsonFiles = globSync("packages/**/package.json", {
    cwd: workspaceRoot,
    exclude: (p) => p.includes("node_modules"),
  });

  for (const relPath of packageJsonFiles) {
    try {
      const pkg = JSON.parse(readFileSync(path.join(workspaceRoot, relPath), "utf8"));
      if (pkg.name) {
        packages.set(pkg.name, path.dirname(relPath));
      }
    } catch { }
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

    console.log(`⚠️  Warning: No src/index.ts found for package "${specifier}". Attempting to fallback to dist/index.js...`);
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

  // resolve extensionless relative imports by trying TypeScript extensions
  // (needed when vite.config.ts is loaded via Node's native ESM with --configLoader native)
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const parentPath = context.parentURL ? fileURLToPath(context.parentURL) : null;
    if (parentPath) {
      const base = path.resolve(path.dirname(parentPath), specifier);
      for (const ext of [".ts", ".tsx", ".mts", ".js", ".jsx", ".mjs"]) {
        const candidate = base + ext;
        if (existsSync(candidate)) {
          return {
            shortCircuit: true,
            url: pathToFileURL(candidate).href,
          };
        }
      }
      // also try as a directory index
      for (const ext of [".ts", ".tsx", ".mts", ".js", ".mjs"]) {
        const candidate = path.join(base, `index${ext}`);
        if (existsSync(candidate)) {
          return {
            shortCircuit: true,
            url: pathToFileURL(candidate).href,
          };
        }
      }
    }
  }

  // fallback to default resolution
  return nextResolve(specifier, context);
}
