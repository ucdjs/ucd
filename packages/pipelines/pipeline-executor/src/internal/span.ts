import type { Span } from "@opentelemetry/api";
import { SpanStatusCode } from "@opentelemetry/api";

export interface RunSpanOptions {
  recordErrors?: boolean;
}

export function runSpan<T>(
  span: Span,
  fn: (span: Span) => T | Promise<T>,
  options?: RunSpanOptions,
): T | Promise<T> {
  const recordErrors = options?.recordErrors ?? false;

  function onError(err: unknown): never {
    if (recordErrors) {
      const message = err instanceof Error ? err.message : String(err);
      span.setStatus({ code: SpanStatusCode.ERROR, message });
      span.recordException(err instanceof Error ? err : new Error(message));
    }
    span.end();
    throw err;
  }

  let result: T | Promise<T>;
  try {
    result = fn(span);
  } catch (err) {
    onError(err);
  }

  if (result instanceof Promise) {
    return result.then(
      (val) => {
        span.end();
        return val;
      },
      onError,
    ) as T | Promise<T>;
  }

  span.end();
  return result;
}
