export {
  type StoreError,
  UCDStoreBaseError,
  UCDStoreBridgeUnsupportedOperation,
  UCDStoreFileNotFoundError,
  UCDStoreGenericError,
  UCDStoreVersionNotFoundError,
} from "./errors";

export {
  createHTTPUCDStore,
  createNodeUCDStore,
} from "./factory";

export type {
  AnalysisFilesReport,
  AnalysisReport,
  AnalysisVersionReport,
  AnalyzeOptions,
} from "./reports/analyze";

export { createUCDStore } from "./store";

export type {
  MirrorFilesReport,
  MirrorOptions,
  MirrorReport,
  MirrorVersionReport,
} from "./tasks/mirror";

export type {
  SyncOptions,
  SyncResult,
} from "./tasks/sync";

export type {
  InternalUCDStoreContext,
  SharedOperationOptions,
  UCDStore,
  UCDStoreContext,
  UCDStoreOperations,
  UCDStoreOptions,
  VersionConflictStrategy,
} from "./types";

export type {
  BaseOperationReport,
  BaseVersionReport,
  FileCounts,
  OperationMetrics,
  OperationSummary,
  ReportError,
  ReportFile,
  StorageMetrics,
} from "./types";

export {
  validateVersions,
} from "./utils/validate";

export type {
  ValidateVersionsOptions,
  ValidateVersionsResult,
} from "./utils/validate";
