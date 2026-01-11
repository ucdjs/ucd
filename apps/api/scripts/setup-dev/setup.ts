import path from "node:path";
import { createTar } from "nanotar";
import { unstable_startWorker } from "wrangler";
import { buildManifest, fetchExpectedFilesForVersion } from "../lib/manifest";

const root = path.resolve(import.meta.dirname, "../..");

// Default versions to seed in local development
const DEV_VERSIONS = ["17.0.0", "16.0.0", "15.1.0", "15.0.0", "4.1.0", "4.0.0"];

async function run() {
  console.log("[setup]: starting local development setup...");
  console.log(`[setup]: seeding manifests for versions: ${DEV_VERSIONS.join(", ")}`);

  // Start the setup worker
  const worker = await unstable_startWorker({
    config: path.join(root, "./wrangler.jsonc"),
    entrypoint: path.join(root, "./scripts/setup-dev/setup-worker.ts"),
  });

  try {
    // Fetch manifests for all versions
    const tarFiles: { name: string; data: Uint8Array }[] = [];

    for (const version of DEV_VERSIONS) {
      console.log(`[setup]: fetching expected files for version ${version}...`);

      const expectedFiles = await fetchExpectedFilesForVersion(version);
      const manifest = buildManifest(expectedFiles);
      const manifestJson = JSON.stringify(manifest, null, 2);

      tarFiles.push({
        name: `${version}/manifest.json`,
        data: new TextEncoder().encode(manifestJson),
      });

      console.log(`[setup]: prepared manifest for ${version} (${expectedFiles.length} files)`);
    }

    // Create tar archive
    console.log("[setup]: creating tar archive...");
    const tarData = createTar(tarFiles);

    // Send to setup worker as raw body
    console.log("[setup]: uploading manifests to local R2...");
    const response = await worker.fetch("https://api.ucdjs.dev/setup", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-tar",
      },
      body: tarData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
    }

    const result = await response.json() as {
      success: boolean;
      uploaded: number;
      versions: { version: string; fileCount: number }[];
    };

    console.log("[setup]: upload complete!");
    console.log(`[setup]: uploaded ${result.uploaded} manifests:`);
    for (const v of result.versions) {
      console.log(`  - ${v.version}: ${v.fileCount} expected files`);
    }
  } finally {
    await worker.dispose();
    console.log("[setup]: setup worker disposed");
  }
}

run().catch((error) => {
  console.error("[setup]: fatal error:", error);
  // eslint-disable-next-line node/prefer-global/process
  process.exit(1);
});
