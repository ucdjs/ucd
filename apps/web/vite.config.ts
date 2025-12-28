import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import mdx from "fumadocs-mdx/vite";
import { nitro } from "nitro/vite";
import { defineConfig } from "vite";
import viteTsConfigPaths from "vite-tsconfig-paths";
import * as MdxConfig from "./source.config";

const config = defineConfig({
  plugins: [
    devtools(),
    mdx(MdxConfig),
    nitro({
      preset: "cloudflare_module",
      cloudflare: {
        // This is false because we can't use CF environments
        // in redirected configs which is what this will use.
        deployConfig: false,
        nodeCompat: true,
      },
    }),
    viteTsConfigPaths({
      projects: ["./tsconfig.json"],
    }),
    tailwindcss(),
    tanstackStart({
      srcDirectory: "src",
      prerender: {
        enabled: false, // We can't enable prerendering until Nitro fixes their preview server.
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
