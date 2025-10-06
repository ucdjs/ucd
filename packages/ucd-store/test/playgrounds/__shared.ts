import type { FileSystemBridgeCapabilities } from "@ucdjs/fs-bridge";
import { assertCapability } from "@ucdjs/fs-bridge";
import { expect, it } from "vitest";
import { UCDStore } from "../../src/store";

export interface PlaygroundTestOptions {
  store: UCDStore;
  requiredCapabilities?: (keyof FileSystemBridgeCapabilities)[];
  read?: boolean;
  write?: boolean;
}

export function runPlaygroundTests(options: PlaygroundTestOptions): void {
  const {
    store,
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

  it.runIf(options.read ?? true)("should support read operations", async () => {
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

  it.runIf(options.write ?? false)("should support write operations", async () => {
    try {
      assertCapability(store.fs, ["exists", "mkdir", "write", "read", "rm"]);

      expect.fail("Write operations test not implemented yet");
    } catch (err) {
      expect.fail((err as Error).message);
    }
  });
}
