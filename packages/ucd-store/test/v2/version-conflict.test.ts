import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError } from "../../src/errors";
import { readManifest } from "../../src/v2/manifest";
import { handleVersionConflict } from "../../src/v2/store";

describe("strict strategy", () => {
  it("should return manifest versions when they match provided versions", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions = ["16.0.0", "15.1.0", "15.0.0"];
    const manifestVersions = ["16.0.0", "15.1.0", "15.0.0"];

    const result = await handleVersionConflict(
      "strict",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    expect(result).toEqual(manifestVersions);
  });

  it("should return manifest versions when order differs but content matches", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions = ["15.0.0", "16.0.0", "15.1.0"];
    const manifestVersions = ["16.0.0", "15.1.0", "15.0.0"];

    const result = await handleVersionConflict(
      "strict",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    expect(result).toEqual(manifestVersions);
  });

  it("should throw error when provided versions differ from manifest", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions = ["16.0.0", "15.1.0"];
    const manifestVersions = ["16.0.0", "15.1.0", "15.0.0"];

    await expect(
      handleVersionConflict(
        "strict",
        providedVersions,
        manifestVersions,
        fs,
        manifestPath,
      ),
    ).rejects.toThrow(UCDStoreGenericError);

    await expect(
      handleVersionConflict(
        "strict",
        providedVersions,
        manifestVersions,
        fs,
        manifestPath,
      ),
    ).rejects.toThrow(
      "Version mismatch: manifest has [16.0.0, 15.1.0, 15.0.0], provided [16.0.0, 15.1.0]. Use versionStrategy: \"merge\" or \"overwrite\" to resolve.",
    );
  });
});

describe("merge strategy", () => {
  it("should combine provided and manifest versions", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions = ["16.0.0", "15.1.0"];
    const manifestVersions = ["15.0.0", "14.0.0"];

    const result = await handleVersionConflict(
      "merge",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    expect(result).toEqual(["15.0.0", "14.0.0", "16.0.0", "15.1.0"]);
  });

  it("should remove duplicate versions when merging", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions = ["16.0.0", "15.1.0", "15.0.0"];
    const manifestVersions = ["15.1.0", "15.0.0", "14.0.0"];

    const result = await handleVersionConflict(
      "merge",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    // should contain all unique versions
    expect(result).toHaveLength(4);
    expect(result).toContain("16.0.0");
    expect(result).toContain("15.1.0");
    expect(result).toContain("15.0.0");
    expect(result).toContain("14.0.0");
  });

  it("should update manifest file with merged versions", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions = ["16.0.0"];
    const manifestVersions = ["15.0.0"];

    await handleVersionConflict(
      "merge",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    const manifest = await readManifest(fs, manifestPath);
    expect(Object.keys(manifest).sort()).toEqual(["15.0.0", "16.0.0"]);
  });
});

describe("overwrite strategy", () => {
  it("should replace manifest versions with provided versions", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions = ["16.0.0", "15.1.0"];
    const manifestVersions = ["15.0.0", "14.0.0"];

    const result = await handleVersionConflict(
      "overwrite",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    expect(result).toEqual(providedVersions);
  });

  it("should update manifest file with provided versions", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions = ["16.0.0", "15.1.0"];
    const manifestVersions = ["15.0.0", "14.0.0"];

    await handleVersionConflict(
      "overwrite",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    const manifest = await readManifest(fs, manifestPath);
    expect(Object.keys(manifest).sort()).toEqual(["15.1.0", "16.0.0"]);
  });
});

describe("empty provided versions array", () => {
  it("should throw error with strict strategy", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions: string[] = [];
    const manifestVersions = ["15.0.0"];

    await expect(
      handleVersionConflict(
        "strict",
        providedVersions,
        manifestVersions,
        fs,
        manifestPath,
      ),
    ).rejects.toThrow(UCDStoreGenericError);
  });

  it("should return manifest versions with merge strategy", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions: string[] = [];
    const manifestVersions = ["15.0.0"];

    const result = await handleVersionConflict(
      "merge",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    expect(result).toEqual(["15.0.0"]);
  });

  it("should clear manifest with overwrite strategy", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions: string[] = [];
    const manifestVersions = ["15.0.0"];

    const result = await handleVersionConflict(
      "overwrite",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    expect(result).toEqual([]);
  });
});

describe("empty manifest versions array", () => {
  it("should throw error with strict strategy", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions = ["16.0.0"];
    const manifestVersions: string[] = [];

    await expect(
      handleVersionConflict(
        "strict",
        providedVersions,
        manifestVersions,
        fs,
        manifestPath,
      ),
    ).rejects.toThrow(UCDStoreGenericError);
  });

  it("should return provided versions with merge strategy", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions = ["16.0.0"];
    const manifestVersions: string[] = [];

    const result = await handleVersionConflict(
      "merge",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    expect(result).toEqual(["16.0.0"]);
  });

  it("should return provided versions with overwrite strategy", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions = ["16.0.0"];
    const manifestVersions: string[] = [];

    const result = await handleVersionConflict(
      "overwrite",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    expect(result).toEqual(["16.0.0"]);
  });
});

describe("both arrays empty", () => {
  it("should succeed with strict strategy", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions: string[] = [];
    const manifestVersions: string[] = [];

    const result = await handleVersionConflict(
      "strict",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    expect(result).toEqual([]);
  });

  it("should return empty array with merge strategy", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions: string[] = [];
    const manifestVersions: string[] = [];

    const result = await handleVersionConflict(
      "merge",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    expect(result).toEqual([]);
  });

  it("should return empty array with overwrite strategy", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const providedVersions: string[] = [];
    const manifestVersions: string[] = [];

    const result = await handleVersionConflict(
      "overwrite",
      providedVersions,
      manifestVersions,
      fs,
      manifestPath,
    );

    expect(result).toEqual([]);
  });
});
