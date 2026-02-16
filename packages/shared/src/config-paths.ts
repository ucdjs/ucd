import os from "node:os";
import path from "node:path";
import process from "node:process";

const env = typeof process === "undefined" ? {} : process.env;

export function getXdgConfigDir(): string {
  if (env.XDG_CONFIG_HOME) {
    return env.XDG_CONFIG_HOME;
  }

  return path.join(os.homedir(), ".config");
}

export function getUcdConfigDir(): string {
  return path.join(getXdgConfigDir(), "ucd");
}

export function getUcdConfigPath(...segments: string[]): string {
  return path.join(getUcdConfigDir(), ...segments);
}

export function getPipelineDbPath(): string {
  return getUcdConfigPath("pipeline.db");
}
