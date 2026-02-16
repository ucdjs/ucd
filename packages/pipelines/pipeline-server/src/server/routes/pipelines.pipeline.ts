import type { PipelineSource } from "@ucdjs/pipelines-loader";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import { extractDefinePipelineCode } from "#server/code";
import { schema } from "#server/db";
import { findPipelineByFileId, loadPipelineFileGroups } from "#server/lib/files";
import { createExecutionLogCapture } from "#server/lib/log-capture";
import { resolveLocalFilePath } from "#server/lib/resolve";
import { createPipelineExecutor, runWithPipelineExecutionContext } from "@ucdjs/pipelines-executor";
import { github, gitlab } from "@ucdjs/pipelines-loader/remote";
import { toPipelineDetails } from "@ucdjs/pipelines-ui";
import { and, eq } from "drizzle-orm";
import { H3, readValidatedBody } from "h3";
import { z } from "zod";

export const pipelinesPipelineRouter: H3 = new H3();

async function getPipelineFileForSource(
  source: PipelineSource,
  filePath: string,
): Promise<{ content: string; filePath: string } | null> {
  if (source.type === "local") {
    const resolvedPath = resolveLocalFilePath(source.cwd, filePath);
    const content = await fs.promises.readFile(resolvedPath, "utf-8");
    return { content, filePath };
  }

  const { owner, repo, ref } = source;
  const content = source.type === "github"
    ? await github.fetchFile({ owner, repo, ref }, filePath)
    : await gitlab.fetchFile({ owner, repo, ref }, filePath);

  return { content, filePath };
}

pipelinesPipelineRouter.get("/:file/:id", async (event) => {
  const { sources } = event.context;
  const fileId = event.context.params?.file;
  const id = event.context.params?.id;

  if (!fileId || !id) {
    return { error: "File ID and pipeline ID are required" };
  }

  const groups = await loadPipelineFileGroups(sources);
  for (const group of groups) {
    const match = findPipelineByFileId(fileId, group.fileGroups, id);
    if (match) {
      return {
        pipeline: toPipelineDetails(match.entry.pipeline),
        fileId: match.fileGroup.fileId,
        filePath: match.fileGroup.filePath,
        fileLabel: match.fileGroup.fileLabel,
        sourceId: match.fileGroup.sourceId,
      };
    }
  }

  return { error: `Pipeline "${id}" not found` };
});

pipelinesPipelineRouter.get("/:file/:id/code", async (event) => {
  const { sources } = event.context;
  const fileId = event.context.params?.file;
  const id = event.context.params?.id;

  if (!fileId || !id) {
    return { error: "File ID and pipeline ID are required" };
  }

  const groups = await loadPipelineFileGroups(sources);
  for (const group of groups) {
    const match = findPipelineByFileId(fileId, group.fileGroups, id);
    if (!match) {
      continue;
    }

    const file = await getPipelineFileForSource(group.source, match.fileGroup.filePath);
    if (!file?.content) {
      continue;
    }

    return {
      code: extractDefinePipelineCode(file.content, { exportName: match.entry.exportName }),
      filePath: file.filePath,
      fileLabel: match.fileGroup.fileLabel,
      fileId: match.fileGroup.fileId,
      sourceId: match.fileGroup.sourceId,
    };
  }

  return { error: `Pipeline "${id}" not found` };
});

pipelinesPipelineRouter.post("/:file/:id/execute", async (event) => {
  const { sources, db } = event.context;
  const workspaceId = event.context.workspaceId;
  const fileId = event.context.params?.file;
  const id = event.context.params?.id;

  if (!fileId || !id) {
    return { error: "File ID and pipeline ID are required" };
  }

  const localSources = sources.filter((s) => s.type === "local");

  if (localSources.length === 0) {
    return { error: "No local sources configured for pipeline execution" };
  }

  const body = await readValidatedBody(event, z.object({
    versions: z.array(z.string()).optional(),
    cache: z.boolean().optional(),
  }));

  const groups = await loadPipelineFileGroups(localSources);
  for (const group of groups) {
    const match = findPipelineByFileId(fileId, group.fileGroups, id);
    if (!match) {
      continue;
    }

    const pipeline = match.entry.pipeline;
    const versions = body.versions ?? pipeline.versions;
    const cache = body.cache ?? true;

    const executionId = randomUUID();
    const startedAt = new Date();

    await db.insert(schema.executions).values({
      id: executionId,
      workspaceId,
      pipelineId: id,
      status: "running",
      startedAt,
      versions,
    });

    const logCapture = createExecutionLogCapture(db);
    logCapture.start();

    const executor = createPipelineExecutor({
      onEvent: async (evt) => {
        await db.insert(schema.events).values({
          id: randomUUID(),
          workspaceId,
          executionId,
          type: evt.type,
          timestamp: new Date(evt.timestamp),
          data: evt,
        });
      },
    });

    try {
      const execResult = await runWithPipelineExecutionContext({ executionId, workspaceId }, async () => {
        return executor.run([pipeline], {
          versions,
          cache,
        });
      });

      const pipelineResult = execResult.find((result) => result.id === id);
      const completedAt = new Date();

      await db.update(schema.executions)
        .set({
          status: pipelineResult?.status ?? "failed",
          completedAt,
          summary: pipelineResult?.summary ?? null,
          graph: pipelineResult?.graph ?? null,
        })
        .where(and(
          eq(schema.executions.workspaceId, workspaceId),
          eq(schema.executions.id, executionId),
        ));

      // eslint-disable-next-line no-console
      console.info("Pipeline execution completed:", {
        executionId,
        pipelineId: id,
        summary: pipelineResult?.summary,
      });

      return {
        success: true,
        executionId,
      };
    } catch (err) {
      const completedAt = new Date();
      const errorMessage = err instanceof Error ? err.message : String(err);

      await db.update(schema.executions)
        .set({
          status: "failed",
          completedAt,
          error: errorMessage,
        })
        .where(and(
          eq(schema.executions.workspaceId, workspaceId),
          eq(schema.executions.id, executionId),
        ));

      return {
        success: false,
        executionId,
        error: errorMessage,
      };
    } finally {
      await logCapture.stop();
    }
  }

  return { error: `Pipeline "${id}" not found in local sources` };
});
