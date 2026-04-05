import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { bundle } from "../src/bundle";
import { BundleResolveError, BundleTransformError } from "../src/errors";

describe("bundle", () => {
  it("bundles a simple ESM file and returns code + dataUrl", async () => {
    const dir = await testdir({
      "entry.ts": `export const value = 42;`,
    });

    const result = await bundle({ entryPath: `${dir}/entry.ts`, cwd: dir });

    expect(result.code).toContain("42");
    expect(result.dataUrl).toMatch(/^data:text\/javascript;base64,/);
  });

  it("bundles a file that imports a local module", async () => {
    const dir = await testdir({
      "entry.ts": `
        import { helper } from "./helper";

        export const val = helper();
      `,
      "helper.ts": `export function helper() { return "ok"; }`,
    });

    const result = await bundle({ entryPath: `${dir}/entry.ts`, cwd: dir });

    expect(result.code).toContain("ok");
  });

  it("outputs ESM format", async () => {
    const dir = await testdir({
      "entry.ts": `export const x = 1;`,
    });

    const result = await bundle({ entryPath: `${dir}/entry.ts`, cwd: dir });

    expect(result.code).toContain("export");
  });

  it("dataUrl is a valid base64-encoded version of the code", async () => {
    const dir = await testdir({
      "entry.ts": `export const greeting = "hello";`,
    });

    const { code, dataUrl } = await bundle({ entryPath: `${dir}/entry.ts`, cwd: dir });

    const base64 = dataUrl.replace("data:text/javascript;base64,", "");
    // eslint-disable-next-line node/prefer-global/buffer
    const decoded = Buffer.from(base64, "base64").toString("utf-8");
    expect(decoded).toBe(code);
  });

  it("throws BundleResolveError for an unresolvable import", async () => {
    const dir = await testdir({
      "entry.ts": `
        import { missing } from "@luxass/nonexistent-package";

        export const x = missing;
      `,
    });

    await expect(
      bundle({ entryPath: `${dir}/entry.ts`, cwd: dir }),
    ).rejects.toThrow(BundleResolveError);
  });

  it("throws BundleTransformError for a file with syntax errors", async () => {
    const dir = await testdir({
      "entry.ts": `export const broken = {`,
    });

    await expect(
      bundle({ entryPath: `${dir}/entry.ts`, cwd: dir }),
    ).rejects.toThrow(BundleTransformError);
  });

  it("bundles TypeScript with type annotations", async () => {
    const dir = await testdir({
      "entry.ts": `
        export const add = (a: number, b: number): number => a + b;
      `,
    });

    const result = await bundle({ entryPath: `${dir}/entry.ts`, cwd: dir });

    expect(result.code).toBeDefined();
    expect(result.code).not.toContain(": number");
  });

  it("respects tsconfig paths when tsconfig: true", async () => {
    const dir = await testdir({
      "tsconfig.json": JSON.stringify({
        compilerOptions: {
          baseUrl: ".",
          paths: {
            "#utils": ["./src/utils.ts"],
          },
        },
      }),
      "src": {
        "utils.ts": `export const util = "from-alias";`,
      },
      "entry.ts": `
        import { util } from "#utils";

        export { util };
      `,
    });

    const result = await bundle({ entryPath: `${dir}/entry.ts`, cwd: dir });

    expect(result.code).toContain("from-alias");
  });

  describe("buildOptions", () => {
    it("marks imports as external via buildOptions.external", async () => {
      const dir = await testdir({
        "entry.ts": `
          import { something } from "external-pkg";

          export const val = something;
        `,
      });

      const result = await bundle({
        entryPath: `${dir}/entry.ts`,
        cwd: dir,
        buildOptions: {
          external: ["external-pkg"],
        },
      });

      expect(result.code).toContain("external-pkg");
    });

    it("injects compile-time constants via buildOptions.define", async () => {
      const dir = await testdir({
        "entry.ts": `export const mode = __BUILD_MODE__;`,
      });

      const result = await bundle({
        entryPath: `${dir}/entry.ts`,
        cwd: dir,
        buildOptions: {
          transform: {
            define: {
              __BUILD_MODE__: JSON.stringify("production"),
            },
          },
        },
      });

      expect(result.code).toContain("production");
      expect(result.code).not.toContain("__BUILD_MODE__");
    });

    it("sets target platform via buildOptions.platform", async () => {
      const dir = await testdir({
        "entry.ts": `export const x = 1;`,
      });

      const result = await bundle({
        entryPath: `${dir}/entry.ts`,
        cwd: dir,
        buildOptions: {
          platform: "node",
        },
      });

      expect(result.code).toBeDefined();
    });

    it("applies custom resolve aliases via buildOptions.resolve", async () => {
      const dir = await testdir({
        "entry.ts": `
          import { value } from "@alias/lib";

          export { value };
        `,
        "lib.ts": `export const value = "aliased";`,
      });

      const result = await bundle({
        entryPath: `${dir}/entry.ts`,
        cwd: dir,
        buildOptions: {
          resolve: {
            alias: {
              "@alias/lib": `${dir}/lib.ts`,
            },
          },
        },
      });

      expect(result.code).toContain("aliased");
    });
  });
});
