import type { Database } from "#server/db";
import type { PipelineLocator } from "@ucdjs/pipelines-loader";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createDatabase, runMigrations } from "#server/db";
import {
  sourcesEventsRouter,
  sourcesExecutionsRouter,
  sourcesFileRouter,
  sourcesGraphRouter,
  sourcesIndexRouter,
  sourcesLogsRouter,
  sourcesPipelineRouter,
  sourcesSourceRouter,
} from "#server/routes";
import { ensureWorkspace, resolveWorkspace } from "#server/workspace";
import { getUcdConfigDir } from "@ucdjs-internal/shared/config";
import { H3, serve, serveStatic } from "h3";

export type PipelineSource = PipelineLocator & { id: string };

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
        kind: "local",
        id: "local",
        path: path.join(import.meta.dirname, "../../../pipeline-playground"),
      }, {
        kind: "remote",
        id: "github-remote",
        provider: "github",
        owner: "ucdjs",
        repo: "ucd-pipelines",
        ref: "main",
      }];
    } else {
      resolvedSources = [{
        kind: "local",
        id: "local",
        path: cwd,
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

  app.mount("/api/sources", sourcesIndexRouter);
  app.mount("/api/sources", sourcesSourceRouter);
  app.mount("/api/sources", sourcesFileRouter);
  app.mount("/api/sources", sourcesPipelineRouter);
  app.mount("/api/sources", sourcesExecutionsRouter);
  app.mount("/api/sources", sourcesEventsRouter);
  app.mount("/api/sources", sourcesLogsRouter);
  app.mount("/api/sources", sourcesGraphRouter);

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

export { createDatabase, runMigrations };
