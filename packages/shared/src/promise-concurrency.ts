type QueueNode<T> = [value: T, next?: QueueNode<T>];

export type ConcurrencyLimitFn = <Args extends unknown[], T>(
  fn: (...args: Args) => PromiseLike<T> | T,
  ...args: Args
) => Promise<T>;

/**
 * Creates a concurrency limiter that restricts the number of concurrent executions.
 *
 * @param {number} concurrency - The maximum number of concurrent executions allowed.
 * @returns {} A function that wraps any function to enforce the concurrency limit
 * @throws {Error} When concurrency is not a positive integer
 *
 * @example
 * ```typescript
 * import { createConcurrencyLimiter } from "@ucdjs/shared";
 *
 * const limiter = createConcurrencyLimiter(2);
 *
 * // Only 2 of these will run concurrently
 * const results = await Promise.all([
 *   limiter(fetchData, "url1"),
 *   limiter(fetchData, "url2"),
 *   limiter(fetchData, "url3"),
 *   limiter(fetchData, "url4")
 * ]);
 * ```
 */
export function createConcurrencyLimiter(
  concurrency: number,
): ConcurrencyLimitFn {
  if (!Number.isInteger(concurrency) || concurrency < 1) {
    throw new Error("Concurrency must be a positive integer");
  }

  let activeTasks = 0;
  let head: undefined | QueueNode<() => void>;
  let tail: undefined | QueueNode<() => void>;

  function finish(): void {
    activeTasks--;

    // check if there are anymore pending tasks
    if (head) {
      // allow next task to run
      head[0]();
      head = head[1];

      // The head may now be undefined if there are no further pending tasks.
      tail = head && tail;
    }
  }

  return (fn, ...args) => {
    return new Promise<void>((resolve) => {
      if (activeTasks++ < concurrency) {
        // If active tasks is less than concurrency, resolve immediately.
        resolve();
      } else if (tail) {
        // There are pending tasks, so append to the queue.
        tail = tail[1] = [resolve];
      } else {
        // No other pending tasks, initialize the queue with a new tail and head.
        head = tail = [resolve];
      }
    })
      .then(() => fn(...args))
      .finally(finish);
  };
}
