import type { PipelineSource } from "@ucdjs/pipelines-loader";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { extractDefinePipelineCode } from "#server/code";
import { schema } from "#server/db";
import { findPipelineByFileId, loadPipelineFileGroups } from "#server/lib/files";
import { createExecutionLogCapture } from "#server/lib/log-capture";
import { resolveLocalFilePath } from "#server/lib/resolve";
import { createPipelineExecutor, runWithPipelineExecutionContext } from "@ucdjs/pipelines-executor";
import {
  getRemoteSourceCacheStatus,
  syncRemoteSource,
} from "@ucdjs/pipelines-loader";
import { and, desc, eq, sql } from "drizzle-orm";
import { getQuery, H3, readValidatedBody } from "h3";
import { z } from "zod";

export const sourcesPipelineRouter: H3 = new H3();

async function getPipelineFileForSource(
  source: PipelineSource,
  filePath: string,
): Promise<{ content: string; filePath: string } | null> {
  if (source.type === "local") {
    const resolvedPath = resolveLocalFilePath(source.cwd, filePath);
    const content = await fs.promises.readFile(resolvedPath, "utf-8");
    return { content, filePath };
  }

  // Check cache status
  const status = await getRemoteSourceCacheStatus({
    source: source.type,
    owner: source.owner,
    repo: source.repo,
    ref: source.ref,
  });

  // Auto-sync if not cached (server is allowed to download directly)
  if (!status.cached) {
    const result = await syncRemoteSource({
      source: source.type,
      owner: source.owner,
      repo: source.repo,
      ref: source.ref ?? "HEAD",
    });

    if (!result.success) {
      throw new Error(`Failed to sync source: ${result.error?.message ?? "Unknown error"}`);
    }
  }

  const fullPath = path.join(status.cacheDir, filePath);
  const content = await fs.promises.readFile(fullPath, "utf-8");

  return { content, filePath };
}

// GET /api/sources/:sourceId/:fileId/:pipelineId/code - Pipeline code
sourcesPipelineRouter.get("/:sourceId/:fileId/:pipelineId/code", async (event) => {
  const { sources } = event.context;
  const sourceId = event.context.params?.sourceId;
  const fileId = event.context.params?.fileId;
  const pipelineId = event.context.params?.pipelineId;

  if (!sourceId || !fileId || !pipelineId) {
    return { error: "Source ID, File ID, and Pipeline ID are required" };
  }

  const groups = await loadPipelineFileGroups(sources);

  for (const group of groups) {
    const match = findPipelineByFileId(fileId, group.fileGroups, pipelineId);
    if (!match || match.fileGroup.sourceId !== sourceId) {
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

  return { error: `Pipeline "${pipelineId}" not found in file "${fileId}" of source "${sourceId}"` };
});

// POST /api/sources/:sourceId/:fileId/:pipelineId/execute - Execute pipeline
sourcesPipelineRouter.post("/:sourceId/:fileId/:pipelineId/execute", async (event) => {
  const { sources, db } = event.context;
  const workspaceId = event.context.workspaceId;
  const sourceId = event.context.params?.sourceId;
  const fileId = event.context.params?.fileId;
  const pipelineId = event.context.params?.pipelineId;

  if (!sourceId || !fileId || !pipelineId || !workspaceId) {
    return { error: "Source ID, File ID, Pipeline ID, and workspace ID are required" };
  }

  // Only allow execution from local sources for security
  const localSources = sources.filter((s) => s.type === "local" && s.id === sourceId);

  if (localSources.length === 0) {
    return { error: "Pipeline execution is only allowed from local sources" };
  }

  const body = await readValidatedBody(event, z.object({
    versions: z.array(z.string()).optional(),
    cache: z.boolean().optional(),
  }));

  const groups = await loadPipelineFileGroups(localSources);

  for (const group of groups) {
    const match = findPipelineByFileId(fileId, group.fileGroups, pipelineId);
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
      pipelineId,
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

      const pipelineResult = execResult.find((result) => result.id === pipelineId);
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

  return { error: `Pipeline "${pipelineId}" not found in file "${fileId}" of source "${sourceId}"` };
});

// GET /api/sources/:sourceId/:fileId/:pipelineId/executions - List executions
sourcesPipelineRouter.get("/:sourceId/:fileId/:pipelineId/executions", async (event) => {
  const { db } = event.context;
  const workspaceId = event.context.workspaceId;
  const pipelineId = event.context.params?.pipelineId;

  if (!pipelineId || !workspaceId) {
    return { error: "Pipeline ID and workspace ID are required" };
  }

  const query = getQuery(event);
  const limit = Math.min(
    typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 50,
    100,
  );
  const offset = typeof query.offset === "string" ? Number.parseInt(query.offset, 10) : 0;

  try {
    const executions = await db.query.executions.findMany({
      where: and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.pipelineId, pipelineId),
      ),
      orderBy: desc(schema.executions.startedAt),
      limit,
      offset,
    });

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(schema.executions)
      .where(and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.pipelineId, pipelineId),
      ));
    const total = Number(countResult[0]?.count ?? 0);

    return {
      executions: executions.map((exec) => ({
        id: exec.id,
        pipelineId: exec.pipelineId,
        status: exec.status,
        startedAt: exec.startedAt.toISOString(),
        completedAt: exec.completedAt?.toISOString() ?? null,
        versions: exec.versions,
        summary: exec.summary,
        hasGraph: Boolean(exec.graph),
        error: exec.error,
      })),
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (err) {
    console.error("Failed to fetch executions:", err);
    return {
      error: "Failed to fetch executions",
      details: err instanceof Error ? err.message : String(err),
    };
  }
});

// TODO: Add graph, graphs, inspect endpoints
