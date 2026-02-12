import type { DAG } from "./dag";
import type { PipelineEvent } from "./events";
import type { AnyPipelineRouteDefinition, InferRoutesOutput, PipelineRouteDefinition } from "./route";
import type { InferSourceIds, PipelineSourceDefinition } from "./source";
import type { ParseContext, ParsedRow, PipelineFilter, ResolveContext } from "./types";
import { buildDAG } from "./dag";

export interface FallbackRouteDefinition<
  TArtifacts extends Record<string, unknown> = Record<string, unknown>,
  TOutput = unknown,
> {
  /**
   * Optional filter to restrict which unmatched files the fallback handles.
   */
  filter?: PipelineFilter;

  /**
   * Parser function that yields parsed rows from file content.
   */
  parser: (ctx: ParseContext) => AsyncIterable<ParsedRow>;

  /**
   * Resolver function that transforms parsed rows into output.
   */
  resolver: (ctx: ResolveContext<TArtifacts>, rows: AsyncIterable<ParsedRow>) => Promise<TOutput>;
}

export interface PipelineDefinitionSpec<
  TSources extends readonly PipelineSourceDefinition[] = readonly PipelineSourceDefinition[],
  TRoutes extends readonly AnyPipelineRouteDefinition[] = readonly AnyPipelineRouteDefinition[],
  TFallback extends FallbackRouteDefinition<any, unknown> | undefined = undefined,
> {
  /**
   * Unique identifier for the pipeline.
   */
  id: string;

  /**
   * Human-readable name for the pipeline.
   */
  name: string;

  /**
   * Description of what this pipeline does.
   */
  description?: string;

  /**
   * Tags associated with this pipeline.
   */
  tags?: string[];

  /**
   * Unicode versions this pipeline processes.
   */
  versions: string[];

  /**
   * Input sources that provide files to the pipeline.
   */
  inputs: TSources;

  /**
   * Routes that process matched files.
   */
  routes: TRoutes;

  /**
   * Global filter to include/exclude files before routing.
   */
  include?: PipelineFilter;

  /**
   * If true, throw error for files with no matching route (and no fallback).
   * @default false
   */
  strict?: boolean;

  /**
   * Maximum concurrent route executions.
   * @default 4
   */
  concurrency?: number;

  /**
   * Fallback handler for files that don't match any route.
   */
  fallback?: TFallback;

  /**
   * Event handler for pipeline events.
   * Note: This is stored but not invoked by the definition itself.
   * The executor is responsible for calling this.
   */
  onEvent?: (event: PipelineEvent) => void | Promise<void>;
}

export type PipelineDefinitionOptions<
  TSources extends readonly PipelineSourceDefinition[] = readonly PipelineSourceDefinition[],
  TRoutes extends readonly PipelineRouteDefinition<any, any, any, any, any>[] = readonly PipelineRouteDefinition<any, any, any, any, any>[],
  TFallback extends FallbackRouteDefinition<any, unknown> | undefined = undefined,
> = PipelineDefinitionSpec<TSources, TRoutes, TFallback>;

export type PipelineDefinition<
  TId extends string = string,
  TSources extends readonly PipelineSourceDefinition[] = readonly PipelineSourceDefinition[],
  TRoutes extends readonly PipelineRouteDefinition<any, any, any, any, any>[] = readonly PipelineRouteDefinition<any, any, any, any, any>[],
  TFallback extends FallbackRouteDefinition<any, unknown> | undefined = undefined,
> = Readonly<PipelineDefinitionSpec<TSources, TRoutes, TFallback>> & {
  /**
   * Marker to identify this as a pipeline definition.
   */
  readonly _type: "pipeline-definition";

  /**
   * Unique identifier for the pipeline.
   */
  readonly id: TId;

  /**
   * If true, throw error for files with no matching route (and no fallback).
   */
  readonly strict: boolean;

  /**
   * Maximum concurrent route executions.
   */
  readonly concurrency: number;

  /**
   * Precomputed DAG (Directed Acyclic Graph) for route execution order.
   * Built at definition time from route dependencies.
   */
  readonly dag: DAG;

  /**
   * Tags associated with this pipeline.
   */
  readonly tags: string[];
};

