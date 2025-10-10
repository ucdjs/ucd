import { existsSync, readFileSync } from "node:fs";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse, mockFetch } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { dedent } from "@luxass/utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { assertCapability } from "@ucdjs/fs-bridge";
import { createNodeUCDStore } from "@ucdjs/ucd-store";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { captureSnapshot, testdir } from "vitest-testdirs";

describe("store clean", () => {
  beforeEach(() => {
    mockStoreApi({
      baseUrl: UCDJS_API_BASE_URL,
      responses: {
        "/api/v1/versions": [...UNICODE_VERSION_METADATA],
        "/api/v1/versions/:version/file-tree": [
          {
            type: "file",
            name: "ArabicShaping.txt",
            path: "ArabicShaping.txt",
            lastModified: 1644920820000,
          },
          {
            type: "file",
            name: "BidiBrackets.txt",
            path: "BidiBrackets.txt",
            lastModified: 1651584360000,
          },
          {
            type: "directory",
            name: "extracted",
            path: "extracted",
            lastModified: 1724676960000,
            children: [
              {
                type: "file",
                name: "DerivedBidiClass.txt",
                path: "DerivedBidiClass.txt",
                lastModified: 1724609100000,
              },
            ],
          },
        ],
        "/api/v1/files/:wildcard": () => {
          return HttpResponse.text("File content");
        },
      },
    });

    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should clean a valid store", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    await store.mirror();

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/BidiBrackets.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/extracted/DerivedBidiClass.txt`)).toBe(true);

    const [cleanData, cleanError] = await store.clean();

    assert(cleanError === null, "Expected clean to succeed");
    assert(cleanData != null, "Expected clean data to be non-null");
    assert(cleanData[0] != null, "Expected first clean result to be non-null");

    expect(cleanData[0].version).toBe("15.0.0");
    expect(cleanData[0].skipped).toEqual([]);
    expect(cleanData[0].failed).toEqual([]);

    expect(cleanData[0].deleted).toHaveLength(3);
    expect(cleanData[0].deleted).toEqual(expect.arrayContaining([
      "ArabicShaping.txt",
      "extracted/DerivedBidiClass.txt",
      "BidiBrackets.txt",
    ]));

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(false);
    expect(existsSync(`${storePath}/15.0.0/BidiBrackets.txt`)).toBe(false);
    expect(existsSync(`${storePath}/15.0.0/extracted/DerivedBidiClass.txt`)).toBe(false);

    // expect that all directories was also cleared.
    expect(existsSync(`${storePath}/15.0.0/extracted`)).toBe(false);
    expect(existsSync(`${storePath}/15.0.0`)).toBe(false);
  });

  it("should handle orphaned files", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "orphaned.txt": "This is an orphaned file",
      },
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    await store.mirror();

    const [cleanData, cleanError] = await store.clean();

    assert(cleanError === null, "Expected clean to succeed");
    assert(cleanData != null, "Expected clean data to be non-null");
    assert(cleanData[0] != null, "Expected first clean result to be non-null");

    expect(cleanData[0].version).toBe("15.0.0");
    expect(cleanData[0].skipped).toEqual([]);
    expect(cleanData[0].failed).toEqual([]);

    expect(cleanData[0].deleted).toHaveLength(4);
    expect(cleanData[0].deleted).toEqual(expect.arrayContaining([
      "ArabicShaping.txt",
      "extracted/DerivedBidiClass.txt",
      "BidiBrackets.txt",
      "orphaned.txt",
    ]));

    expect(existsSync(`${storePath}/15.0.0/orphaned.txt`)).toBe(false);
  });

  it("should skip files that are not in the store", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "not-in-store.txt": "This file is not in the store",
        "ArabicShaping.txt": "content",
        "BidiBrackets.txt": "content",
        "extracted": {
          "DerivedBidiClass.txt": "content",
        },
      },
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    assertCapability(store.fs, ["rm", "exists"]);
    expect(await store.fs.exists(`./15.0.0/ArabicShaping.txt`)).toBe(true);

    vi.spyOn(store, "analyze").mockResolvedValue([
      [{
        version: "15.0.0",
        files: ["ArabicShaping.txt", "BidiBrackets.txt", "extracted/DerivedBidiClass.txt"],
        missingFiles: [],
        orphanedFiles: ["not-in-store.txt"],
        fileCount: 4,
        expectedFileCount: 3,
        isComplete: false,
      }],
      null,
    ]);

    await store.fs.rm(`./15.0.0/not-in-store.txt`);
    expect(await store.fs.exists(`./15.0.0/not-in-store.txt`)).toBe(false);

    const [cleanData, cleanError] = await store.clean({ concurrency: 1 });

    assert(cleanError === null, "Expected clean to succeed");
    assert(cleanData != null, "Expected clean data to be non-null");
    assert(cleanData[0] != null, "Expected first clean result to be non-null");

    expect(cleanData[0].version).toBe("15.0.0");
    expect(cleanData[0].skipped).toEqual(["not-in-store.txt"]);
    expect(cleanData[0].failed).toEqual([]);
    expect(cleanData[0].deleted).toHaveLength(3);
  });

  it("should clean multiple versions", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: [
        "15.0.0",
        "16.0.0",
      ],
    });

    await store.init();
    await store.mirror();

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(readFileSync(`${storePath}/.ucd-store.json`, "utf-8")).toBe(JSON.stringify({
      "15.0.0": "15.0.0",
      "16.0.0": "16.0.0",
    }, null, 2));

    const [cleanData, cleanError] = await store.clean();

    assert(cleanError === null, "Expected clean to succeed");
    assert(cleanData != null, "Expected clean data to be non-null");
    assert(cleanData[0] != null, "Expected clean results for 15.0.0");
    assert(cleanData[1] != null, "Expected clean results for 16.0.0");

    const clean15Result = cleanData[0];
    const clean16Result = cleanData[1];

    expect(clean15Result.version).toBe("15.0.0");
    expect(clean16Result.version).toBe("16.0.0");

    expect(clean15Result.skipped).toEqual([]);
    expect(clean16Result.skipped).toEqual([]);

    expect(clean15Result.failed).toEqual([]);
    expect(clean16Result.failed).toEqual([]);

    expect(clean15Result.deleted).toHaveLength(3);
    expect(clean15Result.deleted).toEqual(expect.arrayContaining([
      "ArabicShaping.txt",
      "extracted/DerivedBidiClass.txt",
      "BidiBrackets.txt",
    ]));

    expect(clean16Result.deleted).toHaveLength(3);
    expect(clean16Result.deleted).toEqual(expect.arrayContaining([
      "ArabicShaping.txt",
      "extracted/DerivedBidiClass.txt",
      "BidiBrackets.txt",
    ]));
  });

  it("should clean single version in multiple version store", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: [
        "15.0.0",
        "16.0.0",
      ],
    });

    await store.init();
    await store.mirror();

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(readFileSync(`${storePath}/.ucd-store.json`, "utf-8")).toBe(JSON.stringify({
      "15.0.0": "15.0.0",
      "16.0.0": "16.0.0",
    }, null, 2));

    const [cleanData, cleanError] = await store.clean({
      versions: ["15.0.0"],
    });

    assert(cleanError === null, "Expected clean to succeed");
    assert(cleanData != null, "Expected clean data to be non-null");
    assert(cleanData[0] != null, "Expected first clean result to be non-null");

    expect(cleanData[0].version).toBe("15.0.0");
    expect(cleanData[0].skipped).toEqual([]);
    expect(cleanData[0].failed).toEqual([]);
    expect(cleanData[0].deleted).toHaveLength(3);
    expect(cleanData[0].deleted).toEqual(expect.arrayContaining([
      "ArabicShaping.txt",
      "extracted/DerivedBidiClass.txt",
      "BidiBrackets.txt",
    ]));

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(readFileSync(`${storePath}/.ucd-store.json`, "utf-8")).toBe(JSON.stringify({
      "16.0.0": "16.0.0",
    }, null, 2));
  });

  it.todo("should handle empty store", async () => {
    const storePath = await testdir();

    mockFetch([
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/:version/file-tree`, () => {
        return HttpResponse.json([]);
      }],
    ]);

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    await store.mirror();

    const [cleanData, cleanError] = await store.clean();

    assert(cleanError === null, "Expected clean to succeed");
    assert(cleanData != null, "Expected clean data to be non-null");
    assert(cleanData[0] != null, "Expected first clean result to be non-null");

    expect(cleanData[0].version).toBe("15.0.0");
    expect(cleanData[0].skipped).toEqual([]);
    expect(cleanData[0].failed).toEqual([]);
    expect(cleanData[0].deleted).toHaveLength(0);
  });

  it("should return failure when concurrency is less than 1", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    const [cleanData, cleanError] = await store.clean({ concurrency: 0 });

    expect(cleanData).toBe(null);
    expect(cleanError).toBeTruthy();
    expect(cleanError?.message).toBe("Concurrency must be a positive integer");
  });

  it("should skip file deletion if it doesn't exist", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    await store.mirror();

    assertCapability(store.fs, ["rm", "exists"]);
    expect(await store.fs.exists(`./15.0.0/ArabicShaping.txt`)).toBe(true);

    vi.spyOn(store, "analyze").mockResolvedValue([
      [{
        version: "15.0.0",
        files: ["BidiBrackets.txt", "extracted/DerivedBidiClass.txt"],
        missingFiles: [],
        orphanedFiles: ["ArabicShaping.txt"],
        fileCount: 2,
        expectedFileCount: 3,
        isComplete: false,
      }],
      null,
    ]);

    await store.fs.rm(`./15.0.0/ArabicShaping.txt`);
    expect(await store.fs.exists(`./15.0.0/ArabicShaping.txt`)).toBe(false);

    const [cleanData, cleanError] = await store.clean({ concurrency: 1 });

    assert(cleanError === null, "Expected clean to succeed");
    assert(cleanData != null, "Expected clean data to be non-null");
    assert(cleanData[0] != null, "Expected first clean result to be non-null");

    expect(cleanData[0].version).toBe("15.0.0");
    expect(cleanData[0].skipped).toEqual(["ArabicShaping.txt"]);
    expect(cleanData[0].failed).toEqual([]);
    expect(cleanData[0].deleted).toEqual(expect.arrayContaining([
      "extracted/DerivedBidiClass.txt",
      "BidiBrackets.txt",
    ]));
  });

  it("should report failure when deletion rejects", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    await store.mirror();

    assertCapability(store.fs, ["rm", "exists"]);
    await store.fs.rm(`./15.0.0/ArabicShaping.txt`);

    vi.spyOn(store.fs, "exists").mockResolvedValue(true);

    vi.spyOn(store, "analyze").mockResolvedValue([
      [{
        version: "15.0.0",
        files: ["BidiBrackets.txt", "extracted/DerivedBidiClass.txt"],
        missingFiles: [],
        orphanedFiles: ["ArabicShaping.txt"],
        fileCount: 2,
        expectedFileCount: 3,
        isComplete: false,
      }],
      null,
    ]);

    const [cleanData, cleanError] = await store.clean({ concurrency: 1 });

    assert(cleanError === null, "Expected clean to succeed");
    assert(cleanData != null, "Expected clean data to be non-null");
    assert(cleanData[0] != null, "Expected first clean result to be non-null");

    expect(cleanData[0].version).toBe("15.0.0");
    expect(cleanData[0].skipped).toEqual([]);
    expect(cleanData[0].failed).toEqual(["ArabicShaping.txt"]);
    expect(cleanData[0].deleted).toEqual(expect.arrayContaining([
      "extracted/DerivedBidiClass.txt",
      "BidiBrackets.txt",
    ]));
  });

  it("should not remove any files when using dryRun", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    await store.mirror();

    const beforeCleanSnapshot = await captureSnapshot(storePath);

    const [cleanData, cleanError] = await store.clean({ dryRun: true });

    assert(cleanError === null, "Expected clean to succeed");
    assert(cleanData != null, "Expected clean data to be non-null");
    assert(cleanData[0] != null, "Expected first clean result to be non-null");

    expect(cleanData[0].version).toBe("15.0.0");
    expect(cleanData[0].skipped).toEqual([]);
    expect(cleanData[0].failed).toEqual([]);
    expect(cleanData[0].deleted).toHaveLength(3);

    const afterCleanSnapshot = await captureSnapshot(storePath);

    expect(beforeCleanSnapshot).toEqual(dedent`
      vitest-clean-store-clean-should-not-remove-any-files-when-using-dryRun/
      ├── 15.0.0/
      │   ├── extracted/
      │   │   └── DerivedBidiClass.txt
      │   ├── ArabicShaping.txt
      │   └── BidiBrackets.txt
      └── .ucd-store.json
    `);
    expect(beforeCleanSnapshot).toEqual(afterCleanSnapshot);
  });
});
