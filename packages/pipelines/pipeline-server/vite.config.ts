import { cp } from "node:fs/promises";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import viteTsConfigPaths from "vite-tsconfig-paths";
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
        build: {
          outDir: "dist/server",
          ssr: true,
          rolldownOptions: {
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
  };
});
