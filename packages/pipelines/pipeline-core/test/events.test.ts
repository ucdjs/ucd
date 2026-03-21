import { describe, expect, it } from "vitest";
import {
  getPipelineEventPhase,
  PIPELINE_EVENT_PHASES,
} from "../src/events";

describe("getPipelineEventPhase", () => {
  it("maps known event prefixes to canonical phases", () => {
    expect(getPipelineEventPhase("pipeline:start")).toBe("Pipeline");
    expect(getPipelineEventPhase("version:start")).toBe("Version");
    expect(getPipelineEventPhase("parse:start")).toBe("Parse");
    expect(getPipelineEventPhase("resolve:start")).toBe("Resolve");
    expect(getPipelineEventPhase("file:matched")).toBe("File");
    expect(getPipelineEventPhase("cache:hit")).toBe("Cache");
    expect(getPipelineEventPhase("error")).toBe("Error");
  });

  it("falls back to Other for unknown event types", () => {
    expect(getPipelineEventPhase("custom:event")).toBe("Other");
  });
});

describe("pIPELINE_EVENT_PHASES", () => {
  it("keeps the canonical execution phase order", () => {
    expect(PIPELINE_EVENT_PHASES).toEqual([
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
