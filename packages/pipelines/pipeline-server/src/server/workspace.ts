import type { Database } from "#server/db";
import type { PipelineSource } from "./app";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { schema } from "#server/db";
import { and, eq } from "drizzle-orm";

export interface ResolveWorkspaceOptions {
  rootPath?: string;
  sources?: PipelineSource[];
}

export const WORKSPACE_CONFIG_FILENAME = "ucd-pipelines.config.json";

export interface WorkspaceConfigFile {
  workspaceId?: string;
}

export function resolveWorkspaceRoot(options: ResolveWorkspaceOptions = {}): string {
  if (options.rootPath) {
    return options.rootPath;
  }

  const sources = options.sources ?? [];
  const localSources = sources.filter((source) => source.kind === "local");
  if (localSources.length > 0) {
    return localSources[0]?.path ?? process.cwd();
  }

  return process.cwd();
}

export function resolveWorkspace(options: ResolveWorkspaceOptions = {}) {
  const rootPath = resolveWorkspaceRoot(options);
  const normalizedRoot = path.normalize(path.resolve(rootPath));
  const configPath = path.join(normalizedRoot, WORKSPACE_CONFIG_FILENAME);
  let workspaceId: string | undefined;

  if (fs.existsSync(configPath)) {
    try {
      const content = fs.readFileSync(configPath, "utf-8");
      const parsed = JSON.parse(content) as WorkspaceConfigFile;
      if (typeof parsed?.workspaceId === "string" && parsed.workspaceId.length > 0) {
        workspaceId = parsed.workspaceId;
      }
    } catch {
      workspaceId = undefined;
    }
  }

  return {
    workspaceId: workspaceId ?? createHash("sha256").update(normalizedRoot).digest("hex"),
    rootPath: normalizedRoot,
    source: workspaceId ? "config" : "path",
  };
}

export async function recoverStaleExecutions(
  db: Database,
  workspaceId: string,
): Promise<void> {
  await db
    .update(schema.executions)
    .set({
      status: "failed",
      completedAt: new Date(),
      error: "Server restarted during execution",
    })
    .where(
      and(
        eq(schema.executions.workspaceId, workspaceId),
        eq(schema.executions.status, "running"),
      ),
    );
}

export async function ensureWorkspace(db: Database, workspaceId: string, rootPath: string): Promise<void> {
  const now = new Date();

  await db.insert(schema.workspaces).values({
    id: workspaceId,
    rootPath,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoUpdate({
    target: schema.workspaces.id,
    set: {
      rootPath,
      updatedAt: now,
    },
  });
}

export async function ensureWorkspaceExists(
  db: Database,
  workspaceId: string,
  rootPath: string | null = null,
): Promise<void> {
  const now = new Date();

  await db.insert(schema.workspaces).values({
    id: workspaceId,
    rootPath,
    createdAt: now,
    updatedAt: now,
  }).onConflictDoNothing({
    target: schema.workspaces.id,
  });
}

export function resolvePipelineSources(sources: PipelineSource[] = []): PipelineSource[] {
  if (sources.length > 0) {
    return sources;
  }

  const cwd = process.cwd();
  if (process.env.NODE_ENV === "development" || (import.meta as any).env.DEV) {
    return [{
      kind: "local",
      id: "local",
      path: path.join(import.meta.dirname, "../../../pipeline-playground"),
    }];
  }

  return [{
    kind: "local",
    id: "local",
    path: cwd,
  }];
}
