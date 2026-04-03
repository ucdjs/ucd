import type { PipelineDetails } from "#queries/pipeline";
import type { ExecutePipelineResponse } from "#shared/schemas/execution";
import type { SpanProcessor } from "@opentelemetry/sdk-trace-node";
import type { H3Event } from "h3";
import { schema } from "#server/db";
import { createExecutionLogStore } from "#server/lib/execution-logs";
import { resolveSourceFiles } from "#server/lib/resolve";
import { createPipelineSpanExporter } from "#server/pipeline/span-exporter";
import { ensureWorkspaceExists } from "#server/workspace";
import { toPipelineDetails } from "#shared/lib/pipeline-utils";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchSpanProcessor, NodeTracerProvider } from "@opentelemetry/sdk-trace-node";
import { createPipelineExecutor } from "@ucdjs/pipelines-executor";
import { createNodeExecutionRuntime } from "@ucdjs/pipelines-executor/node";
import { and, eq } from "drizzle-orm";
import { H3, HTTPError, readValidatedBody } from "h3";
import { z } from "zod";

export const sourcesPipelineRouter: H3 = new H3();

const BASE = "/:sourceId/files/:fileId/pipelines/:pipelineId";

async function resolvePipelineRoute(event: H3Event) {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;
  const fileId = event.context.params?.fileId;
  const pipelineId = event.context.params?.pipelineId;

  if (!sourceId) {
    throw HTTPError.status(400, "Source ID is required");
  }

  if (!fileId) {
    throw HTTPError.status(400, "File ID is required");
  }

  if (!pipelineId) {
    throw HTTPError.status(400, "Pipeline ID is required");
  }

  const source = sources.find((source) => source.id === sourceId) ?? null;
  if (source == null) {
    throw HTTPError.status(404, `Source "${sourceId}" not found`);
  }

  const { files } = await resolveSourceFiles(source);
  const file = files.find((file) => file.id === fileId) ?? null;
  if (file == null) {
    throw HTTPError.status(404, `File "${fileId}" not found in source "${source.id}"`);
  }

  const pipeline = file.pipelines.find((pipeline) => pipeline.id === pipelineId) ?? null;
  if (pipeline == null) {
    throw HTTPError.status(404, `Pipeline "${pipelineId}" not found in file "${file.id}"`);
  }

  return { file, pipeline, pipelineId, source };
}

sourcesPipelineRouter.get(BASE, async (event) => {
  const { pipeline } = await resolvePipelineRoute(event);

  return toPipelineDetails(pipeline) satisfies PipelineDetails;
});

sourcesPipelineRouter.post(`${BASE}/execute`, async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const { file, pipeline, pipelineId, source } = await resolvePipelineRoute(event);

  const body = await readValidatedBody(event, z.object({
    versions: z.array(z.string()).optional(),
    cache: z.boolean().optional(),
  }));

  const versions = body.versions ?? pipeline.versions;
  const cache = body.cache ?? true;
  const executionId = Array.from(
    crypto.getRandomValues(new Uint8Array(16)),
    (b) => b.toString(16).padStart(2, "0"),
  ).join("");

  await ensureWorkspaceExists(db, workspaceId);

  await db.insert(schema.executions).values({
    id: executionId,
    workspaceId,
    sourceId: source.id,
    fileId: file.id,
    pipelineId,
    status: "running",
    startedAt: new Date(),
    versions,
  });

  // Create a per-execution tracer provider with a SpanExporter that writes to the DB.
  // Each execution gets its own isolated provider to avoid cross-contamination.
  const spanProcessors: SpanProcessor[] = [
    new BatchSpanProcessor(createPipelineSpanExporter({ db, workspaceId, executionId })),
  ];

  // eslint-disable-next-line node/prefer-global/process
  if (process.env.OTLP_ENDPOINT) {
    // eslint-disable-next-line node/prefer-global/process
    spanProcessors.push(new BatchSpanProcessor(new OTLPTraceExporter({ url: `${process.env.OTLP_ENDPOINT}/v1/traces` })));
  }

  const resource = resourceFromAttributes({
    "service.name": "ucdjs-pipeline-server",
    "pipeline.execution_id": executionId,
    "pipeline.pipeline_id": pipelineId,
    "pipeline.file_id": file.id,
    "pipeline.source_id": source.id,
    "pipeline.workspace_id": workspaceId,
  });

  const tracerProvider = new NodeTracerProvider({
    spanProcessors,
    resource,
  });
  const tracer = tracerProvider.getTracer("pipeline-executor");

  const runtime = createNodeExecutionRuntime({
    outputCapture: {
      console: true,
      stdio: true,
    },
    tracer,
  });

  const executor = createPipelineExecutor({
    runtime,
    onLog: createExecutionLogStore(db),
  });

  try {
    const execResult = await runtime.runWithExecutionContext({ executionId, workspaceId }, () =>
      executor.run([pipeline], { versions, cache }));

    // Flush any buffered spans before updating execution status
    await tracerProvider.forceFlush();

    const pipelineResult = execResult.find((r) => r.id === pipelineId);
    const status = pipelineResult?.status ?? "failed";

    if (status === "failed" && pipelineResult?.errors?.length) {
      for (const err of pipelineResult.errors) {
        console.error(`[pipeline] "${pipelineId}" failed (${err.scope}): ${err.message}`);
      }
    }

    await db.update(schema.executions)
      .set({
        status,
        completedAt: new Date(),
        summary: pipelineResult?.summary ?? null,
      })
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ));

    return { success: true, executionId } satisfies ExecutePipelineResponse;
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.error(`[pipeline] "${pipelineId}" execution threw:`, errorMessage);

    await tracerProvider.forceFlush().catch(() => {});

    await db.update(schema.executions)
      .set({ status: "failed", completedAt: new Date(), error: errorMessage })
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.id, executionId),
      ));

    return { success: false, executionId, error: errorMessage } satisfies ExecutePipelineResponse;
  }
});
