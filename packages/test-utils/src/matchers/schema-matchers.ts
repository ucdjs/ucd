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

  let pass = result.success === options.success;
  let failedProperty: string | undefined;

  // If validation succeeded and we have data expectations, verify each property
  if (pass && options.data !== undefined && result.success) {
    for (const key in options.data) {
      if (!this.equals((result.data as any)[key], (options.data as any)[key])) {
        pass = false;
        failedProperty = key;
        break;
      }
    }
  }

  return {
    pass,
    message: () => {
      if (pass) {
        return `Expected schema validation to not match`;
      }

      if (result.success !== options.success) {
        return `Expected schema validation to ${options.success ? "succeed" : "fail"}, but it ${result.success ? "succeeded" : "failed"}`;
      }

      if (failedProperty !== undefined && result.success) {
        const expectedValue = (options.data as any)?.[failedProperty];
        const receivedValue = (result.data as any)[failedProperty];
        return `Expected property "${failedProperty}" to equal ${this.utils.printExpected(expectedValue)}, but received ${this.utils.printReceived(receivedValue)}`;
      }

      return `Schema validation did not match expectations`;
    },
  };
};
