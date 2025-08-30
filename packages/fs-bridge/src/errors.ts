import type { FileSystemBridgeCapabilityKey } from "./types";

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
