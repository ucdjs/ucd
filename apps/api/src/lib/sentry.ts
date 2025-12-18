import type { Context } from "hono";
import * as Sentry from "@sentry/cloudflare";

/**
 * Component identifiers for different parts of the API.
 * Used to categorize errors by which part of the system they occurred in.
 */
export const COMPONENTS = {
  V1_VERSIONS: "v1_versions",
  V1_FILES: "v1_files",
  WELL_KNOWN: "well_known",
  TASKS: "tasks",
} as const;

export type Component = typeof COMPONENTS[keyof typeof COMPONENTS];

/**
 * Operation names mapped by component.
 * Ensures type safety when specifying operations for each component.
 */
export interface ComponentOperations {
  [COMPONENTS.V1_VERSIONS]: "getAllVersionsFromList" | "getVersionFromList" | "calculateStatistics" | "getVersionFileTree";
  [COMPONENTS.V1_FILES]: "getFile" | "searchFiles" | "listDirectory";
  [COMPONENTS.WELL_KNOWN]: "getUCDConfig" | "getUCDStore";
  [COMPONENTS.TASKS]: "executeTask";
}

/**
 * Type-safe operation name based on component.
 */
export type Operation<T extends Component> = ComponentOperations[T];

/**
 * Options for capturing errors with Sentry.
 */
export interface CaptureErrorOptions<T extends Component> {
  /** The component where the error occurred */
  component: T;
  /** The operation that failed */
  operation: Operation<T>;
  /** Optional Hono context to extract request metadata */
  context?: Context;
  /** Additional tags to add to the error */
  tags?: Record<string, string>;
  /** Additional metadata to include */
  extra?: Record<string, unknown>;
}

/**
 * Extracts request metadata from Hono context for error reporting.
 */
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
export interface CaptureUpstreamErrorOptions<T extends Component> extends Omit<CaptureErrorOptions<T>, "tags"> {
  /** The upstream service that failed */
  upstreamService: string;
  /** Additional tags (upstream_service is automatically added) */
  tags?: Record<string, string>;
}

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
export interface CaptureValidationErrorOptions<T extends Component> extends CaptureErrorOptions<T> {
  /** Additional tags (issue_type: "validation" is automatically added) */
  tags?: Record<string, string>;
}

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

/**
 * Specialized error capture for parsing/parsing errors.
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
export interface CaptureParseErrorOptions<T extends Component> extends CaptureErrorOptions<T> {
  /** Additional tags (issue_type: "parse" is automatically added) */
  tags?: Record<string, string>;
}

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
