import { describe, expect, it } from "vitest";
import {
  getTracePhase,
  PIPELINE_TRACE_PHASES,
} from "../src/events";

describe("getTracePhase", () => {
  it("maps known trace kind prefixes to canonical phases", () => {
    expect(getTracePhase("pipeline.start")).toBe("Pipeline");
    expect(getTracePhase("version.start")).toBe("Version");
    expect(getTracePhase("parse.start")).toBe("Parse");
    expect(getTracePhase("resolve.start")).toBe("Resolve");
    expect(getTracePhase("file.matched")).toBe("File");
    expect(getTracePhase("cache.hit")).toBe("Cache");
    expect(getTracePhase("error")).toBe("Error");
  });

  it("falls back to Other for unknown trace kinds", () => {
    expect(getTracePhase("custom.event")).toBe("Other");
  });
});

describe("pIPELINE_TRACE_PHASES", () => {
  it("keeps the canonical execution phase order", () => {
    expect(PIPELINE_TRACE_PHASES).toEqual([
      "Pipeline",
      "Version",
      "Parse",
      "Resolve",
      "File",
      "Cache",
      "Error",
      "Other",
    ]);
  });
});
