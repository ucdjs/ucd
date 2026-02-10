import type {
  ArtifactDefinition,
  FileContext,
  ParsedRow,
  PipelineDependency,
  PipelineFilter,
  PipelineRouteDefinition,
  RouteOutput,
  SourceBackend,
} from "../src";
import type { AnyPipelineTransformDefinition } from "../src/transform";
import type { ParserFn, PropertyJson } from "../src/types";
import { vi } from "vitest";
import { always, definePipelineRoute } from "../src";

export function createMockBackend(files: FileContext[]): SourceBackend {
  return {
    listFiles: vi.fn().mockResolvedValue(files),
    readFile: vi.fn().mockResolvedValue("file content"),
  };
}

export function createFile(overrides: Partial<FileContext> = {}): FileContext {
  return {
    version: "16.0.0",
    dir: "ucd",
    path: "ucd/LineBreak.txt",
    name: "LineBreak.txt",
    ext: ".txt",
    ...overrides,
  };
}

export async function* mockParser(): AsyncIterable<ParsedRow> {
  yield { sourceFile: "test.txt", kind: "point", codePoint: "0041", value: "A" };
}

export interface MockRouteOptions<
  TDepends extends readonly PipelineDependency[] = readonly PipelineDependency[],
  TEmits extends Record<string, ArtifactDefinition> = Record<string, never>,
  TTransforms extends readonly AnyPipelineTransformDefinition[] = readonly [],
  TOutput = PropertyJson[],
> {
  depends?: TDepends;
  emits?: TEmits;
  transforms?: TTransforms;
  out?: RouteOutput;
  cache?: boolean;
  filter?: PipelineFilter;
  parser?: ParserFn;
  resolver?: PipelineRouteDefinition<string, TDepends, TEmits, TTransforms, TOutput>["resolver"];
}

export function createMockRoute<
  const TId extends string,
  const TDepends extends readonly PipelineDependency[] = readonly [],
  const TEmits extends Record<string, ArtifactDefinition> = Record<string, never>,
  const TTransforms extends readonly AnyPipelineTransformDefinition[] = readonly [],
  TOutput = PropertyJson[],
>(
  id: TId,
  options: MockRouteOptions<TDepends, TEmits, TTransforms, TOutput> = {},
): PipelineRouteDefinition<TId, TDepends, TEmits, TTransforms, TOutput> {
  const {
    depends,
    emits,
    transforms,
    out,
    cache,
    filter = always(),
    parser = mockParser,
    resolver = (async () => []) as unknown as PipelineRouteDefinition<
      TId,
      TDepends,
      TEmits,
      TTransforms,
      TOutput
    >["resolver"],
  } = options;

  return definePipelineRoute({
    id,
    filter,
    parser,
    resolver,
    depends,
    emits,
    transforms,
    out,
    cache,
  });
}
