import type { MaybeArray } from "@luxass/utils";
import type { FileSystemBridge, FileSystemBridgeCapabilityKey } from "./types";

/**
 * Asserts that a file system bridge supports the specified capability or capabilities.
 *
 * This function performs a runtime check to ensure the bridge has the required capabilities
 * and acts as a type guard to narrow the bridge type to include the specified capabilities.
 *
 * @template {FileSystemBridgeCapabilityKey} T - The capability key(s) to check for, extending FileSystemBridgeCapabilityKey
 * @param {FileSystemBridge} bridge - The file system bridge to check capabilities for
 * @param {MaybeArray<T>} capabilityOrCapabilities - A single capability or array of capabilities to verify
 * @throws {BridgeUnsupportedOperation} When the bridge doesn't support one or more of the specified capabilities
 */
export function assertCapability<T extends FileSystemBridgeCapabilityKey = never>(
  bridge: FileSystemBridge,
  capabilityOrCapabilities: MaybeArray<T>,
): asserts bridge is FileSystemBridge & Required<Pick<FileSystemBridge, T>> {
  const capabilitiesToCheck = Array.isArray(capabilityOrCapabilities)
    ? capabilityOrCapabilities
    : [capabilityOrCapabilities];

  for (const capability of capabilitiesToCheck) {
    if (!bridge.capabilities[capability]) {
      throw new BridgeUnsupportedOperation(capability);
    }
  }
}

export class BridgeUnsupportedOperation extends Error {
  public readonly capability: FileSystemBridgeCapabilityKey;

  constructor(
    capability: FileSystemBridgeCapabilityKey,
  ) {
    super(`File system bridge does not support the '${capability}' capability.`);
    this.name = "BridgeUnsupportedOperation";
    this.capability = capability;
  }
}
