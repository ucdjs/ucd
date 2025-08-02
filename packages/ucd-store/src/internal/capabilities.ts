import type {
  FileSystemBridge,
  FileSystemBridgeCapabilityKey,
} from "@ucdjs/fs-bridge";
import type { StoreCapabilities } from "../types";
import { UCDStoreUnsupportedFeature } from "../errors";

export const STORE_CAPABILITY_REQUIREMENTS: Record<keyof StoreCapabilities, FileSystemBridgeCapabilityKey[]> = {
  analyze: ["listdir", "exists", "read"],
  clean: ["listdir", "exists", "rm", "write", "read"],
  mirror: ["read", "write", "listdir", "mkdir", "exists"],
  repair: ["read", "listdir", "exists", "rm", "write", "mkdir"],
};

/**
 * Infers store capabilities based on the capabilities of a FileSystemBridge.
 *
 * This function examines the capabilities provided by a FileSystemBridge and determines
 * which store operations (analyze, clean, mirror, repair) are supported based on the
 * required filesystem capabilities for each operation.
 *
 * @param {FileSystemBridge} fs - The FileSystemBridge instance to analyze capabilities from
 * @returns {StoreCapabilities} A StoreCapabilities object indicating which store operations are supported
 *
 * @throws {Error} When the FileSystemBridge capabilities are not defined
 */
export function inferStoreCapabilitiesFromFSBridge(fs: FileSystemBridge): StoreCapabilities {
  if (fs.capabilities == null) {
    throw new Error("FileSystemBridge capabilities are not defined.");
  }

  const fsCapabilities = fs.capabilities;

  return Object.fromEntries(
    Object.entries(STORE_CAPABILITY_REQUIREMENTS).map(([feature, requiredCaps]) => [
      feature,
      requiredCaps.every((cap) => fsCapabilities[cap] === true),
    ]),
  ) as unknown as StoreCapabilities;
}

/**
 * Asserts that the FileSystemBridge has all required capabilities for a specific store feature.
 *
 * This function validates that the provided FileSystemBridge supports all the necessary
 * filesystem operations required for the specified store feature. If any required capabilities
 * are missing, it throws a UCDStoreUnsupportedFeature error with details about what's missing.
 *
 * @param {keyof StoreCapabilities} feature - The store feature to check capabilities for (analyze, clean, mirror, or repair)
 * @param {FileSystemBridge} fs - The FileSystemBridge instance to validate capabilities against
 * @returns {void} This function doesn't return a value, it either succeeds silently or throws an error
 *
 * @throws {Error} When the FileSystemBridge capabilities are not defined
 * @throws {UCDStoreUnsupportedFeature} When the FileSystemBridge lacks required capabilities for the specified feature
 */
export function assertCapabilities(feature: keyof StoreCapabilities, fs: FileSystemBridge): void {
  if (!fs.capabilities) {
    throw new Error("FileSystemBridge capabilities are not defined.");
  }

  const requiredCapabilities = STORE_CAPABILITY_REQUIREMENTS[feature];
  const hasAllCapabilities = requiredCapabilities.every((cap) => fs.capabilities![cap] === true);

  if (!hasAllCapabilities) {
    const availableCapabilities = Object.entries(fs.capabilities)
      .filter(([, enabled]) => enabled)
      .map(([cap]) => cap);

    throw new UCDStoreUnsupportedFeature(
      feature,
      requiredCapabilities,
      availableCapabilities,
    );
  }
}
