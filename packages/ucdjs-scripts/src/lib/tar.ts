import { createTar } from "nanotar";
import type { GeneratedManifest } from "./manifest";

/**
 * Creates a tar archive from generated manifests.
 * Format: {version}/manifest.json
 */
export function createManifestsTar(manifests: GeneratedManifest[]): Uint8Array {
  const tarFiles = manifests.map((m) => ({
    name: `${m.version}/manifest.json`,
    data: new TextEncoder().encode(JSON.stringify(m.manifest, null, 2)),
  }));

  return createTar(tarFiles);
}
