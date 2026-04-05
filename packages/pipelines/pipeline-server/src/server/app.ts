import type { Database } from "#server/db";
import type { PipelineLocator } from "@ucdjs/pipeline-loader";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createDatabase, runMigrations } from "#server/db";
import { setupLiveUpdates } from "#server/live";
import {
  sourcesExecutionsRouter,
  sourcesGraphRouter,
  sourcesLogsRouter,
  sourcesOverviewRouter,
  sourcesPipelineRouter,
  sourcesRouter,
  sourcesTracesRouter,
} from "#server/routes";
import { ensureWorkspace, recoverStaleExecutions, resolvePipelineSources, resolveWorkspace } from "#server/workspace";
import { context } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import { getUcdConfigDir } from "@ucdjs/env";
import { H3, serve, serveStatic } from "h3";
import { version } from "../../package.json" with { type: "json" };

context.setGlobalContextManager(new AsyncLocalStorageContextManager().enable());

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
  const resolvedSources = resolvePipelineSources(sources);

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

  app.get("/api/config", (event) => ({
    workspaceId: event.context.workspaceId,
    version,
  }));

  app.mount("/api/sources", sourcesRouter);
  app.mount("/api/sources", sourcesOverviewRouter);
  app.mount("/api/sources", sourcesPipelineRouter);
  app.mount("/api/sources", sourcesExecutionsRouter);
  app.mount("/api/sources", sourcesLogsRouter);
  app.mount("/api/sources", sourcesGraphRouter);
  app.mount("/api/sources", sourcesTracesRouter);

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
  await recoverStaleExecutions(db, resolvedWorkspace.workspaceId);
  const resolvedSources = resolvePipelineSources(sources);

  const app = createApp({
    sources: resolvedSources,
    db,
    workspaceId: resolvedWorkspace.workspaceId,
  });

  const live = setupLiveUpdates(app, {
    sources: resolvedSources,
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

  const server = serve(app, {
    port,
    silent: true,
    plugins: live.plugins,
    gracefulShutdown: false,
  });

  const originalClose = server.close.bind(server);
  server.close = async (closeActiveConnections) => {
    await live.close();
    await originalClose(closeActiveConnections);
  };

  const handleShutdown = () => {
    void server.close(true);
  };

  process.once("SIGINT", handleShutdown);
  process.once("SIGTERM", handleShutdown);

  // eslint-disable-next-line no-console
  console.info(`Pipeline UI running at http://localhost:${port}`);
}

export { createDatabase, runMigrations, setupLiveUpdates };
