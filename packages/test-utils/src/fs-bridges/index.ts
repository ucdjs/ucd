/**
 * @deprecated Use `@ucdjs/test-utils/fs-backends` instead.
 */
export { createMemoryMockFS } from "../fs-backends/memory-fs-backend";

/**
 * @deprecated Use `createReadOnlyBackend` from `@ucdjs/test-utils/fs-backends` instead.
 */
export { createReadOnlyBackend as createReadOnlyBridge } from "../fs-backends/read-only-backend";

/**
 * @deprecated Use `CreateReadOnlyBackendOptions` from `@ucdjs/test-utils/fs-backends` instead.
 */
export type { CreateReadOnlyBackendOptions as CreateReadOnlyBridgeOptions } from "../fs-backends/read-only-backend";
