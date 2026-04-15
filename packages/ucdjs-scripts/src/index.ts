#!/usr/bin/env node
import type {
  GlobalOptions,
  RefreshManifestsOptions,
  ReindexVersionsOptions,
  SetupDevOptions,
} from "./types";
import { applyLogLevel, logger } from "#lib/logger";
import cac from "cac";

const cli = cac("ucdjs-scripts");

cli.option("--log-level <level>", "Set log level: debug|info|warn|error");

cli
  .command("setup-dev", "Initialize local API state and seed manifests")
  .option("--versions <versions>", "Comma-separated list of versions to seed (default: predefined dev list)")
  .option("--batch-size <size>", "Number of versions to fetch in parallel", { default: 5 })
  .action(async (opts: GlobalOptions & SetupDevOptions) => {
    applyLogLevel(logger, opts.logLevel);

    const { setupDev } = await import("./commands/setup-dev");
    await setupDev(opts);
  });

cli
  .command("refresh-manifests", "Generate and upload manifests to remote")
  .option("--env <env>", "Target environment: prod, preview, or local")
  .option("--base-url <url>", "Override base URL for upload")
  .option("--task-key <key>", "Secret key for authentication (X-UCDJS-Task-Key)")
  .option("--versions <versions>", "Comma-separated list of versions (default: all from @unicode-utils/core)")
  .option("--dry-run", "Validate manifests without uploading")
  .option("--batch-size <size>", "Number of versions to fetch in parallel", { default: 5 })
  .action(async (opts: GlobalOptions & RefreshManifestsOptions) => {
    applyLogLevel(logger, opts.logLevel);

    const { refreshManifests } = await import("./commands/refresh-manifests");
    await refreshManifests(opts);
  });

cli
  .command("reindex-versions", "Rebuild the versions D1 index from Unicode support metadata")
  .option("--env <env>", "Target environment: prod, preview, or local")
  .option("--base-url <url>", "Override base URL for upload")
  .option("--task-key <key>", "Secret key for authentication (X-UCDJS-Task-Key)")
  .option("--versions <versions>", "Comma-separated list of versions (default: all from @unicode-utils/core)")
  .action(async (opts: GlobalOptions & ReindexVersionsOptions) => {
    applyLogLevel(logger, opts.logLevel);

    const { reindexVersions } = await import("./commands/reindex-versions");
    await reindexVersions(opts);
  });

cli.help();
cli.version("0.0.1");

cli.parse();
