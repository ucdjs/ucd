export type OperationSuccess<T> = readonly [data: T, error: null];
export type OperationFailure<E> = readonly [data: null, error: E];
export type OperationResult<T, E> = OperationSuccess<T> | OperationFailure<E>;

type Operation<T> = Promise<T> | (() => T) | (() => Promise<T>);

export function wrapTry<T, E = Error>(operation: Promise<T>): Promise<OperationResult<T, E>>;
export function wrapTry<_T, E = Error>(operation: () => never): OperationResult<never, E>;
export function wrapTry<T, E = Error>(operation: () => Promise<T>): Promise<OperationResult<T, E>>;
export function wrapTry<T, E = Error>(operation: () => T): OperationResult<T, E>;
export function wrapTry<T, E = Error>(
  operation: Operation<T>,
): OperationResult<T, E> | Promise<OperationResult<T, E>> {
  try {
    const result = typeof operation === "function" ? operation() : operation;

    if (isPromise(result)) {
      return Promise.resolve(result)
        .then((data) => onSuccess(data))
        .catch((error) => onFailure(error));
    }

    return onSuccess(result);
  } catch (error) {
    return onFailure<E>(error);
  }
}

function onSuccess<T>(value: T): OperationSuccess<T> {
  return [value, null];
}

function onFailure<E>(error: unknown): OperationFailure<E> {
  const errorParsed = error instanceof Error ? error : new Error(String(error));
  return [null, errorParsed as E];
}

function isPromise<T = any>(value: unknown): value is Promise<T> {
  return (
    !!value
    && (typeof value === "object" || typeof value === "function")
    && typeof (value as any).then === "function"
  );
}

type InferErrorType<TTry, TErr>
  = TErr extends readonly never[]
    ? TTry extends readonly (infer E)[]
      ? E[]
      : TTry extends (infer E)[]
        ? E[]
        : TErr
    : TErr extends readonly []
      ? TTry extends readonly (infer E)[]
        ? E[]
        : TTry extends (infer E)[]
          ? E[]
          : TErr
      : TErr;

export function tryOr<TTry, TErr = TTry>(config: {
  try: Promise<TTry>;
  err: (error: unknown) => Promise<TErr>;
}): Promise<TTry | InferErrorType<TTry, TErr>>;
export function tryOr<TTry, TErr = TTry>(config: {
  try: Promise<TTry>;
  err: (error: unknown) => TErr;
}): Promise<TTry | InferErrorType<TTry, TErr>>;
export function tryOr<TTry, TErr = TTry>(config: {
  try: () => Promise<TTry>;
  err: (error: unknown) => Promise<TErr>;
}): Promise<TTry | InferErrorType<TTry, TErr>>;
export function tryOr<TTry, TErr = TTry>(config: {
  try: () => Promise<TTry>;
  err: (error: unknown) => TErr;
}): Promise<TTry | InferErrorType<TTry, TErr>>;
export function tryOr<TTry, TErr = TTry>(config: {
  try: () => TTry;
  err: (error: unknown) => Promise<TErr>;
}): Promise<TTry | InferErrorType<TTry, TErr>>;
export function tryOr<TTry, TErr = TTry>(config: {
  try: () => TTry;
  err: (error: unknown) => TErr;
}): TTry | InferErrorType<TTry, TErr>;
export function tryOr<TTry, TErr>(config: {
  try: Promise<TTry> | (() => TTry) | (() => Promise<TTry>);
  err: (error: unknown) => TErr | Promise<TErr>;
}): TTry | TErr | Promise<TTry | TErr> {
  try {
    const tryResult = typeof config.try === "function" ? config.try() : config.try;

    if (isPromise(tryResult)) {
      return Promise.resolve(tryResult)
        .then((data) => data as TTry)
        .catch((error) => {
          const errResult = config.err(error);
          if (isPromise(errResult)) {
            return errResult;
          }
          return errResult;
        });
    }

    // Sync try succeeded
    return tryResult as TTry;
  } catch (error) {
    // Sync try failed
    const errResult = config.err(error);
    if (isPromise(errResult)) {
      return errResult;
    }
    return errResult;
  }
}
