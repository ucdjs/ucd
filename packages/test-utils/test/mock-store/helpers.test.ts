import { describe, expect, it } from "vitest";
import {
  configure,
  unsafeResponse,
} from "../../src/mock-store/helpers";
import { extractConfiguredMetadata } from "../../src/mock-store/utils";

describe("configure", () => {
  it("should attach metadata to response object", () => {
    const response = { data: "test" };
    const configured = configure({
      response,
      latency: 100,
    });

    expect(configured).toBe(response);
  });

  it("should attach metadata to function response", () => {
    const fn = () => ({ data: "test" });
    const configured = configure({
      response: fn,
      latency: 50,
    });

    expect(configured).toBe(fn);
  });

  describe("validation", () => {
    it("should throw error when response property is missing", () => {
      expect(() => configure({} as any)).toThrow(
        "Invalid configure() call: missing response property",
      );
    });

    it("should throw error when config is not an object", () => {
      expect(() => configure(null as any)).toThrow(
        "Invalid configure() call: missing response property",
      );
    });

    it("should throw TypeError when response is not function or object", () => {
      expect(() => configure({ response: "string" as any })).toThrow(
        "Invalid configure() call: response must be a function or a non-null object",
      );
    });
  });
});

describe("unsafeResponse", () => {
  it("should return response as-is without type checking", () => {
    const invalidData = { invalid: "data" };
    const result = unsafeResponse(invalidData);

    expect(result).toBe(invalidData);
  });

  it("should accept any type of data", () => {
    expect(unsafeResponse("string")).toBe("string");
    expect(unsafeResponse(123)).toBe(123);
    expect(unsafeResponse(true)).toBe(true);
    expect(unsafeResponse(null)).toBe(null);
    expect(unsafeResponse(undefined)).toBe(undefined);
    expect(unsafeResponse([])).toEqual([]);
    expect(unsafeResponse({})).toEqual({});
  });

  it("should work with configure for latency/headers", () => {
    const weirdData = { completely: "invalid" };
    const configured = configure({
      response: unsafeResponse(weirdData),
      latency: 100,
    });

    const metadata = extractConfiguredMetadata(configured);
    expect(metadata.actualResponse).toEqual({ completely: "invalid" });
    expect(metadata.latency).toBe(100);
  });
});
