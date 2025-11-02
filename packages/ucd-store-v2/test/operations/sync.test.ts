import type { MirrorReport } from "../../src/operations/mirror";
import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { mockStoreApi } from "#test-utils/mock-store";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it, vi } from "vitest";
import { createInternalContext } from "../../src/core/context";
import { mirror } from "../../src/operations/mirror";
import { sync } from "../../src/operations/sync";

vi.mock("../../src/operations/mirror", async (importOriginal) => {
  const original = await importOriginal<typeof import("../../src/operations/mirror")>();
  return {
    ...original,
    mirror: vi.fn(original.mirror),
  };
});

describe("sync", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  it("should sync with default add strategy", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0", "15.0.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/.ucd-store.json": JSON.stringify({
          "16.0.0": "16.0.0",
        }),
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await sync(context);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toMatchObject({
      timestamp: expect.any(String),
      added: ["15.1.0", "15.0.0"],
      removed: [],
      unchanged: ["16.0.0"],
      versions: expect.arrayContaining(["16.0.0", "15.1.0", "15.0.0"]),
    });
    expect(data?.versions).toHaveLength(3);

    const manifestContent = await fs.read("/test/.ucd-store.json");
    expect(manifestContent).toBe(JSON.stringify({
      "16.0.0": "16.0.0",
      "15.1.0": "15.1.0",
      "15.0.0": "15.0.0",
    }, null, 2));
  });

  it("should use add strategy and keep versions not in API", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/.ucd-store.json": JSON.stringify({
          "16.0.0": "16.0.0",
          "14.0.0": "14.0.0",
        }),
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0", "14.0.0"], // 14.0.0 not in API
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await sync(context, {
      strategy: "add",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toMatchObject({
      timestamp: expect.any(String),
      added: ["15.1.0"],
      removed: [], // add strategy doesn't remove
      unchanged: ["16.0.0", "14.0.0"],
      versions: expect.arrayContaining(["16.0.0", "15.1.0", "14.0.0"]),
    });
    expect(data?.versions).toHaveLength(3);

    const manifestContent = await fs.read("/test/.ucd-store.json");
    expect(manifestContent).toBe(JSON.stringify({
      "16.0.0": "16.0.0",
      "14.0.0": "14.0.0",
      "15.1.0": "15.1.0",
    }, null, 2));
  });

  it("should use update strategy and remove versions not in API", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/.ucd-store.json": JSON.stringify({
          "16.0.0": "16.0.0",
          "15.0.0": "15.0.0",
        }),
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0", "15.0.0"], // 15.0.0 not in API
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await sync(context, {
      strategy: "update",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toMatchObject({
      timestamp: expect.any(String),
      added: ["15.1.0"],
      removed: ["15.0.0"], // update strategy removes unavailable versions
      unchanged: ["16.0.0"],
      versions: expect.arrayContaining(["16.0.0", "15.1.0"]),
    });
    expect(data?.versions).toHaveLength(2);
    expect(data?.versions).not.toContain("15.0.0");

    const manifestContent = await fs.read("/test/.ucd-store.json");
    expect(manifestContent).toBe(JSON.stringify({
      "16.0.0": "16.0.0",
      "15.1.0": "15.1.0",
    }, null, 2));
  });

  it("should support mirror option and mirror new versions", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/.ucd-store.json": JSON.stringify({
          "16.0.0": "16.0.0",
        }),
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    // Mock the mirror function to return a successful mirror result
    const mockMirrorReport: MirrorReport = {
      timestamp: new Date().toISOString(),
      versions: new Map([
        [
          "15.1.0",
          {
            version: "15.1.0",
            counts: { downloaded: 5, skipped: 0, failed: 0 },
            files: {
              downloaded: [],
              skipped: [],
              failed: [],
            },
            metrics: {
              cacheHitRate: 0,
              failureRate: 0,
              successRate: 100,
            },
            errors: [],
          },
        ],
      ]),
    };

    vi.mocked(mirror).mockResolvedValueOnce([mockMirrorReport, null]);

    const [data, error] = await sync(context, {
      mirror: true,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.added).toEqual(["15.1.0"]);
    expect(data?.mirrored).toBeDefined();
    expect(data?.mirrored).toEqual(mockMirrorReport);
    expect(mirror).toHaveBeenCalledWith(context, { versions: ["15.1.0"] });

    const manifestContent = await fs.read("/test/.ucd-store.json");
    expect(manifestContent).toBe(JSON.stringify({
      "16.0.0": "16.0.0",
      "15.1.0": "15.1.0",
    }, null, 2));
  });

  it("should return proper result structure when no changes", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/.ucd-store.json": JSON.stringify({
          "16.0.0": "16.0.0",
        }),
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await sync(context);

    expect(error).toBeNull();
    expect(data).toEqual({
      timestamp: expect.any(String),
      added: [],
      removed: [],
      unchanged: ["16.0.0"],
      versions: ["16.0.0"],
    });

    const manifestContent = await fs.read("/test/.ucd-store.json");
    expect(manifestContent).toBe(JSON.stringify({
      "16.0.0": "16.0.0",
    }, null, 2));
  });

  it("should not include mirrored property when mirror:true but no new versions", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS({
      initialFiles: {
        "/test/.ucd-store.json": JSON.stringify({
          "16.0.0": "16.0.0",
        }),
      },
    });

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await sync(context, {
      mirror: true,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data?.mirrored).toBeUndefined();

    const manifestContent = await fs.read("/test/.ucd-store.json");
    expect(manifestContent).toBe(JSON.stringify({
      "16.0.0": "16.0.0",
    }, null, 2));
  });
});
