import type { PipelineEvent } from "@ucdjs/pipelines-core";
import type { PipelineLogEntry } from "@ucdjs/pipelines-executor";
import { describe, expect, it } from "vitest";
import { createNodeExecutionRuntime } from "../src/runtime/node";

describe("node execution runtime", () => {
  it("keeps span and event context aligned across nested scopes", async () => {
    const runtime = createNodeExecutionRuntime({});
    const event = {
      id: "event-1",
      type: "pipeline:start",
      versions: ["16.0.0"],
      spanId: "event-span",
      timestamp: Date.now(),
    } satisfies PipelineEvent;

    await runtime.runWithExecutionContext({
      executionId: "exec-1",
      workspaceId: "workspace-1",
    }, async () => {
      expect(runtime.getExecutionContext()).toEqual({
        executionId: "exec-1",
        workspaceId: "workspace-1",
      });

      await runtime.withSpan("span-1", async () => {
        expect(runtime.getExecutionContext()?.spanId).toBe("span-1");

        await runtime.withEvent(event, async () => {
          expect(runtime.getExecutionContext()?.spanId).toBe("event-span");
          expect(runtime.getExecutionContext()?.event).toEqual(event);
        });

        expect(runtime.getExecutionContext()?.spanId).toBe("span-1");
      });
    });
  });

  it("captures console output with the active execution context", async () => {
    const runtime = createNodeExecutionRuntime({
      outputCapture: { console: true },
    });
    const logs: Pick<PipelineLogEntry, "message" | "executionId" | "spanId" | "source">[] = [];

    await runtime.runWithLogHandler((entry) => {
      logs.push({
        message: entry.message,
        executionId: entry.executionId,
        spanId: entry.spanId,
        source: entry.source,

      });
    }, async () => {
      const stopCapture = runtime.startOutputCapture?.() ?? (() => {});

      try {
        await runtime.runWithExecutionContext({
          executionId: "exec-1",
          workspaceId: "workspace-1",
          spanId: "span-1",
        }, async () => {
          // eslint-disable-next-line no-console
          console.log("captured log line");
          await Promise.resolve();
        });
      } finally {
        stopCapture();
      }
    });

    expect(logs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        executionId: "exec-1",
        spanId: "span-1",
        source: "console",
        message: "captured log line",
      }),
    ]));
  });
});
