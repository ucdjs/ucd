import { expect } from "vitest";
import { toMatchError } from "./error-matchers";

expect.extend({
  toMatchError,
});
