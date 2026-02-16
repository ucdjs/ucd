import type { Database } from "#server/db";
import type { PipelineSource } from "@ucdjs/pipelines-loader";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createDatabase, runMigrations } from "#server/db";
import {
  pipelinesEventsRouter,
  pipelinesExecutionRouter,
  pipelinesFileRouter,
  pipelinesGraphRouter,
  pipelinesIndexRouter,
  pipelinesLogsRouter,
  pipelinesPipelineRouter,
} from "#server/routes";
import { ensureWorkspace, resolveWorkspace } from "#server/workspace";
import { getUcdConfigDir } from "@ucdjs-internal/shared";
import { H3, serve, serveStatic } from "h3";

export interface AppOptions {
  sources?: PipelineSource[];
  db?: Database;
  workspaceId?: string;
}

export interface ServerOptions extends AppOptions {
  port?: number;
  workspaceRoot?: string;
}

declare module "h3" {
  interface H3EventContext {
    sources: PipelineSource[];
    db: Database;
    workspaceId: string;
  }
}

export function createApp(options: AppOptions = {}): H3 {
  const { sources = [], db, workspaceId } = options;

  if (!db) {
    throw new Error("Database is required. Pass db to createApp() or use startServer()");
  }

  const app = new H3({ debug: true });

  // Default to pipeline-playground in development
  let resolvedSources = sources;
  if (sources.length === 0) {
    const cwd = process.cwd();
    if (process.env.NODE_ENV === "development" || (import.meta as any).env.DEV) {
      resolvedSources = [{
        type: "local",
        id: "local",
        cwd: path.join(import.meta.dirname, "../../../pipeline-playground"),
      }];
    } else {
      resolvedSources = [{
        type: "local",
        id: "local",
        cwd,
      }];
    }
  }

  app.use("/**", (event, next) => {
    event.context.sources = resolvedSources;
    event.context.db = db;
    event.context.workspaceId = workspaceId ?? "default";
    next();
  });

  app.get("/api/hello", () => ({
    message: "Hello from H3!",
    timestamp: Date.now(),
  }));

  app.mount("/api/pipelines", pipelinesIndexRouter);
  app.mount("/api/pipelines", pipelinesFileRouter);
  app.mount("/api/pipelines", pipelinesPipelineRouter);
  app.mount("/api/pipelines", pipelinesExecutionRouter);
  app.mount("/api/pipelines", pipelinesEventsRouter);
  app.mount("/api/pipelines", pipelinesLogsRouter);
  app.mount("/api/pipelines", pipelinesGraphRouter);

  return app;
}

export async function startServer(options: ServerOptions = {}): Promise<void> {
  const { port = 3030, sources, workspaceId, workspaceRoot } = options;

  // Initialize database with auto-migration
  // NOTE: This will CRASH the server if database initialization fails
  // This is intentional - we don't want to run with a misconfigured database
  await fs.mkdir(getUcdConfigDir(), { recursive: true });
  const db = createDatabase();

  try {
    await runMigrations(db);
    // eslint-disable-next-line no-console
    console.info("Database migrations completed successfully");
  } catch (err) {
    console.error("Failed to run database migrations:", err);
    throw err; // CRASH - no fallback
  }

  const resolvedWorkspace = workspaceId
    ? { workspaceId, rootPath: workspaceRoot ?? process.cwd() }
    : resolveWorkspace({ sources, rootPath: workspaceRoot });

  await ensureWorkspace(db, resolvedWorkspace.workspaceId, resolvedWorkspace.rootPath);

  const app = createApp({
    sources,
    db,
    workspaceId: resolvedWorkspace.workspaceId,
  });

  const clientDir = path.join(import.meta.dirname, "../client");

  app.use((event) => {
    const url = event.url.pathname;

    if (url.startsWith("/api")) {
      return;
    }

    return serveStatic(event, {
      fallthrough: true,
      getContents: (id) => fs.readFile(path.join(clientDir, id)),
      getMeta: async (id) => {
        const filePath = path.join(clientDir, id);
        try {
          const stats = await fs.stat(filePath);
          if (!stats.isFile()) return;
          return { size: stats.size, mtime: stats.mtime };
        } catch {
          // File not found - fall through to SPA fallback
        }
      },
    });
  });

  app.use((event) => {
    const url = event.url.pathname;

    if (url.startsWith("/api")) {
      return;
    }

    const indexPath = path.join(clientDir, "index.html");
    return fs.readFile(indexPath, "utf-8").then((html) => {
      return new Response(html, {
        headers: { "content-type": "text/html" },
      });
    });
  });

  serve(app, { port, silent: true });

  // eslint-disable-next-line no-console
  console.info(`Pipeline UI running at http://localhost:${port}`);
}
