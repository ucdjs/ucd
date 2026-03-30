import { cp } from "node:fs/promises";
import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import viteTsConfigPaths from "vite-tsconfig-paths";

import { h3DevServerPlugin } from "./build-plugins/h3-dev-server";

const NODE_MODULES_RE = /node_modules[/\\][^.]/;

function pathToPkgName(path: string): string | undefined {
  let pkgName = path.match(
    // eslint-disable-next-line e18e/prefer-static-regex
    /.*[/\\]node_modules[/\\](?<name>@[^/\\]+[/\\][^/\\]+|[^/\\.][^/\\]*)/,
  )?.groups?.name;
  if (pkgName?.endsWith("-nightly")) {
    pkgName = pkgName.slice(0, -8);
  }
  return pkgName;
}

const virtualRe = /^(?:\0|#|virtual:)/;

function libChunkName(id: string) {
  console.log("Module ID:", id);
  const pkgName = pathToPkgName(id);
  return pkgName ? `_libs/${pkgName}` : undefined;
}

function getChunkName(chunk: { name: string; moduleIds: string[] }) {
  console.log("Chunk:", chunk.name, chunk.moduleIds);
  // Known groups
  if (chunk.name === "rolldown-runtime") {
    return "_runtime.mjs";
  }

  // Library chunks
  if (chunk.moduleIds.every((id) => NODE_MODULES_RE.test(id))) {
    const chunkName = joinPkgNames(chunk.moduleIds);
    if (chunkName.length > 30) {
      return `${chunk.name}+[...].mjs`;
    }
    return `_libs/${chunkName || "_"}.mjs`;
  }

  // _ chunks are preserved (should be after library normalization)
  if (chunk.name.startsWith("_")) {
    return `${chunk.name}.mjs`;
  }

  // No moduleIds
  if (chunk.moduleIds.length === 0) {
    return `_chunks/${chunk.name}.mjs`;
  }

  const ids = chunk.moduleIds.filter((id) => !virtualRe.test(id));

  // All virtual
  if (ids.length === 0) {
    if (chunk.moduleIds.every((id) => id.includes("virtual:raw"))) {
      return `_raw/[name].mjs`;
    }
    return `_virtual/[name].mjs`;
  }

  // WASM chunk
  if (ids.every((id) => id.endsWith(".wasm"))) {
    return `_wasm/[name].mjs`;
  }

  return `_chunks/[name].mjs`;
}

function joinPkgNames(moduleIds: string[]): string {
  const names = [
    ...new Set(
      moduleIds
        .map((id) => pathToPkgName(id))
        .filter(Boolean)
        // eslint-disable-next-line e18e/prefer-static-regex
        .map((name) => name!.replace(/^@/, "").replace(/[/\\]/g, "__")),
    ),
  ].toSorted();
  return names.join("+");
}

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
