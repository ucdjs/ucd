import type { FileSystemBridge, FileSystemBridgeCapabilityKey } from "./types";
import { createDebugger } from "@ucdjs/shared";
import { BridgeUnsupportedOperation } from "./errors";

const debug = createDebugger("ucdjs:fs-bridge:assertions");

/**
 * Asserts that a file system bridge supports the specified capability or capabilities.
 *
 * This function performs a runtime check to ensure the bridge has the required capabilities
 * and acts as a type guard to narrow the bridge type to include the specified capabilities.
 *
 * @template {FileSystemBridgeCapabilityKey} T - The capability key(s) to check for, extending FileSystemBridgeCapabilityKey
 * @param {FileSystemBridge} bridge - The file system bridge to check capabilities for
 * @param {T | T[]} capabilityOrCapabilities - A single capability or array of capabilities to verify
 * @throws {BridgeUnsupportedOperation} When the bridge doesn't support one or more of the specified capabilities
 */
export function assertCapability<T extends FileSystemBridgeCapabilityKey = never>(
  bridge: FileSystemBridge,
  capabilityOrCapabilities: T | T[],
): asserts bridge is FileSystemBridge & Required<Pick<FileSystemBridge, T>> {
  const capabilitiesToCheck = Array.isArray(capabilityOrCapabilities)
    ? capabilityOrCapabilities
    : [capabilityOrCapabilities];

  for (const capability of capabilitiesToCheck) {
    if (!bridge.capabilities[capability]) {
      debug?.("Bridge capability check failed", { capability, availableCapabilities: Object.keys(bridge.capabilities).filter((k) => bridge.capabilities[k as FileSystemBridgeCapabilityKey]) });
      throw new BridgeUnsupportedOperation(capability);
    }
  }
}
