import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext, createPublicContext } from "../../src/core/context";

describe("createInternalContext", async () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  it("should create context with all required properties", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();
    const basePath = "/test/store";
    const versions = ["16.0.0", "15.1.0"];
    const lockfilePath = "/test/store/.ucd-store.lock";

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath,
      versions,
      lockfilePath,
    });

    expect(context.client).toBe(client);
    expect(context.filter).toBe(filter);
    expect(context.fs).toBe(fs);
    expect(context.basePath).toBe(basePath);
    expect(context.versions).toEqual(versions);
    expect(context.lockfilePath).toBe(lockfilePath);
  });

  it("should preserve all input values correctly", async () => {
    const filter = createPathFilter({ include: ["*.txt"] });
    const fs = createMemoryMockFS();
    const basePath = "/different/path";
    const versions = ["15.0.0"];
    const lockfilePath = "/different/path/.ucd-store.lock";

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath,
      versions,
      lockfilePath,
    });

    expect(context).toMatchObject({
      basePath,
      versions,
      lockfilePath,
    });
    expect(context.client).toBe(client);
    expect(context.filter).toBe(filter);
    expect(context.fs).toBe(fs);
  });

  it("should create context with mutable versions array", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();
    const versions = ["16.0.0"];

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions,
      lockfilePath: "/test/.ucd-store.lock",
    });

    // Internal context should have mutable versions
    expect(() => {
      context.versions.push("15.1.0");
    }).not.toThrow();

    expect(context.versions).toEqual(["16.0.0", "15.1.0"]);
  });

  it("should handle empty versions array", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: [],
      lockfilePath: "/test/.ucd-store.lock",
    });

    expect(context.versions).toEqual([]);
  });
});

describe("createPublicContext", async () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, {
    version: "0.1",
    endpoints: {
      files: "/api/v1/files",
      manifest: "/.well-known/ucd-store.json",
      versions: "/api/v1/versions",
    },
    versions: ["16.0.0", "15.1.0"],
  });

  it("should create context with only public properties", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();
    const basePath = "/test/store";
    const versions = ["16.0.0", "15.1.0"];
    const lockfilePath = "/test/store/.ucd-store.lock";

    const internalContext = createInternalContext({
      client,
      filter,
      fs,
      basePath,
      versions,
      lockfilePath,
    });

    const publicContext = createPublicContext(internalContext);

    // Should have public properties
    expect(publicContext.basePath).toBe(basePath);
    expect(publicContext.fs).toBe(fs);
    expect(publicContext.versions).toEqual(versions);

    // Should not expose internal properties
    expect("client" in publicContext).toBe(false);
    expect("filter" in publicContext).toBe(false);
    expect("lockfilePath" in publicContext).toBe(false);
  });

  it("should return frozen versions array", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      lockfilePath: "/test/.ucd-store.lock",
    });

    const publicContext = createPublicContext(internalContext);

    // Should be frozen/readonly
    expect(Object.isFrozen(publicContext.versions)).toBe(true);

    // Attempting to modify should not work (in strict mode would throw)
    const versionsBefore = publicContext.versions;
    expect(() => {
      (publicContext.versions as string[]).push("15.1.0");
    }).toThrow();

    // Versions should remain unchanged
    expect(publicContext.versions).toEqual(versionsBefore);
  });

  it("should use getters so changes to internal context reflect in public context", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      lockfilePath: "/test/.ucd-store.lock",
    });

    const publicContext = createPublicContext(internalContext);

    // Initial state
    expect(publicContext.versions).toEqual(["16.0.0"]);
    expect(publicContext.basePath).toBe("/test");

    // Modify internal context
    internalContext.versions = ["16.0.0", "15.1.0", "15.0.0"];
    internalContext.basePath = "/new/path";

    // Changes should be reflected in public context
    expect(publicContext.versions).toEqual(["16.0.0", "15.1.0", "15.0.0"]);
    expect(publicContext.basePath).toBe("/new/path");
  });

  it("should return new frozen array on each versions access", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      lockfilePath: "/test/.ucd-store.lock",
    });

    const publicContext = createPublicContext(internalContext);

    const versions1 = publicContext.versions;
    const versions2 = publicContext.versions;

    // Should return different frozen array instances
    expect(versions1).not.toBe(versions2);

    // But with same content
    expect(versions1).toEqual(versions2);

    // Both should be frozen
    expect(Object.isFrozen(versions1)).toBe(true);
    expect(Object.isFrozen(versions2)).toBe(true);
  });

  it("should expose fs property correctly", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      lockfilePath: "/test/.ucd-store.lock",
    });

    const publicContext = createPublicContext(internalContext);

    // Should expose the same fs instance
    expect(publicContext.fs).toBe(fs);
    expect(publicContext.fs).toBe(internalContext.fs);
  });

  it("should expose basePath property correctly", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/my/store/path",
      versions: ["16.0.0"],
      lockfilePath: "/my/store/path/.ucd-store.lock",
    });

    const publicContext = createPublicContext(internalContext);

    expect(publicContext.basePath).toBe("/my/store/path");
    expect(publicContext.basePath).toBe(internalContext.basePath);
  });

  it("should handle empty versions array", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: [],
      lockfilePath: "/test/.ucd-store.lock",
    });

    const publicContext = createPublicContext(internalContext);

    expect(publicContext.versions).toEqual([]);
    expect(Object.isFrozen(publicContext.versions)).toBe(true);
  });

  it("should not allow modification of fs or basePath", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,
      basePath: "/test",
      versions: ["16.0.0"],
      lockfilePath: "/test/.ucd-store.lock",
    });

    const publicContext = createPublicContext(internalContext);

    // Properties should be readonly (getters without setters)
    expect(() => {
      // @ts-expect-error - testing runtime behavior
      publicContext.basePath = "/new/path";
    }).toThrow();

    expect(() => {
      // @ts-expect-error - testing runtime behavior
      publicContext.fs = createMemoryMockFS();
    }).toThrow();
  });
});
