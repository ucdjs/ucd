import type {
  FileContext,
  ParseContext,
  PipelineDefinition,
  SourceBackend,
  SourceFileContext,
} from "@ucdjs/pipelines-core";
import { resolveMultipleSourceFiles } from "@ucdjs/pipelines-core";

export interface SourceAdapter {
  listFiles: (version: string) => Promise<FileContext[]>;
  readFile: (file: FileContext) => Promise<string>;
}

export function createSourceAdapter(pipeline: PipelineDefinition): SourceAdapter {
  if (pipeline.inputs.length === 0) {
    throw new Error("Pipeline requires at least one input source");
  }

  const backends = new Map<string, SourceBackend>();
  for (const input of pipeline.inputs) {
    backends.set(input.id, input.backend);
  }

  return {
    listFiles: async (version) => resolveMultipleSourceFiles(pipeline.inputs, version),
    readFile: async (file) => {
      const sourceFile = file as SourceFileContext;
      if ("source" in sourceFile && sourceFile.source) {
        const backend = backends.get(sourceFile.source.id);
        if (backend) {
          return backend.readFile(file);
        }
      }

      const firstBackend = backends.values().next().value;
      if (firstBackend) {
        return firstBackend.readFile(file);
      }

      throw new Error(`No backend found for file: ${file.path}`);
    },
  };
}

export function createParseContext(file: FileContext, source: SourceAdapter): ParseContext {
  let cachedContent: string | null = null;

  return {
    file,
    readContent: async () => {
      if (cachedContent === null) {
        cachedContent = await source.readFile(file);
      }
      return cachedContent;
    },
    async* readLines() {
      const content = await source.readFile(file);
      const lines = content.split(/\r?\n/);
      for (const line of lines) {
        yield line;
      }
    },
    isComment: (line: string) => line.startsWith("#") || line.trim() === "",
  };
}
