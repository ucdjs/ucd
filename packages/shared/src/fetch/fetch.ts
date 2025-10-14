import type { Readable } from "node:stream";
import type {
  CustomFetch,
  FetchContext,
  FetchOptions,
  FetchResponse,
  MappedResponseType,
  ResponseType,
  SafeFetchResponse,
} from "./types";
import destr from "destr";
import { FetchError } from "./error";
import {
  detectResponseType,
  isJSONSerializable,
  isPayloadMethod,
} from "./utils";

// https://developer.mozilla.org/en-US/docs/Web/HTTP/Status
const DEFAULT_RETRY_STATUS_CODES = new Set([
  408, // Request Timeout
  409, // Conflict
  425, // Too Early (Experimental)
  429, // Too Many Requests
  500, // Internal Server Error
  502, // Bad Gateway
  503, // Service Unavailable
  504, // Gateway Timeout
]);

// https://developer.mozilla.org/en-US/docs/Web/API/Response/body
const nullBodyResponses = new Set([101, 204, 205, 304]);

function createCustomFetch(): CustomFetch {
  async function handleError<T = any, R extends ResponseType = ResponseType>(
    context: FetchContext<T, R>,
  ): Promise<FetchResponse<MappedResponseType<R, T>>> {
    // Is Abort
    // If it is an active abort, it will not retry automatically.
    // https://developer.mozilla.org/en-US/docs/Web/API/DOMException#error_names
    const isAbort
      = (context.error
        && context.error.name === "AbortError"
        && !context.options.timeout)
      || false;
    // Retry
    if (context.options.retry !== false && !isAbort) {
      let retries;
      if (typeof context.options.retry === "number") {
        retries = context.options.retry;
      } else {
        retries = isPayloadMethod(context.options.method) ? 0 : 1;
      }

      const responseCode = (context.response && context.response.status) || 500;
      if (
        retries > 0
        && (Array.isArray(context.options.retryStatusCodes)
          ? context.options.retryStatusCodes.includes(responseCode)
          : DEFAULT_RETRY_STATUS_CODES.has(responseCode))
      ) {
        const retryDelay
          = typeof context.options.retryDelay === "function"
            ? context.options.retryDelay({
                ...context,
                retryAttempt: context.options.retry! - retries + 1,
              })
            : context.options.retryDelay || 0;
        if (retryDelay > 0) {
          await new Promise((resolve) => setTimeout(resolve, retryDelay));
        }
        // Timeout
        return executeFetch(context.request, {
          ...context.options,
          retry: retries - 1,
        });
      }
    }

    // Throw normalized error
    const error = FetchError.from(context);

    // Only available on V8 based runtimes (https://v8.dev/docs/stack-trace-api)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(error, executeFetch);
    }
    throw error;
  }

  async function executeFetch<
    T = any,
    R extends ResponseType = "json",
  >(_request: RequestInfo, _options: FetchOptions<R> = {}): Promise<FetchResponse<MappedResponseType<R, T>>> {
    const context: FetchContext<T, R> = {
      request: _request,
      options: {
        ..._options,
        headers: new Headers(
          _options.headers ?? (_request as Request)?.headers,
        ),
      },
      response: undefined,
      error: undefined,
    };

    // Uppercase method name
    if (context.options.method) {
      context.options.method = context.options.method.toUpperCase();
    }

    if (context.options.body && isPayloadMethod(context.options.method)) {
      if (isJSONSerializable(context.options.body)) {
        const contentType = context.options.headers.get("content-type");

        // Automatically stringify request bodies, when not already a string.
        if (typeof context.options.body !== "string") {
          context.options.body
            = contentType === "application/x-www-form-urlencoded"
              ? new URLSearchParams(
                  context.options.body as Record<string, any>,
                ).toString()
              : JSON.stringify(context.options.body);
        }

        // Set Content-Type and Accept headers to application/json by default
        // for JSON serializable request bodies.
        // Pass empty object as older browsers don't support undefined.
        context.options.headers = new Headers(context.options.headers || {});
        if (!contentType) {
          context.options.headers.set("content-type", "application/json");
        }
        if (!context.options.headers.has("accept")) {
          context.options.headers.set("accept", "application/json");
        }
      } else if (
        // ReadableStream Body
        ("pipeTo" in (context.options.body as ReadableStream)
          && typeof (context.options.body as ReadableStream).pipeTo
          === "function")
        // Node.js Stream Body
        || typeof (context.options.body as Readable).pipe === "function"
      ) {
        if (!("duplex" in context.options)) {
          context.options.duplex = "half";
        }
      }
    }

    let abortTimeout: NodeJS.Timeout | undefined;

    // TODO: Can we merge signals?
    if (!context.options.signal && context.options.timeout) {
      const controller = new AbortController();
      abortTimeout = setTimeout(() => {
        const error = new Error(
          "[TimeoutError]: The operation was aborted due to timeout",
        );
        error.name = "TimeoutError";
        (error as any).code = 23; // DOMException.TIMEOUT_ERR
        controller.abort(error);
      }, context.options.timeout);
      context.options.signal = controller.signal;
    }

    try {
      context.response = await fetch(
        context.request,
        context.options as RequestInit,
      );
    } catch (error) {
      context.error = error as Error;
      return await handleError(context);
    } finally {
      if (abortTimeout) {
        clearTimeout(abortTimeout);
      }
    }

    const hasBody
      = (context.response.body || (context.response as any)._bodyInit)
        && !nullBodyResponses.has(context.response.status)
        && context.options.method !== "HEAD";
    if (hasBody) {
      const responseType = context.options.parseAs || detectResponseType(context.response.headers.get("content-type") || "");

      // We override the `.json()` method to parse the body more securely with `destr`
      switch (responseType) {
        case "json": {
          const data = await context.response.text();
          context.response.data = destr(data);
          break;
        }
        case "stream": {
          context.response.data
            = context.response.body || (context.response as any)._bodyInit; // (see refs above)
          break;
        }
        default: {
          context.response.data = await context.response[responseType]() as MappedResponseType<R, T>;
        }
      }
    }

    if (
      context.response.status >= 400
      && context.response.status < 600
    ) {
      return await handleError(context);
    }

    return context.response;
  }

  async function safeFetch<T = any, R extends ResponseType = "json">(
    request: RequestInfo,
    options?: FetchOptions<R>,
  ): Promise<SafeFetchResponse<MappedResponseType<R, T>>> {
    try {
      const response = await executeFetch<T, R>(request, options);

      return {
        data: response.data || null,
        response,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error as any,
        response: (error as any).response,
      };
    }
  }

  const customFetch = executeFetch as CustomFetch;
  customFetch.safe = safeFetch;

  return customFetch;
}

export const customFetch = createCustomFetch();
