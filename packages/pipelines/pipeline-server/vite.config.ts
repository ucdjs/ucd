import { cp } from "node:fs/promises";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import viteTsConfigPaths from "vite-tsconfig-paths";

import { getChunkName, libChunkName, NODE_MODULES_RE } from "./build-plugins/chunk-naming";
import { h3DevServerPlugin } from "./build-plugins/h3-dev-server";

export default defineConfig((config) => {
  return {
    clearScreen: false,
    plugins: [
      Inspect({
        build: true,
      }),
      viteTsConfigPaths({
        projects: [config.command === "build" ? "./tsconfig.build.json" : "./tsconfig.json"],
        loose: true,
        projectDiscovery: "lazy",
      }),
      tanstackRouter({
        routesDirectory: "./src/client/routes",
        generatedRouteTree: "./src/client/routeTree.gen.ts",
      }),
      react(),
      babel({
        presets: [reactCompilerPreset()],
      }),
      tailwindcss(),
      h3DevServerPlugin(),
      {
        name: "copy-migrations",
        apply: "build",
        enforce: "post",
        async writeBundle() {
          await cp("./src/server/db/migrations", "dist/server/migrations", { recursive: true });
          console.log("[copy-migrations] Migrations copied to dist/server/migrations");
        },
      },
    ],
    environments: {
      client: {
        build: {
          outDir: "dist/client",
          ssr: false,
        },
      },
      server: {
        resolve: {
          noExternal: true,
        },
        build: {
          outDir: "dist/server",
          ssr: true,
          rolldownOptions: {
            input: "src/server/app.ts",
            output: {
              chunkFileNames: (chunk) => getChunkName(chunk),
              codeSplitting: {
                groups: [{ test: NODE_MODULES_RE, name: (id) => libChunkName(id) }],
              },
              assetFileNames: "_libs/[name]-[hash][extname]",
            },
          },
        },
      },
    },
    builder: {
      async buildApp(builder) {
        if (builder.environments.client == null || builder.environments.server == null) {
          throw new Error("Both client and server environments must be defined");
        }

        await builder.build(builder.environments.client);
        await builder.build(builder.environments.server);
      },
    },
  };
});
