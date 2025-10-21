import type { FileSystemBridge, FileSystemBridgeCapabilityKey } from "./types";
import { createDebugger } from "@ucdjs-internal/shared";

const debug = createDebugger("ucdjs:fs-bridge:guards");

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
export function hasCapability<T extends FileSystemBridgeCapabilityKey = never>(
  bridge: FileSystemBridge,
  capabilityOrCapabilities: T | T[],
): bridge is FileSystemBridge & Required<Pick<FileSystemBridge, T>> {
  const capabilitiesToCheck = Array.isArray(capabilityOrCapabilities)
    ? capabilityOrCapabilities
    : [capabilityOrCapabilities];

  for (const capability of capabilitiesToCheck) {
    if (!bridge.optionalCapabilities[capability]) {
      debug?.("Bridge capability check failed", { capability, availableCapabilities: Object.keys(bridge.optionalCapabilities).filter((k) => bridge.optionalCapabilities[k as FileSystemBridgeCapabilityKey]) });
      return false;
    }
  }

  return true;
}
