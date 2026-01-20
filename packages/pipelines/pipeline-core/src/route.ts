import type { z } from "zod";
import type { ExtractArtifactKeys, PipelineDependency } from "./dependencies";
import type { ChainTransforms, PipelineTransformDefinition } from "./transform";
import type {
  FileContext,
  ParsedRow,
  ParserFn,
  PipelineFilter,
  PropertyJson,
  ResolvedEntry,
  RouteOutput,
} from "./types";

export interface ArtifactDefinition<TSchema extends z.ZodType = z.ZodType> {
  _type: "artifact" | "global-artifact";
  schema: TSchema;
  scope: "version" | "global";
}

export type InferArtifactType<T extends ArtifactDefinition>
  = T extends ArtifactDefinition<infer TSchema> ? z.infer<TSchema> : never;

export interface RouteResolveContext<
  TArtifactKeys extends string = string,
  TEmits extends Record<string, ArtifactDefinition> = Record<string, ArtifactDefinition>,
> {
  version: string;
  file: FileContext;
  getArtifact: <K extends TArtifactKeys>(key: K) => unknown;
  emitArtifact: <K extends keyof TEmits & string>(
    key: K,
    value: InferArtifactType<TEmits[K]>,
  ) => void;
  normalizeEntries: (entries: ResolvedEntry[]) => ResolvedEntry[];
  now: () => string;
}

export interface PipelineRouteDefinition<
  TId extends string = string,
  TDepends extends readonly PipelineDependency[] = readonly PipelineDependency[],
  TEmits extends Record<string, ArtifactDefinition> = Record<string, ArtifactDefinition>,
  TTransforms extends readonly PipelineTransformDefinition<any, any>[] = readonly PipelineTransformDefinition<any, any>[],
  TOutput = PropertyJson[],
> {
  id: TId;
  filter: PipelineFilter;
  depends?: TDepends;
  emits?: TEmits;
  parser: ParserFn;
  transforms?: TTransforms;
  resolver: (
    ctx: RouteResolveContext<ExtractArtifactKeys<TDepends>, TEmits>,
    rows: AsyncIterable<TTransforms extends readonly [] ? ParsedRow : ChainTransforms<ParsedRow, TTransforms>>,
  ) => Promise<TOutput>;
  out?: RouteOutput;
  cache?: boolean;
}

export function definePipelineRoute<
  const TId extends string,
  const TDepends extends readonly PipelineDependency[] = readonly [],
  const TEmits extends Record<string, ArtifactDefinition> = Record<string, never>,
  const TTransforms extends readonly PipelineTransformDefinition<any, any>[] = readonly [],
  TOutput = PropertyJson[],
>(
  definition: PipelineRouteDefinition<TId, TDepends, TEmits, TTransforms, TOutput>,
): PipelineRouteDefinition<TId, TDepends, TEmits, TTransforms, TOutput> {
  return definition;
}

export type InferRouteId<T> = T extends PipelineRouteDefinition<infer TId, any, any, any, any>
  ? TId
  : never;

export type InferRouteDepends<T> = T extends PipelineRouteDefinition<any, infer TDepends, any, any, any>
  ? TDepends
  : never;

export type InferRouteEmits<T> = T extends PipelineRouteDefinition<any, any, infer TEmits, any, any>
  ? TEmits
  : never;

export type InferRouteTransforms<T> = T extends PipelineRouteDefinition<any, any, any, infer TTransforms, any>
  ? TTransforms
  : never;

export type InferRouteOutput<T> = T extends PipelineRouteDefinition<any, any, any, any, infer TOutput>
  ? TOutput
  : never;

export type InferRoutesOutput<T extends readonly PipelineRouteDefinition<any, any, any, any, any>[]>
  = T[number] extends PipelineRouteDefinition<any, any, any, any, infer TOutput>
    ? TOutput extends unknown[] ? TOutput[number] : TOutput
    : never;

export type InferEmittedArtifactsFromRoute<T> = T extends PipelineRouteDefinition<any, any, infer TEmits, any, any>
  ? { [K in keyof TEmits]: TEmits[K] extends ArtifactDefinition<infer TSchema> ? z.infer<TSchema> : never }
  : never;
