import type {
  FileSystemBridge,
  FileSystemBridgeCapabilityKey,
} from "@ucdjs/fs-bridge";
import type { StoreCapabilities } from "../types";
import { UCDStoreUnsupportedFeature } from "../errors";

export const STORE_CAPABILITY_REQUIREMENTS = {
  analyze: ["listdir", "exists", "read"],
  clean: ["listdir", "exists", "rm", "write", "read"],
  mirror: ["read", "write", "listdir", "mkdir", "exists"],
  repair: ["read", "listdir", "exists", "rm", "write", "mkdir"],
} satisfies Record<keyof StoreCapabilities, FileSystemBridgeCapabilityKey[]>;

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
