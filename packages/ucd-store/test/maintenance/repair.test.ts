import { existsSync } from "node:fs";
import { mockStoreApi } from "#test-utils/mock-store";
import { HttpResponse } from "#test-utils/msw";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createNodeUCDStore } from "@ucdjs/ucd-store";
import { assert, beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";

describe("store repair", () => {
  beforeEach(() => {
    mockStoreApi({
      baseUrl: UCDJS_API_BASE_URL,
      responses: {
        "/api/v1/versions": [...UNICODE_VERSION_METADATA],
        "/api/v1/versions/{version}/file-tree": [
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
                path: "extracted/DerivedBidiClass.txt",
                lastModified: 1724609100000,
              },
            ],
          },
        ],
        "/api/v1/files/{wildcard}": () => {
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

    const [repairData, repairError] = await store.repair();

    assert(repairError === null, "Expected repair to succeed");
    assert(repairData != null, "Expected repair data to be non-null");
    assert(repairData[0] != null, "Expected first repair result to be non-null");

    expect(repairData[0].version).toBe("15.0.0");
    expect(repairData[0].status).toBe("success");
    expect(repairData[0].failed).toEqual([]);
    expect(repairData[0].removed).toEqual([]);

    expect(repairData[0].restored).toHaveLength(2);
    expect(repairData[0].restored).toEqual(expect.arrayContaining([
      "BidiBrackets.txt",
      "extracted/DerivedBidiClass.txt",
    ]));

    expect(repairData[0].skipped).toHaveLength(1);
    expect(repairData[0].skipped).toEqual(["ArabicShaping.txt"]);

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

    const [repairData, repairError] = await store.repair();

    assert(repairError === null, "Expected repair to succeed");
    assert(repairData != null, "Expected repair data to be non-null");
    assert(repairData[0] != null, "Expected first repair result to be non-null");

    expect(repairData[0].version).toBe("15.0.0");
    expect(repairData[0].status).toBe("success");
    expect(repairData[0].failed).toEqual([]);
    expect(repairData[0].restored).toEqual([]);

    expect(repairData[0].removed).toHaveLength(2);
    expect(repairData[0].removed).toEqual(expect.arrayContaining([
      "orphaned.txt",
      "extracted/orphaned-nested.txt",
    ]));

    expect(repairData[0].skipped).toHaveLength(3);
    expect(repairData[0].skipped).toEqual(expect.arrayContaining([
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

    const [repairData, repairError] = await store.repair();

    assert(repairError === null, "Expected repair to succeed");
    assert(repairData != null, "Expected repair data to be non-null");
    assert(repairData[0] != null, "Expected first repair result to be non-null");

    expect(repairData[0].version).toBe("15.0.0");
    expect(repairData[0].status).toBe("success");
    expect(repairData[0].failed).toEqual([]);

    expect(repairData[0].restored).toHaveLength(2);
    expect(repairData[0].restored).toEqual(expect.arrayContaining([
      "BidiBrackets.txt",
      "extracted/DerivedBidiClass.txt",
    ]));

    expect(repairData[0].removed).toHaveLength(1);
    expect(repairData[0].removed).toEqual(["orphaned.txt"]);

    expect(repairData[0].skipped).toHaveLength(1);
    expect(repairData[0].skipped).toEqual(["ArabicShaping.txt"]);
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

    const [repairData, repairError] = await store.repair();

    assert(repairError === null, "Expected repair to succeed");
    assert(repairData != null, "Expected repair data to be non-null");
    assert(repairData[0] != null, "Expected repair results for 15.0.0");
    assert(repairData[1] != null, "Expected repair results for 16.0.0");

    const repair15Result = repairData[0];
    const repair16Result = repairData[1];

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

    const [repairData, repairError] = await store.repair();

    assert(repairError === null, "Expected repair to succeed");
    assert(repairData != null, "Expected repair data to be non-null");
    assert(repairData[0] != null, "Expected first repair result to be non-null");

    expect(repairData[0].version).toBe("15.0.0");
    expect(repairData[0].status).toBe("success");
    expect(repairData[0].restored).toEqual([]);
    expect(repairData[0].removed).toEqual([]);
    expect(repairData[0].failed).toEqual([]);

    expect(repairData[0].skipped).toHaveLength(3);
    expect(repairData[0].skipped).toEqual(expect.arrayContaining([
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

    const [repairData, repairError] = await store.repair({ dryRun: true });

    assert(repairError === null, "Expected repair to succeed");
    assert(repairData != null, "Expected repair data to be non-null");
    assert(repairData[0] != null, "Expected first repair result to be non-null");

    expect(repairData[0].version).toBe("15.0.0");
    expect(repairData[0].status).toBe("success");

    // in dry run, operations should be identified but not executed
    expect(repairData[0].restored).toHaveLength(2);
    expect(repairData[0].removed).toHaveLength(1);

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
    const [repairData, repairError] = await store.repair({ versions: ["15.0.0"] });

    assert(repairError === null, "Expected repair to succeed");
    assert(repairData != null, "Expected repair data to be non-null");
    assert(repairData[0] != null, "Expected first repair result to be non-null");

    expect(repairData[0].version).toBe("15.0.0");
    expect(repairData[0].status).toBe("success");

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

    const [repairData, repairError] = await store.repair();

    expect(repairData).toBe(null);
    assert(repairError != null, "Expected error to be present");
    expect(repairError.message).toBe("Store is not initialized. Please initialize the store before performing operations.");
  });

  it("should return failure when concurrency is less than 1", async () => {
    const storePath = await testdir();

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();
    const [repairData, repairError] = await store.repair({ concurrency: 0 });

    expect(repairData).toBe(null);
    assert(repairError != null, "Expected error to be present");
    expect(repairError.message).toBe("Concurrency must be a positive integer");
  });
});
