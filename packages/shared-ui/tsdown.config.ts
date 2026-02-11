import pluginBabel from "@rollup/plugin-babel";
import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
    "./src/lib/*.ts",
    "./src/hooks/index.ts",
    "./src/ui/*.tsx",
    "./src/components/*.tsx",
  ],
  exports: {
    customExports(exports) {
      exports["./styles.css"] = "./dist/styles/globals.css";
      exports["./package.json"] = "./package.json";

      return exports;
    },
    packageJson: false,
  },
  copy: [
    {
      from: "src/styles/globals.css",
      to: "dist/styles",
    },
    {
      from: "src/styles/shadcn-vendored.css",
      to: "dist/styles",
    },
  ],
  format: "esm",
  inputOptions: {
    transform: {
      jsx: "react-jsx",
    },
    experimental: {
      lazyBarrel: true,
    },
  },
  unbundle: true,
  plugins: [
    pluginBabel({
      babelHelpers: "bundled",
      parserOpts: {
        sourceType: "module",
        plugins: ["jsx", "typescript"],
      },
      plugins: ["babel-plugin-react-compiler"],
      extensions: [".js", ".jsx", ".ts", ".tsx"],
    }),
  ],
});
