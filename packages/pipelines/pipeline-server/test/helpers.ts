import { fileURLToPath } from "node:url";
import { createApp } from "../src/server/app";
import { createDatabase, runMigrations } from "../src/server/db";

const playgroundPath = fileURLToPath(new URL("../../pipeline-playground/src", import.meta.url));

export async function createTestApp() {
  const db = createDatabase({ url: "file::memory:" });
  await runMigrations(db);

  const app = createApp({
    sources: [{
      type: "local",
      id: "local",
      cwd: playgroundPath,
    }],
    db,
  });

  return { app, storePath: playgroundPath };
}

export async function createTestExecution(app: { fetch: (request: Request) => Promise<Response> }) {
  const execRes = await app.fetch(new Request("/api/pipelines/simple/simple/execute", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ versions: ["16.0.0"] }),
  }));

  const execData = await execRes.json();
  if (!execData.executionId) {
    throw new Error("Execution failed to start");
  }

  return execData.executionId as string;
}
