import type {
  FileSystemBridgeCapabilities,
  FileSystemBridgeCapabilityKey,
  FileSystemBridgeOperationsWithSymbol,
} from "@ucdjs/fs-bridge";
import type { StoreCapabilities } from "../types";
import { __INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__ } from "@ucdjs/fs-bridge/internal";
import { UCDStoreUnsupportedFeature } from "../errors";

export function inferStoreCapabilities(fsBridge: FileSystemBridgeOperationsWithSymbol): StoreCapabilities {
  const fsCapabilities = fsBridge[__INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__];

  if (!fsCapabilities) {
    return {
      clean: false,
      analyze: false,
      mirror: false,
      repair: false,
    };
  }

  return {
    clean: hasRequiredCapabilities(fsCapabilities, getRequiredCapabilities("clean")),
    analyze: hasRequiredCapabilities(fsCapabilities, getRequiredCapabilities("analyze")),
    mirror: hasRequiredCapabilities(fsCapabilities, getRequiredCapabilities("mirror")),
    repair: hasRequiredCapabilities(fsCapabilities, getRequiredCapabilities("repair")),
  };
}

function hasRequiredCapabilities(fsCapabilities: FileSystemBridgeCapabilities, capabilities: FileSystemBridgeCapabilityKey[]): boolean {
  return capabilities.every((capability) => fsCapabilities[capability] === true);
}

export function assertCapabilities(feature: keyof StoreCapabilities, fsBridge: FileSystemBridgeOperationsWithSymbol): void {
  const fsCapabilities = fsBridge[__INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__];
  const storeCapabilities = inferStoreCapabilities(fsBridge);

  if (!storeCapabilities[feature]) {
    const requiredCapabilities = getRequiredCapabilities(feature);
    const availableCapabilities = fsCapabilities
      ? Object.keys(fsCapabilities).filter((k) => fsCapabilities[k as keyof typeof fsCapabilities])
      : [];

    throw new UCDStoreUnsupportedFeature(
      feature,
      requiredCapabilities,
      availableCapabilities,
    );
  }
}

const CAPABILITY_REQUIREMENTS: Record<keyof StoreCapabilities, FileSystemBridgeCapabilityKey[]> = {
  clean: [
    "listdir",
    "exists",
    "rm",
    "write",
    "read",
  ],
  analyze: [
    "listdir",
    "exists",
    "read",
  ],
  mirror: [
    "read",
    "write",
    "listdir",
    "mkdir",
    "exists",
  ],
  repair: [
    "read",
    "listdir",
    "exists",
    "rm",
    "write",
  ],
} as const;

function getRequiredCapabilities(feature: keyof StoreCapabilities): FileSystemBridgeCapabilityKey[] {
  const capabilities = CAPABILITY_REQUIREMENTS[feature];
  if (!capabilities) {
    throw new Error(`Unknown store capability: ${feature}`);
  }
  return capabilities;
}
