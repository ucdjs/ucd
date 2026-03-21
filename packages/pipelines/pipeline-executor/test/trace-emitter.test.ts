import { describe, expect, it } from "vitest";
import { createTraceEmitter } from "../src/internal/trace-emitter";
import { createNodeExecutionRuntime } from "../src/runtime/node";
import { createMockFile } from "./helpers";

describe("trace emitter", () => {
  it("attaches the active span id when emitting inside runtime.withSpan", async () => {
    const runtime = createNodeExecutionRuntime({});
    const traces: Array<{ spanId?: string }> = [];
    const emitter = createTraceEmitter({
      runtime,
      onTrace: async (trace) => {
        traces.push({ spanId: trace.spanId });
      },
    });

    await runtime.runWithExecutionContext({
      executionId: "exec-1",
      workspaceId: "workspace-1",
    }, async () => {
      await runtime.withSpan("span-1", async () => {
        await emitter.emit({
          kind: "cache.hit",
          pipelineId: "demo",
          version: "16.0.0",
          routeId: "scripts",
          file: createMockFile("Scripts.txt"),
        });
      });
    });

    expect(traces).toEqual([{ spanId: "span-1" }]);
  });

  it("emits traces without span ids when no span is active", async () => {
    const runtime = createNodeExecutionRuntime({});
    const traces: Array<{ spanId?: string }> = [];
    const emitter = createTraceEmitter({
      runtime,
      onTrace: async (trace) => {
        traces.push({ spanId: trace.spanId });
      },
    });

    await runtime.runWithExecutionContext({
      executionId: "exec-1",
      workspaceId: "workspace-1",
    }, async () => {
      await emitter.emit({
        kind: "cache.miss",
        pipelineId: "demo",
        version: "16.0.0",
        routeId: "scripts",
        file: createMockFile("Scripts.txt"),
      });
    });

    expect(traces).toEqual([{ spanId: undefined }]);
  });
});
