import type { FileSystemBridge, FSEntry } from "@ucdjs/fs-bridge";
import { defineFileSystemBridge } from "@ucdjs/fs-bridge";
import { vi } from "vitest";

export interface CreateReadOnlyBridgeOptions {
  /**
   * Mock function for reading files
   * @default vi.fn().mockResolvedValue("content")
   */
  read?: (path: string) => Promise<string>;

  /**
   * Mock function for checking file existence
   * @default vi.fn().mockResolvedValue(true)
   */
  exists?: (path: string) => Promise<boolean>;

  /**
   * Mock function for listing directory contents
   * @default vi.fn().mockResolvedValue([])
   */
  listdir?: (path: string, recursive?: boolean) => Promise<FSEntry[]>;
}

/**
 * Creates a read-only filesystem bridge for testing.
 *
 * Useful for testing operations that should skip when write capability is unavailable.
 * All functions are optional and will use sensible defaults if not provided.
 *
 * @param options - Optional mock functions for read, exists, and listdir
 * @returns A read-only FileSystemBridge instance
 *
 * @example
 * ```typescript
 * import { createReadOnlyBridge } from "#test-utils/fs-bridges";
 * import { vi } from "vitest";
 *
 * // Use defaults
 * const bridge = createReadOnlyBridge();
 *
 * // Custom read function
 * const bridge = createReadOnlyBridge({
 *   read: vi.fn().mockResolvedValue("custom content"),
 * });
 *
 * // All custom functions
 * const bridge = createReadOnlyBridge({
 *   read: vi.fn().mockResolvedValue("file content"),
 *   exists: vi.fn().mockResolvedValue(false),
 *   listdir: vi.fn().mockResolvedValue([...]),
 * });
 * ```
 */
export function createReadOnlyBridge(
  options: CreateReadOnlyBridgeOptions = {},
): FileSystemBridge {
  return defineFileSystemBridge({
    meta: {
      name: "Read-Only Test Bridge",
      description: "A read-only bridge for testing",
    },
    setup: () => ({
      read: options.read ?? vi.fn().mockResolvedValue("content"),
      exists: options.exists ?? vi.fn().mockResolvedValue(true),
      listdir: options.listdir ?? vi.fn().mockResolvedValue([]),
    }),
  })();
}
