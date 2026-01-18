import type {
  ParserFn,
  ParsedRow,
  PipelineFilter,
  PropertyJson,
  ResolveContext,
  RouteOutput,
} from "./types";

export interface PipelineRouteDefinition<
  TId extends string = string,
  TArtifacts extends Record<string, unknown> = Record<string, unknown>,
  TOutput = PropertyJson[],
> {
  id: TId;
  filter: PipelineFilter;
  parser: ParserFn;
  resolver: (ctx: ResolveContext<TArtifacts>, rows: AsyncIterable<ParsedRow>) => Promise<TOutput>;
  out?: RouteOutput;
  cache?: boolean;
}

export function definePipelineRoute<
  const TId extends string,
  TArtifacts extends Record<string, unknown> = Record<string, unknown>,
  TOutput = PropertyJson[],
>(
  definition: PipelineRouteDefinition<TId, TArtifacts, TOutput>,
): PipelineRouteDefinition<TId, TArtifacts, TOutput> {
  return definition;
}

export type InferRouteId<T> = T extends PipelineRouteDefinition<infer TId, Record<string, unknown>, unknown> ? TId : never;
export type InferRouteOutput<T> = T extends PipelineRouteDefinition<string, Record<string, unknown>, infer TOutput> ? TOutput : never;

export type InferRoutesOutput<T extends readonly PipelineRouteDefinition[]> =
  T[number] extends PipelineRouteDefinition<string, Record<string, unknown>, infer TOutput>
    ? TOutput extends unknown[] ? TOutput[number] : TOutput
    : never;
