import type { DAG } from "./dag";
import type { PipelineEvent } from "./events";
import type { InferRoutesOutput, PipelineRouteDefinition } from "./route";
import type { InferSourceIds, PipelineSourceDefinition } from "./source";
import type { ParseContext, ParsedRow, PipelineFilter, ResolveContext } from "./types";
import { buildDAG } from "./dag";

/**
 * Fallback route definition for files that don't match any explicit route.
 */
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

/**
 * Options for defining a pipeline.
 * This is a pure data structure with no execution logic.
 */
export interface PipelineDefinitionOptions<
  TSources extends readonly PipelineSourceDefinition[] = readonly PipelineSourceDefinition[],
  TRoutes extends readonly PipelineRouteDefinition<any, any, any, any, any>[] = readonly PipelineRouteDefinition<any, any, any, any, any>[],
  TFallback extends FallbackRouteDefinition<any, unknown> | undefined = undefined,
> {
  /**
   * Unique identifier for the pipeline.
   */
  id: string;

  /**
   * Human-readable name for the pipeline.
   */
  name?: string;

  /**
   * Description of what this pipeline does.
   */
  description?: string;

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

/**
 * A pipeline definition is a pure data structure that describes
 * how to process Unicode Character Database files.
 *
 * It does NOT contain execution logic - that is handled by the executor.
 */
export interface PipelineDefinition<
  TId extends string = string,
  TSources extends readonly PipelineSourceDefinition[] = readonly PipelineSourceDefinition[],
  TRoutes extends readonly PipelineRouteDefinition<any, any, any, any, any>[] = readonly PipelineRouteDefinition<any, any, any, any, any>[],
  TFallback extends FallbackRouteDefinition<any, unknown> | undefined = undefined,
> {
  /**
   * Marker to identify this as a pipeline definition.
   */
  readonly _type: "pipeline-definition";

  /**
   * Unique identifier for the pipeline.
   */
  readonly id: TId;

  /**
   * Human-readable name for the pipeline.
   */
  readonly name?: string;

  /**
   * Description of what this pipeline does.
   */
  readonly description?: string;

  /**
   * Unicode versions this pipeline processes.
   */
  readonly versions: string[];

  /**
   * Input sources that provide files to the pipeline.
   */
  readonly inputs: TSources;

  /**
   * Routes that process matched files.
   */
  readonly routes: TRoutes;

  /**
   * Global filter to include/exclude files before routing.
   */
  readonly include?: PipelineFilter;

  /**
   * If true, throw error for files with no matching route (and no fallback).
   */
  readonly strict: boolean;

  /**
   * Maximum concurrent route executions.
   */
  readonly concurrency: number;

  /**
   * Fallback handler for files that don't match any route.
   */
  readonly fallback?: TFallback;

  /**
   * Event handler for pipeline events.
   */
  readonly onEvent?: (event: PipelineEvent) => void | Promise<void>;

  /**
   * Precomputed DAG (Directed Acyclic Graph) for route execution order.
   * Built at definition time from route dependencies.
   */
  readonly dag: DAG;
}

/**
 * Infer the output type of a pipeline definition.
 */
export type InferPipelineOutput<
  TRoutes extends readonly PipelineRouteDefinition<any, any, any, any, any>[],
  TFallback extends FallbackRouteDefinition<any, unknown> | undefined,
> = TFallback extends FallbackRouteDefinition<any, infer TFallbackOutput>
  ? InferRoutesOutput<TRoutes> | TFallbackOutput
  : InferRoutesOutput<TRoutes>;

/**
 * Infer the source IDs from a pipeline definition.
 */
export type InferPipelineSourceIds<T> = T extends PipelineDefinition<any, infer TSources, any, any>
  ? InferSourceIds<TSources>
  : never;

/**
 * Infer the route IDs from a pipeline definition.
 */
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
  TFallback extends FallbackRouteDefinition<any, unknown> | undefined = undefined,
>(
  options: PipelineDefinitionOptions<TSources, TRoutes, TFallback> & { id: TId },
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
    inputs: options.inputs,
    routes: options.routes,
    include: options.include,
    strict: options.strict ?? false,
    concurrency: options.concurrency ?? 4,
    fallback: options.fallback,
    onEvent: options.onEvent,
    dag: dagResult.dag!,
  };
}

/**
 * Type guard to check if a value is a pipeline definition.
 */
export function isPipelineDefinition(value: unknown): value is PipelineDefinition {
  return (
    typeof value === "object"
    && value !== null
    && "_type" in value
    && (value as { _type: unknown })._type === "pipeline-definition"
  );
}

/**
 * Extract route IDs from a pipeline definition.
 */
export function getPipelineRouteIds<T extends PipelineDefinition>(
  pipeline: T,
): string[] {
  return pipeline.routes.map((route) => route.id);
}

/**
 * Extract source IDs from a pipeline definition.
 */
export function getPipelineSourceIds<T extends PipelineDefinition>(
  pipeline: T,
): string[] {
  return pipeline.inputs.map((source) => source.id);
}
