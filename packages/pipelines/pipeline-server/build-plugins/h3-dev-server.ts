import type { H3 } from "h3";
import type { Plugin } from "vite";
import fs from "node:fs/promises";
import { getUcdConfigDir } from "@ucdjs-internal/shared";
import { ensureWorkspace, resolveWorkspace } from "../src/server/workspace";

const appModuleId = "/src/server/app.ts";
const dbModuleId = "/src/server/db/index.ts";

export function h3DevServerPlugin(): Plugin {
  return {
    name: "h3-dev-server",
    async configureServer(server) {
      let appPromise: Promise<H3> | null = null;
      let db: import("../src/server/db").Database | null = null;

      // Initialize database before starting the server
      try {
        const dbMod = await server.ssrLoadModule(dbModuleId);
        const { createDatabase, runMigrations } = dbMod as typeof import("../src/server/db");

        await fs.mkdir(getUcdConfigDir(), { recursive: true });
        db = createDatabase();
        await runMigrations(db);
        const workspace = resolveWorkspace();
        await ensureWorkspace(db, workspace.workspaceId, workspace.rootPath);
        // eslint-disable-next-line no-console
        console.log("[h3-dev-server] Database migrations completed successfully");
      } catch (err) {
        console.error("[h3-dev-server] Failed to initialize database:", err);
        // In dev, we still continue but log the error prominently
        // The app will fail when trying to access db.context
      }

      const getApp = async () => {
        if (!appPromise) {
          appPromise = server
            .ssrLoadModule(appModuleId)
            .then((mod) => (mod as typeof import("../src/server/app")).createApp({
              db: db!,
              workspaceId: resolveWorkspace().workspaceId,
            }));
        }

        return appPromise;
      };

      server.watcher.on("change", (file) => {
        if (file.includes("/src/server/")) {
          appPromise = null;
        }
      });

      // Add middleware BEFORE Vite's internal middleware (no return = pre-hook)
      // This ensures /api routes are handled before Vite's SPA fallback
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api")) {
          return next();
        }

        // If database failed to initialize, return error
        if (!db) {
          res.statusCode = 500;
          res.setHeader("content-type", "application/json");
          res.end(JSON.stringify({
            error: "Database not initialized",
            message: "The database failed to initialize. Check the server console for details.",
          }));
          return;
        }

        try {
          const app = await getApp();

          // Collect request body for POST/PUT/PATCH
          let body: string | undefined;
          if (req.method && ["POST", "PUT", "PATCH"].includes(req.method)) {
            // eslint-disable-next-line node/prefer-global/buffer
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
            // eslint-disable-next-line node/prefer-global/buffer
            body = Buffer.concat(chunks).toString();
          }

          const response = await app.fetch(
            new Request(new URL(req.url, "http://localhost"), {
              method: req.method,
              headers: req.headers as HeadersInit,
              body,
            }),
          );

          res.statusCode = response.status;
          response.headers.forEach((value, key) => {
            res.setHeader(key, value);
          });

          const responseBody = await response.text();
          res.end(responseBody);
        } catch (error) {
          next(error);
        }
      });
    },
  };
}
