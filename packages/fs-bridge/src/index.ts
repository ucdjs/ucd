export { assertCapability } from "./assertions";
export { defineFileSystemBridge } from "./define";
export {
  BridgeBaseError,
  BridgeEntryIsDir,
  BridgeFileNotFound,
  BridgeGenericError,
  BridgeSetupError,
  BridgeUnsupportedOperation,
} from "./errors";

export type {
  FileSystemBridge,
  FileSystemBridgeFactory,
  FileSystemBridgeObject,
  FileSystemBridgeOperations,
  FileSystemBridgeRmOptions,
  FSEntry,
  HasOptionalCapabilityMap,
  OptionalCapabilityKey,
  OptionalFileSystemBridgeOperations,
  RequiredCapabilityKey,
  RequiredFileSystemBridgeOperations,
} from "./types";
