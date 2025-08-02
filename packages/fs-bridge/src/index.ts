import type { MaybeArray } from "@luxass/utils";
import type { FileSystemBridge, FileSystemBridgeCapabilityKey } from "./types";

export * from "./define";
export type * from "./types";

export function assertCapability<T extends FileSystemBridgeCapabilityKey = never>(
  bridge: FileSystemBridge,
  capabilityOrCapabilities: MaybeArray<T>,
): asserts bridge is FileSystemBridge & Required<Pick<FileSystemBridge, T>> {
  const capabilitiesToCheck = Array.isArray(capabilityOrCapabilities)
    ? capabilityOrCapabilities
    : [capabilityOrCapabilities];

  for (const capability of capabilitiesToCheck) {
    if (!bridge.capabilities[capability]) {
      throw new Error(`File system bridge does not support the '${capability}' capability.`);
    }
  }
}
