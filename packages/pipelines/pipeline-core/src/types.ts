/**
 * Represents the context of a file being processed in the pipeline.
 */
export interface FileContext {
  /**
   * The Unicode version being processed (e.g., "16.0.0").
   */
  version: string;

  /**
   * The directory category of the file.
   */
  dir: "ucd" | "extracted" | "auxiliary" | "emoji" | "unihan" | string;

  /**
   * The relative path from the version root (e.g., "ucd/LineBreak.txt").
   */
  path: string;

  /**
   * The file name (e.g., "LineBreak.txt").
   */
  name: string;

  /**
   * The file extension (e.g., ".txt").
   */
  ext: string;
}

/**
 * Context for a specific row/line within a file.
 * Used during row-level filtering in multi-property files.
 */
export interface RowContext {
  /**
   * The property name for multi-property files (e.g., "NFKC_Casefold").
   */
  property?: string;
}

/**
 * Combined context passed to filter predicates.
 * During file routing, only `file` is defined.
 * During row filtering, both `file` and `row` are defined.
 */
export interface FilterContext {
  /**
   * The file context.
   */
  file: FileContext;

  /**
   * The row context (only defined during row-level filtering).
   */
  row?: RowContext;

  /**
   * The source context (only defined when using multiple sources).
   */
  source?: {
    /**
     * The source ID.
     */
    id: string;
  };
}

/**
 * A predicate function that determines if a file or row should be processed.
 */
export type PipelineFilter = (ctx: FilterContext) => boolean;

/**
 * A parsed row from a UCD file.
 */
export interface ParsedRow {
  /**
   * The source file path relative to the version root.
   */
  sourceFile: string;

  /**
   * The kind of entry.
   */
  kind: "range" | "point" | "sequence" | "alias";

  /**
   * Start of range (hex string, e.g., "0041").
   */
  start?: string;

  /**
   * End of range (hex string, e.g., "005A").
   */
  end?: string;

  /**
   * Single code point (hex string).
   */
  codePoint?: string;

  /**
   * Sequence of code points (hex strings).
   */
  sequence?: string[];

  /**
   * Property name for multi-property files.
   */
  property?: string;

  /**
   * The value(s) associated with this entry.
   */
  value?: string | string[];

  /**
   * Additional metadata (comments, line numbers, etc.).
   */
  meta?: Record<string, unknown>;
}

/**
 * Context passed to parser functions.
 */
export interface ParseContext {
  /**
   * The file being parsed.
   */
  file: FileContext;

  /**
   * Read the raw content of the file.
   */
  readContent: () => Promise<string>;

  /**
   * Read the file line by line.
   */
  readLines: () => AsyncIterable<string>;

  /**
   * Check if a line is a comment.
   */
  isComment: (line: string) => boolean;
}

/**
 * A parser function that converts file content to parsed rows.
 */
export type ParserFn = (ctx: ParseContext) => AsyncIterable<ParsedRow>;

/**
 * A resolved entry in the output JSON.
 */
export interface ResolvedEntry {
  /**
   * Range in "XXXX..YYYY" format (hex, inclusive).
   */
  range?: `${string}..${string}`;

  /**
   * Single code point in hex.
   */
  codePoint?: string;

  /**
   * Sequence of code points.
   */
  sequence?: string[];

  /**
   * The value(s) for this entry.
   */
  value: string | string[];
}

/**
 * A default range from @missing declarations.
 */
export interface DefaultRange {
  /**
   * The range this default applies to.
   */
  range: `${string}..${string}`;

  /**
   * The default value.
   */
  value: string | string[];
}

/**
 * The standardized JSON output for a property.
 */
export interface PropertyJson {
  /**
   * The Unicode version (e.g., "16.0.0").
   */
  version: string;

  /**
   * The property name (e.g., "Line_Break").
   */
  property: string;

  /**
   * The source file name (e.g., "LineBreak.txt").
   */
  file: string;

  /**
   * The resolved entries.
   */
  entries: ResolvedEntry[];

  /**
   * Default ranges from @missing (in encounter order).
   */
  defaults?: DefaultRange[];

  /**
   * Additional metadata.
   */
  meta?: Record<string, unknown>;
}

/**
 * Context passed to resolver functions.
 */
export interface ResolveContext<TArtifacts extends Record<string, unknown> = Record<string, unknown>> {
  /**
   * The Unicode version being processed.
   */
  version: string;

  /**
   * The file being resolved.
   */
  file: FileContext;

  /**
   * Get an artifact by ID.
   */
  getArtifact: <K extends keyof TArtifacts>(id: K) => TArtifacts[K];

  /**
   * Emit an artifact for subsequent routes.
   */
  emitArtifact: <K extends string, V>(id: K, value: V) => void;

  /**
   * Normalize and sort entries by code point range.
   */
  normalizeEntries: (entries: ResolvedEntry[]) => ResolvedEntry[];

  /**
   * Get current timestamp in ISO 8601 format.
   */
  now: () => string;
}

/**
 * A resolver function that converts parsed rows to property JSON.
 */
export type ResolverFn<
  TArtifacts extends Record<string, unknown> = Record<string, unknown>,
  TOutput = PropertyJson[],
> = (
  ctx: ResolveContext<TArtifacts>,
  rows: AsyncIterable<ParsedRow>,
) => Promise<TOutput>;

/**
 * Output configuration for a route.
 */
export interface RouteOutput {
  /**
   * Custom output directory.
   */
  dir?: string;

  /**
   * Custom file name generator.
   */
  fileName?: (pj: PropertyJson) => string;
}
