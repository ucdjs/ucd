import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { describe, expect, it } from "vitest";
import { assertCapabilities, inferStoreCapabilities, requiresCapabilities } from "../../src/internal/capabilities";
import { UCDStoreUnsupportedFeature } from "../../src/internal/errors";

function createMockFSBridge(features: Partial<FileSystemBridge["capabilities"]> = {}): FileSystemBridge {
  return {
    capabilities: {
      read: true,
      write: true,
      listdir: true,
      mkdir: true,
      stat: true,
      exists: true,
      rm: true,
      ...features,
    },
  } as FileSystemBridge;
}

describe("inferStoreCapabilities", () => {
  it.each([
    {
      description: "all features=true when all required capabilities available",
      disabledFeatures: {},
      expectedFeatures: { clean: true, analyze: true, mirror: true, repair: true },
    },
    {
      description: "clean=false when rm disabled",
      disabledFeatures: { rm: false },
      expectedFeatures: { clean: false, analyze: true, mirror: true, repair: false },
    },
    {
      description: "clean=false when write disabled",
      disabledFeatures: { write: false },
      expectedFeatures: { clean: false, analyze: true, mirror: false, repair: false },
    },
    {
      description: "clean=false when listdir disabled",
      disabledFeatures: { listdir: false },
      expectedFeatures: { clean: false, analyze: false, mirror: false, repair: false },
    },
    {
      description: "clean=false when exists disabled",
      disabledFeatures: { exists: false },
      expectedFeatures: { clean: false, analyze: false, mirror: false, repair: false },
    },

    {
      description: "analyze=false when stat disabled",
      disabledFeatures: { stat: false },
      expectedFeatures: { clean: true, analyze: false, mirror: true, repair: true },
    },
    {
      description: "analyze=false when listdir disabled",
      disabledFeatures: { listdir: false },
      expectedFeatures: { clean: false, analyze: false, mirror: false, repair: false },
    },
    {
      description: "analyze=false when exists disabled",
      disabledFeatures: { exists: false },
      expectedFeatures: { clean: false, analyze: false, mirror: false, repair: false },
    },

    {
      description: "multiple features false when multiple capabilities disabled",
      disabledFeatures: { rm: false, stat: false },
      expectedFeatures: { clean: false, analyze: false, mirror: true, repair: false },
    },
    {
      description: "multiple features false when core capabilities disabled",
      disabledFeatures: { listdir: false, exists: false },
      expectedFeatures: { clean: false, analyze: false, mirror: false, repair: false },
    },

    {
      description: "clean=true, analyze=false when only stat disabled",
      disabledFeatures: { stat: false },
      expectedFeatures: { clean: true, analyze: false, mirror: true, repair: true },
    },
    {
      description: "clean=false, analyze=true when only write and rm disabled",
      disabledFeatures: { write: false, rm: false },
      expectedFeatures: { clean: false, analyze: true, mirror: false, repair: false },
    },
  ])("should return $description", ({ disabledFeatures, expectedFeatures }) => {
    const mockBridge = createMockFSBridge(disabledFeatures);
    const features = inferStoreCapabilities(mockBridge);

    expect(features).toEqual(expectedFeatures);
  });
});

