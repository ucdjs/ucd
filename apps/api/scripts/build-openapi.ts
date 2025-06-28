import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { getOpenAPI31Document } from "../src";
import { buildOpenApiConfig } from "../src/openapi";

const root = path.resolve(import.meta.dirname, "../");

async function run() {
  const obj = getOpenAPI31Document(buildOpenApiConfig("x.y.z", [
    {
      url: "https://api.ucdjs.dev",
      description: "Production Environment",
    },
  ]));

  if (!existsSync(path.join(root.toString(), "./.generated"))) {
    await mkdir(path.join(root.toString(), "./.generated"), { recursive: true });
  }

  await writeFile(path.join(root.toString(), "./.generated/openapi.json"), JSON.stringify(obj, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
