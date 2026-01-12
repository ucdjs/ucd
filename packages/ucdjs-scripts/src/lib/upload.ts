import type { UploadOptions, UploadResult } from "../types";
import { logger } from "./logger";

/**
 * Uploads manifests tar to the /setup endpoint.
 */
export async function uploadManifests(
  tar: Uint8Array,
  options: UploadOptions,
): Promise<UploadResult> {
  const { baseUrl, setupKey, dryRun = false } = options;

  const url = new URL("/setup", baseUrl);
  if (dryRun) {
    url.searchParams.set("dryRun", "true");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/x-tar",
  };

  if (setupKey) {
    headers["X-UCDJS-Setup-Key"] = setupKey;
  }

  logger.info(`Uploading manifests to ${url.toString()}...`);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: tar as unknown as BodyInit,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Upload failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const result = (await response.json()) as UploadResult;
  return result;
}
