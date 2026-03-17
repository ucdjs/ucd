export { assertFeature } from "./assertions";
export { defineBackend } from "./define";
export {
  BackendEntryIsDirectory,
  BackendError,
  BackendFileNotFound,
  BackendSetupError,
  BackendUnsupportedOperation,
} from "./errors";
export { hasFeature, isHttpBackend } from "./guards";

export type {
  BackendArgs,
  BackendDefinition,
  BackendEntry,
  BackendStat,
  BackendFactory,
  BackendHooks,
  CopyOptions,
  FileSystemBackend,
  FileSystemBackendFeature,
  FileSystemBackendMeta,
  FileSystemBackendMutableOperations,
  FileSystemBackendOperations,
  ListOptions,
  RemoveOptions,
} from "./types";
