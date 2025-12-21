/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { createDebugger } from "@ucdjs-internal/shared";
import { createUCDClient } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { getLockfilePath, readLockfile } from "@ucdjs/lockfile";
import { UCDStoreGenericError } from "@ucdjs/ucd-store-v2";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { assertRemoteOrStoreDir, createStoreFromFlags, SHARED_FLAGS } from "./_shared";

const debug = createDebugger("ucdjs:cli:store:verify");

export interface CLIStoreVerifyCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    json?: boolean;
  }>>;
  versions: string[];
}

export async function runVerifyStore({ flags }: CLIStoreVerifyCmdOptions) {
  if (flags?.help || flags?.h) {
    printHelp({
      headline: "Verify UCD Store integrity",
      commandName: "ucd store verify",
      usage: "[...versions] [...flags]",
      tables: {
        Flags: [
          ...SHARED_FLAGS,
          ["--json", "Output verification results in JSON format."],
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
    include: patterns,
    exclude: excludePatterns,
    json,
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

    const store = await createStoreFromFlags({
      baseUrl,
      storeDir,
      remote,
      include: patterns,
      exclude: excludePatterns,
      lockfileOnly: true,
    });

    // Note: lockfileOnly is used to create read-only store

    // Read lockfile to get versions - works with both local and remote stores
    let lockfilePath: string;
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

    const bridge = store.fs;
    let lockfile;
    try {
      lockfile = await readLockfile(bridge, lockfilePath);
    } catch (err) {
      debug?.("Error reading lockfile:", err);
      if (remote) {
        console.error(red(`\n❌ Error: Could not read lockfile from remote store.`));
        console.error("Verify operation requires a lockfile. For remote stores, the lockfile must be accessible via the API.");
      } else {
        console.error(red(`\n❌ Error: Lockfile not found at ${lockfilePath}`));
        console.error("Run 'ucd store init' to create a new store.");
      }
      return;
    }

    const lockfileVersions = Object.keys(lockfile.versions);

    // Create client to fetch available versions
    const client = await createUCDClient(baseUrl || UCDJS_API_BASE_URL);

    // Get available versions from API
    const configResult = await client.config.get();
    let availableVersions: string[] = [];

    if (configResult.error || !configResult.data) {
      const apiResult = await client.versions.list();
      if (apiResult.error) {
        console.error(red(`\n❌ Error fetching versions: ${apiResult.error.message}`));
        return;
      }
      if (!apiResult.data) {
        console.error(red(`\n❌ Error: No versions data returned from API.`));
        return;
      }
      availableVersions = apiResult.data.map(({ version }) => version);
    } else {
      availableVersions = configResult.data.versions ?? [];
      if (availableVersions.length === 0) {
        const apiResult = await client.versions.list();
        if (apiResult.error) {
          console.error(red(`\n❌ Error fetching versions: ${apiResult.error.message}`));
          return;
        }
        if (!apiResult.data) {
          console.error(red(`\n❌ Error: No versions data returned from API.`));
          return;
        }
        availableVersions = apiResult.data.map(({ version }) => version);
      }
    }

    const availableVersionsSet = new Set(availableVersions);
    const lockfileVersionsSet = new Set(lockfileVersions);

    const missingVersions = lockfileVersions.filter((v) => !availableVersionsSet.has(v));
    const extraVersions = availableVersions.filter((v) => !lockfileVersionsSet.has(v));
    const validVersions = lockfileVersions.filter((v) => availableVersionsSet.has(v));

    const isValid = missingVersions.length === 0;

    if (json) {
      console.info(JSON.stringify({
        valid: isValid,
        lockfileVersions,
        availableVersions,
        missingVersions,
        extraVersions,
        validVersions,
      }, null, 2));
      return;
    }

    if (isValid) {
      console.info(green("\n✓ Store verification passed\n"));
      console.info(`All ${lockfileVersions.length} version(s) in lockfile are available in API.`);
    } else {
      console.error(red("\n❌ Store verification failed\n"));
      console.error(`Found ${missingVersions.length} version(s) in lockfile that are not available in API:`);
      for (const version of missingVersions) {
        console.error(`  - ${version}`);
      }
    }

    if (extraVersions.length > 0) {
      console.info(yellow(`\n⚠ Note: ${extraVersions.length} version(s) available in API but not in lockfile:`));
      for (const version of extraVersions) {
        console.info(`  + ${version}`);
      }
      console.info("Run 'ucd store sync' to update the lockfile.");
    }
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

    console.error(red(`\n❌ Error verifying store:`));
    console.error(`  ${message}`);
    console.error("Please check the store configuration and try again.");
    console.error("If you believe this is a bug, please report it at https://github.com/ucdjs/ucd/issues");
  }
}
