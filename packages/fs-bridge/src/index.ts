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
  FileSystemBridgeCapabilities,
  FileSystemBridgeOperations,
  FileSystemBridgeRmOptions,
  FSEntry,
} from "./types";
