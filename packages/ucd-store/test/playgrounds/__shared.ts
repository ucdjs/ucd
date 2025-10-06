import type { FileSystemBridgeCapabilities } from "@ucdjs/fs-bridge";
import { assertCapability } from "@ucdjs/fs-bridge";
import { expect, it } from "vitest";
import { UCDStore } from "../../src/store";

export interface PlaygroundTestOptions {
  /**
   * The UCDStore instance to be tested.
   */
  store: UCDStore;

  /**
   * List of required capabilities that the store's filesystem bridge must support.
   */
  requiredCapabilities?: (keyof FileSystemBridgeCapabilities)[];

  /**
   * Whether to run read operation tests.
   */
  read?: boolean;

  /**
   * Whether to run write operation tests.
   */
  write?: boolean;

  /**
   * Whether to run analysis tests.
   */
  analyze?: boolean;

  /**
   * Whether to run directory listing tests.
   */
  listdir?: boolean;

  /**
   * Whether to run mirroring tests.
   */
  mirror?: boolean;

  /**
   * Whether to run cleaning tests.
   */
  clean?: boolean;

  /**
   * Whether to run repair tests.
   */
  repair?: boolean;
}

export function runPlaygroundTests(options: PlaygroundTestOptions): void {
  const {
    store,
    read: shouldRunReadTests = true,
    write: shouldRunWriteTests = true,
    analyze: shouldRunAnalyzeTests = true,
    listdir: shouldRunListDirTests = true,
    mirror: shouldRunMirrorTests = true,
    clean: shouldRunCleanTests = true,
    repair: shouldRunRepairTests = true,
  } = options;

  it("should create a valid UCDStore instance", () => {
    expect(store).toBeInstanceOf(UCDStore);
  });

  it("should have basePath configured", () => {
    expect(store.basePath).toBeDefined();
  });

  it("should have capabilities defined", () => {
    expect(store.fs.capabilities).toBeDefined();

    if (options.requiredCapabilities != null && options.requiredCapabilities.length > 0) {
      for (const cap of options.requiredCapabilities) {
        expect(store.fs.capabilities[cap]).toBe(true);
      }
    }
  });

  it("should initialize the store", async () => {
    expect.fail("Initialization test not implemented yet");
  });

  it.runIf(store.initialized && shouldRunReadTests)("should support read operations", async () => {
    try {
      assertCapability(store.fs, ["read", "exists", "listdir"]);

      await store.init();

      const [arabicShaping, arabicShapingError] = await store.getFile("15.1.0", "ArabicShaping.txt");
      expect(arabicShaping).toBeDefined();
      expect(arabicShapingError).toBeNull();

      expect(arabicShaping).not.toBeNull();
    } catch (err) {
      expect.fail((err as Error).message);
    }
  });

  it.runIf(store.initialized && shouldRunWriteTests)("should support write operations", async () => {
    try {
      assertCapability(store.fs, ["exists", "mkdir", "write", "read", "rm"]);

      expect.fail("Write operations test not implemented yet");
    } catch (err) {
      expect.fail((err as Error).message);
    }
  });

  it.runIf(store.initialized && shouldRunAnalyzeTests)("should analyze the store", async () => {
    expect.fail("Analyze test not implemented yet");
  });

  it.runIf(store.initialized && shouldRunListDirTests)("should list files in a version directory", async () => {
    expect.fail("List directory test not implemented yet");
  });

  it.runIf(store.initialized && shouldRunMirrorTests)("should mirror files from remote", async () => {
    expect.fail("Mirror test not implemented yet");
  });

  it.runIf(store.initialized && shouldRunCleanTests)("should clean orphaned files", async () => {
    expect.fail("Clean test not implemented yet");
  });

  it.runIf(store.initialized && shouldRunRepairTests)("should repair missing files", async () => {
    expect.fail("Repair test not implemented yet");
  });
}
