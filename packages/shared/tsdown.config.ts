import { createTsdownConfig } from "@ucdjs-tooling/tsdown-config";
import { replacePlugin } from "rolldown/plugins";

const __UCD_ENDPOINT_DEFAULT_CONFIG__ = await fetch("https://api.ucdjs.dev/.well-known/ucd-config.json").then((res) => {
  if (!res.ok) {
    return null;
  }

  return res.json();
}).catch(() => null);

if (!__UCD_ENDPOINT_DEFAULT_CONFIG__) {
  console.error("");
  console.error("\x1B[43m\x1B[30m  WARNING  \x1B[0m Failed to fetch default UCD endpoint config during build. Using hardcoded defaults.");
  console.error("");
}

export default createTsdownConfig({
  entry: [
    "./src/index.ts",
  ],
  plugins: [
    replacePlugin({
      "globalThis.__UCD_ENDPOINT_DEFAULT_CONFIG__": JSON.stringify(__UCD_ENDPOINT_DEFAULT_CONFIG__),
    }),
  ],
});
