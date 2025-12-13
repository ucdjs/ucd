import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError } from "../../src/errors";
import { verify } from "../../src/setup/verify";

function createMockVersions(versions: string[]) {
  return versions.map((version) => ({
    version,
    documentationUrl: `https://www.unicode.org/versions/Unicode${version}/`,
    date: "2024",
    url: `https://www.unicode.org/Public/${version}`,
    mappedUcdVersion: null,
    type: "stable" as const,
  }));
}

describe("verify", () => {
  it("should return valid result when all manifest versions exist in API", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";
    const manifestVersions = ["16.0.0", "15.1.0"];

    await fs.write!(manifestPath, JSON.stringify({
      "16.0.0": { expectedFiles: [] },
      "15.1.0": { expectedFiles: [] },
    }));

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0", "15.0.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());
    const result = await verify({ client, manifestPath, fs });

    expect(result.valid).toBe(true);
    expect(result.manifestVersions).toEqual(manifestVersions);
    expect(result.missingVersions).toEqual([]);
  });

  it("should include extra versions available in API but not in manifest", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    await fs.write!(manifestPath, JSON.stringify({
      "16.0.0": { expectedFiles: [] },
    }));

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0", "15.0.0", "14.0.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());
    const result = await verify({ client, manifestPath, fs });

    expect(result.valid).toBe(true);
    expect(result.extraVersions).toContain("15.1.0");
    expect(result.extraVersions).toContain("15.0.0");
    expect(result.extraVersions).toContain("14.0.0");
    expect(result.extraVersions).toHaveLength(3);
  });

  it("should return invalid result when manifest has versions not in API", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    await fs.write!(manifestPath, JSON.stringify({
      "16.0.0": { expectedFiles: [] },
      "15.1.0": { expectedFiles: [] },
      "99.0.0": { expectedFiles: [] },
    }));

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());
    const result = await verify({ client, manifestPath, fs });

    expect(result.valid).toBe(false);
  });

  it("should list missing versions when they don't exist in API", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    await fs.write!(manifestPath, JSON.stringify({
      "16.0.0": { expectedFiles: [] },
      "99.0.0": { expectedFiles: [] },
      "88.0.0": { expectedFiles: [] },
    }));

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());
    const result = await verify({ client, manifestPath, fs });

    expect(result.missingVersions).toContain("99.0.0");
    expect(result.missingVersions).toContain("88.0.0");
    expect(result.missingVersions).toHaveLength(2);
  });

  it("should handle empty manifest", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    await fs.write!(manifestPath, JSON.stringify({}));

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(createMockVersions(["16.0.0", "15.1.0"]));
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());
    const result = await verify({ client, manifestPath, fs });

    expect(result.valid).toBe(true);
    expect(result.manifestVersions).toEqual([]);
    expect(result.missingVersions).toEqual([]);
    expect(result.extraVersions).toEqual(["16.0.0", "15.1.0"]);
  });

  it("should throw error when API request fails", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    await fs.write!(manifestPath, JSON.stringify({
      "16.0.0": { expectedFiles: [] },
    }));

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return new HttpResponse(null, { status: 500 });
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

    await expect(verify({ client, manifestPath, fs })).rejects.toThrow(UCDStoreGenericError);
    await expect(verify({ client, manifestPath, fs })).rejects.toThrow(
      "Failed to fetch Unicode versions during verification",
    );
  });

  it("should throw error when API returns no data", async () => {
    const fs = createMemoryMockFS();
    const manifestPath = "/test/.ucd-store.json";

    await fs.write!(manifestPath, JSON.stringify({
      "16.0.0": { expectedFiles: [] },
    }));

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(null);
      }],
    ]);

    const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

    await expect(verify({ client, manifestPath, fs })).rejects.toThrow(UCDStoreGenericError);
    await expect(verify({ client, manifestPath, fs })).rejects.toThrow(
      "Failed to fetch Unicode versions during verification: no data returned",
    );
  });
});
