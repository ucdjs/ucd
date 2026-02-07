import type { PipelineDefinition, PipelineEvent } from "@ucdjs/pipelines-core";
import type { PipelineInfo } from "@ucdjs/pipelines-ui";
import { randomUUID } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { createPipelineExecutor } from "@ucdjs/pipelines-executor";
import { github, gitlab } from "@ucdjs/pipelines-loader/remote";
import { toPipelineDetails, toPipelineInfo } from "@ucdjs/pipelines-ui";
import { desc, eq } from "drizzle-orm";
import { getQuery, getValidatedQuery, H3, readValidatedBody } from "h3";
import { z } from "zod";
import { extractDefinePipelineCode } from "../code";
import { schema } from "../db";
import { getPipelines } from "../lib";

interface FilePipelineEntry {
  pipeline: PipelineDefinition;
  exportName: string;
}

interface PipelineFileGroup {
  fileId: string;
  filePath: string;
  sourceId: string;
  pipelines: PipelineInfo[];
  entries: FilePipelineEntry[];
}

function encodeFileId(sourceId: string, filePath: string): string {
  const raw = `${sourceId}:${filePath}`;
  return Buffer.from(raw, "utf-8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeFileId(fileId: string): { sourceId: string; filePath: string } {
  const normalized = fileId.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
  const decoded = Buffer.from(padded, "base64").toString("utf-8");
  const index = decoded.indexOf(":");
  if (index === -1) {
    throw new Error("Invalid file id");
  }
  return {
    sourceId: decoded.slice(0, index),
    filePath: decoded.slice(index + 1),
  };
}

function buildFileGroups(
  sourceId: string,
  files: Array<{ filePath: string; pipelines: PipelineDefinition[]; exportNames: string[] }>,
): PipelineFileGroup[] {
  return files.map((file) => {
    const entries = file.pipelines.map((pipeline, index) => ({
      pipeline,
      exportName: file.exportNames[index] ?? "default",
    }));

    return {
      fileId: encodeFileId(sourceId, file.filePath),
      filePath: file.filePath,
      sourceId,
      pipelines: entries.map((entry) => ({
        ...toPipelineInfo(entry.pipeline),
        sourceId,
      })),
      entries,
    };
  });
}

function applySearchFilter(
  groups: PipelineFileGroup[],
  search: string,
): PipelineFileGroup[] {
  if (!search) return groups;

  return groups
    .map((group) => {
      const entries = group.entries.filter(({ pipeline }) => {
        const haystack = [
          pipeline.id,
          pipeline.name ?? "",
          pipeline.description ?? "",
          ...pipeline.versions,
          ...pipeline.routes.map((route) => route.id),
          ...pipeline.inputs.map((input) => input.id),
        ]
          .join(" ")
          .toLowerCase();
        return haystack.includes(search);
      });

      if (!entries.length) {
        return null;
      }

      return {
        ...group,
        pipelines: entries.map((entry) => ({
          ...toPipelineInfo(entry.pipeline),
          sourceId: group.sourceId,
        })),
        entries,
      };
    })
    .filter((group): group is PipelineFileGroup => Boolean(group));
}

function findFileGroup(fileId: string, fileGroups: PipelineFileGroup[]): PipelineFileGroup | null {
  let decoded;
  try {
    decoded = decodeFileId(fileId);
  } catch {
    return null;
  }

  return fileGroups.find((group) => group.fileId === fileId)
    ?? fileGroups.find(
      (group) => group.sourceId === decoded.sourceId && group.filePath === decoded.filePath,
    )
    ?? null;
}

function findPipelineByFileId(
  fileId: string,
  fileGroups: PipelineFileGroup[],
  pipelineId: string,
): {
  fileGroup: PipelineFileGroup;
  entry: FilePipelineEntry;
} | null {
  const fileGroup = findFileGroup(fileId, fileGroups);

  if (!fileGroup) return null;

  const entry = fileGroup.entries.find(({ pipeline }) => pipeline.id === pipelineId);
  if (!entry) return null;

  return { fileGroup, entry };
}

export const pipelinesRouter = new H3();

pipelinesRouter.get("/:file", async (event) => {
  const { sources } = event.context;
  const fileId = event.context.params?.file;

  if (!fileId) {
    return { error: "File ID is required" };
  }

  const allErrors: Array<{ filePath: string; message: string; sourceId: string }> = [];

  for (const source of sources) {
    try {
      const result = await getPipelines(source);
      const fileGroups = buildFileGroups(source.id, result.files);
      const fileGroup = findFileGroup(fileId, fileGroups);

      if (fileGroup) {
        return {
          file: {
            fileId: fileGroup.fileId,
            filePath: fileGroup.filePath,
            sourceId: fileGroup.sourceId,
            pipelines: fileGroup.pipelines,
          },
        };
      }

      allErrors.push(...result.errors.map((e) => ({ filePath: e.filePath, message: e.error.message, sourceId: source.id })));
    } catch (err) {
      allErrors.push({
        filePath: "",
        message: err instanceof Error ? err.message : String(err),
        sourceId: source.id,
      });
    }
  }

  return { error: `Pipeline file "${fileId}" not found`, errors: allErrors };
});

pipelinesRouter.get("/:file/:id", async (event) => {
  const { sources } = event.context;
  const fileId = event.context.params?.file;
  const id = event.context.params?.id;

  if (!fileId || !id) {
    return { error: "File ID and pipeline ID are required" };
  }

  for (const source of sources) {
    try {
      const result = await getPipelines(source);
      const fileGroups = buildFileGroups(source.id, result.files);
      const match = findPipelineByFileId(fileId, fileGroups, id);

      if (match) {
        return {
          pipeline: toPipelineDetails(match.entry.pipeline),
          fileId: match.fileGroup.fileId,
          filePath: match.fileGroup.filePath,
          sourceId: match.fileGroup.sourceId,
        };
      }
    } catch {
      // Continue to next source
    }
  }

  return { error: `Pipeline "${id}" not found` };
});

pipelinesRouter.get("/:file/:id/code", async (event) => {
  const { sources } = event.context;
  const fileId = event.context.params?.file;
  const id = event.context.params?.id;

  if (!fileId || !id) {
    return { error: "File ID and pipeline ID are required" };
  }

  for (const source of sources) {
    try {
      const result = await getPipelines(source);
      const fileGroups = buildFileGroups(source.id, result.files);
      const match = findPipelineByFileId(fileId, fileGroups, id);

      if (!match) {
        continue;
      }

      const file = result.files.find((f) => f.filePath === match.fileGroup.filePath);

      if (!file) {
        continue;
      }

      let content: string | undefined;

      if (source.type === "local") {
        const filePath = path.resolve(source.cwd, file.filePath);
        content = await fs.promises.readFile(filePath, "utf-8");
      } else {
        const { owner, repo, ref } = source;
        content = source.type === "github"
          ? await github.fetchFile({ owner, repo, ref }, file.filePath)
          : await gitlab.fetchFile({ owner, repo, ref }, file.filePath);
      }

      if (!content) {
        continue;
      }

      return {
        code: extractDefinePipelineCode(content, { exportName: match.entry.exportName }),
        filePath: file.filePath,
        fileId: match.fileGroup.fileId,
        sourceId: match.fileGroup.sourceId,
      };
    } catch {
      // Continue to next source
    }
  }

  return { error: `Pipeline "${id}" not found` };
});

pipelinesRouter.post("/:file/:id/execute", async (event) => {
  const { sources, db } = event.context;
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

  for (const source of localSources) {
    try {
      const result = await getPipelines(source);
      const fileGroups = buildFileGroups(source.id, result.files);
      const match = findPipelineByFileId(fileId, fileGroups, id);

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
        pipelineId: id,
        status: "running",
        startedAt,
        versions,
      });

      const events: PipelineEvent[] = [];
      const executor = createPipelineExecutor({
        onEvent: async (evt) => {
          events.push(evt);

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
          .where(eq(schema.executions.id, executionId));

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

pipelinesRouter.get("/:file/:id/executions", async (event) => {
  const { db } = event.context;
  const id = event.context.params?.id;

  if (!id) {
    return { error: "Pipeline ID is required" };
  }

  const query = getQuery(event);
  const limit = Math.min(
    typeof query.limit === "string" ? Number.parseInt(query.limit, 10) : 50,
    100,
  );
  const offset = typeof query.offset === "string" ? Number.parseInt(query.offset, 10) : 0;

  try {
    const executions = await db.query.executions.findMany({
      where: eq(schema.executions.pipelineId, id),
      orderBy: desc(schema.executions.startedAt),
      limit,
      offset,
    });

    const countResult = await db.query.executions.findMany({
      where: eq(schema.executions.pipelineId, id),
      columns: { id: true },
    });
    const total = countResult.length;

    return {
      executions: executions.map((exec) => ({
        id: exec.id,
        pipelineId: exec.pipelineId,
        status: exec.status,
        startedAt: exec.startedAt.toISOString(),
        completedAt: exec.completedAt?.toISOString() ?? null,
        versions: exec.versions,
        summary: exec.summary,
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

pipelinesRouter.get("/", async (event) => {
  const { sources } = event.context;
  const query = await getValidatedQuery(event, z.object({
    search: z.string().optional().transform((s) => s?.trim().toLowerCase()).default(""),
  }));

  const allFiles: PipelineFileGroup[] = [];
  const allErrors: Array<{ filePath: string; message: string; sourceId: string }> = [];

  for (const source of sources) {
    try {
      const result = await getPipelines(source);

      const fileGroups = buildFileGroups(source.id, result.files);
      const filteredGroups = applySearchFilter(fileGroups, query.search);
      allFiles.push(...filteredGroups);
      allErrors.push(...result.errors.map((e) => ({ filePath: e.filePath, message: e.error.message, sourceId: source.id })));
    } catch (err) {
      allErrors.push({
        filePath: "",
        message: err instanceof Error ? err.message : String(err),
        sourceId: source.id,
      });
    }
  }

  return {
    files: allFiles.map((file) => ({
      fileId: file.fileId,
      filePath: file.filePath,
      sourceId: file.sourceId,
      pipelines: file.pipelines,
    })),
    errors: allErrors,
  };
});
