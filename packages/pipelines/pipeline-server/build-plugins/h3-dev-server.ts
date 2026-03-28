import type { Plugin } from "vite";
import type { Database } from "../src/server/db";
import fs from "node:fs/promises";
import { Readable } from "node:stream";
import { getUcdConfigDir } from "@ucdjs/env";
import nodeAdapter from "crossws/adapters/node";
import { ensureWorkspace, recoverStaleExecutions, resolveWorkspace } from "../src/server/workspace";

const appModuleId = "/src/server/app.ts";
const dbModuleId = "/src/server/db/index.ts";

export function h3DevServerPlugin(): Plugin {
  return {
    name: "h3-dev-server",
    async configureServer(server) {
      let db: Database | null = null;
      let liveClose: (() => Promise<void>) | null = null;

      // Initialize database before starting the server
      try {
        const dbMod = await server.ssrLoadModule(dbModuleId);
        const { createDatabase, runMigrations } = dbMod as typeof import("../src/server/db");

        await fs.mkdir(getUcdConfigDir(), { recursive: true });
        db = createDatabase();
        await runMigrations(db);
        const workspace = resolveWorkspace();
        await ensureWorkspace(db, workspace.workspaceId, workspace.rootPath);
        await recoverStaleExecutions(db, workspace.workspaceId);
        // eslint-disable-next-line no-console
        console.log("[h3-dev-server] Database migrations completed successfully");
      } catch (err) {
        console.error("[h3-dev-server] Failed to initialize database:", err);
        // In dev, we still continue but log the error prominently
        // The app will fail when trying to access db.context
      }

      const getApp = async () => {
        return server
          .ssrLoadModule(appModuleId)
          .then((mod) => (mod as typeof import("../src/server/app")).createApp({
            db: db!,
            workspaceId: resolveWorkspace().workspaceId,
          }));
      };

      if (db && server.httpServer) {
        const workspace = resolveWorkspace();
        const appMod = await server.ssrLoadModule(appModuleId) as typeof import("../src/server/app");
        const sources = appMod.resolvePipelineSources();
        const liveApp = appMod.createApp({
          db,
          sources,
          workspaceId: workspace.workspaceId,
        });
        const live = appMod.setupLiveUpdates(liveApp, {
          sources,
          workspaceId: workspace.workspaceId,
        });
        const ws = nodeAdapter({
          resolve: async (req) => (await liveApp.fetch(req)).crossws,
        });

        liveClose = live.close;

        server.httpServer.on("upgrade", async (req, socket, head) => {
          if (!req.url?.startsWith("/api/live")) {
            return;
          }

          try {
            await ws.handleUpgrade(req, socket, head);
          } catch (err) {
            console.error("[h3-dev-server] Failed to upgrade websocket:", err);
            socket.destroy();
          }
        });
      }

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

          let body: string | undefined;
          if (req.method === "POST" || req.method === "PUT" || req.method === "PATCH") {
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

          if (response.body) {
            Readable.fromWeb(response.body as Parameters<typeof Readable.fromWeb>[0]).pipe(res);
          } else {
            res.end();
          }
        } catch (err) {
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader("content-type", "application/json");
            res.end(JSON.stringify({
              statusCode: 500,
              message: err instanceof Error ? err.message : String(err),
            }));
          }
        }
      });

      server.httpServer?.once("close", () => {
        if (liveClose) {
          void liveClose();
        }
      });
    },
  };
}
