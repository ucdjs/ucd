import type { Database } from "#server/db";
import type { PipelineSource } from "@ucdjs/pipelines-loader";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { createDatabase, runMigrations } from "#server/db";
import {
  sourcesExecutionRouter,
  sourcesFileRouter,
  sourcesOverviewRouter,
  sourcesPipelineRouter,
  sourcesSourceRouter,
} from "#server/routes";
import { ensureWorkspace, resolveWorkspace } from "#server/workspace";
import { H3, HTTPError, serve, serveStatic } from "h3";
// import { getUcdConfigDir } from "@ucdjs-internal/shared/config";
import { getUcdConfigDir } from "../../../../shared/src/config";
import { version } from "../../package.json" with { type: "json" };

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
  const {
    sources = [],
    db,
    workspaceId = "default",
  } = options;

  if (!db) {
    throw new Error("Database is required. Pass db to createApp() or use startServer()");
  }

  const app = new H3({
    onError(error) {
      const status = error.statusCode;
      return Response.json(
        {
          message: error.message || error.statusText || "Internal Server Error",
          status,
          timestamp: new Date().toISOString(),
        },
        { status },
      );
    },
  });

  // Default to pipeline-playground in development
  let resolvedSources = sources;
  if (sources.length === 0) {
    const cwd = process.cwd();
    if (process.env.NODE_ENV === "development" || (import.meta as any).env.DEV) {
      resolvedSources = [
        {
          type: "local",
          id: "local",
          cwd: path.join(import.meta.dirname, "../../../pipeline-playground"),
        },
        // {
        //   type: "gitlab",
        //   id: "gitlab-test",
        //   owner: "luxass",
        //   repo: "ucdjs-pipelines-gitlab",
        //   ref: "main",
        // },
        // {
        //   type: "github",
        //   id: "github-test",
        //   owner: "ucdjs",
        //   repo: "ucd-pipelines",
        //   ref: "main",
        // },
      ];
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
    event.context.workspaceId = workspaceId;
    next();
  });

  app.get("/api/hello", () => ({
    message: "Hello from H3!",
    timestamp: Date.now(),
  }));

  app.get("/api/config", () => {
    return {
      workspaceId: options.workspaceId,
      version,
    };
  });

  app.mount("/api/sources", sourcesSourceRouter);
  app.mount("/api/sources", sourcesOverviewRouter);
  app.mount("/api/sources", sourcesFileRouter);
  app.mount("/api/sources", sourcesPipelineRouter);
  app.mount("/api/sources", sourcesExecutionRouter);

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
