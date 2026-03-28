import { sourcesTracesRouter } from "#server/routes";
import { describe, expect, it } from "vitest";
import { createTestRoutesApp } from "./helpers";

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/traces", () => {
  it("returns traces and a derived output manifest", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesTracesRouter], {
      seed: {
        executions: [{
          traces: [
            {
              kind: "output.resolved",
              data: {
                id: "trace-1",
                kind: "output.resolved",
                pipelineId: "simple",
                timestamp: Date.now(),
                version: "16.0.0",
                routeId: "basic-route",
                file: {
                  version: "16.0.0",
                  dir: "ucd",
                  path: "ucd/Scripts.txt",
                  name: "Scripts.txt",
                  ext: ".txt",
                },
                outputIndex: 0,
                outputId: "json",
                property: "Script",
                sink: "filesystem",
                format: "json",
                locator: "/tmp/script.json",
              },
            },
            {
              kind: "output.written",
              data: {
                id: "trace-2",
                kind: "output.written",
                pipelineId: "simple",
                timestamp: Date.now(),
                version: "16.0.0",
                routeId: "basic-route",
                file: {
                  version: "16.0.0",
                  dir: "ucd",
                  path: "ucd/Scripts.txt",
                  name: "Scripts.txt",
                  ext: ".txt",
                },
                outputIndex: 0,
                outputId: "json",
                property: "Script",
                sink: "filesystem",
                locator: "/tmp/script.json",
                status: "written",
              },
            },
          ],
        }],
      },
    });
    const executionId = seeded.executionIds[0]!;

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/traces`,
    ));

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toEqual(expect.objectContaining({
      executionId,
      pipelineId: "simple",
      traces: expect.arrayContaining([
        expect.objectContaining({ kind: "output.resolved" }),
        expect.objectContaining({ kind: "output.written" }),
      ]),
      outputManifest: [
        expect.objectContaining({
          outputId: "json",
          routeId: "basic-route",
          locator: "/tmp/script.json",
          status: "written",
        }),
      ],
    }));
  });
});
