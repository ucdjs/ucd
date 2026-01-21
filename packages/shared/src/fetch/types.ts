import type { FetchError, FetchSchemaValidationError } from "./error";
import type { ZodType } from "zod";

export interface CustomFetch {
  <T = any, R extends ResponseType = "json">(
    request: RequestInfo,
    options?: FetchOptions<R, T>
  ): Promise<FetchResponse<MappedResponseType<R, T>>>;
  safe: <T = any, R extends ResponseType = "json">(
    request: RequestInfo,
    options?: FetchOptions<R, T>,
  ) => Promise<SafeFetchResponse<MappedResponseType<R, T>>>;
}

export interface ResponseMap {
  blob: Blob;
  text: string;
  arrayBuffer: ArrayBuffer;
  stream: ReadableStream<Uint8Array>;
}

export type ResponseType = keyof ResponseMap | "json";

export type MappedResponseType<
  R extends ResponseType,
  JsonType = any,
> = R extends keyof ResponseMap ? ResponseMap[R] : JsonType;

export interface SafeFetchResponse<T = any> {
  data: T | null;
  error: FetchError<T> | FetchSchemaValidationError<T> | null;
  response?: FetchResponse<T>;
}

export interface FetchResponse<T> extends Response {
  data?: T;
}

export interface FetchOptions<R extends ResponseType = ResponseType, T = any>
  extends Omit<RequestInit, "body"> {
  body?: RequestInit["body"] | Record<string, any>;

  parseAs?: R;

  /**
   * Zod schema to validate the response data against.
   * If validation fails, an error will be returned/thrown.
   *
   * TODO(@luxass): figure out how we can hide the true value of
   *  `schema` from the user. Since it is very large, it can be
   *  confusing to see it in error messages.
   */
  schema?: ZodType<T>;

  /**
   * @experimental Set to "half" to enable duplex streaming.
   * Will be automatically set to "half" when using a ReadableStream as body.
   * @see https://fetch.spec.whatwg.org/#enumdef-requestduplex
   */
  duplex?: "half" | undefined;

  /** timeout in milliseconds */
  timeout?: number;

  retry?: number | false;

  /** Delay between retries in milliseconds. */
  retryDelay?: number | (
    (context: FetchContext<T, R> & {
      retryAttempt: number;
    }) => number
  );

  /** Default is [408, 409, 425, 429, 500, 502, 503, 504] */
  retryStatusCodes?: number[];
}

export interface FetchContext<T = any, R extends ResponseType = ResponseType> {
  request: RequestInfo;
  options: FetchOptions<R> & { headers: Headers };
  response?: FetchResponse<MappedResponseType<R, T>>;
  error?: Error;
}
