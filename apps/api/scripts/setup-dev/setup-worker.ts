/// <reference path="../../wrangler-types.d.ts" />

import type { ExpectedFile } from "@ucdjs/schemas";
import { Hono } from "hono";
import { parseTar } from "nanotar";

interface SetupWorkerEnv {
  UCD_BUCKET: R2Bucket;
}

const app = new Hono<{ Bindings: SetupWorkerEnv }>();

app.post("/setup", async (c) => {
  const bucket = c.env.UCD_BUCKET;

  if (!bucket) {
    return c.json({ error: "UCD_BUCKET binding not configured" }, 500);
  }

  console.log("[setup]: received setup request");

  try {
    // Read raw tar data from request body
    const tarData = await c.req.arrayBuffer();

    if (!tarData || tarData.byteLength === 0) {
      return c.json({ error: "No data uploaded" }, 400);
    }

    console.log(`[setup]: received ${tarData.byteLength} bytes`);

    const files = parseTar(tarData);
    const results: { version: string; fileCount: number }[] = [];

    for (const entry of files) {
      if (entry.type !== "file" || !entry.data) {
        continue;
      }

      // Expected format: {version}/manifest.json
      const match = entry.name.match(/^(\d+\.\d+\.\d+)\/manifest\.json$/);
      if (!match) {
        console.log(`[setup]: skipping ${entry.name} (not a manifest file)`);
        continue;
      }

      const version = match[1];
      const storagePath = `manifest/${version}/manifest.json`;

      // Parse to verify it's valid JSON with ExpectedFile[] structure
      const manifestText = new TextDecoder().decode(entry.data);
      const manifest = JSON.parse(manifestText) as { expectedFiles: ExpectedFile[] };

      if (!Array.isArray(manifest.expectedFiles)) {
        console.error(`[setup]: invalid manifest format for ${version}`);
        continue;
      }

      await bucket.put(storagePath, entry.data, {
        httpMetadata: {
          contentType: "application/json",
        },
      });

      console.log(`[setup]: uploaded ${storagePath} (${manifest.expectedFiles.length} files)`);
      results.push({ version, fileCount: manifest.expectedFiles.length });
    }

    return c.json({
      success: true,
      uploaded: results.length,
      versions: results,
    });
  } catch (error) {
    console.error("[setup]: failed to process upload:", error);
    return c.json({
      error: "Failed to process upload",
      details: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

console.log("[setup-worker]: started the manifest setup worker");

export default app;
