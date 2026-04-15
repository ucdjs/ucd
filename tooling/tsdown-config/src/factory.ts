import type { UserConfig as TSDownOptions } from "tsdown";
import { defineConfig } from "tsdown";

export const baseConfig = {
  entry: ["./src/index.ts"],
  format: ["esm"],
  clean: true,
  dts: true,
  treeshake: true,
  publint: true,
  tsconfig: "./tsconfig.build.json",
  inputOptions: {
    onwarn: (warning, defaultHandler) => {
      if (warning.code === "UNRESOLVED_IMPORT") {
        throw new Error(
          `Unresolved import: ${warning.message}. Please ensure all dependencies are installed and paths are correct.`,
        );
      }

      return defaultHandler(warning);
    },
  },
} satisfies TSDownOptions;

export function createTsdownConfig(overrides: Partial<TSDownOptions> = {}) {
  return defineConfig(() => {
    const defaultExports = {
      packageJson: true,
      // We don't want to write the "inlinedDependencies"..
      inlinedDependencies: false,
    };

    return {
      exports:
        overrides.exports && typeof overrides.exports === "object"
          ? {
              ...defaultExports,
              ...overrides.exports,
            }
          : overrides.exports ?? defaultExports,
      ...baseConfig,
      ...overrides,
      inputOptions: {
        ...(baseConfig.inputOptions ?? {}),
        ...(overrides.inputOptions ?? {}),
      },
    } as TSDownOptions;
  });
}
