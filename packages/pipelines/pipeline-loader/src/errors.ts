import type { PipelineLoadErrorCode } from "./types";

export class PipelineLoaderError extends Error {
  readonly code: PipelineLoadErrorCode;

  constructor(code: PipelineLoadErrorCode, message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "PipelineLoaderError";
    this.code = code;
  }
}

export class CacheMissError extends PipelineLoaderError {
  readonly source: string;
  readonly owner: string;
  readonly repo: string;
  readonly ref: string;

  constructor(source: string, owner: string, repo: string, ref: string) {
    super(
      "CACHE_MISS",
      `Cache miss for ${source}:${owner}/${repo}@${ref}. `
      + `Run 'ucd pipelines cache refresh --${source} ${owner}/${repo} --ref ${ref}' to sync.`,
    );
    this.name = "CacheMissError";
    this.source = source;
    this.owner = owner;
    this.repo = repo;
    this.ref = ref;
  }
}

export class BundleError extends PipelineLoaderError {
  readonly entryPath: string;

  constructor(entryPath: string, message: string, options?: ErrorOptions) {
    super("BUNDLE_FAILED", message, options);
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
