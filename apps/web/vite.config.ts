import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
  ssr: {
    // lru_map is a CJS module that @pierre/diffs imports with named exports.
    // We need to bundle both lru_map and @pierre/diffs so Vite handles CJS->ESM conversion.
    noExternal: ["lru_map", "@pierre/diffs"],
  },
  optimizeDeps: {
    // Ensure lru_map is pre-bundled for client-side as well
    include: ["lru_map"],
  },
  define: {
    // lru_map uses `self` in its UMD wrapper which doesn't exist in Node.js SSR context
    self: "globalThis",
  },
  plugins: [
    devtools(),
    nitro({
      preset: "cloudflare_module",
      cloudflare: {
        // This is false because we can't use CF environments
        // in redirected configs which is what this will use.
        deployConfig: false,
        nodeCompat: true,
      },
      // Bundle lru_map and @pierre/diffs to handle CJS->ESM interop
      externals: {
        inline: ["lru_map", "@pierre/diffs"],
      },
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src",
      prerender: {
        enabled: false, // We can't enable prerendering until Nitro fixes their preview server.
      },
      server: {
        entry: "server.ts",
      },
    }),
    viteReact({
      babel: {
        plugins: ["babel-plugin-react-compiler"],
      },
    }),
  ],
});

export default config;
