import type { VersionComparison } from "../../src/operations/compare";
import { createTestContext } from "#internal-pkg:test-utils/test-context";
import { mockStoreApi } from "#test-utils/mock-store";
import { createEmptyLockfile } from "@ucdjs/lockfile/test-utils";
import { describe, expect, it } from "vitest";
import { compare } from "../../src/operations/compare";

describe("compare", () => {
  it("should detect added, removed and modified files", async () => {
    mockStoreApi({
      versions: ["15.0.0", "16.0.0"],
      files: {
        "15.0.0": [
          { name: "A.txt", path: "A.txt", lastModified: Date.now(), type: "file" },
          { name: "B.txt", path: "B.txt", lastModified: Date.now(), type: "file" },
        ],
        "16.0.0": [
          { name: "B.txt", path: "B.txt", lastModified: Date.now(), type: "file" },
          { name: "C.txt", path: "C.txt", lastModified: Date.now(), type: "file" },
        ],
      },
    });

    const { context } = await createTestContext({
      versions: ["15.0.0", "16.0.0"],
      lockfile: createEmptyLockfile(["15.0.0", "16.0.0"]),
      initialFiles: {
        "/test/15.0.0/A.txt": "alpha",
        "/test/15.0.0/B.txt": "original",
        "/test/16.0.0/B.txt": "modified",
        "/test/16.0.0/C.txt": "new",
      },
    });

    const [data, error] = await compare(context, { from: "15.0.0", to: "16.0.0" });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    expect(data).toEqual({
      from: "15.0.0",
      to: "16.0.0",
      files: {
        added: ["C.txt"],
        removed: ["A.txt"],
        modified: ["B.txt"],
        unchanged: [],
      },
      counts: {
        fromTotal: 2,
        toTotal: 2,
        added: 1,
        removed: 1,
        modified: 1,
        unchanged: 0,
      },
    } satisfies VersionComparison);
  });

  it("should respect includeFileHashes=false and mark common files as unchanged", async () => {
    mockStoreApi({
      versions: ["15.0.0", "16.0.0"],
      files: {
        "15.0.0": [
          { name: "B.txt", path: "B.txt", lastModified: Date.now(), type: "file" },
        ],
        "16.0.0": [
          { name: "B.txt", path: "B.txt", lastModified: Date.now(), type: "file" },
        ],
      },
    });

    const { context } = await createTestContext({
      versions: ["15.0.0", "16.0.0"],
      lockfile: createEmptyLockfile(["15.0.0", "16.0.0"]),
      initialFiles: {
        "/test/15.0.0/B.txt": "original",
        "/test/16.0.0/B.txt": "modified",
      },
    });

    const [data, error] = await compare(context, { from: "15.0.0", to: "16.0.0", includeFileHashes: false });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    expect(data?.files).toEqual({
      added: [],
      removed: [],
      modified: [],
      unchanged: ["B.txt"],
    });
  });

  it("should return all files as unchanged when comparing a version to itself", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
      files: {
        "16.0.0": [
          { name: "X.txt", path: "X.txt", lastModified: Date.now(), type: "file" },
        ],
      },
    });

    const { context } = await createTestContext({
      versions: ["16.0.0"],
      lockfile: createEmptyLockfile(["16.0.0"]),
      initialFiles: {
        "/test/16.0.0/X.txt": "content",
      },
    });

    const [data, error] = await compare(context, { from: "16.0.0", to: "16.0.0" });

    expect(error).toBeNull();
    expect(data).toBeDefined();

    expect(data?.files).toEqual({
      added: [],
      removed: [],
      modified: [],
      unchanged: ["X.txt"],
    });
  });
});
