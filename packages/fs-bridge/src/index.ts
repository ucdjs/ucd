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
  FileSystemBridgeMetadata,
  FileSystemBridgeOperations,
  FileSystemBridgeRmOptions,
  FSEntry,
} from "./types";
