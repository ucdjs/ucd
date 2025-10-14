import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { readManifest, writeManifest } from "../../src/v2/manifest";

describe("read manifest", () => {
  it("should read manifest", async () => {
    const _testdirPath = await testdir();

    // const manifest = await readManifest();
  });
});
