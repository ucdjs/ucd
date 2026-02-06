import type { PipelineSource } from "@ucdjs/pipelines-loader";
import type { Database } from "./db";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { H3, serve, serveStatic } from "h3";
import { eventsRouter } from "./routes/events";
import { executeRouter } from "./routes/execute";
import { executionsRouter } from "./routes/executions";
import { pipelinesRouter } from "./routes/pipelines";
import { sourcesRouter } from "./routes/sources";
import { versionsRouter } from "./routes/versions";

export interface AppOptions {
  sources?: PipelineSource[];
  db?: Database;
}

export interface ServerOptions extends AppOptions {
  port?: number;
}

declare module "h3" {
  interface H3EventContext {
    sources: PipelineSource[];
    db: Database;
  }
}

export function createApp(options: AppOptions = {}): H3 {
  const { sources = [], db } = options;

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
    next();
  });

  app.get("/api/hello", () => ({
    message: "Hello from H3!",
    timestamp: Date.now(),
  }));

  app.mount("/api/sources", sourcesRouter);
  app.mount("/api/pipelines", pipelinesRouter);
  app.mount("/api/pipelines/:id/execute", executeRouter);
  app.mount("/api/pipelines/:id/executions", executionsRouter);
  app.mount("/api/executions/:id/events", eventsRouter);
  app.mount("/api/versions", versionsRouter);

  return app;
}

export async function startServer(options: ServerOptions = {}): Promise<void> {
  const { port = 3030, sources } = options;

  // Initialize database with auto-migration
  // NOTE: This will CRASH the server if database initialization fails
  // This is intentional - we don't want to run with a misconfigured database
  const { createDatabase, runMigrations } = await import("./db");
  const db = createDatabase();

  try {
    await runMigrations(db);
    // eslint-disable-next-line no-console
    console.info("Database migrations completed successfully");
  } catch (err) {
    console.error("Failed to run database migrations:", err);
    throw err; // CRASH - no fallback
  }

  const app = createApp({ sources, db });

  const clientDir = path.join(import.meta.dirname, "../client");

  app.use((event) => {
    const url = event.url.pathname;

    if (url.startsWith("/api")) {
      return;
    }

    return serveStatic(event, {
      fallthrough: true,
      getContents: (id) => fs.promises.readFile(path.join(clientDir, id)),
      getMeta: async (id) => {
        const filePath = path.join(clientDir, id);
        try {
          const stats = await fs.promises.stat(filePath);
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
    return fs.promises.readFile(indexPath, "utf-8").then((html) => {
      return new Response(html, {
        headers: { "content-type": "text/html" },
      });
    });
  });

  serve(app, { port, silent: true });

  // eslint-disable-next-line no-console
  console.info(`Pipeline UI running at http://localhost:${port}`);
}
