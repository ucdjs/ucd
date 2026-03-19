import { sourcesGraphRouter } from "#server/routes";
import { describe, expect, it } from "vitest";
import { createTestRoutesApp } from "./helpers";

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/graph", () => {
  it("returns graph data and status", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesGraphRouter], {
      seed: {
        executions: [{
          traces: [
            {
              kind: "source.provided",
              data: {
                id: "trace-1",
                kind: "source.provided",
                pipelineId: "simple",
                timestamp: Date.now(),
                version: "1.0.0",
                file: {
                  version: "1.0.0",
                  dir: "ucd",
                  path: "ucd/colors.txt",
                  name: "colors.txt",
                  ext: ".txt",
                },
              },
            },
            {
              kind: "file.matched",
              data: {
                id: "trace-2",
                kind: "file.matched",
                pipelineId: "simple",
                timestamp: Date.now(),
                version: "1.0.0",
                routeId: "basic-route",
                file: {
                  version: "1.0.0",
                  dir: "ucd",
                  path: "ucd/colors.txt",
                  name: "colors.txt",
                  ext: ".txt",
                },
              },
            },
            {
              kind: "output.produced",
              data: {
                id: "trace-3",
                kind: "output.produced",
                pipelineId: "simple",
                timestamp: Date.now(),
                version: "1.0.0",
                routeId: "basic-route",
                file: {
                  version: "1.0.0",
                  dir: "ucd",
                  path: "ucd/colors.txt",
                  name: "colors.txt",
                  ext: ".txt",
                },
                outputIndex: 0,
                property: "Colors",
              },
            },
            {
              kind: "output.resolved",
              data: {
                id: "trace-4",
                kind: "output.resolved",
                pipelineId: "simple",
                timestamp: Date.now(),
                version: "1.0.0",
                routeId: "basic-route",
                file: {
                  version: "1.0.0",
                  dir: "ucd",
                  path: "ucd/colors.txt",
                  name: "colors.txt",
                  ext: ".txt",
                },
                outputIndex: 0,
                outputId: "filesystem-archive",
                property: "Colors",
                sink: "filesystem",
                format: "json",
                locator: "/tmp/archive/colors.json",
              },
            },
          ],
        }],
      },
    });
    const executionId = seeded.executionIds[0]!;

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/graph`,
    ));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual({
      executionId,
      pipelineId: "simple",
      status: "completed",
      graph: {
        nodes: [
          {
            id: "source:1.0.0",
            nodeType: "source",
            flowType: "pipeline-source",
            label: "v1.0.0",
            detailFields: [
              { label: "Node ID", type: "text", value: "source:1.0.0" },
              { label: "Version", type: "text", value: "1.0.0" },
            ],
          },
          {
            id: "file:1.0.0:ucd/colors.txt",
            nodeType: "file",
            flowType: "pipeline-file",
            label: "colors.txt",
            detailFields: [
              { label: "Node ID", type: "text", value: "file:1.0.0:ucd/colors.txt" },
              { label: "Name", type: "text", value: "colors.txt" },
              { label: "Path", type: "content", value: "ucd/colors.txt" },
              { label: "Directory", type: "content", value: "ucd" },
              { label: "Extension", type: "text", value: ".txt" },
              { label: "Version", type: "text", value: "1.0.0" },
              {
                label: "File",
                type: "json",
                value: {
                  version: "1.0.0",
                  dir: "ucd",
                  path: "ucd/colors.txt",
                  name: "colors.txt",
                  ext: ".txt",
                },
              },
            ],
          },
          {
            id: "route:1.0.0:basic-route",
            nodeType: "route",
            flowType: "pipeline-route",
            label: "basic-route",
            detailFields: [
              { label: "Node ID", type: "text", value: "route:1.0.0:basic-route" },
              { label: "Route ID", type: "text", value: "basic-route" },
            ],
            actions: [
              {
                label: "Open basic-route",
                to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect",
                params: {
                  sourceId: "local",
                  sourceFileId: "simple",
                  pipelineId: "simple",
                },
                search: {
                  route: "basic-route",
                },
              },
            ],
          },
          {
            id: "output:1.0.0:filesystem-archive:/tmp/archive/colors.json",
            nodeType: "output",
            flowType: "pipeline-output",
            label: "filesystem-archive -> colors.json",
            detailFields: [
              { label: "Node ID", type: "text", value: "output:1.0.0:filesystem-archive:/tmp/archive/colors.json" },
              { label: "Output Index", type: "text", value: 0 },
              { label: "Output ID", type: "text", value: "filesystem-archive" },
              { label: "Property", type: "text", value: "Colors" },
              { label: "Locator", type: "content", value: "/tmp/archive/colors.json" },
            ],
            actions: [
              {
                label: "Open outputs",
                to: "/s/$sourceId/$sourceFileId/$pipelineId/inspect/outputs",
                params: {
                  sourceId: "local",
                  sourceFileId: "simple",
                  pipelineId: "simple",
                },
              },
            ],
          },
        ],
        edges: [
          {
            id: "edge-0-source:1.0.0-file:1.0.0:ucd/colors.txt",
            source: "source:1.0.0",
            target: "file:1.0.0:ucd/colors.txt",
            label: "provides",
            edgeType: "provides",
          },
          {
            id: "edge-1-file:1.0.0:ucd/colors.txt-route:1.0.0:basic-route",
            source: "file:1.0.0:ucd/colors.txt",
            target: "route:1.0.0:basic-route",
            label: "matched",
            edgeType: "matched",
          },
          {
            id: "edge-2-route:1.0.0:basic-route-output:1.0.0:filesystem-archive:/tmp/archive/colors.json",
            source: "route:1.0.0:basic-route",
            target: "output:1.0.0:filesystem-archive:/tmp/archive/colors.json",
            label: "resolved",
            edgeType: "resolved",
          },
        ],
      },
    });
  });

  it("returns null when the execution has no graph", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesGraphRouter], {
      seed: {
        executions: [{}],
      },
    });
    const executionId = seeded.executionIds[0]!;

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/graph`,
    ));

    expect(res.status).toBe(200);

    const data = await res.json();
    expect(data).toEqual(expect.objectContaining({
      executionId,
      graph: null,
    }));
  });

  it("returns 404 for a missing execution", async () => {
    const { app } = await createTestRoutesApp([sourcesGraphRouter]);

    const res = await app.fetch(new Request(
      "http://localhost/api/sources/local/files/simple/pipelines/simple/executions/missing/graph",
    ));

    expect(res.status).toBe(404);
  });

  it("returns 404 when the execution belongs to another pipeline", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesGraphRouter], {
      seed: {
        executions: [{
          pipelineId: "other",
        }],
      },
    });
    const executionId = seeded.executionIds[0]!;

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/graph`,
    ));

    expect(res.status).toBe(404);
  });

  it("returns 404 when the execution belongs to another source or file", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesGraphRouter], {
      seed: {
        executions: [{
          sourceId: "other-source",
          fileId: "other-file",
        }],
      },
    });
    const executionId = seeded.executionIds[0]!;

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/graph`,
    ));

    expect(res.status).toBe(404);
  });
});
