import type { PipelineDefinition } from "@ucdjs/pipelines-core";
import type { LoadedPipelineFile } from "./types";
import { isPipelineDefinition } from "@ucdjs/pipelines-core";
import { transform } from "oxc-transform";

export async function loadPipelineFromContent(
  content: string,
  filename: string,
): Promise<LoadedPipelineFile> {
  const result = await transform(filename, content, { sourceType: "module" });
  const jsCode = result.code;

  const module = { exports: {} };
  const exports = module.exports;

  const sandbox = {
    module,
    exports,
    require,
    __filename: filename,
    __dirname: filename.split("/").slice(0, -1).join("/"),
  };

  // eslint-disable-next-line no-new-func
  const fn = new Function(
    "module",
    "exports",
    "require",
    "__filename",
    "__dirname",
    jsCode,
  );

  fn.call(module.exports, module, module.exports, require, filename, sandbox.__dirname);

  const pipelines: PipelineDefinition[] = [];
  const exportNames: string[] = [];

  const exportedModule = module.exports as Record<string, unknown>;

  for (const [name, value] of Object.entries(exportedModule)) {
    if (isPipelineDefinition(value)) {
      pipelines.push(value);
      exportNames.push(name);
    }
  }

  if (isPipelineDefinition(module.exports)) {
    pipelines.push(module.exports);
    exportNames.push("default");
  }

  return {
    filePath: filename,
    pipelines,
    exportNames,
  };
}
