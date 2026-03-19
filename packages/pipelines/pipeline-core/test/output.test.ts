import { byName, definePipelineRoute, filesystemSink, normalizeRouteOutputs } from "../src";
import { describe, expect, it } from "vitest";

describe("normalizeRouteOutputs", () => {
  it("defaults filesystem sinks to both so outputs remain available during the run", () => {
    const route = definePipelineRoute({
      id: "scripts",
      filter: byName("Scripts.txt"),
      async *parser() {},
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
