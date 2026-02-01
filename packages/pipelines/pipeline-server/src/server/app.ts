import fs from "node:fs";
import path from "node:path";
import { H3, serve, serveStatic } from "h3";
import helloRouter from "./routes/hello";
import pipelinesRouter from "./routes/pipelines";

export interface ServerOptions {
  port?: number;
}

export function createApp(): H3 {
  const app = new H3({ debug: true });

  // Mount route handlers
  app.mount("/api/hello", helloRouter);
  app.mount("/api/pipelines", pipelinesRouter);

  return app;
}

export function startServer(options: ServerOptions = {}): void {
  const { port = 3030 } = options;

  const app = createApp();

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
