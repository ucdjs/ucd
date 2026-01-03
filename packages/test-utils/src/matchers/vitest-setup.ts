import { expect } from "vitest";
import { toMatchError } from "./error-matchers";
import { toMatchSchema } from "./schema-matchers";

expect.extend({
  toMatchError,
  toMatchSchema,
});
