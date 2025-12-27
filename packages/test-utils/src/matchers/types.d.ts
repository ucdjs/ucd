import type { ErrorMatcherOptions } from "./error-matchers";

import "vitest";

interface CustomMatchers<R = unknown> {
  toMatchError: (options: ErrorMatcherOptions) => R;
}

declare module "vitest" {
  // eslint-disable-next-line ts/no-empty-object-type
  interface Matchers<T = any> extends CustomMatchers<T> {}
}
