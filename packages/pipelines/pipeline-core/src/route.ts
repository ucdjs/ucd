import type { ExtractRouteDependencies, PipelineDependency } from "./dependencies";
import type { RouteOutputDefinition } from "./output";
import type { AnyPipelineTransformDefinition, ChainTransforms, PipelineTransformDefinition } from "./transform";
import type {
  FileContext,
  ParsedRow,
  ParserFn,
  PipelineFilter,
  PipelineLogger,
  PropertyJson,
  ResolvedEntry,
} from "./types";

export interface ResolveContext<
  TDepends extends readonly PipelineDependency[] = readonly PipelineDependency[],
> {
  version: string;
  file: FileContext;
  logger: PipelineLogger;
  getRouteData: <T = unknown>(routeId: ExtractRouteDependencies<TDepends>) => readonly T[];
  normalizeEntries: (entries: ResolvedEntry[]) => ResolvedEntry[];
  now: () => string;
}

export type ResolverFn<
  TOutput = PropertyJson[],
  TDepends extends readonly PipelineDependency[] = readonly PipelineDependency[],
> = (
  ctx: ResolveContext<TDepends>,
  rows: AsyncIterable<ParsedRow>,
) => Promise<TOutput>;

type PipelineRouteResolver<
  TDepends extends readonly PipelineDependency[],
  TTransforms extends readonly AnyPipelineTransformDefinition[],
  TOutput,
> = (
  ctx: ResolveContext<TDepends>,
  rows: AsyncIterable<TTransforms extends readonly [] ? ParsedRow : ChainTransforms<ParsedRow, TTransforms>>,
) => Promise<TOutput>;

export interface PipelineRouteDefinition<
  TId extends string = string,
  TDepends extends readonly PipelineDependency[] = readonly PipelineDependency[],
  TTransforms extends readonly AnyPipelineTransformDefinition[] = readonly [],
  TOutput = PropertyJson[],
> {
  id: TId;
  filter: PipelineFilter;
  depends?: TDepends;
  parser: ParserFn;
  transforms?: TTransforms;
  resolver: PipelineRouteResolver<TDepends, TTransforms, TOutput>;
  outputs?: RouteOutputDefinition[];
  cache?: boolean;
}

export type AnyPipelineRouteDefinition = PipelineRouteDefinition<any, any, any, any>;

export function definePipelineRoute<
  const TId extends string,
  const TDepends extends readonly PipelineDependency[] = readonly [],
  const TTransforms extends readonly AnyPipelineTransformDefinition[] = readonly [],
  TOutput = PropertyJson[],
>(
  definition: PipelineRouteDefinition<TId, TDepends, TTransforms, TOutput>,
): PipelineRouteDefinition<TId, TDepends, TTransforms, TOutput> {
  return definition;
}

export type InferRoute<T> = T extends PipelineRouteDefinition<
  infer TId,
  infer TDepends,
  infer TTransforms extends readonly PipelineTransformDefinition<any, any>[],
  infer TOutput
>
  ? {
      id: TId;
      depends: TDepends;
      transforms: TTransforms;
      output: TOutput;
    }
  : never;

export type InferRoutesOutput<T extends readonly AnyPipelineRouteDefinition[]>
  = T[number] extends PipelineRouteDefinition<any, any, any, infer TOutput>
    ? TOutput extends unknown[] ? TOutput[number] : TOutput
    : never;
