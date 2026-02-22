import { fileURLToPath } from "node:url";
import { sentryTanstackStart } from "@sentry/tanstackstart-react";
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
      minify: true,
      wasm: false,
    }),
    // this is the plugin that enables path aliases
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src",
      prerender: {
        enabled: false, // We can't enable prerendering until Nitro fixes their preview server soonTM.
        filter({ path }) {
          return !path.startsWith("/file-explorer");
        },
      },
      importProtection: {
        enabled: true,
        behavior: {
          dev: "mock",
          build: "error",
        },
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
    Inspect({
      build: true,
    }),
    sentryTanstackStart({
      org: "ucdjs",
      project: "web",
      // eslint-disable-next-line node/prefer-global/process
      authToken: process.env.SENTRY_AUTH_TOKEN,
    }),
  ],
  build: {
    rolldownOptions: {
      experimental: {
        lazyBarrel: true,
      },
    },
    minify: false,
  },
  resolve: {
    alias: [
      {
        find: /^use-sync-external-store\/shim$/,
        replacement: fileURLToPath(new URL("./shims/use-sync-external-store-shim.ts", import.meta.url)),
      },
      {
        find: /^use-sync-external-store\/shim\/index\.js$/,
        replacement: fileURLToPath(new URL("./shims/use-sync-external-store-shim.ts", import.meta.url)),
      },
      {
        find: /^use-sync-external-store\/shim\/with-selector$/,
        replacement: fileURLToPath(new URL("./shims/use-sync-external-store-shim.ts", import.meta.url)),
      },
      {
        find: /^use-sync-external-store\/shim\/with-selector\.js$/,
        replacement: fileURLToPath(new URL("./shims/use-sync-external-store-shim.ts", import.meta.url)),
      },
    ],
  },
});

export default config;
