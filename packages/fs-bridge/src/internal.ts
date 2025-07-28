/**
 * Internal debug symbol used to attach capability information to file system bridge instances.
 *
 * @internal
 * @remarks
 * This symbol is used internally by the fs-bridge package to store debugging information
 * about bridge capabilities. It should never be used by external code as it may change
 * or be removed without notice.
 *
 * @warning
 * The name explicitly indicates this is for internal use only. Using this symbol in
 * external code will likely break your application when the package is updated.
 *
 * @example
 * ```typescript
 * // DON'T DO THIS - Internal use only
 * const capabilities = bridge[__INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__];
 * ```
 */
export const __INTERNAL_BRIDGE_DEBUG_SYMBOL_DO_NOT_USE_OR_YOU_WILL_BE_FIRED__: unique symbol = Symbol.for("ucdjs.fs-bridge.debug");
