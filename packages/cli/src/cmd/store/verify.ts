/* eslint-disable no-console */
import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { UCDStoreGenericError } from "@ucdjs/ucd-store-v2";
import { green, red, yellow } from "farver/fast";
import { printHelp } from "../../cli-utils";
import { assertRemoteOrStoreDir, createStoreFromFlags, SHARED_FLAGS } from "./_shared";

export interface CLIStoreVerifyCmdOptions {
  flags: CLIArguments<Prettify<CLIStoreCmdSharedFlags & {
    json?: boolean;
  }>>;
  versions: string[];
}

export async function runVerifyStore({ flags, versions }: CLIStoreVerifyCmdOptions) {
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
    lockfileOnly,
    json,
  } = flags;

  try {
    assertRemoteOrStoreDir(flags);

    // For verify, we need to create a store with verify enabled
    // But verify is called during store creation, so we need to handle it differently
    // Actually, verify is an internal operation, so we'll need to read the lockfile
    // and check versions against the API manually

    if (remote || !storeDir) {
      console.error(red(`\n❌ Error: Verify operation requires a local store directory.`));
      return;
    }

    // Read lockfile to get versions
    const { readLockfile, getLockfilePath } = await import("@ucdjs/ucd-store-v2/core/lockfile");
    const { createUCDClient } = await import("@ucdjs/client");
    const { UCDJS_API_BASE_URL } = await import("@ucdjs/env");

    const lockfilePath = getLockfilePath(storeDir);
    const fs = await import("@ucdjs/fs-bridge/bridges/node").then((m) => m.default);
    if (!fs) {
      console.error(red(`\n❌ Error: Could not load Node.js filesystem bridge.`));
      return;
    }

    const bridge = fs({ basePath: storeDir });
    const lockfile = await readLockfile(bridge, lockfilePath);
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
