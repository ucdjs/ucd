import { createMemoryMockFS } from "#test-utils/fs-bridges";
import { createPathFilter, getDefaultUCDEndpointConfig } from "@ucdjs-internal/shared";
import { createUCDClientWithConfig } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { describe, expect, it } from "vitest";
import { createInternalContext, createPublicContext } from "../src/context";

describe("createInternalContext", async () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, getDefaultUCDEndpointConfig());

  it("should create context with all required properties", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,
      lockfile: {
        supports: true,
        exists: false,
        path: "/test/store/.ucd-store.lock",
      },
      versions: {
        userProvided: ["16.0.0", "15.1.0"],
        configFile: [],
      },
    });

    expect(context.client).toBe(client);
    expect(context.filter).toBe(filter);
    expect(context.fs).toBe(fs);
    expect(context.lockfile.supports).toBe(true);
    expect(context.lockfile.exists).toBe(false);
    expect(context.lockfile.path).toBe("/test/store/.ucd-store.lock");
    expect(context.versions.userProvided).toEqual(["16.0.0", "15.1.0"]);
    expect(context.versions.configFile).toEqual([]);
    expect(context.versions.resolved).toEqual([]);
    expect(context.versions.apiVersions).toBeTypeOf("function");
  });

  it("should create context with mutable resolved versions array", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,

      lockfile: {
        supports: true,
        exists: false,
        path: "/test/.ucd-store.lock",
      },
      versions: {
        userProvided: ["16.0.0"],
        configFile: [],
      },
    });

    // resolved versions should be mutable
    expect(() => {
      context.versions.resolved.push("15.1.0");
    }).not.toThrow();

    expect(context.versions.resolved).toEqual(["15.1.0"]);
  });

  it("should freeze userProvided and configFile versions", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,

      lockfile: {
        supports: true,
        exists: false,
        path: "/test/.ucd-store.lock",
      },
      versions: {
        userProvided: ["16.0.0"],
        configFile: ["15.1.0"],
      },
    });

    expect(Object.isFrozen(context.versions.userProvided)).toBe(true);
    expect(Object.isFrozen(context.versions.configFile)).toBe(true);
  });

  it("should handle empty versions", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,

      lockfile: {
        supports: true,
        exists: false,
        path: "/test/.ucd-store.lock",
      },
      versions: {
        userProvided: [],
        configFile: [],
      },
    });

    expect(context.versions.userProvided).toEqual([]);
    expect(context.versions.configFile).toEqual([]);
    expect(context.versions.resolved).toEqual([]);
  });

  it("should have mutable lockfile.exists flag", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const context = createInternalContext({
      client,
      filter,
      fs,

      lockfile: {
        supports: true,
        exists: false,
        path: "/test/.ucd-store.lock",
      },
      versions: {
        userProvided: [],
        configFile: [],
      },
    });

    expect(context.lockfile.exists).toBe(false);
    context.lockfile.exists = true;
    expect(context.lockfile.exists).toBe(true);
  });
});

describe("createPublicContext", async () => {
  const client = createUCDClientWithConfig(UCDJS_API_BASE_URL, {
    version: "0.1",
    endpoints: {
      files: "/api/v1/files",
      manifest: "/.well-known/ucd-store/{version}.json",
      versions: "/api/v1/versions",
    },
    versions: ["16.0.0", "15.1.0"],
  });

  it("should create context with only public properties", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,
      lockfile: {
        supports: true,
        exists: false,
        path: "/test/store/.ucd-store.lock",
      },
      versions: {
        userProvided: ["16.0.0", "15.1.0"],
        configFile: [],
      },
    });

    // Set resolved versions (simulating what store.ts does)
    internalContext.versions.resolved = ["16.0.0", "15.1.0"];

    const publicContext = createPublicContext(internalContext);

    // Should have public properties
    expect(publicContext.fs).toBe(fs);
    expect(publicContext.versions).toEqual(["16.0.0", "15.1.0"]);

    // Should not expose internal properties
    expect("client" in publicContext).toBe(false);
    expect("filter" in publicContext).toBe(false);
    expect("lockfile" in publicContext).toBe(false);
    expect("basePath" in publicContext).toBe(false);
  });

  it("should return frozen versions array", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,
      lockfile: {
        supports: true,
        exists: false,
        path: "/test/.ucd-store.lock",
      },
      versions: {
        userProvided: ["16.0.0"],
        configFile: [],
      },
    });

    internalContext.versions.resolved = ["16.0.0"];

    const publicContext = createPublicContext(internalContext);

    // Should be frozen/readonly
    expect(Object.isFrozen(publicContext.versions)).toBe(true);

    // Attempting to modify should throw
    expect(() => {
      (publicContext.versions as string[]).push("15.1.0");
    }).toThrow();
  });

  it("should use getters so changes to internal context reflect in public context", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,

      lockfile: {
        supports: true,
        exists: false,
        path: "/test/.ucd-store.lock",
      },
      versions: {
        userProvided: ["16.0.0"],
        configFile: [],
      },
    });

    internalContext.versions.resolved = ["16.0.0"];

    const publicContext = createPublicContext(internalContext);

    // Initial state
    expect(publicContext.versions).toEqual(["16.0.0"]);

    // Modify internal context
    internalContext.versions.resolved = ["16.0.0", "15.1.0", "15.0.0"];

    // Changes should be reflected in public context
    expect(publicContext.versions).toEqual(["16.0.0", "15.1.0", "15.0.0"]);
  });

  it("should return new frozen array on each versions access", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,

      lockfile: {
        supports: true,
        exists: false,
        path: "/test/.ucd-store.lock",
      },
      versions: {
        userProvided: ["16.0.0"],
        configFile: [],
      },
    });

    internalContext.versions.resolved = ["16.0.0"];

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

  it("should handle empty versions array", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,

      lockfile: {
        supports: true,
        exists: false,
        path: "/test/.ucd-store.lock",
      },
      versions: {
        userProvided: [],
        configFile: [],
      },
    });

    const publicContext = createPublicContext(internalContext);

    expect(publicContext.versions).toEqual([]);
    expect(Object.isFrozen(publicContext.versions)).toBe(true);
  });

  it("should not allow modification of fs", async () => {
    const filter = createPathFilter({});
    const fs = createMemoryMockFS();

    const internalContext = createInternalContext({
      client,
      filter,
      fs,

      lockfile: {
        supports: true,
        exists: false,
        path: "/test/.ucd-store.lock",
      },
      versions: {
        userProvided: ["16.0.0"],
        configFile: [],
      },
    });

    const publicContext = createPublicContext(internalContext);

    // Properties should be readonly (getters without setters)
    expect(() => {
      // @ts-expect-error - testing runtime behavior
      publicContext.fs = createMemoryMockFS();
    }).toThrow();
  });
});
