import type { FSAdapter } from "@ucdjs/utils/types";
import { afterAll, beforeEach, describe, expect, expectTypeOf, it, vi } from "vitest";
import { createDefaultFSAdapter } from "../../src/ucd-files";

vi.mock("node:fs/promises", { spy: true });

// eslint-disable-next-line test/prefer-lowercase-title
describe("FS Adapter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // TODO: make this fail, if some methods are not implemented
  it("should implement all methods", async () => {
    const fs = await createDefaultFSAdapter();

    expect(fs.readFile).toBeDefined();
    expect(fs.writeFile).toBeDefined();
    expect(fs.mkdir).toBeDefined();
    expect(fs.ensureDir).toBeDefined();
    expect(fs.exists).toBeDefined();
    expect(fs.readdir).toBeDefined();
  });

  it("should read file successfully", async () => {
    const { readFile } = await import("node:fs/promises");

    // mock the spy's return value for this test
    vi.mocked(readFile).mockResolvedValue("file content");

    const fs = await createDefaultFSAdapter();
    const result = await fs.readFile("/test.txt");

    expect(result).toBe("file content");
    expect(readFile).toHaveBeenCalledWith("/test.txt", "utf-8");
  });

  it("should write file successfully", async () => {
    const { writeFile } = await import("node:fs/promises");

    // mock the spy's return value for this test
    vi.mocked(writeFile).mockResolvedValue(undefined);

    const fs = await createDefaultFSAdapter();
    await fs.writeFile("/test.txt", "file content");

    expect(writeFile).toHaveBeenCalledWith("/test.txt", "file content", "utf-8");
  });
});

// eslint-disable-next-line test/prefer-lowercase-title
describe("FS Adapter - module unavailable", () => {
  afterAll(() => {
    vi.resetModules();
    vi.doMock("node:fs/promises", { spy: true });
  });
  it("should throw error when node:fs/promises is not available", async () => {
    vi.doMock("node:fs/promises", () => {
      throw new Error("Module not found");
    });

    await expect(createDefaultFSAdapter()).rejects.toThrow(
      "Failed to load file system module",
    );
  });
});