describe("assertCapabilities", () => {
  it.each([
    {
      description: "not throw when clean feature is supported",
      feature: "clean" as const,
      disabledFeatures: {},
    },
    {
      description: "not throw when analyze feature is supported",
      feature: "analyze" as const,
      disabledFeatures: {},
    },
    {
      description: "not throw for analyze on HTTP bridge (read-only)",
      feature: "analyze" as const,
      disabledFeatures: { write: false, mkdir: false, rm: false },
    },
  ])("should $description", ({ feature, disabledFeatures }) => {
    const mockBridge = createMockFSBridge(disabledFeatures);
    expect(() => assertCapabilities(feature, mockBridge)).not.toThrow();
  });

  it.each([
    {
      description: "throw when clean feature missing rm capability",
      feature: "clean" as const,
      disabledFeatures: { rm: false },
      expectedError: {
        feature: "clean",
        requiredCapabilities: ["listdir", "exists", "rm", "write", "read"],
        availableCapabilities: ["read", "write", "listdir", "mkdir", "stat", "exists"],
      },
    },
    {
      description: "throw when clean feature missing write capability",
      feature: "clean" as const,
      disabledFeatures: { write: false },
      expectedError: {
        feature: "clean",
        requiredCapabilities: ["listdir", "exists", "rm", "write", "read"],
        availableCapabilities: ["read", "listdir", "mkdir", "stat", "exists", "rm"],
      },
    },
    {
      description: "throw when clean feature missing listdir capability",
      feature: "clean" as const,
      disabledFeatures: { listdir: false },
      expectedError: {
        feature: "clean",
        requiredCapabilities: ["listdir", "exists", "rm", "write", "read"],
        availableCapabilities: ["read", "write", "mkdir", "stat", "exists", "rm"],
      },
    },
    {
      description: "throw when clean feature missing exists capability",
      feature: "clean" as const,
      disabledFeatures: { exists: false },
      expectedError: {
        feature: "clean",
        requiredCapabilities: ["listdir", "exists", "rm", "write", "read"],
        availableCapabilities: ["read", "write", "listdir", "mkdir", "stat", "rm"],
      },
    },
    {
      description: "throw when clean feature missing read capability",
      feature: "clean" as const,
      disabledFeatures: { read: false },
      expectedError: {
        feature: "clean",
        requiredCapabilities: ["listdir", "exists", "rm", "write", "read"],
        availableCapabilities: ["write", "listdir", "mkdir", "stat", "exists", "rm"],
      },
    },

    // Analyze
    {
      description: "throw when analyze feature missing stat capability",
      feature: "analyze" as const,
      disabledFeatures: { stat: false },
      expectedError: {
        feature: "analyze",
        requiredCapabilities: ["listdir", "stat", "exists", "read"],
        availableCapabilities: ["read", "write", "listdir", "mkdir", "exists", "rm"],
      },
    },
    {
      description: "throw when analyze feature missing listdir capability",
      feature: "analyze" as const,
      disabledFeatures: { listdir: false },
      expectedError: {
        feature: "analyze",
        requiredCapabilities: ["listdir", "stat", "exists", "read"],
        availableCapabilities: ["read", "write", "mkdir", "stat", "exists", "rm"],
      },
    },
    {
      description: "throw when analyze feature missing exists capability",
      feature: "analyze" as const,
      disabledFeatures: { exists: false },
      expectedError: {
        feature: "analyze",
        requiredCapabilities: ["listdir", "stat", "exists", "read"],
        availableCapabilities: ["read", "write", "listdir", "mkdir", "stat", "rm"],
      },
    },

    // multiple missing capabilities
    {
      description: "throw when clean feature missing multiple capabilities",
      feature: "clean" as const,
      disabledFeatures: { write: false, rm: false },
      expectedError: {
        feature: "clean",
        requiredCapabilities: ["listdir", "exists", "rm", "write", "read"],
        availableCapabilities: ["read", "listdir", "mkdir", "stat", "exists"],
      },
    },
    {
      description: "throw when analyze feature missing multiple capabilities",
      feature: "analyze" as const,
      disabledFeatures: { listdir: false, stat: false },
      expectedError: {
        feature: "analyze",
        requiredCapabilities: ["listdir", "stat", "exists", "read"],
        availableCapabilities: ["read", "write", "mkdir", "exists", "rm"],
      },
    },

    // Real-world bridge scenarios
    {
      description: "throw for clean on HTTP bridge (read-only)",
      feature: "clean" as const,
      disabledFeatures: { write: false, mkdir: false, rm: false },
      expectedError: {
        feature: "clean",
        requiredCapabilities: ["listdir", "exists", "rm", "write", "read"],
        availableCapabilities: ["read", "listdir", "stat", "exists"],
      },
    },
  ])("should $description", ({ feature, disabledFeatures, expectedError }) => {
    const mockBridge = createMockFSBridge(disabledFeatures);

    expect(() => assertCapabilities(feature, mockBridge)).toThrow(UCDStoreUnsupportedFeature);

    try {
      assertCapabilities(feature, mockBridge);
      expect.fail("Should have thrown UCDStoreUnsupportedFeature");
    } catch (error) {
      const thrownError = error as UCDStoreUnsupportedFeature;
      expect(thrownError.feature).toBe(expectedError.feature);
      expect(thrownError.requiredCapabilities).toEqual(expectedError.requiredCapabilities);
      expect(thrownError.availableCapabilities).toEqual(expect.arrayContaining(expectedError.availableCapabilities));
      expect(thrownError.availableCapabilities).toHaveLength(expectedError.availableCapabilities.length);
      expect(thrownError.message).toContain(`Feature '${expectedError.feature}' is not supported`);
      expect(thrownError.message).toContain(`Required: [${expectedError.requiredCapabilities.join(", ")}]`);
    }
  });
});

