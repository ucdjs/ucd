import type { GeneratedManifest, UploadResult } from "../src/types";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { createManifestEtag } from "../src/lib/manifest";

const {
  generateManifestsMock,
  getRemoteManifestEtagMock,
  uploadManifestMock,
} = vi.hoisted(() => ({
  generateManifestsMock: vi.fn(),
  getRemoteManifestEtagMock: vi.fn(),
  uploadManifestMock: vi.fn(),
}));

vi.mock("../src/lib/manifest", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/manifest")>();
  return {
    ...actual,
    generateManifests: generateManifestsMock,
  };
});

vi.mock("../src/lib/upload", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../src/lib/upload")>();
  return {
    ...actual,
    getRemoteManifestEtag: getRemoteManifestEtagMock,
    uploadManifest: uploadManifestMock,
  };
});

function createGeneratedManifest(): GeneratedManifest {
  return {
    version: "16.0.0",
    manifest: {
      expectedFiles: [
        {
          name: "UnicodeData.txt",
          path: "/16.0.0/ucd/UnicodeData.txt",
          storePath: "/16.0.0/UnicodeData.txt",
        },
      ],
    },
    snapshot: {
      unicodeVersion: "16.0.0",
      files: {
        "UnicodeData.txt": {
          hash: "sha256:1111111111111111111111111111111111111111111111111111111111111111",
          fileHash: "sha256:aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
          size: 123,
        },
      },
    },
    fileCount: 1,
    date: "2024-06-11",
    status: "stable",
  };
}

describe("refreshManifests", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it("skips upload when the remote manifest ETag matches", async () => {
    const manifest = createGeneratedManifest();
    const remoteEtag = createManifestEtag(manifest);
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    generateManifestsMock.mockResolvedValue([manifest]);
    getRemoteManifestEtagMock.mockResolvedValue(remoteEtag);

    let shouldSkipResult: boolean | undefined;
    uploadManifestMock.mockImplementation(async (manifests, options): Promise<UploadResult> => {
      shouldSkipResult = await options.shouldSkip?.(manifests[0]!);
      return {
        success: true,
        uploaded: 0,
        skipped: shouldSkipResult ? 1 : 0,
        errors: [],
        versions: [],
      };
    });

    const { refreshManifests } = await import("../src/commands/refresh-manifests");

    await refreshManifests({
      baseUrl: "https://api.ucdjs.dev",
      versions: "16.0.0",
    });

    expect(shouldSkipResult).toBe(true);
    expect(getRemoteManifestEtagMock).toHaveBeenCalledWith("16.0.0", expect.objectContaining({
      baseUrl: "https://api.ucdjs.dev",
    }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("uploads when the remote manifest is missing even if the versions endpoint is unavailable", async () => {
    const manifest = createGeneratedManifest();
    const fetchSpy = vi.spyOn(globalThis, "fetch");

    generateManifestsMock.mockResolvedValue([manifest]);
    getRemoteManifestEtagMock.mockResolvedValue(null);

    let shouldSkipResult: boolean | undefined;
    uploadManifestMock.mockImplementation(async (manifests, options): Promise<UploadResult> => {
      shouldSkipResult = await options.shouldSkip?.(manifests[0]!);
      return {
        success: true,
        uploaded: shouldSkipResult ? 0 : 1,
        skipped: shouldSkipResult ? 1 : 0,
        errors: [],
        versions: shouldSkipResult
          ? []
          : [{
              version: manifests[0]!.version,
              date: manifests[0]!.date,
              status: manifests[0]!.status,
              fileCount: manifests[0]!.fileCount,
            }],
      };
    });

    const { refreshManifests } = await import("../src/commands/refresh-manifests");

    await refreshManifests({
      baseUrl: "https://api.ucdjs.dev",
      versions: "16.0.0",
    });

    expect(shouldSkipResult).toBe(false);
    expect(getRemoteManifestEtagMock).toHaveBeenCalledWith("16.0.0", expect.objectContaining({
      baseUrl: "https://api.ucdjs.dev",
    }));
    expect(fetchSpy).not.toHaveBeenCalled();
  });
});
