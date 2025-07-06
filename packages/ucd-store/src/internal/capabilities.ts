import type { FileSystemBridge, FileSystemBridgeCapabilities } from "@ucdjs/utils/fs-bridge";
import type { StoreCapabilities } from "../types";
import { getSupportedBridgeCapabilities } from "@ucdjs/utils/fs-bridge";
import { UCDStoreUnsupportedFeature } from "./errors";

export function inferStoreCapabilities(fsBridge: FileSystemBridge): StoreCapabilities {
  const fsCapabilities = getSupportedBridgeCapabilities(fsBridge);

  return {
    clean: hasRequiredCapabilities(fsCapabilities, ["listdir", "exists", "rm", "write"]),
    analyze: hasRequiredCapabilities(fsCapabilities, ["listdir", "stat", "exists"]),
    mirror: hasRequiredCapabilities(fsCapabilities, ["read", "write", "listdir", "mkdir", "exists"]),
    repair: hasRequiredCapabilities(fsCapabilities, ["listdir", "exists", "rm", "write"]),
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
    case "mirror":
      return ["read", "write", "listdir", "mkdir", "exists"];
    case "repair":
      return ["listdir", "exists", "rm", "write"];
    default:
      return [];
  }
}

export function requiresCapabilities<K extends keyof StoreCapabilities>(capability: K) {
  return function <T extends Record<K, any>>(
    target: T,
    propertyKey: K,
    descriptor: TypedPropertyDescriptor<(...args: any[]) => Promise<any>>,
  ): TypedPropertyDescriptor<(...args: any[]) => Promise<any>> {
    const originalMethod = descriptor.value!;

    descriptor.value = async function (...args: any[]) {
      assertCapabilities(capability, (this as any).fs);
      return await originalMethod.apply(this, args);
    };

    return descriptor;
  };
}
