import type { FileContext } from "./types";

export interface TransformContext {
  version: string;
  file: FileContext;
}

type PipelineTransformFunction<TInput, TOutput> = (ctx: TransformContext, rows: AsyncIterable<TInput>) => AsyncIterable<TOutput>;

export interface PipelineTransformDefinition<TInput = unknown, TOutput = unknown> {
  id: string;
  fn: PipelineTransformFunction<TInput, TOutput>;
}

export type AnyPipelineTransformDefinition = PipelineTransformDefinition<any, any>;

/**
 * Creates and returns a validated pipeline transform definition.
 *
 * This function is primarily a type-safe way to define transforms. It ensures that
 * the transform adheres to the `PipelineTransformDefinition` interface and preserves
 * type information for chaining.
 *
 * @typeParam TInput - The input type accepted by the transform.
 * @typeParam TOutput - The output type produced by the transform.
 * @param {PipelineTransformDefinition<TInput, TOutput>} definition - The transform definition.
 * @returns {PipelineTransformDefinition<TInput, TOutput>} The same definition, typed correctly.
 *
 * @example
 * ```ts
 * const uppercase = definePipelineTransform({
 *   id: 'uppercase',
 *   fn: async function* (_ctx, rows) {
 *     for await (const row of rows) {
 *       yield row.toUpperCase();
 *     }
 *   },
 * });
 * ```
 */
export function definePipelineTransform<TInput, TOutput>(
  definition: PipelineTransformDefinition<TInput, TOutput>,
): PipelineTransformDefinition<TInput, TOutput> {
  return definition;
}

export type InferTransformInput<T> = T extends PipelineTransformDefinition<infer TInput, unknown> ? TInput : never;

export type InferTransformOutput<T> = T extends PipelineTransformDefinition<unknown, infer TOutput> ? TOutput : never;

/**
 * Recursively composes a sequence of transform definitions into a single output type.
 *
 * Given an input type and a sequence of transforms, this type infers the final output
 * type by threading the output of each transform into the input of the next.
 *
 * @typeParam TInput - The initial input type.
 * @typeParam TTransforms - A readonly tuple of transform definitions, starting with one
 *                          that accepts `TInput`.
 *
 * @example
 * ```ts
 * type T1 = PipelineTransformDefinition<string, number>;
 * type T2 = PipelineTransformDefinition<number, boolean>;
 * type Result = ChainTransforms<string, [T1, T2]>; // boolean
 * ```
 */
type ChainTransformsHelper<
  TInput,
  TTransforms extends readonly PipelineTransformDefinition<any, any>[],
>
  = TTransforms extends readonly [PipelineTransformDefinition<TInput, infer Output>, ...infer Rest]
    ? ChainTransformsHelper<Output, Extract<Rest, readonly PipelineTransformDefinition<any, any>[]>>
    : TInput;

export type ChainTransforms<
  TInput,
  TTransforms extends readonly PipelineTransformDefinition<any, any>[],
> = ChainTransformsHelper<TInput, TTransforms>;

/**
 * Applies a sequence of transforms to an async iterable, composing them together.
 *
 * This function threads the output of one transform into the input of the next,
 * creating a pipeline. All iteration is lazy—values are pulled through the pipeline
 * only as they are consumed.
 *
 * @typeParam TInput - The input type of the first transform.
 * @param {TransformContext} ctx - The context to pass to each transform.
 * @param {AsyncIterable<TInput>} rows - The initial data source.
 * @param {readonly PipelineTransformDefinition<any, any>[]} transforms - The transforms to apply in order.
 * @returns {AsyncIterable<unknown>} An async iterable of the final output (typed as `unknown` since
 *                                    the result type depends on the transform sequence).
 *
 * @remarks
 * The output type can be narrowed using the `ChainTransforms` utility type if the
 * exact sequence of transforms is known at compile time.
 *
 * @example
 * ```ts
 * const output = applyTransforms(ctx, sourceRows, [
 *   definePipelineTransform({ id: 'filter', fn: filterFn }),
 *   definePipelineTransform({ id: 'map', fn: mapFn }),
 * ]);
 * ```
 */
export async function* applyTransforms<TInput>(
  ctx: TransformContext,
  rows: AsyncIterable<TInput>,
  transforms: readonly PipelineTransformDefinition<any, any>[],
): AsyncIterable<unknown> {
  let current: AsyncIterable<unknown> = rows;

  for (const transform of transforms) {
    current = transform.fn(ctx, current);
  }

  yield* current;
}
