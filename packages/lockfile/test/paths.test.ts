import { describe, expect, it } from "vitest";
import { getLockfilePath, getSnapshotPath } from "../src/paths";

describe("path utilities", () => {
  describe("getLockfilePath", () => {
    it("should return the lockfile filename", () => {
      const path = getLockfilePath("/some/base/path");

      expect(path).toBe(".ucd-store.lock");
    });

    it("should always return the same filename regardless of input", () => {
      expect(getLockfilePath("")).toBe(".ucd-store.lock");
      expect(getLockfilePath("/")).toBe(".ucd-store.lock");
      expect(getLockfilePath("/usr/local/ucd")).toBe(".ucd-store.lock");
    });
  });

  describe("getSnapshotPath", () => {
    it("should return version-prefixed snapshot path", () => {
      const path = getSnapshotPath("16.0.0");

      expect(path).toBe("16.0.0/snapshot.json");
    });

    it("should handle various version formats", () => {
      expect(getSnapshotPath("15.1.0")).toBe("15.1.0/snapshot.json");
      expect(getSnapshotPath("1.0.0")).toBe("1.0.0/snapshot.json");
      expect(getSnapshotPath("16.0.0-beta")).toBe("16.0.0-beta/snapshot.json");
    });
  });
});
