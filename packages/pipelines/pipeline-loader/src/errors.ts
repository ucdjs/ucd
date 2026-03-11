export const PIPELINE_LOADER_ISSUE_CODES = [
  "INVALID_LOCATOR",
  "CACHE_MISS",
  "REF_RESOLUTION_FAILED",
  "DOWNLOAD_FAILED",
  "MATERIALIZE_FAILED",
  "DISCOVERY_FAILED",
  "BUNDLE_RESOLVE_FAILED",
  "BUNDLE_TRANSFORM_FAILED",
  "IMPORT_FAILED",
  "INVALID_EXPORT",
] as const;

type PipelineLoaderIssueCode = (typeof PIPELINE_LOADER_ISSUE_CODES)[number];
type PipelineLoaderIssueScope = "locator" | "repository" | "discovery" | "file" | "bundle" | "import";

export interface PipelineLoaderIssue {
  code: PipelineLoaderIssueCode;
  scope: PipelineLoaderIssueScope;
  message: string;
  locator?: unknown;
  repositoryPath?: string;
  filePath?: string;
  relativePath?: string;
  cause?: Error;
  meta?: Record<string, unknown>;
}

export class PipelineLoaderError extends Error {
  readonly code: PipelineLoaderIssueCode;

  constructor(code: PipelineLoaderIssueCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PipelineLoaderError";
    this.code = code;
  }
}

export class CacheMissError extends PipelineLoaderError {
  readonly provider: string;
  readonly owner: string;
  readonly repo: string;
  readonly ref: string;

  constructor(provider: string, owner: string, repo: string, ref: string) {
    super(
      "CACHE_MISS",
      `Cache miss for ${provider}:${owner}/${repo}@${ref}. `
      + `Run 'ucd pipelines cache refresh --${provider} ${owner}/${repo} --ref ${ref}' to sync.`,
    );
    this.name = "CacheMissError";
    this.provider = provider;
    this.owner = owner;
    this.repo = repo;
    this.ref = ref;
  }
}

export class BundleError extends PipelineLoaderError {
  readonly entryPath: string;

  constructor(entryPath: string, message: string, options?: ErrorOptions) {
    super("IMPORT_FAILED", message, options);
    this.name = "BundleError";
    this.entryPath = entryPath;
  }
}

export class BundleResolveError extends PipelineLoaderError {
  readonly entryPath: string;
  readonly importPath: string;

  constructor(entryPath: string, importPath: string, options?: ErrorOptions) {
    super(
      "BUNDLE_RESOLVE_FAILED",
      `Cannot resolve import "${importPath}" in ${entryPath}`,
      options,
    );
    this.name = "BundleResolveError";
    this.entryPath = entryPath;
    this.importPath = importPath;
  }
}

export class BundleTransformError extends PipelineLoaderError {
  readonly entryPath: string;
  readonly line?: number;
  readonly column?: number;

  constructor(entryPath: string, options?: ErrorOptions & { line?: number; column?: number }) {
    const { line, column, ...errorOptions } = options ?? {};
    super(
      "BUNDLE_TRANSFORM_FAILED",
      `Transform/parse error in ${entryPath}${line != null ? ` at line ${line}` : ""}`,
      errorOptions,
    );
    this.name = "BundleTransformError";
    this.entryPath = entryPath;
    this.line = line;
    this.column = column;
  }
}

export function toPipelineLoaderIssue(error: Error, filePath: string): PipelineLoaderIssue {
  if (error instanceof BundleResolveError) {
    return {
      code: "BUNDLE_RESOLVE_FAILED",
      scope: "bundle",
      message: error.message,
      filePath,
      cause: error,
      meta: {
        entryPath: error.entryPath,
        importPath: error.importPath,
      },
    };
  }

  if (error instanceof BundleTransformError) {
    return {
      code: "BUNDLE_TRANSFORM_FAILED",
      scope: "bundle",
      message: error.message,
      filePath,
      cause: error,
      meta: {
        entryPath: error.entryPath,
        ...(error.line != null ? { line: error.line } : {}),
        ...(error.column != null ? { column: error.column } : {}),
      },
    };
  }

  if (error instanceof BundleError) {
    return {
      code: error.code,
      scope: "import",
      message: error.message,
      filePath,
      cause: error,
      meta: {
        entryPath: error.entryPath,
      },
    };
  }

  if (error instanceof PipelineLoaderError) {
    return {
      code: error.code,
      scope: "import",
      message: error.message,
      filePath,
      cause: error,
    };
  }

  return {
    code: "IMPORT_FAILED",
    scope: "import",
    message: error.message,
    filePath,
    cause: error,
  };
}
