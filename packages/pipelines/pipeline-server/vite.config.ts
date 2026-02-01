import type { Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { createApp } from "./src/server/app";

function h3DevServerPlugin(): Plugin {
  const app = createApp();

  return {
    name: "h3-dev-server",
    configureServer(server) {
      // Add middleware BEFORE Vite's internal middleware (no return = pre-hook)
      // This ensures /api routes are handled before Vite's SPA fallback
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith("/api")) {
          return next();
        }

        try {
          // Collect request body for POST/PUT/PATCH
          let body: string | undefined;
          if (req.method && ["POST", "PUT", "PATCH"].includes(req.method)) {
            const chunks: Buffer[] = [];
            for await (const chunk of req) {
              chunks.push(chunk);
            }
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

export default defineConfig({
  plugins: [
    TanStackRouterVite({
      routesDirectory: "./src/client/routes",
      generatedRouteTree: "./src/client/routeTree.gen.ts",
    }),
    react(),
    tailwindcss(),
    h3DevServerPlugin(),
  ],
  environments: {
    client: {
      build: {
        outDir: "dist/client",
      },
    },
    server: {
      build: {
        outDir: "dist/server",
        ssr: true,
        rollupOptions: {
          input: "src/server/app.ts",
        },
      },
    },
  },
  builder: {
    async buildApp(builder) {
      await builder.build(builder.environments.client);
      await builder.build(builder.environments.server);
    },
  },
});
