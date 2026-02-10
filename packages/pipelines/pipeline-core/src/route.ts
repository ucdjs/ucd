import type { z } from "zod";
import type { ExtractArtifactKeys, PipelineDependency } from "./dependencies";
import type { AnyPipelineTransformDefinition, ChainTransforms, PipelineTransformDefinition } from "./transform";
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

type PipelineRouteResolver<
  TDepends extends readonly PipelineDependency[],
  TEmits extends Record<string, ArtifactDefinition>,
  TTransforms extends readonly AnyPipelineTransformDefinition[],
  TOutput,
> = (
  ctx: RouteResolveContext<ExtractArtifactKeys<TDepends>, TEmits>,
  rows: AsyncIterable<TTransforms extends readonly [] ? ParsedRow : ChainTransforms<ParsedRow, TTransforms>>,
) => Promise<TOutput>;

export interface PipelineRouteDefinition<
  TId extends string = string,
  TDepends extends readonly PipelineDependency[] = readonly PipelineDependency[],
  TEmits extends Record<string, ArtifactDefinition> = Record<string, ArtifactDefinition>,
  TTransforms extends readonly AnyPipelineTransformDefinition[] = readonly [],
  TOutput = PropertyJson[],
> {
  id: TId;
  filter: PipelineFilter;
  depends?: TDepends;
  emits?: TEmits;
  parser: ParserFn;
  transforms?: TTransforms;
  resolver: PipelineRouteResolver<TDepends, TEmits, TTransforms, TOutput>;
  out?: RouteOutput;
  cache?: boolean;
}

export type AnyPipelineRouteDefinition = PipelineRouteDefinition<any, any, any, any, any>;

export function definePipelineRoute<
  const TId extends string,
  const TDepends extends readonly PipelineDependency[] = readonly [],
  const TEmits extends Record<string, ArtifactDefinition> = Record<string, never>,
  const TTransforms extends readonly AnyPipelineTransformDefinition[] = readonly [],
  TOutput = PropertyJson[],
>(
  definition: PipelineRouteDefinition<TId, TDepends, TEmits, TTransforms, TOutput>,
): PipelineRouteDefinition<TId, TDepends, TEmits, TTransforms, TOutput> {
  return definition;
}

export type InferRoute<T> = T extends PipelineRouteDefinition<
  infer TId,
  infer TDepends,
  infer TEmits,
  infer TTransforms extends readonly PipelineTransformDefinition<any, any>[],
  infer TOutput
>
  ? {
      id: TId;
      depends: TDepends;
      emits: TEmits;
      transforms: TTransforms;
      output: TOutput;
    }
  : never;

export type InferRoutesOutput<T extends readonly AnyPipelineRouteDefinition[]>
  = T[number] extends PipelineRouteDefinition<any, any, any, any, infer TOutput>
    ? TOutput extends unknown[] ? TOutput[number] : TOutput
    : never;

export type InferEmittedArtifactsFromRoute<T> = T extends PipelineRouteDefinition<any, any, infer TEmits, any, any>
  ? { [K in keyof TEmits]: TEmits[K] extends ArtifactDefinition<infer TSchema> ? z.infer<TSchema> : never }
  : never;
