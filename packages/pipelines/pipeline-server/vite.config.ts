import type { H3 } from "h3";
import type { Plugin } from "vite";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const appModuleId = "/src/server/app.ts";

function h3DevServerPlugin(): Plugin {
  return {
    name: "h3-dev-server",
    configureServer(server) {
      let appPromise: Promise<H3> | null = null;

      const getApp = async () => {
        if (!appPromise) {
          appPromise = server
            .ssrLoadModule(appModuleId)
            .then((mod) => (mod as typeof import("./src/server/app")).createApp());
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

export default defineConfig({
  clearScreen: false,
  plugins: [
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
      loose: true,
      projectDiscovery: "lazy",
    }),
    tanstackRouter({
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
        ssr: false,
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
