import { existsSync, readFileSync } from "node:fs";
import { HttpResponse, mockFetch } from "#msw-utils";
import { UNICODE_VERSION_METADATA } from "@luxass/unicode-utils-new";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createNodeUCDStore } from "@ucdjs/ucd-store";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { testdir } from "vitest-testdirs";

const MOCK_FILES = [
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
];

describe("store clean", () => {
  beforeEach(() => {
    mockFetch([
      [["GET", "HEAD"], `${UCDJS_API_BASE_URL}/api/v1/versions`, () => {
        return HttpResponse.json(UNICODE_VERSION_METADATA);
      }],
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/versions/:version/file-tree`, () => {
        return HttpResponse.json(MOCK_FILES);
      }],
      ["GET", `${UCDJS_API_BASE_URL}/api/v1/files/*`, () => {
        return HttpResponse.text("File content");
      }],
    ]);

    vi.clearAllMocks();
    vi.unstubAllEnvs();
  });

  it("should clean a valid store", async () => {
    const storePath = await testdir({}, {
      cleanup: false,
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/ArabicShaping.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/BidiBrackets.txt`)).toBe(true);
    expect(existsSync(`${storePath}/15.0.0/extracted/DerivedBidiClass.txt`)).toBe(true);

    const [clean15Result] = await store.clean();

    expect(clean15Result?.version).toBe("15.0.0");
    expect(clean15Result?.skipped).toEqual([]);
    expect(clean15Result?.failed).toEqual([]);

    expect(clean15Result?.deleted).toHaveLength(3);
    expect(clean15Result?.deleted).toEqual(expect.arrayContaining([
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

    const [clean15Result] = await store.clean();

    expect(clean15Result?.version).toBe("15.0.0");
    expect(clean15Result?.skipped).toEqual([]);
    expect(clean15Result?.failed).toEqual([]);

    expect(clean15Result?.deleted).toHaveLength(4);
    expect(clean15Result?.deleted).toEqual(expect.arrayContaining([
      "ArabicShaping.txt",
      "extracted/DerivedBidiClass.txt",
      "BidiBrackets.txt",
      "orphaned.txt",
    ]));

    expect(existsSync(`${storePath}/15.0.0/orphaned.txt`)).toBe(false);
  });

  it.todo("should skip files that are not in the store", async () => {
    const storePath = await testdir({
      "15.0.0": {
        "not-in-store.txt": "This file is not in the store",
      },
    });

    const store = await createNodeUCDStore({
      basePath: storePath,
      versions: ["15.0.0"],
    });

    await store.init();

    const [clean15Result] = await store.clean();

    expect(clean15Result?.version).toBe("15.0.0");
    expect(clean15Result?.skipped).toEqual(["/not-in-store.txt"]);
    expect(clean15Result?.failed).toEqual([]);
    expect(clean15Result?.deleted).toHaveLength(3);
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

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(readFileSync(`${storePath}/.ucd-store.json`, "utf-8")).toBe(JSON.stringify({
      "15.0.0": "15.0.0",
      "16.0.0": "16.0.0",
    }, null, 2));

    const [clean15Result, clean16Result] = await store.clean();
    expect(clean15Result?.version).toBe("15.0.0");
    expect(clean16Result?.version).toBe("16.0.0");

    expect(clean15Result?.skipped).toEqual([]);
    expect(clean16Result?.skipped).toEqual([]);

    expect(clean15Result?.failed).toEqual([]);
    expect(clean16Result?.failed).toEqual([]);

    expect(clean15Result?.deleted).toHaveLength(3);
    expect(clean15Result?.deleted).toEqual(expect.arrayContaining([
      "ArabicShaping.txt",
      "extracted/DerivedBidiClass.txt",
      "BidiBrackets.txt",
    ]));

    expect(clean16Result?.deleted).toHaveLength(3);
    expect(clean16Result?.deleted).toEqual(expect.arrayContaining([
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

    expect(existsSync(`${storePath}/.ucd-store.json`)).toBe(true);
    expect(readFileSync(`${storePath}/.ucd-store.json`, "utf-8")).toBe(JSON.stringify({
      "15.0.0": "15.0.0",
      "16.0.0": "16.0.0",
    }, null, 2));

    const [clean15Result] = await store.clean({
      versions: ["15.0.0"],
    });

    expect(clean15Result?.version).toBe("15.0.0");
    expect(clean15Result?.skipped).toEqual([]);
    expect(clean15Result?.failed).toEqual([]);
    expect(clean15Result?.deleted).toHaveLength(3);
    expect(clean15Result?.deleted).toEqual(expect.arrayContaining([
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

    const [clean15Result] = await store.clean();

    expect(clean15Result?.version).toBe("15.0.0");
    expect(clean15Result?.skipped).toEqual([]);
    expect(clean15Result?.failed).toEqual([]);
    expect(clean15Result?.deleted).toHaveLength(0);
  });
});
