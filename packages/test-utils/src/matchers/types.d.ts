import type { ErrorMatcherOptions } from "./error-matchers";
import type { ApiErrorOptions, HeadersOptions, ResponseMatcherOptions } from "./response-matchers";
import type { SchemaMatcherOptions } from "./schema-matchers";

import "vitest";

interface CustomMatchers<R = unknown> {
  toMatchError: (options: ErrorMatcherOptions) => R;
  toMatchSchema: <TSchema extends z.ZodType>(
    options: SchemaMatcherOptions<TSchema>,
  ) => R;
  toBeApiError: (options: ApiErrorOptions) => Promise<R>;
  toBeHeadError: (expectedStatus: number) => R;
  toHaveResponseHeaders: (options: HeadersOptions) => R;
  toBeJsonResponse: () => R;
  toMatchResponse: (options: ResponseMatcherOptions) => Promise<R>;
}

declare module "vitest" {
  // eslint-disable-next-line ts/no-empty-object-type
  interface Matchers<T = any> extends CustomMatchers<T> {}
}
