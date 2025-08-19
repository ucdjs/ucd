import { existsSync } from "node:fs";
import { HttpResponse } from "#internal/test-utils/msw";
import { setupMockStore } from "#internal/test-utils/store";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createNodeUCDStore } from "@ucdjs/ucd-store";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";

describe("store repair", () => {
  beforeEach(() => {
    setupMockStore({
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

  it("should repair missing files", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": "existing content",

        // missing files:
        // BidiBrackets.txt
        // extracted/DerivedBidiClass.txt
      },
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/BidiBrackets.txt`)).toBe(false);
    expect(existsSync(`${storePath}/15.0.0/extracted/DerivedBidiClass.txt`)).toBe(false);

    const repairResult = await store.repair();

    assert(repairResult.success === true, "Expected repair to succeed");
    assert(repairResult.data[0] != null, "Expected first repair result to be non-null");

    expect(repairResult.data[0].version).toBe("15.0.0");
    expect(repairResult.data[0].status).toBe("success");
    expect(repairResult.data[0].failed).toEqual([]);
    expect(repairResult.data[0].removed).toEqual([]);

    expect(repairResult.data[0].restored).toHaveLength(2);
    expect(repairResult.data[0].restored).toEqual(expect.arrayContaining([
      "BidiBrackets.txt",
      "extracted/DerivedBidiClass.txt",
    ]));

    expect(repairResult.data[0].skipped).toHaveLength(1);
    expect(repairResult.data[0].skipped).toEqual(["ArabicShaping.txt"]);

    // verify files were actually restored
    expect(existsSync(`${storePath}/15.0.0/BidiBrackets.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/extracted/DerivedBidiClass.txt`)).toBe(true);
  });

  it("should remove orphaned files", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": "content",
        "BidiBrackets.txt": "content",
        "orphaned.txt": "This should not exist",
        "extracted": {
          "DerivedBidiClass.txt": "content",
          "orphaned-nested.txt": "This should also not exist",
        },
      },
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    expect(existsSync(`${storePath}/15.0.0/orphaned.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/extracted/orphaned-nested.txt`)).toBe(true);

    const repairResult = await store.repair();

    assert(repairResult.success === true, "Expected repair to succeed");
    assert(repairResult.data[0] != null, "Expected first repair result to be non-null");

    expect(repairResult.data[0].version).toBe("15.0.0");
    expect(repairResult.data[0].status).toBe("success");
    expect(repairResult.data[0].failed).toEqual([]);
    expect(repairResult.data[0].restored).toEqual([]);

    expect(repairResult.data[0].removed).toHaveLength(2);
    expect(repairResult.data[0].removed).toEqual(expect.arrayContaining([
      "orphaned.txt",
      "extracted/orphaned-nested.txt",
    ]));

    expect(repairResult.data[0].skipped).toHaveLength(3);
    expect(repairResult.data[0].skipped).toEqual(expect.arrayContaining([
      "ArabicShaping.txt",
      "BidiBrackets.txt",
      "extracted/DerivedBidiClass.txt",
    ]));

    // verify orphaned files were removed
    expect(existsSync(`${storePath}/15.0.0/orphaned.txt`)).toBe(false);
    expect(existsSync(`${storePath}/15.0.0/extracted/orphaned-nested.txt`)).toBe(false);

    // verify legitimate files remain
    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/BidiBrackets.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/extracted/DerivedBidiClass.txt`)).toBe(true);
  });

  it("should repair both missing and orphaned files", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": "content",
        "orphaned.txt": "This should not exist",
        // Missing BidiBrackets.txt and extracted/DerivedBidiClass.txt
      },
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    const repairResult = await store.repair();

    assert(repairResult.success === true, "Expected repair to succeed");
    assert(repairResult.data[0] != null, "Expected first repair result to be non-null");

    expect(repairResult.data[0].version).toBe("15.0.0");
    expect(repairResult.data[0].status).toBe("success");
    expect(repairResult.data[0].failed).toEqual([]);

    expect(repairResult.data[0].restored).toHaveLength(2);
    expect(repairResult.data[0].restored).toEqual(expect.arrayContaining([
      "BidiBrackets.txt",
      "extracted/DerivedBidiClass.txt",
    ]));

    expect(repairResult.data[0].removed).toHaveLength(1);
    expect(repairResult.data[0].removed).toEqual(["orphaned.txt"]);

    expect(repairResult.data[0].skipped).toHaveLength(1);
    expect(repairResult.data[0].skipped).toEqual(["ArabicShaping.txt"]);
  });

  it("should repair multiple versions", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": "content",
        "orphaned.txt": "orphaned in 15.0.0",
      },
      "16.0.0": {
        "BidiBrackets.txt": "content",
        "orphaned.txt": "orphaned in 16.0.0",
      },
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0", "16.0.0"],
    });

    await store.init();

    const repairResult = await store.repair();

    assert(repairResult.success === true, "Expected repair to succeed");
    assert(repairResult.data[0] != null, "Expected repair results for 15.0.0");
    assert(repairResult.data[1] != null, "Expected repair results for 16.0.0");

    const repair15Result = repairResult.data[0];
    const repair16Result = repairResult.data[1];

    expect(repair15Result?.version).toBe("15.0.0");
    expect(repair15Result?.status).toBe("success");
    expect(repair16Result?.version).toBe("16.0.0");
    expect(repair16Result?.status).toBe("success");

    // 15.0.0 should restore missing files and remove orphaned
    expect(repair15Result?.restored).toHaveLength(2);
    expect(repair15Result?.removed).toHaveLength(1);
    expect(repair15Result?.skipped).toHaveLength(1);

    // 16.0.0 should restore missing files and remove orphaned
    expect(repair16Result?.restored).toHaveLength(2);
    expect(repair16Result?.removed).toHaveLength(1);
    expect(repair16Result?.skipped).toHaveLength(1);
  });

  it("should handle completely intact store", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    await store.mirror();

    const repairResult = await store.repair();

    assert(repairResult.success === true, "Expected repair to succeed");
    assert(repairResult.data[0] != null, "Expected first repair result to be non-null");

    expect(repairResult.data[0].version).toBe("15.0.0");
    expect(repairResult.data[0].status).toBe("success");
    expect(repairResult.data[0].restored).toEqual([]);
    expect(repairResult.data[0].removed).toEqual([]);
    expect(repairResult.data[0].failed).toEqual([]);

    expect(repairResult.data[0].skipped).toHaveLength(3);
    expect(repairResult.data[0].skipped).toEqual(expect.arrayContaining([
      "ArabicShaping.txt",
      "BidiBrackets.txt",
      "extracted/DerivedBidiClass.txt",
    ]));
  });

  it("should handle dry run mode", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": "content",
        "orphaned.txt": "This should not exist",
      },
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    const repairResult = await store.repair({ dryRun: true });

    assert(repairResult.success === true, "Expected repair to succeed");
    assert(repairResult.data[0] != null, "Expected first repair result to be non-null");

    expect(repairResult.data[0].version).toBe("15.0.0");
    expect(repairResult.data[0].status).toBe("success");

    // in dry run, operations should be identified but not executed
    expect(repairResult.data[0].restored).toHaveLength(2);
    expect(repairResult.data[0].removed).toHaveLength(1);

    // verify no actual changes were made
    expect(existsSync(`${storePath}/15.0.0/orphaned.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/BidiBrackets.txt`)).toBe(false);
    expect(existsSync(`${storePath}/15.0.0/extracted/DerivedBidiClass.txt`)).toBe(false);
  });

  it("should handle specific version repair", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "ArabicShaping.txt": "content",
        "orphaned.txt": "orphaned in 15.0.0",
      },
      "16.0.0": {
        "BidiBrackets.txt": "content",
        "orphaned.txt": "orphaned in 16.0.0",
      },
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0", "16.0.0"],
    });

    await store.init();

    // repair only 15.0.0
    const repairResult = await store.repair({ versions: ["15.0.0"] });

    assert(repairResult.success === true, "Expected repair to succeed");
    assert(repairResult.data[0] != null, "Expected first repair result to be non-null");

    expect(repairResult.data[0].version).toBe("15.0.0");
    expect(repairResult.data[0].status).toBe("success");

    // verify 15.0.0 was repaired
    expect(existsSync(`${storePath}/15.0.0/orphaned.txt`)).toBe(false);

    // verify 16.0.0 was not touched
    expect(existsSync(`${storePath}/16.0.0/orphaned.txt`)).toBe(true);
  });

  it("should handle store not initialized error", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    const repairResult = await store.repair();

    expect(repairResult.success).toBe(false);
    expect(repairResult.data).toEqual([]);
    expect(repairResult.errors).toHaveLength(1);
    expect(repairResult.errors[0]).toEqual({
      message: "Store is not initialized. Please initialize the store before performing operations.",
      type: "NOT_INITIALIZED",
    });
  });

  it("should return failure when concurrency is less than 1", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    const repairResult = await store.repair({ concurrency: 0 });

    assert(repairResult.success === false, "Expected mirror operation to be unsuccessful");
    assert(repairResult.data === undefined, "Expected no versions to be mirrored");

    expect(repairResult.data).toBeUndefined();
    expect(repairResult.errors).toHaveLength(1);

    assert(repairResult.errors[0] != null, "Expected error to be present");
    expect(repairResult.errors[0].type).toBe("GENERIC");
    expect(repairResult.errors[0].message).toBe("Concurrency must be at least 1");
  });
});
