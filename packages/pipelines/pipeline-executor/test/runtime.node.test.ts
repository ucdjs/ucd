import type { PipelineLogEntry } from "@ucdjs/pipeline-executor";
import { describe, expect, it } from "vitest";
import { createNodeExecutionRuntime } from "../src/runtime/node";

describe("node execution runtime", () => {
  it("stores and retrieves execution context", async () => {
    const runtime = createNodeExecutionRuntime({});

    await runtime.runWithExecutionContext({
      executionId: "exec-1",
      workspaceId: "workspace-1",
    }, async () => {
      expect(runtime.getExecutionContext()).toEqual({
        executionId: "exec-1",
        workspaceId: "workspace-1",
      });
    });

    expect(runtime.getExecutionContext()).toBeUndefined();
  });

  it("runs nested spans without throwing", async () => {
    const runtime = createNodeExecutionRuntime({});

    await runtime.runWithExecutionContext({
      executionId: "exec-1",
      workspaceId: "workspace-1",
    }, async () => {
      await runtime.startSpan("outer", async () => {
        await runtime.startSpan("inner", async () => {
          // Nested spans work without error
          expect(runtime.getExecutionContext()?.executionId).toBe("exec-1");
        });
      });
    });
  });

  it("calls startSpan callback even without execution context", async () => {
    const runtime = createNodeExecutionRuntime({});
    let called = false;

    await runtime.startSpan("noop-span", async () => {
      called = true;
    });

    expect(called).toBe(true);
  });

  it("captures console output with the active execution context", async () => {
    const runtime = createNodeExecutionRuntime({
      outputCapture: { console: true },
    });
    const logs: Pick<PipelineLogEntry, "message" | "executionId" | "source">[] = [];

    await runtime.runWithLogHandler((entry) => {
      logs.push({
        message: entry.message,
        executionId: entry.executionId,
        source: entry.source,
      });
    }, async () => {
      const stopCapture = runtime.startOutputCapture?.() ?? (() => {});

      try {
        await runtime.runWithExecutionContext({
          executionId: "exec-1",
          workspaceId: "workspace-1",
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
        source: "console",
        message: "captured log line",
      }),
    ]));
  });
});
