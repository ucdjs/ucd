import type { UCDStoreVersionManifest } from "@ucdjs/schemas";

const STORE_MANIFEST_PREFIX = "manifest/";
const SNAPSHOT_SEPARATOR = "\n--snapshot--\n";
const MANIFEST_BUNDLE_ETAG_HEADER = "X-UCD-Manifest-Bundle-Etag";
const textEncoder = new TextEncoder();

export function getVersionManifestStorageKey(version: string): string {
  return `${STORE_MANIFEST_PREFIX}${version}/manifest.json`;
}

export function getVersionSnapshotStorageKey(version: string): string {
  return `${STORE_MANIFEST_PREFIX}${version}/snapshot.json`;
}

export async function readVersionManifestObject(
  bucket: R2Bucket,
  version: string,
): Promise<R2ObjectBody | null> {
  return bucket.get(getVersionManifestStorageKey(version));
}

async function readObjectText(object: Pick<R2ObjectBody, "json"> & {
  text?: () => Promise<string>;
}): Promise<string> {
  if (typeof object.text === "function") {
    return object.text();
  }

  return JSON.stringify(await object.json());
}

function uint8ArrayToHex(bytes: Uint8Array): string {
  let result = "";

  for (let i = 0; i < bytes.length; i++) {
    result += bytes[i]!.toString(16).padStart(2, "0");
  }

  return result;
}

async function createBundleEtag(manifestText: string, snapshotText: string): Promise<string> {
  const payload = textEncoder.encode(`${manifestText}${SNAPSHOT_SEPARATOR}${snapshotText}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", payload);
  return `"${uint8ArrayToHex(new Uint8Array(hashBuffer))}"`;
}

export async function readVersionManifestData(
  object: Pick<R2ObjectBody, "json"> & { text?: () => Promise<string> },
): Promise<{ data: UCDStoreVersionManifest; manifestText: string }> {
  const manifestText = await readObjectText(object);
  return {
    data: JSON.parse(manifestText) as UCDStoreVersionManifest,
    manifestText,
  };
}

export async function createVersionManifestHeaders(
  bucket: R2Bucket,
  version: string,
  object: R2ObjectBody,
  manifestText?: string,
): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json; charset=UTF-8",
  };

  if (object.httpEtag || object.etag) {
    headers.ETag = object.httpEtag ?? `"${object.etag}"`;
  }

  if (object.uploaded) {
    headers["Last-Modified"] = object.uploaded.toUTCString();
  }

  if (manifestText) {
    const snapshotObject = await bucket.get(getVersionSnapshotStorageKey(version));
    if (snapshotObject) {
      const snapshotText = await readObjectText(snapshotObject);
      headers[MANIFEST_BUNDLE_ETAG_HEADER] = await createBundleEtag(manifestText, snapshotText);
    }
  }

  return headers;
}
