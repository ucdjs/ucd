export {
  createDeduplicateTransform,
  type DeduplicateOptions,
  deduplicateRows,
  type DeduplicateStrategy,
} from "./deduplicate";

export {
  createExpandRangesTransform,
  expandRanges,
  type ExpandRangesOptions,
} from "./expand-ranges";

export {
  createNormalizeTransform,
  normalizeCodePoints,
} from "./normalize";

export {
  createSortTransform,
  sortByCodePoint,
  type SortDirection,
  type SortOptions,
} from "./sort";
