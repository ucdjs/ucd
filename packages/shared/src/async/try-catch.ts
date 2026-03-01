import { createDebugger } from "../debugger";

const debug = createDebugger("ucdjs:shared:try-catch");

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
  const operationType = typeof operation === "function" ? "function" : "promise";
  debug?.("wrapTry: called", { operationType });

  try {
    const result = typeof operation === "function" ? operation() : operation;

    if (isPromise(result)) {
      debug?.("wrapTry: executing async operation");
      return Promise.resolve(result)
        .then((data) => {
          debug?.("wrapTry: async operation succeeded", {
            hasData: data != null,
            dataType: typeof data,
          });
          return onSuccess(data);
        })
        .catch((error) => {
          debug?.("wrapTry: async operation failed", {
            errorName: error instanceof Error ? error.name : "Unknown",
            errorMessage: error instanceof Error ? error.message : String(error),
          });
          return onFailure(error);
        });
    }

    debug?.("wrapTry: sync operation succeeded", {
      hasData: result != null,
      dataType: typeof result,
    });
    return onSuccess(result);
  } catch (err) {
    debug?.("wrapTry: sync operation failed", {
      errorName: err instanceof Error ? (err as Error).name : "Unknown",
      errorMessage: err instanceof Error ? (err as Error).message : String(err),
    });
    return onFailure<E>(err);
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
  const tryType = typeof config.try === "function" ? "function" : "promise";
  debug?.("tryOr: called", { tryType });

  try {
    const tryResult = typeof config.try === "function" ? config.try() : config.try;

    if (isPromise(tryResult)) {
      debug?.("tryOr: executing async try");
      return Promise.resolve(tryResult)
        .then((data) => {
          debug?.("tryOr: async try succeeded", {
            hasData: data != null,
            dataType: typeof data,
          });
          return data as TTry;
        })
        .catch((error) => {
          debug?.("tryOr: async try failed, invoking error handler", {
            errorName: error instanceof Error ? error.name : "Unknown",
            errorMessage: error instanceof Error ? error.message : String(error),
          });
          const errResult = config.err(error);
          if (isPromise(errResult)) {
            debug?.("tryOr: error handler returned promise");
            return errResult;
          }
          debug?.("tryOr: error handler returned sync value");
          return errResult;
        });
    }

    debug?.("tryOr: sync try succeeded", {
      hasData: tryResult != null,
      dataType: typeof tryResult,
    });
    return tryResult as TTry;
  } catch (err) {
    debug?.("tryOr: sync try failed, invoking error handler", {
      errorName: err instanceof Error ? err.name : "Unknown",
      errorMessage: err instanceof Error ? err.message : String(err),
    });
    const errResult = config.err(err);
    if (isPromise(errResult)) {
      debug?.("tryOr: error handler returned promise");
      return errResult;
    }

    debug?.("tryOr: error handler returned sync value");
    return errResult;
  }
}
