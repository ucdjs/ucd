import type { TestProjectConfiguration } from "vitest/config";
import { fileURLToPath } from "node:url";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineProject } from "vitest/config";

const pipelineServerRoot = fileURLToPath(new URL("./", import.meta.url));

const browserSetupFile = `${pipelineServerRoot}/test/browser/setup.ts`;

const projects = [
  {
    test: {
      name: "pipeline-server",
      include: ["server/**/*.test.ts"],
      environment: "node",
    },
  },
  {
    plugins: [
      tanstackRouter({
        routesDirectory: `${pipelineServerRoot}/src/client/routes`,
        generatedRouteTree: `${pipelineServerRoot}/src/client/routeTree.gen.ts`,
        disableLogging: true,
      }),
      react(),
    ],
    test: {
      name: "pipeline-server-browser",
      include: ["browser/**/*.test.ts?(x)"],
      environment: "jsdom",
      environmentOptions: {
        jsdom: {
          url: "http://localhost/",
        },
      },
      setupFiles: [browserSetupFile],
    },
  },
] satisfies TestProjectConfiguration[];

export default defineProject({
  test: {
    projects,
  },
});
