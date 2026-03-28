import type {
  FileContext,
  ParseContext,
  PipelineDefinition,
  PipelineLogger,
  PipelineOutputSourceDefinition,
  SourceBackend,
  SourceFileContext,
} from "@ucdjs/pipelines-core";
import type { PipelineExecutionRuntime } from "../runtime";
import type { PipelineExecutionResult } from "../types";
import { isPipelineOutputSource, resolveMultipleSourceFiles } from "@ucdjs/pipelines-core";
import { serializeOutputValue } from "@ucdjs/pipelines-core/outputs";
import { createPipelineLogger } from "../internal/logger";
import { basename, extname } from "./path-utils";

const LINE_SPLIT_RE = /\r?\n/;

export function isSourceFileContext(file: FileContext): file is SourceFileContext {
  if (!("source" in file)) return false;
  const { source } = file;
  return source != null && typeof source === "object" && "id" in source;
}

export interface SourceAdapter {
  listFiles: (version: string) => Promise<FileContext[]>;
  readFile: (file: FileContext) => Promise<string>;
}

interface CreateSourceAdapterOptions {
  priorResults?: PipelineExecutionResult[];
}

interface PublishedOutputFileEntry {
  file: SourceFileContext;
  content: string;
}

export function createSourceAdapter(
  pipeline: PipelineDefinition,
  logger: PipelineLogger,
  options: CreateSourceAdapterOptions = {},
): SourceAdapter {
  const backends = new Map<string, SourceBackend>();
  const publishedOutputFiles = new Map<string, PublishedOutputFileEntry[]>();

  for (const input of pipeline.inputs) {
    if (isPipelineOutputSource(input)) {
      publishedOutputFiles.set(input.id, buildPublishedOutputFiles(input, options.priorResults ?? []));
      continue;
    }

    backends.set(input.id, input.backend);
  }

  return {
    listFiles: async (version) => {
      const standardInputs = pipeline.inputs.filter((input) => !isPipelineOutputSource(input));
      const standardFiles = await resolveMultipleSourceFiles(standardInputs, version, { logger });

      const outputFiles = pipeline.inputs
        .filter(isPipelineOutputSource)
        .flatMap((input) =>
          (publishedOutputFiles.get(input.id) ?? [])
            .filter((entry) => entry.file.version === version)
            .map((entry) => entry.file)
            .filter((file) => {
              const ctx = { file, logger };
              if (input.includes && !input.includes(ctx)) return false;
              if (input.excludes && input.excludes(ctx)) return false;
              return true;
            }),
        );

      const filesByPath = new Map<string, FileContext>();
      for (const file of [...standardFiles, ...outputFiles]) {
        filesByPath.set(file.path, file);
      }

      return [...filesByPath.values()];
    },
    readFile: async (file) => {
      if (isSourceFileContext(file)) {
        const outputEntries = publishedOutputFiles.get(file.source.id);
        if (outputEntries) {
          const entry = outputEntries.find((candidate) => candidate.file.path === file.path);
          if (entry) {
            return entry.content;
          }
        }

        const backend = backends.get(file.source.id);
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

function buildPublishedOutputFiles(
  input: PipelineOutputSourceDefinition,
  priorResults: PipelineExecutionResult[],
): PublishedOutputFileEntry[] {
  const upstream = priorResults.find((result) => result.id === input.pipelineId);
  if (!upstream) {
    return [];
  }

  return upstream.outputManifest
    .filter((entry) => entry.status !== "failed")
    .filter((entry) => input.outputId == null || entry.outputId === input.outputId)
    .map((entry) => {
      const outputValue = upstream.data[entry.outputIndex];
      const content = serializeOutputValue(outputValue, entry.format);
      const locatorPath = entry.locator.startsWith("memory://")
        ? entry.locator.slice("memory://".length)
        : entry.locator;
      const name = basename(locatorPath) || `${entry.outputId}.${entry.format === "text" ? "txt" : "json"}`;
      const ext = extname(name) || (entry.format === "text" ? ".txt" : ".json");

      return {
        file: {
          version: entry.version,
          dir: "pipeline-output",
          path: `pipeline-output/${entry.pipelineId}/${entry.outputId}/${entry.outputIndex}/${name}`,
          name,
          ext,
          source: { id: input.id },
        },
        content,
      };
    });
}

export function createParseContext(
  file: FileContext,
  source: SourceAdapter,
  runtime: PipelineExecutionRuntime,
): ParseContext {
  let cachedContent: string | null = null;
  const logger = createPipelineLogger(runtime);

  return {
    file,
    logger,
    readContent: async () => {
      if (cachedContent === null) {
        cachedContent = await source.readFile(file);
      }
      return cachedContent;
    },
    async* readLines() {
      const content = await source.readFile(file);
      const lines = content.split(LINE_SPLIT_RE);
      for (const line of lines) {
        yield line;
      }
    },
    isComment: (line: string) => line.startsWith("#") || line.trim() === "",
  };
}
