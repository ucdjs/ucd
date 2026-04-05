import { sourcesTracesRouter } from "#server/routes";
import { describe, expect, it } from "vitest";
import { createTestRoutesApp } from "../helpers";

const TRACE_ID = "abc123";
const SPAN_ID_PIPELINE = "span-pipeline";
const SPAN_ID_ROUTE = "span-route";

const file = {
  version: "16.0.0",
  dir: "ucd",
  path: "ucd/Scripts.txt",
  name: "Scripts.txt",
  ext: ".txt",
};

// eslint-disable-next-line test/prefer-lowercase-title
describe("GET /api/sources/:sourceId/files/:fileId/pipelines/:pipelineId/executions/:executionId/traces", () => {
  it("returns spans with nested events and a derived output manifest", async () => {
    const now = Date.now();
    const { app, seeded } = await createTestRoutesApp([sourcesTracesRouter], {
      seed: {
        executions: [{
          traces: [
            {
              kind: "pipeline",
              traceId: TRACE_ID,
              spanId: SPAN_ID_PIPELINE,
              startTimestamp: now,
              durationMs: 100,
              endTimestamp: new Date(now + 100),
              data: {
                id: "t-1",
                kind: "pipeline",
                pipelineId: "simple",
                traceId: TRACE_ID,
                spanId: SPAN_ID_PIPELINE,
                timestamp: now + 100,
                versions: ["16.0.0"],
                startTimestamp: now,
                durationMs: 100,
              },
            },
            {
              kind: "file.route",
              traceId: TRACE_ID,
              spanId: SPAN_ID_ROUTE,
              parentSpanId: SPAN_ID_PIPELINE,
              startTimestamp: now + 10,
              durationMs: 50,
              endTimestamp: new Date(now + 60),
              data: {
                id: "t-2",
                kind: "file.route",
                pipelineId: "simple",
                traceId: TRACE_ID,
                spanId: SPAN_ID_ROUTE,
                parentSpanId: SPAN_ID_PIPELINE,
                timestamp: now + 60,
                version: "16.0.0",
                routeId: "basic-route",
                file,
                startTimestamp: now + 10,
                durationMs: 50,
              },
            },
            {
              kind: "output",
              traceId: TRACE_ID,
              spanId: "span-output",
              parentSpanId: SPAN_ID_ROUTE,
              startTimestamp: now + 20,
              durationMs: 10,
              endTimestamp: new Date(now + 30),
              data: {
                id: "t-3",
                kind: "output",
                pipelineId: "simple",
                traceId: TRACE_ID,
                spanId: "span-output",
                parentSpanId: SPAN_ID_ROUTE,
                timestamp: now + 30,
                version: "16.0.0",
                routeId: "basic-route",
                file,
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
              traceId: TRACE_ID,
              spanId: SPAN_ID_ROUTE,
              endTimestamp: new Date(now + 55),
              data: {
                id: "t-4",
                kind: "output.written",
                pipelineId: "simple",
                traceId: TRACE_ID,
                spanId: SPAN_ID_ROUTE,
                timestamp: now + 55,
                version: "16.0.0",
                routeId: "basic-route",
                file,
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

    expect(data.executionId).toBe(executionId);
    expect(data.pipelineId).toBe("simple");
    expect(data.status).toBe("completed");
    expect(data.traceId).toBe(TRACE_ID);
    expect(data.startTimestamp).toBe(now);
    expect(data.durationMs).toBe(100);

    expect(data.spans).toHaveLength(3);
    expect(data.spans[0]).toEqual(expect.objectContaining({
      kind: "pipeline",
      spanId: SPAN_ID_PIPELINE,
      parentSpanId: null,
      startTimestamp: now,
      durationMs: 100,
    }));
    expect(data.spans[1]).toEqual(expect.objectContaining({
      kind: "file.route",
      spanId: SPAN_ID_ROUTE,
      parentSpanId: SPAN_ID_PIPELINE,
    }));

    const routeSpan = data.spans.find((s: { spanId: string }) => s.spanId === SPAN_ID_ROUTE);
    expect(routeSpan.events).toHaveLength(1);
    expect(routeSpan.events[0]).toEqual(expect.objectContaining({
      kind: "output.written",
    }));

    expect(data.outputManifest).toEqual([
      expect.objectContaining({
        outputId: "json",
        routeId: "basic-route",
        locator: "/tmp/script.json",
        status: "written",
      }),
    ]);
  });

  it("returns empty spans when execution has no traces", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesTracesRouter], {
      seed: {
        executions: [{}],
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
      traceId: null,
      startTimestamp: null,
      durationMs: null,
      spans: [],
      outputManifest: [],
    }));
  });

  it("returns 404 for a missing execution", async () => {
    const { app } = await createTestRoutesApp([sourcesTracesRouter]);

    const res = await app.fetch(new Request(
      "http://localhost/api/sources/local/files/simple/pipelines/simple/executions/missing/traces",
    ));

    expect(res.status).toBe(404);
  });

  it("returns 404 when execution belongs to another pipeline", async () => {
    const { app, seeded } = await createTestRoutesApp([sourcesTracesRouter], {
      seed: {
        executions: [{ pipelineId: "other" }],
      },
    });
    const executionId = seeded.executionIds[0]!;

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/traces`,
    ));

    expect(res.status).toBe(404);
  });

  it("strips base fields from span attributes", async () => {
    const now = Date.now();
    const { app, seeded } = await createTestRoutesApp([sourcesTracesRouter], {
      seed: {
        executions: [{
          traces: [{
            kind: "pipeline",
            traceId: TRACE_ID,
            spanId: SPAN_ID_PIPELINE,
            startTimestamp: now,
            durationMs: 50,
            endTimestamp: new Date(now + 50),
            data: {
              id: "t-1",
              kind: "pipeline",
              pipelineId: "simple",
              traceId: TRACE_ID,
              spanId: SPAN_ID_PIPELINE,
              timestamp: now + 50,
              versions: ["16.0.0"],
              startTimestamp: now,
              durationMs: 50,
            },
          }],
        }],
      },
    });
    const executionId = seeded.executionIds[0]!;

    const res = await app.fetch(new Request(
      `http://localhost/api/sources/local/files/simple/pipelines/simple/executions/${executionId}/traces`,
    ));

    const data = await res.json();
    const attrs = data.spans[0].attributes;

    expect(attrs).not.toHaveProperty("id");
    expect(attrs).not.toHaveProperty("kind");
    expect(attrs).not.toHaveProperty("pipelineId");
    expect(attrs).not.toHaveProperty("traceId");
    expect(attrs).not.toHaveProperty("spanId");
    expect(attrs).not.toHaveProperty("timestamp");
    expect(attrs).not.toHaveProperty("startTimestamp");
    expect(attrs).not.toHaveProperty("durationMs");
    expect(attrs).toHaveProperty("versions", ["16.0.0"]);
  });
});
