import type { PipelineSource } from "@ucdjs/pipelines-loader";
import type { LoadedFile } from "./lookup";
import { sourceLabel } from "./lookup";

/**
 * Build the source metadata object for API responses.
 */
export function sourceInfo(source: PipelineSource) {
  return { id: source.id, type: source.type, label: sourceLabel(source) };
}

/**
 * Build the file metadata object for API responses.
 */
export function fileInfo(file: LoadedFile) {
  return { id: file.id, path: file.relativePath, label: file.label };
}
