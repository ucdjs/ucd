import { describe, expect, it } from "vitest";
import { getPayloadForHook } from "../src/utils";

describe("getPayloadForHook", () => {
  describe("read operation", () => {
    it.each([
      {
        phase: "before",
        args: ["/path/to/file.txt"],
        expected: { path: "/path/to/file.txt" },
      },
      {
        phase: "after",
        args: ["/path/to/file.txt"],
        result: "file content",
        expected: { path: "/path/to/file.txt", content: "file content" },
      },
    ])("should construct $phase payload", ({ phase, args, result, expected }) => {
      const payload = getPayloadForHook("read", phase as "before" | "after", args, result);
      expect(payload).toEqual(expected);
    });
  });

  describe("write operation", () => {
    it.each([
      {
        phase: "before",
        args: ["/path/to/file.txt", "hello", "utf-8"],
        expected: { path: "/path/to/file.txt", content: "hello", encoding: "utf-8" },
      },
      {
        phase: "before",
        args: ["/path/to/file.txt", "hello"],
        expected: { path: "/path/to/file.txt", content: "hello", encoding: undefined },
      },
      {
        phase: "after",
        args: ["/path/to/file.txt"],
        expected: { path: "/path/to/file.txt" },
      },
    ])("should construct $phase payload", ({ phase, args, expected }) => {
      const payload = getPayloadForHook("write", phase as "before" | "after", args);
      expect(payload).toEqual(expected);
    });
  });

  describe("listdir operation", () => {
    it("should construct before payload with path and recursive flag", () => {
      const payload = getPayloadForHook("listdir", "before", ["/path/to/dir", true]);

      expect(payload).toEqual({
        path: "/path/to/dir",
        recursive: true,
      });
    });

    it("should default recursive to false when not provided", () => {
      const payload = getPayloadForHook("listdir", "before", ["/path/to/dir"]);

      expect(payload).toEqual({
        path: "/path/to/dir",
        recursive: false,
      });
    });

    it("should construct after payload with entries", () => {
      const entries = [
        { name: "file.txt", type: "file" as const },
        { name: "subdir", type: "directory" as const },
      ];
      const payload = getPayloadForHook("listdir", "after", ["/path/to/dir", false], entries);

      expect(payload).toEqual({
        path: "/path/to/dir",
        recursive: false,
        entries,
      });
    });
  });

  describe("exists operation", () => {
    it("should construct before payload with path", () => {
      const payload = getPayloadForHook("exists", "before", ["/path/to/file.txt"]);

      expect(payload).toEqual({
        path: "/path/to/file.txt",
      });
    });

    it("should construct after payload with exists status", () => {
      const payload = getPayloadForHook("exists", "after", ["/path/to/file.txt"], true);

      expect(payload).toEqual({
        path: "/path/to/file.txt",
        exists: true,
      });
    });
  });

  describe("mkdir operation", () => {
    it("should construct payload with path", () => {
      const payload = getPayloadForHook("mkdir", "before", ["/path/to/dir"]);

      expect(payload).toEqual({
        path: "/path/to/dir",
      });
    });

    it("should have same payload for before and after phases", () => {
      const beforePayload = getPayloadForHook("mkdir", "before", ["/path/to/dir"]);
      const afterPayload = getPayloadForHook("mkdir", "after", ["/path/to/dir"]);

      expect(beforePayload).toEqual(afterPayload);
    });
  });

  describe("rm operation", () => {
    it("should construct payload with path and options", () => {
      const options = { recursive: true, force: true };
      const payload = getPayloadForHook("rm", "before", ["/path/to/target", options]);

      expect(payload).toEqual({
        path: "/path/to/target",
        recursive: true,
        force: true,
      });
    });

    it("should construct payload with empty options", () => {
      const payload = getPayloadForHook("rm", "before", ["/path/to/target", {}]);

      expect(payload).toEqual({
        path: "/path/to/target",
      });
    });
  });

  describe("error handling", () => {
    it("should throw for unknown operation", () => {
      expect(() => {
        getPayloadForHook("unknown", "before", ["/path"]);
      }).toThrow("Failed to construct hook payload for 'unknown:before' hook");
    });
  });
});
