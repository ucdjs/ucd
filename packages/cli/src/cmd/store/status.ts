/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import process from "node:process";
import { createDebugger } from "@ucdjs-internal/shared";
import { createUCDClient } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { getLockfilePath, readLockfile, readSnapshotOrDefault } from "@ucdjs/lockfile";
import { UCDStoreGenericError } from "@ucdjs/ucd-store-v2";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../../cli-utils";
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
    let lockfilePath: string;
    const bridge = store.fs;

    if (remote) {
      // For remote stores, lockfile path is relative to base URL
      lockfilePath = getLockfilePath("");
    } else {
      if (!storeDir) {
        console.error(red(`\n❌ Error: Store directory must be specified.`));
        return;
      }
      lockfilePath = getLockfilePath(storeDir);
    }

    let lockfile;
    try {
      lockfile = await readLockfile(bridge, lockfilePath);
    } catch (err) {
      debug?.("Error reading lockfile:", err);
      console.error(red(`\n❌ Error: Lockfile not found at ${lockfilePath}`));
      console.error("Run 'ucd store init' to create a new store.");
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
        console.warn(yellow(`Warning: Could not fetch versions from API: ${apiResult.error.message}`));
      } else if (apiResult.data) {
        availableVersions = apiResult.data.map(({ version }) => version);
      }
    } else {
      availableVersions = configResult.data.versions ?? [];
      if (availableVersions.length === 0) {
        const apiResult = await client.versions.list();
        if (apiResult.error) {
          console.warn(yellow(`Warning: Could not fetch versions from API: ${apiResult.error.message}`));
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
          const snapshot = await readSnapshotOrDefault(bridge, storeDir, version);
          console.info("snapshot", snapshot, storeDir, version);
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
      process.stdout.write(JSON.stringify({
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
      }, null, 2));
      return;
    }

    // Display status
    if (remote) {
      console.info(`Store Status: Remote (${baseUrl || "default API"})`);
    } else {
      console.info(`Store Status: ${storeDir}`);
    }
    console.info(`  Lockfile: ${lockfilePath}`);
    console.info(`  Lockfile Version: ${lockfile.lockfileVersion}`);
    console.info(`  Total Versions: ${lockfileVersions.length}`);
    console.info("");

    for (const status of versionStatuses.sort((a, b) => a.version.localeCompare(b.version))) {
      const { version, entry, hasSnapshot, isAvailableInAPI } = status;
      const statusIcon = hasSnapshot ? green("✓") : yellow("⚠");
      const apiIcon = isAvailableInAPI ? green("✓") : red("✗");

      console.info(`  Version ${version}:`);
      console.info(`    Snapshot: ${entry?.path}`);
      console.info(`    Status: ${statusIcon} ${hasSnapshot ? "Mirrored" : "Not mirrored"}`);
      console.info(`    Files: ${entry?.fileCount}`);
      console.info(`    Size: ${((entry?.totalSize ?? 0) / 1024 / 1024).toFixed(2)} MB`);
      console.info(`    API: ${apiIcon} ${isAvailableInAPI ? "Available" : "Not available"}`);
      console.info("");
    }

    console.info("  Summary:");
    console.info(`    Mirrored: ${mirroredCount}/${lockfileVersions.length} versions`);
    console.info(`    Available in API: ${availableCount}/${lockfileVersions.length} versions`);
  } catch (err) {
    if (err instanceof UCDStoreGenericError) {
      console.error(red(`\n❌ Error: ${err.message}`));
      return;
    }

    let message = "Unknown error";
    if (err instanceof Error) {
      message = err.message;
    } else if (typeof err === "string") {
      message = err;
    }

    console.error(red(`\n❌ Error getting store status:`));
    console.error(`  ${message}`);
    console.error("Please check the store configuration and try again.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
