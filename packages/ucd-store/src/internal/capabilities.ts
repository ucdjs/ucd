import type { FileSystemBridge, FileSystemBridgeCapabilities, FileSystemBridgeCapabilityKey, FileSystemBridgeOperations } from "@ucdjs/fs-bridge";
import type { StoreCapabilities } from "../types";
import { __BRIDGE_DEBUG_SYMBOL__DO_NOT_USE_OR_YOU_WILL_BE_FIRED__ } from "@ucdjs/fs-bridge";
import { UCDStoreUnsupportedFeature } from "../errors";

export function inferStoreCapabilities(fsBridge: FileSystemBridgeOperations): StoreCapabilities {
  const fsCapabilities = (fsBridge as any)[__BRIDGE_DEBUG_SYMBOL__DO_NOT_USE_OR_YOU_WILL_BE_FIRED__];

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

export function assertCapabilities(feature: keyof StoreCapabilities, fsBridge: FileSystemBridgeOperations): void {
  const fsCapabilities = (fsBridge as any)[__BRIDGE_DEBUG_SYMBOL__DO_NOT_USE_OR_YOU_WILL_BE_FIRED__];
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

const CAPABILITY_REQUIREMENTS: Record<keyof StoreCapabilities, FileSystemBridgeCapabilityKey[]> = {
  clean: ["listdir", "exists", "rm", "write", "read"],
  analyze: ["listdir", "exists", "read"],
  mirror: ["read", "write", "listdir", "mkdir", "exists"],
  repair: ["read", "listdir", "exists", "rm", "write"],
} as const;

function getRequiredCapabilities(feature: keyof StoreCapabilities): FileSystemBridgeCapabilityKey[] {
  const capabilities = CAPABILITY_REQUIREMENTS[feature];
  if (!capabilities) {
    throw new Error(`Unknown store capability: ${feature}`);
  }
  return capabilities;
}

interface HasFileSystemBridge {
  fs: FileSystemBridgeOperations;
}

export function requiresCapabilities<K extends keyof StoreCapabilities>(capability?: K) {
  return function <
    T extends HasFileSystemBridge,
    M extends (...args: any[]) => Promise<any>,
  >(
    target: T,
    propertyKey: string | symbol,
    descriptor: TypedPropertyDescriptor<M>,
  ): TypedPropertyDescriptor<M> {
    const originalMethod = descriptor.value!;

    const _capability = capability || propertyKey as K;
    if (!_capability || !CAPABILITY_REQUIREMENTS[_capability]) {
      throw new Error(`Invalid capability: ${_capability}`);
    }

    descriptor.value = async function (this: T, ...args: Parameters<M>): Promise<Awaited<ReturnType<M>>> {
      assertCapabilities(_capability, this.fs);
      return await originalMethod.apply(this, args);
    } as M;

    return descriptor;
  };
}
