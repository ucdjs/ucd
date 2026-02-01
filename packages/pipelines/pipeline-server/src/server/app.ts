import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { H3, serve, serveStatic } from "h3";
import { executeRouter } from "./routes/execute";
import { pipelinesRouter } from "./routes/pipelines";
import { versionsRouter } from "./routes/versions";

export interface AppOptions {
  cwd?: string;
}

export interface ServerOptions extends AppOptions {
  port?: number;
}

declare module "h3" {
  interface H3EventContext {
    cwd: string;
  }
}

export function createApp(options: AppOptions = {}): H3 {
  const { cwd = process.cwd() } = options;

  const app = new H3({ debug: true });

  // Middleware to attach cwd to context
  app.use("/**", (event, next) => {
    event.context.cwd = cwd;
    next();
  });

  app.get("/api/hello", () => ({
    message: "Hello from H3!",
    timestamp: Date.now(),
  }));
  app.mount("/api/pipelines", pipelinesRouter);
  app.mount("/api/pipelines/:id/execute", executeRouter);
  app.mount("/api/versions", versionsRouter);

  return app;
}

export async function startServer(options: ServerOptions = {}): Promise<void> {
  const { port = 3030, cwd = process.cwd() } = options;

  const app = createApp({ cwd });

  // Static file serving for client assets
  const clientDir = path.join(import.meta.dirname, "../client");

  app.use((event) => {
    const url = event.path;

    // Skip API routes
    if (url.startsWith("/api")) {
      return;
    }

    return serveStatic(event, {
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

  // SPA fallback - serve index.html for client-side routing
  app.use((event) => {
    const url = event.path;

    // Skip API routes
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

  serve(app, { port });

  // eslint-disable-next-line no-console
  console.log(`Pipeline UI running at http://localhost:${port}`);
}
