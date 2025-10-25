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

export { hasCapability } from "./guards";

export type {
  FileSystemBridge,
  FileSystemBridgeFactory,
  FileSystemBridgeHooks,
  FileSystemBridgeMetadata,
  FileSystemBridgeOperations,
  FileSystemBridgeRmOptions,
  FSEntry,
} from "./types";
