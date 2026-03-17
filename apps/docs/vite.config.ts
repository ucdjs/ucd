import babel from "@rolldown/plugin-babel";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
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
    tanstackStart(),
    react(),
    babel({
      presets: [reactCompilerPreset()],
    }),
  ],
});

export default config;
