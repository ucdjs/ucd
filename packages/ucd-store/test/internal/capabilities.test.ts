import type { FileSystemBridge, FileSystemBridgeCapabilityKey } from "@ucdjs/fs-bridge";
import type { StoreCapabilities } from "../../src/types";
import { describe, expect, it } from "vitest";
import { UCDStoreUnsupportedFeature } from "../../src/errors";
import { assertCapabilities, inferStoreCapabilitiesFromFSBridge, STORE_CAPABILITY_REQUIREMENTS } from "../../src/internal/capabilities";

describe("inferStoreCapabilitiesFromFSBridge", () => {
  it("should throw error when capabilities are null", () => {
    const fs = {
      capabilities: null,
    } as unknown as FileSystemBridge;

    expect(() => inferStoreCapabilitiesFromFSBridge(fs)).toThrow(
      "FileSystemBridge capabilities are not defined.",
    );
  });

  it("should throw error when capabilities are undefined", () => {
    const fs = {
      capabilities: undefined,
    } as unknown as FileSystemBridge;

    expect(() => inferStoreCapabilitiesFromFSBridge(fs)).toThrow(
      "FileSystemBridge capabilities are not defined.",
    );
  });

  it("should return all false capabilities when filesystem has no capabilities", () => {
    const fs = {
      capabilities: {
        read: false,
        write: false,
        listdir: false,
        exists: false,
        mkdir: false,
        rm: false,
      },
    } as FileSystemBridge;

    const result = inferStoreCapabilitiesFromFSBridge(fs);

    expect(result).toEqual({
      analyze: false,
      clean: false,
      mirror: false,
      repair: false,
    });
  });

  it("should return all true capabilities when filesystem has all capabilities", () => {
    const fs = {
      capabilities: {
        read: true,
        write: true,
        listdir: true,
        exists: true,
        mkdir: true,
        rm: true,
      },
    } as FileSystemBridge;

    const result = inferStoreCapabilitiesFromFSBridge(fs);

    expect(result).toEqual({
      analyze: true,
      clean: true,
      mirror: true,
      repair: true,
    });
  });

  it.each([
    {
      capability: "analyze" as keyof StoreCapabilities,
      requiredCaps: STORE_CAPABILITY_REQUIREMENTS.analyze,
      description: "analyze capability requires listdir, exists, and read",
    },
    {
      capability: "clean" as keyof StoreCapabilities,
      requiredCaps: STORE_CAPABILITY_REQUIREMENTS.clean,
      description: "clean capability requires listdir, exists, rm, write, and read",
    },
    {
      capability: "mirror" as keyof StoreCapabilities,
      requiredCaps: STORE_CAPABILITY_REQUIREMENTS.mirror,
      description: "mirror capability requires read, write, listdir, mkdir, and exists",
    },
    {
      capability: "repair" as keyof StoreCapabilities,
      requiredCaps: STORE_CAPABILITY_REQUIREMENTS.repair,
      description: "repair capability requires read, listdir, exists, rm, and write",
    },
  ])("should enable $capability when all required capabilities are present", ({ capability, requiredCaps }) => {
    const fsWithAllCaps = {
      capabilities: {
        read: requiredCaps.includes("read"),
        write: requiredCaps.includes("write"),
        listdir: requiredCaps.includes("listdir"),
        exists: requiredCaps.includes("exists"),
        mkdir: requiredCaps.includes("mkdir"),
        rm: requiredCaps.includes("rm"),
      },
    } as FileSystemBridge;

    const result = inferStoreCapabilitiesFromFSBridge(fsWithAllCaps);
    expect(result[capability]).toBe(true);
  });

  it.each([
    ...Object.entries(STORE_CAPABILITY_REQUIREMENTS).flatMap(([capability, requiredCaps]) =>
      requiredCaps.map((missingCap) => ({
        capability: capability as keyof StoreCapabilities,
        requiredCaps,
        missingCap,
        description: `${capability} should be disabled when missing ${missingCap}`,
      })),
    ),
  ])("$description", ({ capability, requiredCaps, missingCap }) => {
    const fsWithMissingCap = {
      capabilities: {
        read: requiredCaps.includes("read") && missingCap !== "read",
        write: requiredCaps.includes("write") && missingCap !== "write",
        listdir: requiredCaps.includes("listdir") && missingCap !== "listdir",
        exists: requiredCaps.includes("exists") && missingCap !== "exists",
        mkdir: requiredCaps.includes("mkdir") && missingCap !== "mkdir",
        rm: requiredCaps.includes("rm") && missingCap !== "rm",
      },
    } as FileSystemBridge;

    const result = inferStoreCapabilitiesFromFSBridge(fsWithMissingCap);
    expect(result[capability]).toBe(false);
  });

  it.each([
    {
      scenario: "read-only filesystem",
      fsCapabilities: {
        read: true,
        write: false,
        listdir: true,
        exists: true,
        mkdir: false,
        rm: false,
        stat: true,
      },
      expectedResult: {
        analyze: true, // only needs read, listdir, exists
        clean: false, // needs write and rm
        mirror: false, // needs write and mkdir
        repair: false, // needs write and rm
      },
    },
    {
      scenario: "write-only filesystem (theoretical)",
      fsCapabilities: {
        read: false,
        write: true,
        listdir: false,
        exists: false,
        mkdir: true,
        rm: true,
        stat: false,
      },
      expectedResult: {
        analyze: false, // needs read, listdir, exists
        clean: false, // needs read, listdir, exists
        mirror: false, // needs read, listdir, exists
        repair: false, // needs read, listdir, exists
      },
    },
    {
      scenario: "filesystem without directory operations",
      fsCapabilities: {
        read: true,
        write: true,
        listdir: false,
        exists: true,
        mkdir: false,
        rm: true,
        stat: true,
      },
      expectedResult: {
        analyze: false, // needs listdir
        clean: false, // needs listdir
        mirror: false, // needs listdir and mkdir
        repair: false, // needs listdir
      },
    },
    {
      scenario: "filesystem with basic file operations only",
      fsCapabilities: {
        read: true,
        write: true,
        listdir: false,
        exists: true,
        mkdir: false,
        rm: false,
      },
      expectedResult: {
        analyze: false, // needs listdir
        clean: false, // needs listdir and rm
        mirror: false, // needs listdir and mkdir
        repair: false, // needs listdir and rm
      },
    },
  ])("should handle $scenario correctly", ({ fsCapabilities, expectedResult }) => {
    const fs = {
      capabilities: fsCapabilities,
    } as FileSystemBridge;

    const result = inferStoreCapabilitiesFromFSBridge(fs);
    expect(result).toEqual(expectedResult);
  });

  it("should return correct types for all store capabilities", () => {
    const fs = {
      capabilities: {
        read: true,
        write: true,
        listdir: true,
        exists: true,
        mkdir: true,
        rm: true,
      },
    } as FileSystemBridge;

    const result = inferStoreCapabilitiesFromFSBridge(fs);

    // verify the result has all expected properties with boolean values
    expect(typeof result.analyze).toBe("boolean");
    expect(typeof result.clean).toBe("boolean");
    expect(typeof result.mirror).toBe("boolean");
    expect(typeof result.repair).toBe("boolean");

    // verify no extra properties
    expect(Object.keys(result)).toEqual(["analyze", "clean", "mirror", "repair"]);
  });
});

