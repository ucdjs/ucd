import { describe, expect, expectTypeOf, it } from "vitest";
import { requiredEnv } from "../src/required-env";

describe("requiredEnv", () => {
  it("should return validated env when all required keys are present", () => {
    const env = {
      API_KEY: "abc123",
      PORT: "3000",
      DEBUG: "true",
    };

    const result = requiredEnv(env, ["API_KEY", "PORT"]);
    expect(result).toEqual(env);
    expect(result.API_KEY).toBe("abc123");
    expect(result.PORT).toBe("3000");

    expectTypeOf(result.DEBUG).toEqualTypeOf<string | undefined>();
    expectTypeOf(result.DEBUG).not.toEqualTypeOf<string>();

    expectTypeOf(result.API_KEY).toEqualTypeOf<string>();
    expectTypeOf(result.PORT).toEqualTypeOf<string>();
  });

  it("should work with different data types", () => {
    const env = {
      stringVar: "hello",
      numberVar: 42,
      booleanVar: true,
      objectVar: { nested: "value" },
    };

    const result = requiredEnv(env, ["stringVar", "numberVar", "booleanVar", "objectVar"]);

    expect(result.stringVar).toBe("hello");
    expect(result.numberVar).toBe(42);
    expect(result.booleanVar).toBe(true);
    expect(result.objectVar).toEqual({ nested: "value" });
  });

  it("should throw error when required key is missing", () => {
    const env = {
      API_KEY: "abc123",
    };

    expect(() => {
      requiredEnv(env, [
        "API_KEY",
        // @ts-expect-error - MISSING_KEY is not defined in env
        "MISSING_KEY",
      ]);
    }).toThrow("Missing required env var: MISSING_KEY");
  });

  it("should throw error when required key is undefined", () => {
    const env = {
      API_KEY: "abc123",
      UNDEFINED_KEY: undefined,
    };

    expect(() => {
      requiredEnv(env, [
        "API_KEY",
        "UNDEFINED_KEY",
      ]);
    }).toThrow("Missing required env var: UNDEFINED_KEY");
  });

  it("should throw error when required key is null", () => {
    const env = {
      API_KEY: "abc123",
      NULL_KEY: null,
    };

    expect(() => {
      requiredEnv(env, [
        "API_KEY",
        "NULL_KEY",
      ]);
    }).toThrow("Missing required env var: NULL_KEY");
  });

  it("should allow empty string values", () => {
    const env = {
      API_KEY: "abc123",
      EMPTY_KEY: "",
    };

    const result = requiredEnv(env, [
      "API_KEY",
      "EMPTY_KEY",
    ]);

    expect(result.EMPTY_KEY).toBe("");
  });

  it("should work with empty keys object", () => {
    const env = {
      API_KEY: "abc123",
      PORT: "3000",
    };

    const result = requiredEnv(env, []);

    expect(result).toEqual(env);
  });

  it("should throw error for first missing key when multiple are missing", () => {
    const env = {
      API_KEY: "abc123",
    };

    expect(() => {
      requiredEnv(env, [
        "API_KEY",
        // @ts-expect-error - MISSING_KEY_1 is not defined in env
        "MISSING_KEY_1",
        // @ts-expect-error - MISSING_KEY_2 is not defined in env
        "MISSING_KEY_2",
      ]);
    }).toThrow(/Missing required env var: MISSING_KEY_[12]/);
  });

  it("should work with falsy values that are not undefined", () => {
    const env = {
      zeroValue: 0,
      falseValue: false,
      emptyString: "",
      nullValue: null,
    };

    const result = requiredEnv(env, [
      "zeroValue",
      "falseValue",
      "emptyString",
    ]);

    expect(result.zeroValue).toBe(0);
    expect(result.falseValue).toBe(false);
    expect(result.emptyString).toBe("");
  });
});
