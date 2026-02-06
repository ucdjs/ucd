import type { PipelineEvent } from "@ucdjs/pipelines-core";
import type { LocalSource } from "@ucdjs/pipelines-loader";
import { randomUUID } from "node:crypto";
import { createPipelineExecutor } from "@ucdjs/pipelines-executor";
import { findPipelineFiles, loadPipelinesFromPaths } from "@ucdjs/pipelines-loader";
import { eq } from "drizzle-orm";
import { H3, readBody } from "h3";
import * as schema from "../db/schema";

export const executeRouter = new H3();

interface ExecuteBody {
  versions?: string[];
  cache?: boolean;
}

executeRouter.post("/", async (event) => {
  const { sources, db } = event.context;
  const id = event.context.params?.id;

  if (!id) {
    return { error: "Pipeline ID is required" };
  }

  // Only execute local pipelines - remote execution not supported
  const localSources = sources.filter((s) => s.type === "local") as LocalSource[];

  if (localSources.length === 0) {
    return { error: "No local sources configured for pipeline execution" };
  }

  for (const source of localSources) {
    try {
      const files = await findPipelineFiles({ cwd: source.cwd });
      const result = await loadPipelinesFromPaths(files);

      const pipeline = result.pipelines.find((p) => p.id === id);

      if (!pipeline) {
        continue;
      }

      const body = (await readBody<ExecuteBody>(event).catch(() => null)) ?? {};
      const versions = body.versions ?? pipeline.versions;
      const cache = body.cache ?? true;

      // Generate execution ID
      const executionId = randomUUID();
      const startedAt = new Date();

      // Create execution record
      await db.insert(schema.executions).values({
        id: executionId,
        pipelineId: id,
        status: "running",
        startedAt,
        versions,
      });

      const events: PipelineEvent[] = [];
      const executor = createPipelineExecutor({
        onEvent: async (evt) => {
          events.push(evt);

          // Persist event to database
          await db.insert(schema.events).values({
            id: randomUUID(),
            executionId,
            type: evt.type,
            timestamp: new Date(evt.timestamp),
            data: evt,
          });
        },
      });

      try {
        const execResult = await executor.run([pipeline], {
          versions,
          cache,
        });

        const pipelineResult = execResult.results.get(id);
        const completedAt = new Date();

        // Update execution with final status
        await db.update(schema.executions)
          .set({
            status: "completed",
            completedAt,
            summary: pipelineResult?.summary ?? null,
            graph: pipelineResult?.graph ?? null,
          })
          .where(eq(schema.executions.id, executionId));

        // eslint-disable-next-line no-console
        console.info("Pipeline execution completed:", {
          executionId,
          pipelineId: id,
          summary: pipelineResult?.summary,
        });

        // Return just success and executionId
        return {
          success: true,
          executionId,
        };
      } catch (err) {
        const completedAt = new Date();
        const errorMessage = err instanceof Error ? err.message : String(err);

        // Update execution with failure status
        await db.update(schema.executions)
          .set({
            status: "failed",
            completedAt,
            error: errorMessage,
          })
          .where(eq(schema.executions.id, executionId));

        // Return failure with executionId
        return {
          success: false,
          executionId,
          error: errorMessage,
        };
      }
    } catch {
      // Continue to next source
    }
  }

  return { error: `Pipeline "${id}" not found in local sources` };
});