export type AnyPipelineDefinition = PipelineDefinition<any, any, any, any>;

export type InferPipelineOutput<
  TRoutes extends readonly PipelineRouteDefinition<any, any, any, any, any>[],
  TFallback extends FallbackRouteDefinition<any, unknown> | undefined,
> = TFallback extends FallbackRouteDefinition<any, infer TFallbackOutput>
  ? InferRoutesOutput<TRoutes> | TFallbackOutput
  : InferRoutesOutput<TRoutes>;

export type InferPipelineSourceIds<T> = T extends PipelineDefinition<any, infer TSources, any, any>
  ? InferSourceIds<TSources>
  : never;

export type InferPipelineRouteIds<T> = T extends PipelineDefinition<any, any, infer TRoutes, any>
  ? TRoutes[number] extends PipelineRouteDefinition<infer TId, any, any, any, any>
    ? TId
    : never
  : never;

/**
 * Define a pipeline configuration.
 *
 * This returns a pure data structure describing the pipeline.
 * To execute the pipeline, pass it to a pipeline executor.
 *
 * @example
 * ```ts
 * const pipeline = definePipeline({
 *   id: "my-pipeline",
 *   name: "My Pipeline",
 *   versions: ["16.0.0"],
 *   inputs: [mySource],
 *   routes: [myRoute],
 * });
 *
 * // Execute with an executor
 * const executor = createPipelineExecutor({ pipelines: [pipeline] });
 * const result = await executor.run();
 * ```
 */
export function definePipeline<
  const TId extends string,
  const TSources extends readonly PipelineSourceDefinition[],
  const TRoutes extends readonly PipelineRouteDefinition<any, any, any, any, any>[],
  const TFallback extends FallbackRouteDefinition<any, unknown> | undefined = undefined,
>(
  options: Omit<PipelineDefinitionSpec<readonly [...TSources], readonly [...TRoutes], TFallback>, "inputs" | "routes">
    & {
      id: TId;
      inputs: readonly [...TSources];
      routes: readonly [...TRoutes];
    },
): PipelineDefinition<TId, TSources, TRoutes, TFallback> {
  const dagResult = buildDAG(options.routes);

  if (!dagResult.valid) {
    const errorMessages = dagResult.errors.map((e) => e.message).join("\n  ");
    throw new Error(`Pipeline "${options.id}" has invalid route dependencies:\n  ${errorMessages}`);
  }

  return {
    _type: "pipeline-definition",
    id: options.id,
    name: options.name,
    description: options.description,
    versions: options.versions,
    inputs: options.inputs as TSources,
    routes: options.routes as TRoutes,
    include: options.include,
    strict: options.strict ?? false,
    concurrency: options.concurrency ?? 4,
    fallback: options.fallback,
    onEvent: options.onEvent,
    dag: dagResult.dag!,
    tags: options.tags ?? [],
  };
}

export function isPipelineDefinition(value: unknown): value is PipelineDefinition {
  return (
    typeof value === "object"
    && value !== null
    && "_type" in value
    && typeof value._type === "string"
    && value._type === "pipeline-definition"
    && "id" in value
    && typeof value.id === "string"
    && "inputs" in value
    && Array.isArray(value.inputs)
    && "routes" in value
    && Array.isArray(value.routes)
  );
}

export function getPipelineRouteIds<T extends PipelineDefinition>(
  pipeline: T,
): string[] {
  return pipeline.routes.map((route) => route.id);
}

export function getPipelineSourceIds<T extends PipelineDefinition>(
  pipeline: T,
): string[] {
  return pipeline.inputs.map((source) => source.id);
}
