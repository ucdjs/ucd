export {
  createPathFilter,
  DEFAULT_EXCLUDED_EXTENSIONS,
  filterTreeStructure,
  PRECONFIGURED_FILTERS,
} from "@ucdjs-internal/shared";
export type { PathFilter, PathFilterOptions } from "@ucdjs-internal/shared";

export {
  createGlobMatcher,
  DEFAULT_PICOMATCH_OPTIONS,
  isValidGlobPattern,
  matchGlob,
} from "@ucdjs-internal/shared";
export type { GlobMatchFn, GlobMatchOptions } from "@ucdjs-internal/shared";

export {
  findFileByPath,
  flattenFilePaths,
  normalizePathForFiltering,
  normalizeTreeForFiltering,
} from "@ucdjs-internal/shared";

export { createConcurrencyLimiter, isApiError, tryOr, wrapTry } from "@ucdjs-internal/shared";
export type { OperationFailure, OperationResult, OperationSuccess } from "@ucdjs-internal/shared";

export {
  getLatestDraftUnicodeVersion,
  getLatestStableUnicodeVersion,
  isDraftUnicodeVersion,
  isStableUnicodeVersion,
  isValidUnicodeVersion,
} from "@ucdjs-internal/shared";
