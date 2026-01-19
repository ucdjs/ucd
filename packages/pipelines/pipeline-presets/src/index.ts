export {
  createMultiPropertyParser,
  createSequenceParser,
  createStandardParser,
  multiPropertyParser,
  type MultiPropertyParserOptions,
  sequenceParser,
  type SequenceParserOptions,
  standardParser,
  type StandardParserOptions,
  type UnicodeDataMeta,
  unicodeDataParser,
  type UnicodeDataRow,
} from "./parsers";

export {
  type BasicPipelineOptions,
  createBasicPipeline,
  createEmojiPipeline,
  createFullPipeline,
  type EmojiPipelineOptions,
  type FullPipelineOptions,
} from "./pipelines";

export {
  createGroupedResolver,
  createPropertyJsonResolver,
  type GroupedResolverOptions,
  propertyJsonResolver,
  type PropertyJsonResolverOptions,
} from "./resolvers";

export {
  allRoutes,
  blocksRoute,
  coreRoutes,
  derivedCorePropertiesRoute,
  emojiDataRoute,
  emojiRoutes,
  generalCategoryRoute,
  lineBreakRoute,
  propListRoute,
  scriptsRoute,
  unicodeDataRoute,
} from "./routes";

export {
  createHttpBackend,
  createHttpSource,
  createMemoryBackend,
  createMemorySource,
  createUnicodeOrgSource,
  type HttpBackendOptions,
  type HttpSourceOptions,
  type MemoryBackendOptions,
  type MemoryFile,
  type MemorySourceOptions,
  UNICODE_ORG_BASE_URL,
  unicodeOrgSource,
} from "./sources";

export {
  createDeduplicateTransform,
  createExpandRangesTransform,
  createFilterByPipelineFilter,
  createNormalizeTransform,
  createRowFilter,
  createSortTransform,
  type DeduplicateOptions,
  deduplicateRows,
  type DeduplicateStrategy,
  expandRanges,
  type ExpandRangesOptions,
  normalizeCodePoints,
  type RowFilterOptions,
  sortByCodePoint,
  type SortDirection,
  type SortOptions,
} from "./transforms";
