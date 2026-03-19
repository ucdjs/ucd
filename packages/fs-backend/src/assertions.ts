import type { FileSystemBackend, FileSystemBackendFeature } from "./types";
import { createDebugger } from "@ucdjs-internal/shared";
import { BackendUnsupportedOperation } from "./errors";

const debug = createDebugger("ucdjs:fs-backend:assertions");

export function assertFeature<T extends FileSystemBackendFeature = never>(
  backend: FileSystemBackend,
  featureOrFeatures: T | T[],
): void {
  const features = Array.isArray(featureOrFeatures)
    ? featureOrFeatures
    : [featureOrFeatures];

  for (const feature of features) {
    if (!backend.features.has(feature)) {
      debug?.("Backend feature check failed", { feature });
      throw new BackendUnsupportedOperation(feature);
    }
  }
}
