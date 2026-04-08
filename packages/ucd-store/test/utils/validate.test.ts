import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { mockStoreApi } from "@ucdjs/test-utils/mock-store";
import { HttpResponse, mockFetch } from "@ucdjs/test-utils/msw";
import { UCDStoreGenericError, validateVersions } from "@ucdjs/ucd-store";
import { describe, expect, it } from "vitest";

describe("validateVersions", () => {
  it("should report all versions as valid when the API contains them", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0", "15.0.0"],
      responses: {
        "/api/v1/versions": true,
      },
    });

    const { client } = await createTestContext();
    const result = await validateVersions({
      client,
      versions: ["16.0.0", "15.1.0"],
    });

    expect(result).toEqual({
      valid: true,
      validatedVersions: ["16.0.0", "15.1.0"],
      availableVersions: ["16.0.0", "15.1.0", "15.0.0"],
      validVersions: ["16.0.0", "15.1.0"],
      invalidVersions: [],
    });
  });

  it("should separate valid and invalid versions", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
      responses: {
        "/api/v1/versions": true,
      },
    });

    const { client } = await createTestContext();
    const result = await validateVersions({
      client,
      versions: ["16.0.0", "14.0.0"],
    });

    expect(result.valid).toBe(false);
    expect(result.validVersions).toEqual(["16.0.0"]);
    expect(result.invalidVersions).toEqual(["14.0.0"]);
  });

  it("should throw when the API returns an error", async () => {
    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return new HttpResponse(null, { status: 500 });
      }],
    ]);

    const { client } = await createTestContext();

    await expect(validateVersions({
      client,
      versions: ["16.0.0"],
    })).rejects.toBeInstanceOf(UCDStoreGenericError);
  });

  it("should throw when the API returns no data", async () => {
    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(null);
      }],
    ]);

    const { client } = await createTestContext();

    await expect(validateVersions({
      client,
      versions: ["16.0.0"],
    })).rejects.toThrow("no data returned");
  });
});
