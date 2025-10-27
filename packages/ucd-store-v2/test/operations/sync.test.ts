import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { mockStoreApi } from "#test-utils/mock-store";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext } from "../../src/core/context";
import { sync } from "../../src/operations/sync";

describe("sync", () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  it("should sync with default add strategy", async () => {
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
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await sync(context);

    expect(error).toBeNull();
    expect(data).toBeDefined();
    expect(data).toMatchObject({
      timestamp: expect.any(String),
      added: expect.any(Array),
      removed: expect.any(Array),
      unchanged: expect.any(Array),
      versions: expect.any(Array),
    });
  });

  it("should use add strategy by default", async () => {
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
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await sync(context, {
      strategy: "add",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should use update strategy when specified", async () => {
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
      versions: ["16.0.0", "15.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await sync(context, {
      strategy: "update",
    });

    expect(error).toBeNull();
    expect(data).toBeDefined();
  });

  it("should support mirror option", async () => {
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
      versions: ["16.0.0"],
      manifestPath: "/test/.ucd-store.json",
    });

    const [data, error] = await sync(context, {
      mirror: true,
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

    const [data, error] = await sync(context);

    expect(error).toBeNull();
    expect(data).toEqual({
      timestamp: expect.any(String),
      added: expect.any(Array),
      removed: expect.any(Array),
      unchanged: expect.any(Array),
      versions: expect.arrayContaining(["16.0.0"]),
    });
  });
});
