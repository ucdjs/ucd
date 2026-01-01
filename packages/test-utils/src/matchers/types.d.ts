import type { ErrorMatcherOptions } from "./error-matchers";
import type { SchemaMatcherOptions } from "./schema-matchers";

import "vitest";

interface CustomMatchers<R = unknown> {
  toMatchError: (options: ErrorMatcherOptions) => R;
  toMatchSchema: <TSchema extends z.ZodType>(
    options: SchemaMatcherOptions<TSchema>,
  ) => R;
}

declare module "vitest" {
  // eslint-disable-next-line ts/no-empty-object-type
  interface Matchers<T = any> extends CustomMatchers<T> {}
}
