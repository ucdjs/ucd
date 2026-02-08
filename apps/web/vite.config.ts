import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import Inspect from "vite-plugin-inspect";
import viteTsConfigPaths from "vite-tsconfig-paths";

const config = defineConfig({
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
    Inspect(),
  ],
  // optimizeDeps: {
  //   // Force Vite to process shared-ui package to handle JSX in chunks
  //   include: ["@ucdjs-internal/shared-ui"],
  // },
  // ssr: {
  //   // Ensure shared-ui is bundled and processed by Vite instead of being external
  //   noExternal: ["@ucdjs-internal/shared-ui"],
  // },
});

export default config;
