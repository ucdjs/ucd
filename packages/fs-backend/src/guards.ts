import type { FileSystemBackend, FileSystemBackendFeature } from "./types";
import { createDebugger } from "@ucdjs-internal/shared";
import { kHttpBackendSymbol } from "./backends/http";

const debug = createDebugger("ucdjs:fs-backend:guards");

export function hasFeature<T extends FileSystemBackendFeature = never>(
  backend: FileSystemBackend,
  featureOrFeatures: T | T[],
): boolean {
  const features = Array.isArray(featureOrFeatures)
    ? featureOrFeatures
    : [featureOrFeatures];

  for (const feature of features) {
    if (!backend.features.has(feature)) {
      debug?.("Backend feature check failed", { feature });
      return false;
    }
  }

  return true;
}

export function isHttpBackend(backend: FileSystemBackend): boolean {
  return kHttpBackendSymbol in backend && (backend as Record<symbol, unknown>)[kHttpBackendSymbol] === true;
}
