import type { WorkflowEvent, WorkflowStep } from "cloudflare:workers";
import { WorkflowEntrypoint } from "cloudflare:workers";

// Maximum TAR file size (50MB)
const MAX_TAR_SIZE_BYTES = 50 * 1024 * 1024;

interface ManifestUploadParams {
  version: string;
  tarData: string; // base64 encoded
  contentType: "application/x-tar" | "application/gzip";
}

interface FileEntry {
  name: string;
  data: ArrayBuffer;
}

interface UploadResult {
  name: string;
  success: boolean;
}

interface WorkflowOutput {
  success: boolean;
  version: string;
  filesUploaded: number;
  duration: number;
  workflowId: string;
}

export class ManifestUploadWorkflow extends WorkflowEntrypoint<Env, ManifestUploadParams> {
  async run(event: WorkflowEvent<ManifestUploadParams>, step: WorkflowStep): Promise<WorkflowOutput> {
    const { version, tarData: tarDataBase64 } = event.payload;
    const startTime = Date.now();

    // Step 1: Extract and validate TAR
    const files = await step.do("extract-tar", async () => {
      // Validate size limit
      const decodedLength = (tarDataBase64.length * 3) / 4;
      if (decodedLength > MAX_TAR_SIZE_BYTES) {
        throw new Error(
          `TAR file size (${Math.round(decodedLength / 1024 / 1024)}MB) exceeds maximum of 50MB`,
        );
      }

      // Decode base64 to binary
      const binaryString = atob(tarDataBase64);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Parse tar using nanotar
      const { parseTar } = await import("nanotar");
      // Create a proper ArrayBuffer from Uint8Array
      const arrayBuffer = bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
      const parsed = parseTar(arrayBuffer);

      // Filter and transform files
      const fileEntries: FileEntry[] = [];
      for (const file of parsed) {
        if (!file.data) continue;

        const fileName = file.name.replace(/^\.\//, "");
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

    // Step 2: Upload files in parallel batches
    const _uploadResults = await step.do(
      "upload-files",
      {
        retries: { limit: 3, delay: 5000, backoff: "exponential" },
        timeout: "5 minutes",
      },
      async () => {
        const bucket = this.env.UCD_BUCKET;
        const results: UploadResult[] = [];
        const BATCH_SIZE = 10;

        // Process in batches for parallelization
        for (let i = 0; i < files.length; i += BATCH_SIZE) {
          const batch = files.slice(i, i + BATCH_SIZE);
          const batchPromises = batch.map(async (file) => {
            const storagePath = `manifest/${version}/${file.name}`;

            try {
              await bucket.put(storagePath, file.data, {
                httpMetadata: { contentType: "application/json" },
              });

              // eslint-disable-next-line no-console
              console.log(`[manifest-upload]: Uploaded ${storagePath}`);
              return { name: file.name, success: true };
            } catch (error) {
              console.error(`[manifest-upload]: Failed to upload ${storagePath}:`, error);
              throw new Error(`Failed to upload ${file.name}: ${error instanceof Error ? error.message : String(error)}`);
            }
          });

          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults);
        }

        return results;
      },
    );

    // Step 3: Validate completeness
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

    // Step 4: Purge affected caches
    await step.do("purge-caches", async () => {
      const cacheNames = ["v1_versions", "v1_files", "ucd_store"];

      // Determine API origin based on environment
      let origin: string;
      if (this.env.ENVIRONMENT === "production") {
        origin = "https://api.ucdjs.dev";
      } else if (this.env.ENVIRONMENT === "preview") {
        origin = "https://preview.api.ucdjs.dev";
      } else {
        origin = "http://localhost:8787";
      }

      const purgePromises = cacheNames.map(async (name) => {
        try {
          const cache = await caches.open(name);
          // Purge version-specific paths
          await cache.delete(new Request(`${origin}/api/v1/versions/${version}`));
          await cache.delete(new Request(`${origin}/api/v1/files/${version}`));
          // eslint-disable-next-line no-console
          console.log(`[manifest-upload]: Purged ${name} cache for version ${version}`);
        } catch (error) {
          // Log but don't fail if cache purge fails
          console.warn(`[manifest-upload]: Failed to purge ${name} cache:`, error);
        }
      });

      await Promise.all(purgePromises);
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
