import type { Database } from "#server/db";
import type { PipelineSource } from "@ucdjs/pipelines-loader";
import { createHash } from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { schema } from "#server/db";
import { eq } from "drizzle-orm";

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
  const localSources = sources.filter((source) => source.type === "local");
  if (localSources.length > 0) {
    return localSources[0]?.cwd ?? process.cwd();
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
      if (parsed?.workspaceId) {
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

export async function ensureWorkspace(db: Database, workspaceId: string, rootPath: string): Promise<void> {
  const existing = await db.query.workspaces.findFirst({
    where: eq(schema.workspaces.id, workspaceId),
    columns: { id: true },
  });

  if (existing) {
    return;
  }

  const now = new Date();

  await db.insert(schema.workspaces).values({
    id: workspaceId,
    rootPath,
    createdAt: now,
    updatedAt: now,
  });
}
