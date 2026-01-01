import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { createDebugger } from "@ucdjs-internal/shared";
import { createUCDClient } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { getLockfilePath, readLockfile, readSnapshotOrUndefined } from "@ucdjs/lockfile";
import { UCDStoreGenericError } from "@ucdjs/ucd-store";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { output } from "../../output";
import { assertRemoteOrStoreDir, createStoreFromFlags, SHARED_FLAGS } from "./_shared";

const debug = createDebugger("ucdjs:cli:store:status");

export interface CLIStoreStatusCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    json?: boolean;
  }>>;
}

export async function runStatusStore({ flags }: CLIStoreStatusCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Show UCD Store status and lockfile information",
      commandName: "ucd store status",
      usage: "[...flags]",
      tables: {
        Flags: [
          ...SHARED_FLAGS,
          ["--json", "Output status information in JSON format."],
          ["--help (-h)", "See all available flags."],
        ],
      },
    });
    return;
  }

  const {
    storeDir,
    remote,
    baseUrl,
    json,
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote,
      lockfileOnly: true,
    });

    // Read lockfile - works with both local and remote stores
    const lockfilePath = getLockfilePath();
    const bridge = store.fs;

    if (!remote && !storeDir) {
      output.error(red(`\n❌ Error: Store directory must be specified.`));
      return;
    }

    let lockfile;
    try {
      lockfile = await readLockfile(bridge, lockfilePath);
    } catch (err) {
      debug?.("Error reading lockfile:", err);
      output.error(red(`\n❌ Error: Lockfile not found at ${lockfilePath}`));
      output.error("Run 'ucd store init' to create a new store.");
      return;
    }

    // Create client to fetch available versions
    const client = await createUCDClient(baseUrl || UCDJS_API_BASE_URL);

    // Get available versions from API
    const configResult = await client.config.get();
    let availableVersions: string[] = [];

    if (configResult.error || !configResult.data) {
      const apiResult = await client.versions.list();
      if (apiResult.error) {
        output.warn(yellow(`Warning: Could not fetch versions from API: ${apiResult.error.message}`));
      } else if (apiResult.data) {
        availableVersions = apiResult.data.map(({ version }) => version);
      }
    } else {
      availableVersions = configResult.data.versions ?? [];
      if (availableVersions.length === 0) {
        const apiResult = await client.versions.list();
        if (apiResult.error) {
          output.warn(yellow(`Warning: Could not fetch versions from API: ${apiResult.error.message}`));
        } else if (apiResult.data) {
          availableVersions = apiResult.data.map(({ version }) => version);
        }
      }
    }

    const availableVersionsSet = new Set(availableVersions);
    const lockfileVersions = Object.keys(lockfile.versions);

    // Check snapshots and build status
    const versionStatuses = await Promise.all(
      lockfileVersions.map(async (version) => {
        const entry = lockfile.versions[version];
        // For remote stores, snapshots don't exist (they're local only)
        let hasSnapshot = false;
        if (!remote && storeDir) {
          const snapshot = await readSnapshotOrUndefined(bridge, version);
          output.log("snapshot", snapshot, version);
          hasSnapshot = snapshot !== undefined;
        }
        const isAvailableInAPI = availableVersionsSet.has(version);

        return {
          version,
          entry,
          hasSnapshot,
          isAvailableInAPI,
        };
      }),
    );

    const mirroredCount = versionStatuses.filter((s) => s.hasSnapshot).length;
    const availableCount = versionStatuses.filter((s) => s.isAvailableInAPI).length;

    if (json) {
      output.json({
        storePath: storeDir,
        lockfilePath,
        lockfileVersion: lockfile.lockfileVersion,
        totalVersions: lockfileVersions.length,
        versions: versionStatuses.map((s) => ({
          version: s.version,
          snapshotPath: s.entry?.path,
          fileCount: s.entry?.fileCount,
          totalSize: s.entry?.totalSize,
          mirrored: s.hasSnapshot,
          availableInAPI: s.isAvailableInAPI,
        })),
        summary: {
          mirrored: mirroredCount,
          availableInAPI: availableCount,
          total: lockfileVersions.length,
        },
      });
      return;
    }

    // Display status
    if (remote) {
      output.log(`Store Status: Remote (${baseUrl || "default API"})`);
    } else {
      output.log(`Store Status: ${storeDir}`);
    }
    output.log(`  Lockfile: ${lockfilePath}`);
    output.log(`  Lockfile Version: ${lockfile.lockfileVersion}`);
    output.log(`  Total Versions: ${lockfileVersions.length}`);
    output.log("");

    for (const status of versionStatuses.sort((a, b) => a.version.localeCompare(b.version))) {
      const { version, entry, hasSnapshot, isAvailableInAPI } = status;
      const statusIcon = hasSnapshot ? green("✓") : yellow("⚠");
      const apiIcon = isAvailableInAPI ? green("✓") : red("✗");

      output.log(`  Version ${version}:`);
      output.log(`    Snapshot: ${entry?.path}`);
      output.log(`    Status: ${statusIcon} ${hasSnapshot ? "Mirrored" : "Not mirrored"}`);
      output.log(`    Files: ${entry?.fileCount}`);
      output.log(`    Size: ${((entry?.totalSize ?? 0) / 1024 / 1024).toFixed(2)} MB`);
      output.log(`    API: ${apiIcon} ${isAvailableInAPI ? "Available" : "Not available"}`);
      output.log("");
    }

    output.log("  Summary:");
    output.log(`    Mirrored: ${mirroredCount}/${lockfileVersions.length} versions`);
    output.log(`    Available in API: ${availableCount}/${lockfileVersions.length} versions`);
  } catch (err) {
    if (err instanceof UCDStoreGenericError) {
      output.error(red(`\n❌ Error: ${err.message}`));
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    output.error(red(`\n❌ Error getting store status:`));
    output.error(`  ${message}`);
    output.error("Please check the store configuration and try again.");
    output.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
