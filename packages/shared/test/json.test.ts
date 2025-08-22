import { describe, expect, it } from "vitest";
import { safeJsonParse } from "../src/index";

describe("safeJsonParse", () => {
  it("should parse a valid JSON object", () => {
    const validJson = "{\"name\":\"test\",\"value\":123}";
    const result = safeJsonParse<{ name: string; value: number }>(validJson);
    expect(result).toEqual({ name: "test", value: 123 });
  });

  it("should parse a valid JSON array", () => {
    const validJson = "[1,2,3,\"test\"]";
    const result = safeJsonParse<(number | string)[]>(validJson);
    expect(result).toEqual([1, 2, 3, "test"]);
  });

  it("should return null for invalid JSON", () => {
    const invalidJson = "{name:\"test\",value:123}"; // missing quotes around property names
    const result = safeJsonParse(invalidJson);
    expect(result).toBeNull();
  });

  it("should return null for incomplete JSON", () => {
    const incompleteJson = "{\"name\":\"test\",";
    const result = safeJsonParse(incompleteJson);
    expect(result).toBeNull();
  });

  it("should correctly parse nested objects", () => {
    const nestedJson = "{\"user\":{\"name\":\"test\",\"id\":123},\"active\":true}";
    const result = safeJsonParse<{ user: { name: string; id: number }; active: boolean }>(nestedJson);
    expect(result).toEqual({ user: { name: "test", id: 123 }, active: true });
  });
});
