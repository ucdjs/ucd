import type { ApiError } from "@ucdjs/schemas";
import { describe, expect, it } from "vitest";
import {
  getLatestDraftUnicodeVersion,
  getLatestStableUnicodeVersion,
  isApiError,
  isDraftUnicodeVersion,
  isStableUnicodeVersion,
  isValidUnicodeVersion,
} from "../src/index";

describe("@ucdjs/utils", () => {
  it("re-exports API guard helpers", () => {
    const apiError = {
      message: "Bad Request",
      status: 400,
      timestamp: "2026-03-15T00:00:00.000Z",
    } satisfies ApiError;

    expect(isApiError(apiError)).toBe(true);
    expect(isApiError(new Error("oops"))).toBe(false);
  });

  it("re-exports Unicode version helpers", () => {
    expect(isValidUnicodeVersion("16.0.0")).toBe(true);
    expect(isValidUnicodeVersion("latest")).toBe(false);
    expect(isDraftUnicodeVersion("17.0.0")).toBeTypeOf("boolean");
    expect(isStableUnicodeVersion("16.0.0")).toBeTypeOf("boolean");
    expect(getLatestStableUnicodeVersion()).toBeTypeOf("string");
    expect(getLatestDraftUnicodeVersion()).toBeTypeOf("string");
  });
});
