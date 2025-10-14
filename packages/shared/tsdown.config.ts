import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";

const __UCD_ENDPOINT_DEFAULT_CONFIG__ = await fetch("https://api.ucdjs.dev/.well-known/ucd-config.json").then((res) => res.json()).catch(() => null);

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
  ],
  define: {
    __UCD_ENDPOINT_DEFAULT_CONFIG__: JSON.stringify(__UCD_ENDPOINT_DEFAULT_CONFIG__),
  },
});
