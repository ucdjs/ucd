import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { describe, expect, it } from "vitest";
import { UCDStoreGenericError } from "../src/errors";

describe("getExpectedFilePaths", () => {
  describe("successful retrieval", () => {
    it("should return file paths from manifest endpoint", async () => {
      mockStoreApi({
        versions: ["15.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [
              "ReadMe.txt",
              "UnicodeData.txt",
              "ucd/emoji-data.txt",
            ],
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["15.0.0"],
      });

      const result = await context.getExpectedFilePaths("15.0.0");

      expect(result).toEqual([
        "ReadMe.txt",
        "UnicodeData.txt",
        "ucd/emoji-data.txt",
      ]);
    });

    it("should handle empty expectedFiles array", async () => {
      mockStoreApi({
        versions: ["15.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            expectedFiles: [],
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["15.0.0"],
      });

      const result = await context.getExpectedFilePaths("15.0.0");

      expect(result).toEqual([]);
    });
  });

  describe("error handling", () => {
    it("should throw UCDStoreGenericError when API returns error", async () => {
      mockStoreApi({
        versions: ["15.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            status: 404,
            message: "Version not found",
            timestamp: new Date().toISOString(),
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["15.0.0"],
      });

      await expect(
        context.getExpectedFilePaths("15.0.0"),
      ).rejects.toThrow(UCDStoreGenericError);
    });

    it("should throw error when manifest response is invalid", async () => {
      mockStoreApi({
        versions: ["15.0.0"],
        responses: {
          "/.well-known/ucd-store/{version}.json": {
            // @ts-expect-error - This is a test error
            // Missing expectedFiles
            version: "15.0.0",
          },
        },
      });

      const { context } = await createTestContext({
        versions: ["15.0.0"],
      });

      await expect(
        context.getExpectedFilePaths("15.0.0"),
      ).rejects.toThrow();
    });
  });
});
