import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { mockStoreApi } from "#test-utils/mock-store";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../../src/core/context";
import { mirror } from "../../src/operations/mirror";

describe("mirror", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  it("should mirror all versions by default", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0", "15.1.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await mirror(context);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toMatchObject({
      timestamp: expect.any(String),
      versions: expect.any(Array),
      summary: {
        totalFiles: expect.any(Number),
        downloaded: expect.any(Number),
        skipped: expect.any(Number),
        failed: expect.any(Number),
        duration: expect.any(Number),
        totalSize: expect.any(String),
      },
    });
  });

  it("should mirror specific versions when provided", async () => {
    mockStoreApi({
      versions: ["16.0.0", "15.1.0", "15.0.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0", "15.1.0", "15.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await mirror(context, {
      versions: ["16.0.0"],
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should support force option to re-download existing files", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await mirror(context, {
      force: true,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should support custom concurrency limit", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await mirror(context, {
      concurrency: 10,
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should call progress callback during download", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const progressCalls: Array<{ version: string; current: number; total: number; file: string }> = [];

    const [data, error] = await mirror(context, {
      onProgress: (progress) => {
        progressCalls.push(progress);
      },
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should return proper result structure", async () => {
    mockStoreApi({
      versions: ["16.0.0"],
    });

    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await mirror(context);

    expect(error).toBeNull();
    expect(data).toEqual({
      timestamp: expect.any(String),
      versions: expect.any(Array),
      summary: {
        totalFiles: 0,
        downloaded: 0,
        skipped: 0,
        failed: 0,
        duration: expect.any(Number),
        totalSize: "0 B",
      },
    });
  });
});
