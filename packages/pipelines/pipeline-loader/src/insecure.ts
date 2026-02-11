import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import type { LoadedPipelineFile } from "./types";
import path from "node:path";
import { isPipelineDefinition } from "@ucdjs/pipelines-core";
import { bundleRemoteModule, createDataUrl, identifierForLocalFile } from "./remote/bundler";

/**
 * Options for loading a pipeline module from raw source content.
 */
export interface LoadPipelineFromContentOptions {
  identifier?: string;
  customFetch?: typeof fetch;
}

/**
 * Load pipeline definitions from module source content.
 */
export async function loadPipelineFromContent(
  content: string,
  filename: string,
  options: LoadPipelineFromContentOptions = {},
): Promise<LoadedPipelineFile> {
  const identifier = options.identifier ?? identifierForLocalFile(path.resolve(filename));
  const bundle = await bundleRemoteModule({
    content,
    identifier,
    customFetch: options.customFetch,
  });

  const dataUrl = createDataUrl(bundle);
  const module = await import(/* @vite-ignore */ dataUrl);

  const pipelines: PipelineDefinition[] = [];
  const exportNames: string[] = [];

  const exportedModule = module as Record<string, unknown>;

  for (const [name, value] of Object.entries(exportedModule)) {
    if (name === "default") {
      continue;
    }

    if (isPipelineDefinition(value)) {
      pipelines.push(value);
      exportNames.push(name);
    }
  }

  return {
    filePath: filename,
    pipelines,
    exportNames,
  };
}
