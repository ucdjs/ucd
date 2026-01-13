import type { Prettify } from "@luxass/utils";
import type { CLIArguments } from "../../cli-utils";
import type { CLIStoreCmdSharedFlags } from "./_shared";
import { createDebugger } from "@ucdjs-internal/shared";
import { createUCDClient } from "@ucdjs/client";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { getLockfilePath, readLockfile } from "@ucdjs/lockfile";
import { printHelp } from "../../cli-utils";
import { green, output, red, yellow } from "../../output";
import { assertRemoteOrStoreDir, createStoreFromFlags, REMOTE_CAPABLE_FLAGS, SHARED_FLAGS } from "./_shared";

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
          ...REMOTE_CAPABLE_FLAGS,
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

  assertRemoteOrStoreDir(flags);

  const store = await createStoreFromFlags({
    baseUrl,
    storeDir,
    remote,
    include: patterns,
    exclude: excludePatterns,
    requireExistingStore: true,
  });

  // Read lockfile to get versions - works with both local and remote stores
  const lockfilePath = getLockfilePath();
  const bridge = store.fs;
  let lockfile;
  try {
    lockfile = await readLockfile(bridge, lockfilePath);
  } catch (err) {
    debug?.("Error reading lockfile:", err);
    if (remote) {
      output.error(red(`\n❌ Error: Could not read lockfile from remote store.`));
      output.error("Verify operation requires a lockfile. For remote stores, the lockfile must be accessible via the API.");
    } else {
      output.error(red(`\n❌ Error: Lockfile not found at ${lockfilePath}`));
      output.error("Run 'ucd store init' to create a new store.");
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
      output.error(red(`\n❌ Error fetching versions: ${apiResult.error.message}`));
      return;
    }
    if (!apiResult.data) {
      output.error(red(`\n❌ Error: No versions data returned from API.`));
      return;
    }
    availableVersions = apiResult.data.map(({ version }) => version);
  } else {
    availableVersions = configResult.data.versions ?? [];
    if (availableVersions.length === 0) {
      const apiResult = await client.versions.list();
      if (apiResult.error) {
        output.error(red(`\n❌ Error fetching versions: ${apiResult.error.message}`));
        return;
      }
      if (!apiResult.data) {
        output.error(red(`\n❌ Error: No versions data returned from API.`));
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
    output.json({
      valid: isValid,
      lockfileVersions,
      availableVersions,
      missingVersions,
      extraVersions,
      validVersions,
    });
    return;
  }

  if (isValid) {
    output.log(green("\n✓ Store verification passed\n"));
    output.log(`All ${lockfileVersions.length} version(s) in lockfile are available in API.`);
  } else {
    output.error(red("\n❌ Store verification failed\n"));
    output.error(`Found ${missingVersions.length} version(s) in lockfile that are not available in API:`);
    for (const version of missingVersions) {
      output.error(`  - ${version}`);
    }
  }

  if (extraVersions.length > 0) {
    output.log(yellow(`\n⚠ Note: ${extraVersions.length} version(s) available in API but not in lockfile:`));
    for (const version of extraVersions) {
      output.log(`  + ${version}`);
    }
    output.log("Run 'ucd store sync' to update the lockfile.");
  }
}
