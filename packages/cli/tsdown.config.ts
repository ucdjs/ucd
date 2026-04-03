import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

function getCommandChunkPath(facadeModuleId?: string): string | undefined {
  const relativePath = facadeModuleId
    ?.replaceAll("\\", "/")
    // eslint-disable-next-line e18e/prefer-static-regex
    .match(/\/src\/cmd\/(.+)\.[cm]?[jt]s$/)?.[1];

  return relativePath ? `commands/${relativePath}-[hash].mjs` : undefined;
}

export default createTsdownConfig({
  entry: ["./src/cli.ts"],
  dts: false,
  deps: {
    alwaysBundle: (id) => {
      if (id.startsWith("node:")) {
        return false;
      }

      // Keep the pipeline UI server external for now because it serves
      // its own built client assets from its package layout at runtime.
      if (id === "@ucdjs/pipeline-server") {
        return false;
      }

      return true;
    },
  },
  outputOptions: {
    entryFileNames: (chunkInfo) => {
      if (chunkInfo.name === "cli.d") {
        return "[name].mts";
      }

      if (chunkInfo.name === "cli") {
        return "[name].mjs";
      }

      return getCommandChunkPath(chunkInfo.facadeModuleId) ?? "commands/[name]-[hash].mjs";
    },
    chunkFileNames: (chunkInfo) => getCommandChunkPath(chunkInfo.facadeModuleId) ?? "libs/[name]-[hash].mjs",
    assetFileNames: "libs/[name]-[hash][extname]",
  },
});
