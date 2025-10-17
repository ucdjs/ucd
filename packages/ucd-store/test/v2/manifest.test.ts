import { join } from "node:path";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { UCDStoreInvalidManifestError } from "../../src/errors";
import { readManifest, writeManifest } from "../../src/v2/manifest";

describe("writeManifest", () => {
  it("should write manifest with multiple versions", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const versions = ["15.1.0", "15.0.0", "14.0.0"];

    await writeManifest(fs, manifestPath, versions);

    const written = await fs.read!(manifestPath);
    const parsed = JSON.parse(written);

    expect(parsed).toEqual({
      "15.1.0": "15.1.0",
      "15.0.0": "15.0.0",
      "14.0.0": "14.0.0",
    });
  });

  it("should write valid JSON with correct formatting", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const versions = ["16.0.0"];

    await writeManifest(fs, manifestPath, versions);

    const written = await fs.read!(manifestPath);

    expect(() => JSON.parse(written)).not.toThrow();

    expect(written).toContain("\n");
  });

  it("should create parent directories if they don't exist", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/deep/nested/path/.ucd-store.json";
    const versions = ["15.0.0"];

    await writeManifest(fs, manifestPath, versions);

    const written = await fs.read!(manifestPath);
    const parsed = JSON.parse(written);

    expect(parsed).toEqual({
      "15.0.0": "15.0.0",
    });
  });

  it("should handle empty versions array", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const versions: string[] = [];

    await writeManifest(fs, manifestPath, versions);

    const written = await fs.read!(manifestPath);
    const parsed = JSON.parse(written);

    expect(parsed).toEqual({});
  });

  it("should overwrite existing manifest", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    // write first manifest
    await writeManifest(fs, manifestPath, ["15.0.0"]);

    // overwrite with new versions
    await writeManifest(fs, manifestPath, ["16.0.0", "15.1.0"]);

    const written = await fs.read!(manifestPath);
    const parsed = JSON.parse(written);

    expect(parsed).toEqual({
      "16.0.0": "16.0.0",
      "15.1.0": "15.1.0",
    });
  });

  it("should throw error when file system bridge lacks write capability", async () => {
    const fs = defineFileSystemBridge({
      name: "Read-Only Bridge",
      description: "A bridge without write capability",
      setup() {
        return {
          async read() {
            return "";
          },
          async exists() {
            return false;
          },
          async listdir() {
            return [];
          },
        };
      },
    })();

    const manifestPath = "/test/.ucd-store.json";
    const versions = ["15.0.0"];

    await expect(writeManifest(fs, manifestPath, versions)).rejects.toThrow(
      "File system bridge does not support the 'write' capability.",
    );
  });

  it("should handle special characters in versions", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const versions = ["15.0.0-beta.1", "14.0.0+build.123"];

    await writeManifest(fs, manifestPath, versions);

    const written = await fs.read!(manifestPath);
    const parsed = JSON.parse(written);

    expect(parsed).toEqual({
      "15.0.0-beta.1": "15.0.0-beta.1",
      "14.0.0+build.123": "14.0.0+build.123",
    });
  });
});

describe("readManifest", () => {
  it("should read and parse valid manifest", async () => {
    const testdirPath = await testdir({
      ".ucd-store.json": JSON.stringify({
        "15.1.0": "15.1.0",
        "15.0.0": "15.0.0",
      }),
    });

    const fs = createMemoryMockFS();
    const manifestPath = join(testdirPath, ".ucd-store.json");

    // write the manifest content to the memory fs
    await fs.write!(
      manifestPath,
      JSON.stringify({
        "15.1.0": "15.1.0",
        "15.0.0": "15.0.0",
      }),
    );

    const manifest = await readManifest(fs, manifestPath);

    expect(manifest).toEqual({
      "15.1.0": "15.1.0",
      "15.0.0": "15.0.0",
    });
  });

  it("should throw UCDStoreInvalidManifestError when manifest is empty", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    // write empty file
    await fs.write!(manifestPath, "");

    await expect(readManifest(fs, manifestPath)).rejects.toThrow(
      UCDStoreInvalidManifestError,
    );

    await expect(readManifest(fs, manifestPath)).rejects.toThrow(
      "store manifest is empty",
    );
  });

  it("should throw UCDStoreInvalidManifestError when JSON is invalid", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    await fs.write!(manifestPath, "{ invalid json }");

    await expect(readManifest(fs, manifestPath)).rejects.toThrow(
      UCDStoreInvalidManifestError,
    );

    await expect(readManifest(fs, manifestPath)).rejects.toThrow(
      "store manifest is not a valid JSON",
    );
  });

  it("should throw UCDStoreInvalidManifestError when schema validation fails", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    await fs.write!(manifestPath, JSON.stringify(["15.0.0", "14.0.0"]));

    await expect(readManifest(fs, manifestPath)).rejects.toThrow(
      UCDStoreInvalidManifestError,
    );

    await expect(readManifest(fs, manifestPath)).rejects.toThrow(
      "store manifest is not a valid JSON",
    );
  });

  it("should handle manifest with empty object", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    await fs.write!(manifestPath, JSON.stringify({}));

    const manifest = await readManifest(fs, manifestPath);

    expect(manifest).toEqual({});
  });

  it("should handle manifest with single version", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    await fs.write!(
      manifestPath,
      JSON.stringify({
        "15.0.0": "15.0.0",
      }),
    );

    const manifest = await readManifest(fs, manifestPath);

    expect(manifest).toEqual({
      "15.0.0": "15.0.0",
    });
  });

  it("should handle manifest with many versions", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    const versions = {
      "16.0.0": "16.0.0",
      "15.1.0": "15.1.0",
      "15.0.0": "15.0.0",
      "14.0.0": "14.0.0",
      "13.0.0": "13.0.0",
    };

    await fs.write!(manifestPath, JSON.stringify(versions));

    const manifest = await readManifest(fs, manifestPath);

    expect(manifest).toEqual(versions);
  });
});

describe("manifest integration", () => {
  it("should successfully round-trip write and read", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const versions = ["16.0.0", "15.1.0", "15.0.0"];

    // write manifest
    await writeManifest(fs, manifestPath, versions);

    // read it back
    const manifest = await readManifest(fs, manifestPath);

    // should have correct structure
    expect(Object.keys(manifest)).toEqual(versions);
    expect(Object.values(manifest)).toEqual(versions);
  });

  it("should handle multiple write/read cycles", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    // first write/read
    await writeManifest(fs, manifestPath, ["15.0.0"]);
    const manifest1 = await readManifest(fs, manifestPath);
    expect(manifest1).toEqual({ "15.0.0": "15.0.0" });

    // second write/read
    await writeManifest(fs, manifestPath, ["16.0.0", "15.1.0"]);
    const manifest2 = await readManifest(fs, manifestPath);
    expect(manifest2).toEqual({
      "16.0.0": "16.0.0",
      "15.1.0": "15.1.0",
    });

    // third write/read
    await writeManifest(fs, manifestPath, ["14.0.0"]);
    const manifest3 = await readManifest(fs, manifestPath);
    expect(manifest3).toEqual({ "14.0.0": "14.0.0" });
  });

  it("should handle non-standard version formats", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const versions = [
      "15.0.0",
      "15.0.0-beta.1",
      "14.0.0+build.123",
      "v13.0.0",
      "latest",
    ];

    await writeManifest(fs, manifestPath, versions);
    const manifest = await readManifest(fs, manifestPath);

    expect(Object.keys(manifest).sort()).toEqual(versions.sort());
  });
});
