import type { UCDStoreVersionManifest } from "@ucdjs/schemas";
import { describe, expect, it, vi } from "vitest";
import { createManifestResource } from "../../src/resources/manifest";

describe("createManifestResource", () => {
  const mockManifest: UCDStoreVersionManifest = {
    expectedFiles: [
      { name: "UnicodeData.txt", path: "/16.0.0/ucd/UnicodeData.txt", storePath: "/16.0.0/UnicodeData.txt" },
      { name: "PropList.txt", path: "/16.0.0/ucd/PropList.txt", storePath: "/16.0.0/PropList.txt" },
      { name: "emoji-data.txt", path: "/16.0.0/ucd/emoji/emoji-data.txt", storePath: "/16.0.0/emoji/emoji-data.txt" },
    ],
  };

  it("should delegate manifest fetching to getManifest", async () => {
    const getManifest = vi.fn().mockResolvedValue({
      data: mockManifest,
      error: null,
    });

    const manifestResource = createManifestResource({ getManifest });
    const { data, error } = await manifestResource.get("16.0.0");

    expect(getManifest).toHaveBeenCalledWith("16.0.0");
    expect(error).toBeNull();
    expect(data).toEqual(mockManifest);
  });

  it("should preserve the manifest structure from the delegated result", async () => {
    const getManifest = vi.fn().mockResolvedValue({
      data: mockManifest,
      error: null,
    });

    const manifestResource = createManifestResource({ getManifest });
    const { data, error } = await manifestResource.get("16.0.0");

    expect(getManifest).toHaveBeenCalledTimes(1);
    expect(error).toBeNull();
    expect(data).toHaveProperty("expectedFiles");
    expect(Array.isArray(data!.expectedFiles)).toBe(true);
    expect(data!.expectedFiles[0]).toHaveProperty("name");
    expect(data!.expectedFiles[0]).toHaveProperty("path");
    expect(data!.expectedFiles[0]).toHaveProperty("storePath");
  });

  it("should pass through API errors from getManifest", async () => {
    const getManifest = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("Not found"),
    });

    const manifestResource = createManifestResource({ getManifest });
    const { data, error } = await manifestResource.get("99.0.0");

    expect(getManifest).toHaveBeenCalledWith("99.0.0");
    expect(data).toBeNull();
    expect(error).toBeDefined();
    expect(error?.message).toBe("Not found");
  });

  it("should pass through rejected or invalid version handling to getManifest", async () => {
    const getManifest = vi.fn().mockResolvedValue({
      data: null,
      error: new Error("Invalid version format: latest. Expected X.Y.Z format."),
    });

    const manifestResource = createManifestResource({ getManifest });
    const { data, error } = await manifestResource.get("latest");

    expect(getManifest).toHaveBeenCalledWith("latest");
    expect(data).toBeNull();
    expect(error?.message).toContain("Invalid version format");
  });
});
