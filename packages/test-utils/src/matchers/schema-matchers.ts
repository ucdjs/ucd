import type { MatcherState, RawMatcherFn } from "@vitest/expect";
import type z from "zod";

export interface SchemaMatcherOptions<TSchema extends z.ZodType> {
  schema: TSchema;
  success: boolean;
  data?: Partial<z.infer<TSchema>>;
}

export const toMatchSchema: RawMatcherFn<MatcherState, [SchemaMatcherOptions<z.ZodType>]> = function <TSchema extends z.ZodType>(
  this: MatcherState,
  received: unknown,
  options: SchemaMatcherOptions<TSchema>,
) {
  const result = options.schema.safeParse(received);
  const successMatches = result.success === options.success;

  if (!successMatches) {
    const expectedStatus = options.success ? "succeed" : "fail";
    const actualStatus = result.success ? "succeeded" : "failed";
    const issues = result.error?.issues ? `\n${this.utils.printExpected(result.error.issues)}` : "";
    return {
      pass: false,
      message: () => `Expected schema validation to ${expectedStatus}, but it ${actualStatus}${issues}`,
    };
  }

  // Check partial data properties if provided
  if (options.data && result.success) {
    for (const key of Object.keys(options.data)) {
      const expected = (options.data as any)[key];
      const received = (result.data as any)[key];

      if (!this.equals(received, expected)) {
        return {
          pass: false,
          message: () =>
            `Expected property "${key}" to equal ${this.utils.printExpected(expected)}, but received ${this.utils.printReceived(received)}`,
        };
      }
    }
  }

  return {
    pass: true,
    message: () => `Expected schema validation to not match`,
  };
};
