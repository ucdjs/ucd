import { defineConfig } from "tsdown";
import { baseConfig } from "./base";
import type { Options as TSDownOptions } from "tsdown";

export function createTsdownConfig(overrides: Partial<TSDownOptions> = {}) {
  return defineConfig({
    ...baseConfig,
    ...overrides,
    entry: overrides.entry || ["./src/index.ts"],
  });
}

export { baseConfig } from "./base";
