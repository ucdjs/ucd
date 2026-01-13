#!/usr/bin/env node
import type { GlobalOptions, RefreshManifestsOptions, SetupDevOptions } from "./types";
import { applyLogLevel, logger } from "#lib/logger";
import cac from "cac";

const cli = cac("ucdjs-scripts");

cli.option("--log-level <level>", "Set log level: debug|info|warn|error");

cli
  .command("setup-dev", "Seed local API environment with manifests")
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
  .option("--setup-key <key>", "Secret key for authentication (X-UCDJS-Setup-Key)")
  .option("--versions <versions>", "Comma-separated list of versions (default: all from API)")
  .option("--dry-run", "Validate manifests without uploading")
  .option("--batch-size <size>", "Number of versions to fetch in parallel", { default: 5 })
  .action(async (opts: GlobalOptions & RefreshManifestsOptions) => {
    applyLogLevel(logger, opts.logLevel);

    const { refreshManifests } = await import("./commands/refresh-manifests");
    await refreshManifests(opts);
  });

cli.help();
cli.version("0.0.1");

cli.parse();
