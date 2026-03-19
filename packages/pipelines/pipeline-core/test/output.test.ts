import { describe, expect, it } from "vitest";
import { byName, definePipelineRoute, filesystemSink, normalizeRouteOutputs } from "../src";

describe("normalizeRouteOutputs", () => {
  it("leaves sink undefined when an output is runtime-only", () => {
    const route = definePipelineRoute({
      id: "scripts",
      filter: byName("Scripts.txt"),
      async* parser() {},
      resolver: async () => [],
      outputs: [{
        id: "json",
      }],
    });

    const [output] = normalizeRouteOutputs(route);

    expect(output).toEqual(expect.objectContaining({
      id: "json",
      sink: undefined,
    }));
  });

  it("keeps filesystem sinks for persisted outputs", () => {
    const route = definePipelineRoute({
      id: "scripts",
      filter: byName("Scripts.txt"),
      async* parser() {},
      resolver: async () => [],
      outputs: [{
        id: "json",
        sink: filesystemSink({ baseDir: "/tmp/demo" }),
      }],
    });

    const [output] = normalizeRouteOutputs(route);

    expect(output).toEqual(expect.objectContaining({
      id: "json",
      sink: { type: "filesystem", baseDir: "/tmp/demo" },
    }));
  });
});
