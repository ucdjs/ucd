import type { ParseContext, ParsedRow, PipelineFilter } from "@ucdjs/pipelines-core";

export interface ArtifactBuildContext {
  version: string;
}

export interface PipelineArtifactDefinition<
  TId extends string = string,
  TValue = unknown,
> {
  id: TId;
  filter?: PipelineFilter;
  parser?: (ctx: ParseContext) => AsyncIterable<ParsedRow>;
  build: (ctx: ArtifactBuildContext, rows?: AsyncIterable<ParsedRow>) => Promise<TValue>;
}

export function definePipelineArtifact<
  const TId extends string,
  TValue,
>(
  definition: PipelineArtifactDefinition<TId, TValue>,
): PipelineArtifactDefinition<TId, TValue> {
  return definition;
}

export type InferArtifactId<T> = T extends PipelineArtifactDefinition<infer TId, unknown> ? TId : never;
export type InferArtifactValue<T> = T extends PipelineArtifactDefinition<string, infer TValue> ? TValue : never;

export type InferArtifactsMap<T extends readonly PipelineArtifactDefinition[]> = {
  [K in T[number] as InferArtifactId<K>]: InferArtifactValue<K>;
};

export function isPipelineArtifactDefinition(value: unknown): value is PipelineArtifactDefinition {
  return (
    typeof value === "object"
    && value !== null
    && !Array.isArray(value)
    && "id" in value
    && "build" in value
    && typeof value.id === "string"
    && typeof value.build === "function"
    && (!("filter" in value) || typeof value.filter === "function")
    && (!("parser" in value) || typeof value.parser === "function")
  );
}
