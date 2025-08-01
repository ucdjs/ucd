import type { MaybeArray } from "@luxass/utils";
import type { FileSystemBridgeCapabilityKey } from "./types";

export * from "./define";
export type * from "./types";

export function assertFSCapability(
  capabilities: Record<string, boolean>,
  capabilityOrCapabilities: MaybeArray<FileSystemBridgeCapabilityKey>,
): asserts capabilities is Record<string, true> {
  const capabilitiesToCheck = Array.isArray(capabilityOrCapabilities)
    ? capabilityOrCapabilities
    : [capabilityOrCapabilities];

  for (const capability of capabilitiesToCheck) {
    if (!capabilities[capability]) {
      throw new Error(`File system bridge does not support the '${capability}' capability.`);
    }
  }
}
