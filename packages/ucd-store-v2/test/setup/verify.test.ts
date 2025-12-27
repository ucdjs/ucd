import {
  createTestContext,
} from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError } from "../../src/errors";
import { verify } from "../../src/setup/verify";

describe("verify", () => {
  describe("valid lockfile", () => {
    it("should return valid result when all lockfile versions exist in API", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0"],
        lockfile: createEmptyLockfile(["16.0.0", "15.1.0"]),
      });

      // Act
      const result = await verify({
        client: context.client,
        lockfilePath,
        fs,
      });

      // Assert
      expect(result.valid).toBe(true);
      expect(result.lockfileVersions).toEqual(["16.0.0", "15.1.0"]);
      expect(result.missingVersions).toEqual([]);
    });

    it("should include extra versions available in API but not in lockfile", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0", "15.0.0", "14.0.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const result = await verify({
        client: context.client,
        lockfilePath,
        fs,
      });

      // Assert
      expect(result.valid).toBe(true);
      expect(result.extraVersions).toContain("15.1.0");
      expect(result.extraVersions).toContain("15.0.0");
      expect(result.extraVersions).toContain("14.0.0");
      expect(result.extraVersions).toHaveLength(3);
    });
  });

  describe("invalid lockfile", () => {
    it("should return invalid result when lockfile has versions not in API", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "15.1.0", "99.0.0"],
        lockfile: createEmptyLockfile(["16.0.0", "15.1.0", "99.0.0"]),
      });

      // Act
      const result = await verify({
        client: context.client,
        lockfilePath,
        fs,
      });

      // Assert
      expect(result.valid).toBe(false);
    });

    it("should list missing versions when they don't exist in API", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0", "99.0.0", "88.0.0"],
        lockfile: createEmptyLockfile(["16.0.0", "99.0.0", "88.0.0"]),
      });

      // Act
      const result = await verify({
        client: context.client,
        lockfilePath,
        fs,
      });

      // Assert
      expect(result.missingVersions).toContain("99.0.0");
      expect(result.missingVersions).toContain("88.0.0");
      expect(result.missingVersions).toHaveLength(2);
    });
  });

  describe("edge cases", () => {
    it("should handle empty lockfile", async () => {
      // Arrange
      mockStoreApi({
        versions: ["16.0.0", "15.1.0"],
      });

      const { context, fs, lockfilePath } = await createTestContext({
        versions: [],
        lockfile: createEmptyLockfile([]),
      });

      // Act
      const result = await verify({
        client: context.client,
        lockfilePath,
        fs,
      });

      // Assert
      expect(result.valid).toBe(true);
      expect(result.lockfileVersions).toEqual([]);
      expect(result.missingVersions).toEqual([]);
      expect(result.extraVersions).toEqual(["16.0.0", "15.1.0"]);
    });
  });

  describe("error handling", () => {
    it("should throw UCDStoreGenericError when API request fails", async () => {
      // Arrange
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act & Assert
      await expect(
        verify({
          client: context.client,
          lockfilePath,
          fs,
        }),
      ).rejects.toThrow(UCDStoreGenericError);
    });

    it("should include 'Failed to fetch Unicode versions during verification' in error message", async () => {
      // Arrange
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return new HttpResponse(null, { status: 500 });
        }],
      ]);

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const error = await verify({
        client: context.client,
        lockfilePath,
        fs,
      }).catch((e) => e);

      // Assert
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error.message).toContain("Failed to fetch Unicode versions during verification");
    });

    it("should throw UCDStoreGenericError when API returns no data", async () => {
      // Arrange
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(null);
        }],
      ]);

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act & Assert
      await expect(
        verify({
          client: context.client,
          lockfilePath,
          fs,
        }),
      ).rejects.toThrow(UCDStoreGenericError);
    });

    it("should include 'no data returned' in error message", async () => {
      // Arrange
      mockFetch([
        ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
          return HttpResponse.json(null);
        }],
      ]);

      const { context, fs, lockfilePath } = await createTestContext({
        versions: ["16.0.0"],
        lockfile: createEmptyLockfile(["16.0.0"]),
      });

      // Act
      const error = await verify({
        client: context.client,
        lockfilePath,
        fs,
      }).catch((e) => e);

      // Assert
      expect(error).toBeInstanceOf(UCDStoreGenericError);
      expect(error.message).toContain("Failed to fetch Unicode versions during verification: no data returned");
    });
  });
});
