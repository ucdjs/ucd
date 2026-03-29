import type { UCDStoreManifest } from "@ucdjs/schemas";

const STORE_MANIFEST_PREFIX = "manifest/";

export function getVersionManifestStorageKey(version: string): string {
  return `${STORE_MANIFEST_PREFIX}${version}/manifest.json`;
}

export async function readVersionManifestObject(
  bucket: R2Bucket,
  version: string,
): Promise<R2ObjectBody | null> {
  return bucket.get(getVersionManifestStorageKey(version));
}

export async function parseVersionManifest(
  object: R2ObjectBody,
): Promise<UCDStoreManifest[string]> {
  return object.json<UCDStoreManifest[string]>();
}

export function createVersionManifestHeaders(object: R2ObjectBody): Record<string, string> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=UTF-8",
  };

  if (object.httpEtag || object.etag) {
    headers.ETag = object.httpEtag ?? `"${object.etag}"`;
  }

  if (object.uploaded) {
    headers["Last-Modified"] = object.uploaded.toUTCString();
  }

  return headers;
}
