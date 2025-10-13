import type { FetchContext, FetchOptions, FetchResponse, ResponseType } from "./types";

export class FetchError<T = any> extends Error {
  readonly request?: RequestInfo;
  readonly options?: FetchOptions;
  readonly response?: FetchResponse<T>;
  readonly data?: T;
  readonly status?: number;
  readonly statusText?: string;

  constructor(message: string, opts?: { cause: unknown }) {
    // @ts-ignore https://v8.dev/features/error-cause
    super(message, opts);

    this.name = "FetchError";

    // Polyfill cause for other runtimes
    if (opts?.cause && !this.cause) {
      this.cause = opts.cause;
    }
  }

  static from<T = any, R extends ResponseType = ResponseType>(
    ctx: FetchContext<T, R>,
  ): FetchError<T> {
    const errorMessage = ctx.error?.message || ctx.error?.toString() || "";

    const method
      = (ctx.request as Request)?.method || ctx.options?.method || "GET";
    const url = (ctx.request as Request)?.url || String(ctx.request) || "/";
    const requestStr = `[${method}] ${JSON.stringify(url)}`;

    const statusStr = ctx.response
      ? `${ctx.response.status} ${ctx.response.statusText}`
      : "<no response>";

    const message = `${requestStr}: ${statusStr}${
      errorMessage ? ` ${errorMessage}` : ""
    }`;

    const fetchError = new FetchError<T>(
      message,
      ctx.error ? { cause: ctx.error } : undefined,
    );

    Object.assign(fetchError, {
      request: ctx.request,
      options: ctx.options,
      response: ctx.response,
      data: ctx.response?.data,
      status: ctx.response?.status,
      statusText: ctx.response?.statusText,
    });

    return fetchError;
  }
}
