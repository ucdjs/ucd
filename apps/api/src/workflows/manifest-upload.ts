import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import {
  clearCacheEntry,
  getApiOriginForEnvironment,
  MAX_TAR_SIZE_BYTES,
} from "@ucdjs-internal/worker-utils";
import { UNICODE_STABLE_VERSION } from "@unicode-utils/core";
import { WorkflowEntrypoint } from "cloudflare:workers";
import { parseTar } from "nanotar";
import {
  V1_VERSIONS_DETAIL_CACHE_NAME,
  V1_VERSIONS_MANIFEST_CACHE_NAME,
  V1_VERSIONS_ROUTER_BASE_PATH,
  WELL_KNOWN_ROUTER_BASE_PATH,
  WELL_KNOWN_UCD_STORE_VERSION_CACHE_NAME,
} from "../constants";

const LEADING_DOT_SLASH_RE = /^\.\//;

interface ManifestUploadParams {
  version: string;
  r2Key: string;
}

export class ManifestUploadWorkflow extends WorkflowEntrypoint<Env, ManifestUploadParams> {
  async run(event: WorkflowEvent<ManifestUploadParams>, step: WorkflowStep) {
    const { version, r2Key } = event.payload;
    const startTime = Date.now();

    const files = await step.do("extract-tar", async () => {
      const tarObject = await this.env.UCD_BUCKET.get(r2Key);
      if (!tarObject) {
        throw new Error(`TAR file not found for key ${r2Key}`);
      }

      if (tarObject.size > MAX_TAR_SIZE_BYTES) {
        throw new Error(
          `TAR file size (${Math.round(tarObject.size / 1024 / 1024)}MB) exceeds maximum of 10MB`,
        );
      }

      const arrayBuffer = await tarObject.arrayBuffer();
      const parsed = parseTar(arrayBuffer);

      // Filter and transform files
      const fileEntries: {
        name: string;
        data: ArrayBuffer;
      }[] = [];
      for (const file of parsed) {
        if (!file.data) continue;

        const fileName = file.name.replace(LEADING_DOT_SLASH_RE, "");
        if (!fileName) continue;

        // Convert data to ArrayBuffer if needed
        const fileData = file.data instanceof ArrayBuffer
          ? file.data
          : (file.data.buffer.slice(file.data.byteOffset, file.data.byteOffset + file.data.byteLength) as ArrayBuffer);

        fileEntries.push({
          name: fileName,
          data: fileData,
        });
      }

      if (fileEntries.length === 0) {
        throw new Error("No valid files found in TAR archive");
      }

      // eslint-disable-next-line no-console
      console.log(`[manifest-upload]: Extracted ${fileEntries.length} files from TAR for version ${version}`);
      return fileEntries;
    });

    await step.do("upload-files", {
      retries: {
        limit: 3,
        delay: 5000,
        backoff: "exponential",
      },
      timeout: "5 minutes",
    }, async () => {
      const bucket = this.env.UCD_BUCKET;
      const BATCH_SIZE = 20;

      // eslint-disable-next-line no-console
      console.info(`[manifest-upload]: Starting upload of ${files.length} files for version ${version} in batches of ${BATCH_SIZE}`);
      // Process in parallel batches for faster uploads
      for (let i = 0; i < files.length; i += BATCH_SIZE) {
        const batch = files.slice(i, i + BATCH_SIZE);
        await Promise.all(batch.map(async (file) => {
          const storagePath = `manifest/${version}/${file.name}`;

          try {
            await bucket.put(storagePath, file.data, {
              httpMetadata: { contentType: "application/json" },
            });

            // eslint-disable-next-line no-console
            console.info(`[manifest-upload]: Uploaded ${storagePath}`);
          } catch (err) {
            console.error(`[manifest-upload]: Failed to upload ${storagePath}:`, err);
            throw new Error(`Failed to upload ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
          }
        }));
      }
    });

    await step.do("validate-upload", async () => {
      const bucket = this.env.UCD_BUCKET;
      const checkPromises = files.map(async (file) => {
        const obj = await bucket.head(`manifest/${version}/${file.name}`);
        return { name: file.name, exists: obj !== null };
      });

      const checks = await Promise.all(checkPromises);
      const missing = checks.filter((c) => !c.exists);

      if (missing.length > 0) {
        const missingNames = missing.map((m) => m.name).join(", ");
        throw new Error(`Validation failed: ${missing.length} files missing (${missingNames})`);
      }

      // eslint-disable-next-line no-console
      console.log(`[manifest-upload]: Validated ${files.length} files in R2 for version ${version}`);

      return { validated: true, fileCount: files.length };
    });

    await step.do("purge-caches", async () => {
      const origin = getApiOriginForEnvironment(this.env.ENVIRONMENT);
      const purgeTargets = [
        {
          cacheName: V1_VERSIONS_DETAIL_CACHE_NAME,
          path: `${V1_VERSIONS_ROUTER_BASE_PATH}/${version}`,
        },
        {
          cacheName: V1_VERSIONS_MANIFEST_CACHE_NAME,
          path: `${V1_VERSIONS_ROUTER_BASE_PATH}/${version}/manifest`,
        },
        {
          cacheName: WELL_KNOWN_UCD_STORE_VERSION_CACHE_NAME,
          path: `${WELL_KNOWN_ROUTER_BASE_PATH}/ucd-store/${version}.json`,
        },
      ];

      if (version === UNICODE_STABLE_VERSION) {
        purgeTargets.push({
          cacheName: V1_VERSIONS_DETAIL_CACHE_NAME,
          path: `${V1_VERSIONS_ROUTER_BASE_PATH}/latest`,
        });
      }

      const purgePromises = purgeTargets.map(async ({ cacheName, path }) => {
        try {
          const clearCache = await clearCacheEntry(cacheName);
          await clearCache(`${origin}${path}`);
          // eslint-disable-next-line no-console
          console.log(`[manifest-upload]: Purged ${cacheName} cache for ${path}`);
        } catch (err) {
          // Log but don't fail if cache purge fails
          console.warn(`[manifest-upload]: Failed to purge ${cacheName} cache for ${path}:`, err);
        }
      });

      await Promise.all(purgePromises);
    });

    await step.do("cleanup-tar", async () => {
      await this.env.UCD_BUCKET.delete(r2Key);
    });

    const duration = Date.now() - startTime;

    // eslint-disable-next-line no-console
    console.log(
      `[manifest-upload]: Completed upload for version ${version} - ${files.length} files in ${duration}ms`,
    );

    return {
      success: true,
      version,
      filesUploaded: files.length,
      duration,
      workflowId: event.instanceId,
    };
  }
}