describe("requiresCapabilities decorator", () => {
  class TestStore {
    public fs: FileSystemBridge;

    constructor(fs: FileSystemBridge) {
      this.fs = fs;
    }

    @requiresCapabilities("clean")
    async clean(): Promise<string> {
      return "clean executed";
    }

    @requiresCapabilities("analyze")
    async analyze(): Promise<string> {
      return "analyze executed";
    }

    @requiresCapabilities("mirror")
    async mirror(): Promise<string> {
      return "mirror executed";
    }

    @requiresCapabilities("repair")
    async repair(): Promise<string> {
      return "repair executed";
    }
  }

  it("should allow method execution when capabilities are available", async () => {
    const fullCapabilityBridge = createMockFSBridge();
    const store = new TestStore(fullCapabilityBridge);

    await expect(store.clean()).resolves.toBe("clean executed");
    await expect(store.analyze()).resolves.toBe("analyze executed");
    await expect(store.mirror()).resolves.toBe("mirror executed");
    await expect(store.repair()).resolves.toBe("repair executed");
  });

  it("should prevent method execution when capabilities are missing", async () => {
    const limitedBridge = createMockFSBridge({
      write: false,
      rm: false,
      mkdir: false,
    });
    const store = new TestStore(limitedBridge);

    // clean requires write + rm - should fail
    await expect(store.clean()).rejects.toThrow(UCDStoreUnsupportedFeature);

    // analyze only requires read capabilities - should work
    await expect(store.analyze()).resolves.toBe("analyze executed");

    // mirror requires write + mkdir - should fail
    await expect(store.mirror()).rejects.toThrow(UCDStoreUnsupportedFeature);

    // repair requires write + rm - should fail
    await expect(store.repair()).rejects.toThrow(UCDStoreUnsupportedFeature);
  });

  it("should provide detailed error information when capabilities are missing", async () => {
    const readOnlyBridge = createMockFSBridge({
      write: false,
      rm: false,
      mkdir: false,
    });
    const store = new TestStore(readOnlyBridge);

    try {
      await store.clean();
      expect.fail("Should have thrown UCDStoreUnsupportedFeature");
    } catch (error) {
      expect(error).toBeInstanceOf(UCDStoreUnsupportedFeature);
      const typedError = error as UCDStoreUnsupportedFeature;
      expect(typedError.feature).toBe("clean");
      expect(typedError.requiredCapabilities).toEqual(["listdir", "exists", "rm", "write", "read"]);
      expect(typedError.availableCapabilities).toEqual(["read", "listdir", "stat", "exists"]);
    }
  });

  it("should work with mixed capability scenarios", async () => {
    // Create a bridge that supports some operations but not others
    const mixedBridge = createMockFSBridge({
      write: false, // Disables clean, mirror, repair
      rm: false, // Disables clean, repair
      mkdir: false, // Disables mirror
    });
    const store = new TestStore(mixedBridge);

    // analyze should work (only needs read capabilities)
    await expect(store.analyze()).resolves.toBe("analyze executed");

    // All others should fail
    await expect(store.clean()).rejects.toThrow(UCDStoreUnsupportedFeature);
    await expect(store.mirror()).rejects.toThrow(UCDStoreUnsupportedFeature);
    await expect(store.repair()).rejects.toThrow(UCDStoreUnsupportedFeature);
  });

  it("should preserve method return types and arguments", async () => {
    class TypedTestStore {
      public fs: FileSystemBridge;

      constructor(fs: FileSystemBridge) {
        this.fs = fs;
      }

      @requiresCapabilities("clean")
      async processData(input: string, count: number): Promise<{ result: string; processed: number }> {
        return { result: input.toUpperCase(), processed: count };
      }
    }

    const bridge = createMockFSBridge();
    const store = new TypedTestStore(bridge);

    const result = await store.processData("test", 5);
    expect(result).toEqual({ result: "TEST", processed: 5 });
  });

  it("should work with async methods that throw errors", async () => {
    class ErrorTestStore {
      public fs: FileSystemBridge;

      constructor(fs: FileSystemBridge) {
        this.fs = fs;
      }

      @requiresCapabilities("clean")
      async failingMethod(): Promise<string> {
        throw new Error("Method implementation error");
      }
    }

    const bridge = createMockFSBridge();
    const store = new ErrorTestStore(bridge);

    // Should pass capability check but fail with implementation error
    await expect(store.failingMethod()).rejects.toThrow("Method implementation error");
  });

  it("should check capabilities before executing method logic", async () => {
    let methodExecuted = false;

    class ExecutionTestStore {
      public fs: FileSystemBridge;

      constructor(fs: FileSystemBridge) {
        this.fs = fs;
      }

      @requiresCapabilities("clean")
      async trackingMethod(): Promise<string> {
        methodExecuted = true;
        return "executed";
      }
    }

    const insufficientBridge = createMockFSBridge({ write: false, rm: false });
    const store = new ExecutionTestStore(insufficientBridge);

    try {
      await store.trackingMethod();
      expect.fail("Should have thrown UCDStoreUnsupportedFeature");
    } catch (error) {
      expect(error).toBeInstanceOf(UCDStoreUnsupportedFeature);
      expect(methodExecuted).toBe(false); // Method should not have been executed
    }
  });

  it("should work with methods that have no parameters", async () => {
    class NoParamsTestStore {
      public fs: FileSystemBridge;

      constructor(fs: FileSystemBridge) {
        this.fs = fs;
      }

      @requiresCapabilities("analyze")
      async noParamsMethod(): Promise<string> {
        return "no params executed";
      }
    }

    const bridge = createMockFSBridge();
    const store = new NoParamsTestStore(bridge);

    await expect(store.noParamsMethod()).resolves.toBe("no params executed");
  });

  it("should use property name as capability when no parameter provided", async () => {
    class AutoCapabilityStore {
      public fs: FileSystemBridge;

      constructor(fs: FileSystemBridge) {
        this.fs = fs;
      }

      @requiresCapabilities()
      async clean(): Promise<string> {
        return "clean executed";
      }

      @requiresCapabilities()
      async analyze(): Promise<string> {
        return "analyze executed";
      }

      @requiresCapabilities()
      async mirror(): Promise<string> {
        return "mirror executed";
      }

      @requiresCapabilities()
      async repair(): Promise<string> {
        return "repair executed";
      }
    }

    const fullCapabilityBridge = createMockFSBridge();
    const store = new AutoCapabilityStore(fullCapabilityBridge);

    await expect(store.clean()).resolves.toBe("clean executed");
    await expect(store.analyze()).resolves.toBe("analyze executed");
    await expect(store.mirror()).resolves.toBe("mirror executed");
    await expect(store.repair()).resolves.toBe("repair executed");
  });

  it("should fail with property name as capability when requirements not met", async () => {
    class AutoCapabilityStore {
      public fs: FileSystemBridge;

      constructor(fs: FileSystemBridge) {
        this.fs = fs;
      }

      @requiresCapabilities()
      async clean(): Promise<string> {
        return "clean executed";
      }

      @requiresCapabilities()
      async analyze(): Promise<string> {
        return "analyze executed";
      }
    }

    const limitedBridge = createMockFSBridge({ write: false, rm: false });
    const store = new AutoCapabilityStore(limitedBridge);

    // clean method should fail because it requires write + rm
    await expect(store.clean()).rejects.toThrow(UCDStoreUnsupportedFeature);

    // analyze method should work because it only needs read capabilities
    await expect(store.analyze()).resolves.toBe("analyze executed");
  });
});
