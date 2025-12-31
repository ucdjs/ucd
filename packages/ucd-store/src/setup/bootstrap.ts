import type { InternalUCDStoreContext } from "../types";
import { createDebugger } from "@ucdjs-internal/shared";
import { assertCapability } from "@ucdjs/fs-bridge";
import { writeLockfile } from "@ucdjs/lockfile";
import { extractFilterPatterns } from "../context";
import { UCDStoreGenericError } from "../errors";

const debug = createDebugger("ucdjs:ucd-store:bootstrap");

/**
 * Bootstraps a new store by validating versions against the API
 * and creating the initial lockfile (if the bridge supports writing).
 *
 * @param {InternalUCDStoreContext} context - The internal store context
 * @throws {UCDStoreGenericError} If API fetch fails or versions are invalid
 */
export async function bootstrap(context: InternalUCDStoreContext): Promise<void> {
  const { fs, filter } = context;
  const versions = context.versions.resolved;

  debug?.("Starting bootstrap for versions:", versions);

  // Validate versions against API using context's cached getter
  const availableVersions = await context.versions.apiVersions();

  if (availableVersions.length === 0) {
    throw new UCDStoreGenericError("Failed to fetch Unicode versions: no versions available from API");
  }

  debug?.(`Fetched ${availableVersions.length} available versions from API`);

  const missingVersions = versions.filter((v) => !availableVersions.includes(v));
  if (missingVersions.length > 0) {
    debug?.("✗ Validation failed - missing versions:", missingVersions);
    throw new UCDStoreGenericError(
      `Some requested versions are not available in the API: ${missingVersions.join(", ")}`,
    );
  }

  debug?.("✓ All requested versions are available");

  // Check if store root exists using "." - fs-bridge will resolve it to basePath
  const storeRootExists = await fs.exists(".");
  if (!storeRootExists) {
    debug?.("Creating store root directory");
    assertCapability(fs, "mkdir");
    await fs.mkdir(".");
  } else {
    debug?.("Base directory already exists");
  }

  // Only write lockfile if the bridge supports it
  if (context.lockfile.supports && context.lockfile.path) {
    debug?.(`Writing lockfile to: ${context.lockfile.path}`);
    const filters = filter ? extractFilterPatterns(filter) : undefined;
    const now = new Date();
    await writeLockfile(fs, context.lockfile.path, {
      lockfileVersion: 1,
      createdAt: now,
      updatedAt: now,
      versions: Object.fromEntries(
        versions.map((v) => [
          v,
          {
            path: `${v}/snapshot.json`, // relative path to snapshot
            fileCount: 0,
            totalSize: 0,
            createdAt: now,
            updatedAt: now,
          },
        ]),
      ),
      filters,
    });
    debug?.("✓ Lockfile written");
  } else {
    debug?.("Skipping lockfile write - bridge does not support writing");
  }

  debug?.("✓ Bootstrap completed successfully");
}