describe("assertCapabilities", () => {
  it("should throw error when capabilities are null", () => {
    const fs = {
      capabilities: null,
    } as unknown as FileSystemBridge;

    expect(() => assertCapabilities("analyze", fs)).toThrow(
      "FileSystemBridge capabilities are not defined.",
    );
  });

  it("should throw error when capabilities are undefined", () => {
    const fs = {
      capabilities: undefined,
    } as unknown as FileSystemBridge;

    expect(() => assertCapabilities("mirror", fs)).toThrow(
      "FileSystemBridge capabilities are not defined.",
    );
  });

  it.each([
    "analyze" as keyof StoreCapabilities,
    "clean" as keyof StoreCapabilities,
    "mirror" as keyof StoreCapabilities,
    "repair" as keyof StoreCapabilities,
  ])("should not throw when all required capabilities are present for %s", (feature) => {
    const requiredCaps = STORE_CAPABILITY_REQUIREMENTS[feature];
    const fs = {
      capabilities: {
        read: requiredCaps.includes("read"),
        write: requiredCaps.includes("write"),
        listdir: requiredCaps.includes("listdir"),
        exists: requiredCaps.includes("exists"),
        mkdir: requiredCaps.includes("mkdir"),
        rm: requiredCaps.includes("rm"),
      },
    } as FileSystemBridge;

    expect(() => assertCapabilities(feature, fs)).not.toThrow();
  });

  it.each([
    ...Object.entries(STORE_CAPABILITY_REQUIREMENTS).flatMap(([capability, requiredCaps]) =>
      requiredCaps.map((missingCap) => ({
        capability: capability as keyof StoreCapabilities,
        requiredCaps: requiredCaps as FileSystemBridgeCapabilityKey[],
        missingCap: missingCap as FileSystemBridgeCapabilityKey,
      })),
    ),
  ])("should throw UCDStoreUnsupportedFeature when $capability is missing $missingCap", ({ capability, requiredCaps, missingCap }) => {
    const fs = {
      capabilities: {
        read: requiredCaps.includes("read") && missingCap !== "read",
        write: requiredCaps.includes("write") && missingCap !== "write",
        listdir: requiredCaps.includes("listdir") && missingCap !== "listdir",
        exists: requiredCaps.includes("exists") && missingCap !== "exists",
        mkdir: requiredCaps.includes("mkdir") && missingCap !== "mkdir",
        rm: requiredCaps.includes("rm") && missingCap !== "rm",
      },
    } as FileSystemBridge;

    expect(() => assertCapabilities(capability, fs)).toThrow(UCDStoreUnsupportedFeature);
  });

  it("should throw UCDStoreUnsupportedFeature with correct parameters", () => {
    const fs = {
      capabilities: {
        read: false,
        write: false,
        listdir: false,
        exists: false,
        mkdir: false,
        rm: false,
      },
    } as FileSystemBridge;

    expect(() => assertCapabilities("analyze", fs)).toThrow(
      expect.objectContaining({
        feature: "analyze",
        requiredCapabilities: STORE_CAPABILITY_REQUIREMENTS.analyze,
        availableCapabilities: [],
      }),
    );
  });

  it("should include available capabilities in error when some capabilities are present", () => {
    const fs = {
      capabilities: {
        read: true,
        write: false,
        listdir: true,
        exists: false,
        mkdir: false,
        rm: false,
      },
    } as FileSystemBridge;

    expect(() => assertCapabilities("clean", fs)).toThrow(
      expect.objectContaining({
        feature: "clean",
        requiredCapabilities: STORE_CAPABILITY_REQUIREMENTS.clean,
        availableCapabilities: ["read", "listdir"],
      }),
    );
  });

  it.each([
    {
      scenario: "analyze with partial capabilities",
      feature: "analyze" as keyof StoreCapabilities,
      fsCapabilities: {
        read: true,
        write: false,
        listdir: false, // missing
        exists: true,
        mkdir: false,
        rm: false,
      },
      expectedAvailable: ["read", "exists"],
    },
    {
      scenario: "mirror with write-only capabilities",
      feature: "mirror" as keyof StoreCapabilities,
      fsCapabilities: {
        read: false, // missing
        write: true,
        listdir: false, // missing
        exists: false, // missing
        mkdir: true,
        rm: false,
      },
      expectedAvailable: ["write", "mkdir"],
    },
  ])("should handle $scenario correctly", ({ feature, fsCapabilities, expectedAvailable }) => {
    const fs = {
      capabilities: fsCapabilities,
    } as FileSystemBridge;

    expect(() => assertCapabilities(feature, fs)).toThrow(
      expect.objectContaining({
        feature,
        requiredCapabilities: STORE_CAPABILITY_REQUIREMENTS[feature],
        availableCapabilities: expectedAvailable,
      }),
    );
  });
});
