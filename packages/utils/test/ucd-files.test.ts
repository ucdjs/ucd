import { beforeEach, describe, expect, it, vi } from "vitest";
import { createDefaultFSAdapter } from "../src/ucd-files";

const mockReadFile = vi.fn();

vi.mock("node:fs/promises", () => ({ readFile: mockReadFile }));

// eslint-disable-next-line test/prefer-lowercase-title
describe("FS Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should implement all methods", async () => {
    const fs = await createDefaultFSAdapter();

    expect(fs.readFile).toBeDefined();
  });

  it("should read file successfully", async () => {
    mockReadFile.mockResolvedValue("file content");

    const fs = await createDefaultFSAdapter();
    const result = await fs.readFile("/test.txt");

    expect(result).toBe("file content");
    expect(mockReadFile).toHaveBeenCalledWith("/test.txt", "utf-8");
  });

  describe("when node:fs/promises is not available", () => {
    beforeEach(() => {
      vi.resetModules();
    });

    it("should throw error", async () => {
      vi.doMock("node:fs/promises", () => {
        throw new Error("Module not found");
      });

      await expect(createDefaultFSAdapter()).rejects.toThrow(
        "Failed to load file system module",
      );
    });
  });
});
