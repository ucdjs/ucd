import type { Context } from "hono";
import * as Sentry from "@sentry/cloudflare";

export const COMPONENTS = {
  V1_VERSIONS: "v1_versions",
  V1_FILES: "v1_files",
  WELL_KNOWN: "well_known",
  TASKS: "tasks",
} as const;

export type Component = typeof COMPONENTS[keyof typeof COMPONENTS];

export interface ComponentOperations {
  [COMPONENTS.V1_VERSIONS]: "getAllVersionsFromList" | "getVersionFromList" | "calculateStatistics" | "getVersionFileTree" | "getCurrentDraftVersion";
  [COMPONENTS.V1_FILES]: "getFile" | "searchFiles" | "listDirectory";
  [COMPONENTS.WELL_KNOWN]: "getUCDConfig" | "getUCDStore";
  [COMPONENTS.TASKS]: "executeTask";
}

export interface CaptureErrorOptions<T extends Component> {
  /**
   * The component where the error occurred
   */
  component: T;

  /**
   * The operation that failed
   */
  operation: ComponentOperations[T];

  /**
   *  Optional Hono context to extract request metadata
   */
  context?: Context;

  /**
   * Additional tags to add to the error
   */
  tags?: Record<string, string>;

  /**
   *  Additional metadata to include
   */
  extra?: Record<string, unknown>;
}

function extractRequestContext(context?: Context): Record<string, unknown> | undefined {
  if (!context) {
    return undefined;
  }

  const request = context.req;
  const url = new URL(request.url);

  return {
    path: request.path,
    method: request.method,
    query: Object.fromEntries(url.searchParams.entries()),
    headers: {
      "user-agent": request.header("user-agent"),
      "content-type": request.header("content-type"),
      "accept": request.header("accept"),
    },
  };
}

/**
 * Type-safe error capturing wrapper for Sentry.
 *
 * Automatically extracts request metadata from Hono context if provided,
 * and ensures component/operation combinations are type-safe.
 *
 * @example
 * ```typescript
 * import { captureError, COMPONENTS } from "../../lib/sentry";
 *
 * captureError(error, {
 *   component: COMPONENTS.V1_VERSIONS,
 *   operation: "getAllVersionsFromList",
 *   context: c, // Auto-extracts request metadata
 *   tags: {
 *     upstream_service: "unicode.org",
 *   },
 *   extra: {
 *     url: "https://www.unicode.org/versions/enumeratedversions.html",
 *   },
 * });
 * ```
 */
export function captureError<T extends Component>(
  error: Error,
  options: CaptureErrorOptions<T>,
): void {
  const { component, operation, context, tags = {}, extra = {} } = options;

  const requestContext = extractRequestContext(context);

  Sentry.captureException(error, {
    tags: {
      component,
      operation,
      ...tags,
    },
    extra: {
      ...(requestContext && { request: requestContext }),
      error_message: error.message,
      error_name: error.name,
      ...extra,
    },
  });
}

export interface CaptureUpstreamErrorOptions<T extends Component> extends Omit<CaptureErrorOptions<T>, "tags"> {
  /**
   * The upstream service that failed
   */
  upstreamService: string;

  /**
   *  Additional tags (upstream_service is automatically added)
   */
  tags?: Record<string, string>;
}

/**
 * Specialized error capture for upstream service failures.
 * Automatically adds common upstream service tags and metadata.
 *
 * @example
 * ```typescript
 * captureUpstreamError(error, {
 *   component: COMPONENTS.V1_VERSIONS,
 *   operation: "getAllVersionsFromList",
 *   upstreamService: "unicode.org",
 *   context: c,
 *   extra: {
 *     httpStatus: 500,
 *   },
 * });
 * ```
 */
export function captureUpstreamError<T extends Component>(
  error: Error,
  options: CaptureUpstreamErrorOptions<T>,
): void {
  const { upstreamService, tags = {}, ...rest } = options;

  captureError(error, {
    ...rest,
    tags: {
      upstream_service: upstreamService,
      ...tags,
    },
  });
}

export interface CaptureValidationErrorOptions<T extends Component> extends CaptureErrorOptions<T> {
  /**
   *  Additional tags (issue_type: "validation" is automatically added)
   */
  tags?: Record<string, string>;
}

/**
 * Specialized error capture for validation failures.
 * Automatically adds validation-specific tags.
 *
 * @example
 * ```typescript
 * captureValidationError(error, {
 *   component: COMPONENTS.V1_FILES,
 *   operation: "getFile",
 *   context: c,
 *   extra: {
 *     field: "path",
 *     value: invalidPath,
 *   },
 * });
 * ```
 */
export function captureValidationError<T extends Component>(
  error: Error,
  options: CaptureValidationErrorOptions<T>,
): void {
  const { tags = {}, ...rest } = options;

  captureError(error, {
    ...rest,
    tags: {
      issue_type: "validation",
      ...tags,
    },
  });
}

export interface CaptureParseErrorOptions<T extends Component> extends CaptureErrorOptions<T> {
  /**
   *  Additional tags (issue_type: "parse" is automatically added)
   */
  tags?: Record<string, string>;
}

/**
 * Specialized error capture for parsing errors.
 * Automatically adds parsing-specific tags.
 *
 * @example
 * ```typescript
 * captureParseError(error, {
 *   component: COMPONENTS.V1_VERSIONS,
 *   operation: "getAllVersionsFromList",
 *   context: c,
 *   extra: {
 *     html_length: html.length,
 *     html_preview: html.substring(0, 500),
 *   },
 * });
 * ```
 */
export function captureParseError<T extends Component>(
  error: Error,
  options: CaptureParseErrorOptions<T>,
): void {
  const { tags = {}, ...rest } = options;

  captureError(error, {
    ...rest,
    tags: {
      issue_type: "parse",
      ...tags,
    },
  });
}
