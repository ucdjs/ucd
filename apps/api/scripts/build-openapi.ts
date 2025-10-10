import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { buildOpenApiConfig } from "../src/openapi";
import { getOpenAPI31Document } from "../src/worker";

const root = path.resolve(import.meta.dirname, "../../../");

async function run() {
  const obj = getOpenAPI31Document(buildOpenApiConfig("x.y.z", [
    {
      url: "https://api.ucdjs.dev",
      description: "Production Environment",
    },
  ]));

  const outputPath = path.join(root, "ucd-generated/api");
  if (!existsSync(outputPath)) {
    await mkdir(outputPath, { recursive: true });
  }

  await writeFile(path.join(outputPath, "openapi.json"), JSON.stringify(obj, null, 2));
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
