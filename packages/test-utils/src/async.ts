/**
 * Collects all values from an async iterable into an array.
 *
 * This function consumes an async iterable and collects all emitted values into
 * a regular array. If the async iterable throws an error at any point, the error
 * is propagated after the iterator's `return()` method is called (if available)
 * to allow for cleanup.
 *
 * @typeParam T - The type of values yielded by the async iterable.
 * @param {AsyncIterable<T>} iterable - The async iterable to consume completely.
 * @returns {Promise<T[]>} A promise that resolves to an array containing all values in emission order.
 * @throws {Error} Propagates any error thrown by the async iterable.
 *
 * @example
 * ```ts
 * const values = await collect(asyncFromArray([1, 2, 3]));
 * console.assert(values.equals([1, 2, 3]));
 * ```
 *
 * @example Cleanup on error
 * ```ts
 * async function* source() {
 *   try {
 *     yield 1;
 *     throw new Error('boom');
 *   } finally {
 *     console.log('Cleanup!'); // Called even though an error was thrown
 *   }
 * }
 * await collect(source()); // throws, but cleanup runs first
 * ```
 */
export async function collect<T>(iterable: AsyncIterable<T>): Promise<T[]> {
  const result: T[] = [];
  for await (const value of iterable) {
    result.push(value);
  }
  return result;
}

/**
 * Wraps a synchronous iterable as an async iterable.
 *
 * This is useful in tests when you want to simulate an async source but only have
 * synchronous data. The resulting async iterable properly implements the async
 * iterator protocol, including support for cleanup via `return()`.
 *
 * @typeParam T - The type of elements in the iterable.
 * @param {Iterable<T>} iterable - A synchronous iterable (array, Set, Map, etc.) to wrap.
 * @param {object} [options] - Optional configuration.
 * @param {number} [options.delay] - Number of milliseconds to wait before each value is yielded.
 *                        Useful for simulating network latency or slow producers in tests.
 *                        Must be a non-negative number.
 * @returns {AsyncIterable<T>} An async iterable that yields each element from the source iterable.
 *
 * @example
 * ```ts
 * // Simple case: wrap an array
 * for await (const value of asyncFromArray([1, 2, 3])) {
 *   console.log(value);
 * }
 * ```
 *
 * @example
 * ```ts
 * // Simulate network latency (50ms between values)
 * for await (const value of asyncFromArray(['a', 'b', 'c'], { delay: 50 })) {
 *   console.log(value);
 * }
 * ```
 */
export function asyncFromArray<T>(
  iterable: Iterable<T>,
  options?: { readonly delay?: number },
): AsyncIterable<T> {
  return (async function* () {
    for (const value of iterable) {
      if (options?.delay) {
        await new Promise((resolve) => setTimeout(resolve, options.delay));
      }
      yield value;
    }
  })();
}
