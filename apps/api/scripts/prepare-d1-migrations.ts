import { glob, mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";

const appRoot = path.resolve(import.meta.dirname, "..");
const sourceDir = path.join(appRoot, "src/db/migrations");
const outputDir = path.join(appRoot, ".d1-migrations");

async function run() {
  await rm(outputDir, { force: true, recursive: true });
  await mkdir(outputDir, { recursive: true });

  for await (const entry of glob("**/*.sql", {
    cwd: sourceDir,
  })) {
    const sourcePath = path.join(sourceDir, entry);
    const migrationName = path.dirname(entry);
    const destPath = path.join(outputDir, `${migrationName}.sql`);

    await writeFile(destPath, await readFile(sourcePath));
  }

  console.log(`Prepared D1 migrations in ${outputDir}`);
}

run().catch((err) => {
  console.error("Error preparing D1 migrations:", err);
  // eslint-disable-next-line node/prefer-global/process
  process.exit(1);
});
