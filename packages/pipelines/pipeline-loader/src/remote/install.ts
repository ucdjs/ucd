import type { PackageManager, RemoteInstallOptions } from "../types";
import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

function resolveInstallPackageManager(
  manager: PackageManager | "auto" | undefined,
  files: Set<string>,
): PackageManager {
  if (manager && manager !== "auto") {
    return manager;
  }

  if (files.has("pnpm-lock.yaml")) {
    return "pnpm";
  }
  if (files.has("bun.lockb") || files.has("bun.lock")) {
    return "bun";
  }
  if (files.has("yarn.lock")) {
    return "yarn";
  }
  if (files.has("package-lock.json") || files.has("npm-shrinkwrap.json")) {
    return "npm";
  }

  return "npm";
}

function installCommandFor(
  manager: PackageManager,
  options: { hasLockfile: boolean; allowScripts: boolean },
): { command: string; args: string[] } {
  const { hasLockfile, allowScripts } = options;

  if (manager === "pnpm") {
    const args = ["install", hasLockfile ? "--frozen-lockfile" : "--no-frozen-lockfile"];
    if (!allowScripts) {
      args.push("--ignore-scripts");
    }
    return { command: "pnpm", args };
  }

  if (manager === "yarn") {
    const args = ["install"];
    if (hasLockfile) {
      args.push("--frozen-lockfile");
    }
    if (!allowScripts) {
      args.push("--ignore-scripts");
    }
    return { command: "yarn", args };
  }

  if (manager === "bun") {
    const args = ["install"];
    if (!allowScripts) {
      args.push("--ignore-scripts");
    }
    return { command: "bun", args };
  }

  const args = [hasLockfile ? "ci" : "install"];
  if (!allowScripts) {
    args.push("--ignore-scripts");
  }
  return { command: "npm", args };
}

async function hasFile(cwd: string, fileName: string): Promise<boolean> {
  return readFile(path.join(cwd, fileName), "utf-8")
    .then(() => true)
    .catch(() => false);
}

async function detectPackageManagerFromDisk(cwd: string, requested?: PackageManager | "auto"): Promise<PackageManager> {
  if (requested && requested !== "auto") {
    return requested;
  }

  const files = new Set<string>();
  if (await hasFile(cwd, "pnpm-lock.yaml")) files.add("pnpm-lock.yaml");
  if (await hasFile(cwd, "bun.lockb")) files.add("bun.lockb");
  if (await hasFile(cwd, "bun.lock")) files.add("bun.lock");
  if (await hasFile(cwd, "yarn.lock")) files.add("yarn.lock");
  if (await hasFile(cwd, "package-lock.json")) files.add("package-lock.json");
  if (await hasFile(cwd, "npm-shrinkwrap.json")) files.add("npm-shrinkwrap.json");

  return resolveInstallPackageManager("auto", files);
}

async function runInstall(options: {
  cwd: string;
  packageManager: PackageManager;
  allowScripts: boolean;
}): Promise<void> {
  const packageJsonPath = path.join(options.cwd, "package.json");
  const hasPackageJson = await readFile(packageJsonPath, "utf-8")
    .then(() => true)
    .catch(() => false);

  if (!hasPackageJson) {
    return;
  }

  const hasLockfile = await Promise.any([
    readFile(path.join(options.cwd, "pnpm-lock.yaml"), "utf-8").then(() => true),
    readFile(path.join(options.cwd, "package-lock.json"), "utf-8").then(() => true),
    readFile(path.join(options.cwd, "npm-shrinkwrap.json"), "utf-8").then(() => true),
    readFile(path.join(options.cwd, "yarn.lock"), "utf-8").then(() => true),
    readFile(path.join(options.cwd, "bun.lockb")).then(() => true),
    readFile(path.join(options.cwd, "bun.lock")).then(() => true),
  ]).catch(() => false);

  const { command, args } = installCommandFor(options.packageManager, {
    hasLockfile,
    allowScripts: options.allowScripts,
  });

  await new Promise<void>((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      env: process.env,
      stdio: "pipe",
    });

    let stderr = "";
    child.stderr.on("data", (chunk) => {
      stderr += String(chunk);
    });

    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Dependency installation failed using ${command}: ${stderr.trim() || `exit code ${code}`}`));
    });
  });
}

export async function installRemotePipelineDependencies(cwd: string, install: RemoteInstallOptions): Promise<void> {
  if (!install.enabled) {
    return;
  }

  const packageManager = await detectPackageManagerFromDisk(cwd, install.packageManager);

  await runInstall({
    cwd,
    packageManager,
    allowScripts: install.allowScripts ?? false,
  });
}
