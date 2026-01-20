import type { FileContext } from "./types";

export interface TransformContext {
  version: string;
  file: FileContext;
}

export interface PipelineTransformDefinition<TInput = unknown, TOutput = unknown> {
  id: string;
  fn: (ctx: TransformContext, rows: AsyncIterable<TInput>) => AsyncIterable<TOutput>;
}

export function definePipelineTransform<TInput, TOutput>(
  definition: PipelineTransformDefinition<TInput, TOutput>,
): PipelineTransformDefinition<TInput, TOutput> {
  return definition;
}

export type InferTransformInput<T>
  = T extends PipelineTransformDefinition<infer TInput, unknown> ? TInput : never;

export type InferTransformOutput<T>
  = T extends PipelineTransformDefinition<unknown, infer TOutput> ? TOutput : never;

type ChainTwo<T1, T2> = T1 extends PipelineTransformDefinition<any, infer O1>
  ? T2 extends PipelineTransformDefinition<O1, infer O2>
    ? O2
    : never
  : never;

type ChainThree<T1, T2, T3> = T1 extends PipelineTransformDefinition<any, infer O1>
  ? T2 extends PipelineTransformDefinition<O1, infer O2>
    ? T3 extends PipelineTransformDefinition<O2, infer O3>
      ? O3
      : never
    : never
  : never;

type ChainFour<T1, T2, T3, T4> = T1 extends PipelineTransformDefinition<any, infer O1>
  ? T2 extends PipelineTransformDefinition<O1, infer O2>
    ? T3 extends PipelineTransformDefinition<O2, infer O3>
      ? T4 extends PipelineTransformDefinition<O3, infer O4>
        ? O4
        : never
      : never
    : never
  : never;

type ChainFive<T1, T2, T3, T4, T5> = T1 extends PipelineTransformDefinition<any, infer O1>
  ? T2 extends PipelineTransformDefinition<O1, infer O2>
    ? T3 extends PipelineTransformDefinition<O2, infer O3>
      ? T4 extends PipelineTransformDefinition<O3, infer O4>
        ? T5 extends PipelineTransformDefinition<O4, infer O5>
          ? O5
          : never
        : never
      : never
    : never
  : never;

type ChainSix<T1, T2, T3, T4, T5, T6> = T1 extends PipelineTransformDefinition<any, infer O1>
  ? T2 extends PipelineTransformDefinition<O1, infer O2>
    ? T3 extends PipelineTransformDefinition<O2, infer O3>
      ? T4 extends PipelineTransformDefinition<O3, infer O4>
        ? T5 extends PipelineTransformDefinition<O4, infer O5>
          ? T6 extends PipelineTransformDefinition<O5, infer O6>
            ? O6
            : never
          : never
        : never
      : never
    : never
  : never;

type ChainSeven<T1, T2, T3, T4, T5, T6, T7> = T1 extends PipelineTransformDefinition<any, infer O1>
  ? T2 extends PipelineTransformDefinition<O1, infer O2>
    ? T3 extends PipelineTransformDefinition<O2, infer O3>
      ? T4 extends PipelineTransformDefinition<O3, infer O4>
        ? T5 extends PipelineTransformDefinition<O4, infer O5>
          ? T6 extends PipelineTransformDefinition<O5, infer O6>
            ? T7 extends PipelineTransformDefinition<O6, infer O7>
              ? O7
              : never
            : never
          : never
        : never
      : never
    : never
  : never;

type ChainEight<T1, T2, T3, T4, T5, T6, T7, T8> = T1 extends PipelineTransformDefinition<any, infer O1>
  ? T2 extends PipelineTransformDefinition<O1, infer O2>
    ? T3 extends PipelineTransformDefinition<O2, infer O3>
      ? T4 extends PipelineTransformDefinition<O3, infer O4>
        ? T5 extends PipelineTransformDefinition<O4, infer O5>
          ? T6 extends PipelineTransformDefinition<O5, infer O6>
            ? T7 extends PipelineTransformDefinition<O6, infer O7>
              ? T8 extends PipelineTransformDefinition<O7, infer O8>
                ? O8
                : never
              : never
            : never
          : never
        : never
      : never
    : never
  : never;

export type ChainTransforms<
  TInput,
  TTransforms extends readonly PipelineTransformDefinition<any, any>[],
> = TTransforms extends readonly []
  ? TInput
  // eslint-disable-next-line unused-imports/no-unused-vars
  : TTransforms extends readonly [infer T1 extends PipelineTransformDefinition<any, infer O1>]
    ? O1
    : TTransforms extends readonly [infer T1, infer T2]
      ? ChainTwo<T1, T2>
      : TTransforms extends readonly [infer T1, infer T2, infer T3]
        ? ChainThree<T1, T2, T3>
        : TTransforms extends readonly [infer T1, infer T2, infer T3, infer T4]
          ? ChainFour<T1, T2, T3, T4>
          : TTransforms extends readonly [infer T1, infer T2, infer T3, infer T4, infer T5]
            ? ChainFive<T1, T2, T3, T4, T5>
            : TTransforms extends readonly [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6]
              ? ChainSix<T1, T2, T3, T4, T5, T6>
              : TTransforms extends readonly [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6, infer T7]
                ? ChainSeven<T1, T2, T3, T4, T5, T6, T7>
                : TTransforms extends readonly [infer T1, infer T2, infer T3, infer T4, infer T5, infer T6, infer T7, infer T8]
                  ? ChainEight<T1, T2, T3, T4, T5, T6, T7, T8>
                  : unknown;

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
