import { expect } from "vitest";
import { toMatchError } from "./error-matchers";
import {
  toBeApiError,
  toBeHeadError,
  toMatchResponse,
} from "./response-matchers";
import { toMatchSchema } from "./schema-matchers";

expect.extend({
  toMatchError,
  toMatchSchema,
  toBeApiError,
  toBeHeadError,
  toMatchResponse,
});
