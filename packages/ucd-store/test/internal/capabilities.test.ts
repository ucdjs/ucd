import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";
import { describe, expect, it } from "vitest";
import { assertCapabilities, inferStoreCapabilities } from "../../src/internal/capabilities";
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
      description: "clean=true when all required capabilities available",
      disabledFeatures: {},
      expectedFeatures: { clean: true, analyze: true },
    },
    {
      description: "clean=false when rm disabled",
      disabledFeatures: { rm: false },
      expectedFeatures: { clean: false, analyze: true },
    },
    {
      description: "clean=false when write disabled",
      disabledFeatures: { write: false },
      expectedFeatures: { clean: false, analyze: true },
    },
    {
      description: "clean=false when listdir disabled",
      disabledFeatures: { listdir: false },
      expectedFeatures: { clean: false, analyze: false },
    },
    {
      description: "clean=false when exists disabled",
      disabledFeatures: { exists: false },
      expectedFeatures: { clean: false, analyze: false },
    },

    {
      description: "analyze=false when stat disabled",
      disabledFeatures: { stat: false },
      expectedFeatures: { clean: true, analyze: false },
    },
    {
      description: "analyze=false when listdir disabled",
      disabledFeatures: { listdir: false },
      expectedFeatures: { clean: false, analyze: false },
    },
    {
      description: "analyze=false when exists disabled",
      disabledFeatures: { exists: false },
      expectedFeatures: { clean: false, analyze: false },
    },

    {
      description: "both features false when multiple capabilities disabled",
      disabledFeatures: { rm: false, stat: false },
      expectedFeatures: { clean: false, analyze: false },
    },
    {
      description: "both features false when core capabilities disabled",
      disabledFeatures: { listdir: false, exists: false },
      expectedFeatures: { clean: false, analyze: false },
    },

    {
      description: "clean=true, analyze=false when only stat disabled",
      disabledFeatures: { stat: false },
      expectedFeatures: { clean: true, analyze: false },
    },
    {
      description: "clean=false, analyze=true when only write and rm disabled",
      disabledFeatures: { write: false, rm: false },
      expectedFeatures: { clean: false, analyze: true },
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
        requiredCapabilities: ["listdir", "exists", "rm", "write"],
        availableCapabilities: ["read", "write", "listdir", "mkdir", "stat", "exists"],
      },
    },
    {
      description: "throw when clean feature missing write capability",
      feature: "clean" as const,
      disabledFeatures: { write: false },
      expectedError: {
        feature: "clean",
        requiredCapabilities: ["listdir", "exists", "rm", "write"],
        availableCapabilities: ["read", "listdir", "mkdir", "stat", "exists", "rm"],
      },
    },
    {
      description: "throw when clean feature missing listdir capability",
      feature: "clean" as const,
      disabledFeatures: { listdir: false },
      expectedError: {
        feature: "clean",
        requiredCapabilities: ["listdir", "exists", "rm", "write"],
        availableCapabilities: ["read", "write", "mkdir", "stat", "exists", "rm"],
      },
    },
    {
      description: "throw when clean feature missing exists capability",
      feature: "clean" as const,
      disabledFeatures: { exists: false },
      expectedError: {
        feature: "clean",
        requiredCapabilities: ["listdir", "exists", "rm", "write"],
        availableCapabilities: ["read", "write", "listdir", "mkdir", "stat", "rm"],
      },
    },

    // Analyze feature failure cases
    {
      description: "throw when analyze feature missing stat capability",
      feature: "analyze" as const,
      disabledFeatures: { stat: false },
      expectedError: {
        feature: "analyze",
        requiredCapabilities: ["listdir", "stat", "exists"],
        availableCapabilities: ["read", "write", "listdir", "mkdir", "exists", "rm"],
      },
    },
    {
      description: "throw when analyze feature missing listdir capability",
      feature: "analyze" as const,
      disabledFeatures: { listdir: false },
      expectedError: {
        feature: "analyze",
        requiredCapabilities: ["listdir", "stat", "exists"],
        availableCapabilities: ["read", "write", "mkdir", "stat", "exists", "rm"],
      },
    },
    {
      description: "throw when analyze feature missing exists capability",
      feature: "analyze" as const,
      disabledFeatures: { exists: false },
      expectedError: {
        feature: "analyze",
        requiredCapabilities: ["listdir", "stat", "exists"],
        availableCapabilities: ["read", "write", "listdir", "mkdir", "stat", "rm"],
      },
    },

    // Multiple missing capabilities
    {
      description: "throw when clean feature missing multiple capabilities",
      feature: "clean" as const,
      disabledFeatures: { write: false, rm: false },
      expectedError: {
        feature: "clean",
        requiredCapabilities: ["listdir", "exists", "rm", "write"],
        availableCapabilities: ["read", "listdir", "mkdir", "stat", "exists"],
      },
    },
    {
      description: "throw when analyze feature missing multiple capabilities",
      feature: "analyze" as const,
      disabledFeatures: { listdir: false, stat: false },
      expectedError: {
        feature: "analyze",
        requiredCapabilities: ["listdir", "stat", "exists"],
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
        requiredCapabilities: ["listdir", "exists", "rm", "write"],
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
