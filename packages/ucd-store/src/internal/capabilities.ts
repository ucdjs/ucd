import type { FileSystemBridge, FileSystemBridgeCapabilities } from "@ucdjs/utils/fs-bridge";
import type { StoreCapabilities } from "../types";
import { getSupportedBridgeCapabilities } from "@ucdjs/utils/fs-bridge";
import { UCDStoreUnsupportedFeature } from "./errors";

export function inferStoreCapabilities(fsBridge: FileSystemBridge): StoreCapabilities {
  const fsCapabilities = getSupportedBridgeCapabilities(fsBridge);

  return {
    clean: hasRequiredCapabilities(fsCapabilities, ["listdir", "exists", "rm", "write"]),
    analyze: hasRequiredCapabilities(fsCapabilities, ["listdir", "stat", "exists"]),
  };
}

function hasRequiredCapabilities(fsCapabilities: FileSystemBridgeCapabilities, capabilities: (keyof FileSystemBridgeCapabilities)[]): boolean {
  return capabilities.every((capability) => fsCapabilities[capability] === true);
}

export function assertCapabilities(feature: keyof StoreCapabilities, fsBridge: FileSystemBridge): void {
  const fsCapabilities = getSupportedBridgeCapabilities(fsBridge);
  const storeCapabilities = inferStoreCapabilities(fsBridge);

  if (!storeCapabilities[feature]) {
    const requiredCapabilities = getRequiredCapabilities(feature);
    const availableCapabilities = Object.keys(fsCapabilities).filter((k) => fsCapabilities[k as keyof typeof fsCapabilities]);

    throw new UCDStoreUnsupportedFeature(
      feature,
      requiredCapabilities,
      availableCapabilities,
    );
  }
}

function getRequiredCapabilities(feature: keyof StoreCapabilities): string[] {
  switch (feature) {
    case "clean":
      return ["listdir", "exists", "rm", "write"];
    case "analyze":
      return ["listdir", "stat", "exists"];
    default:
      return [];
  }
}
