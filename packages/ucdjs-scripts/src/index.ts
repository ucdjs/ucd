#!/usr/bin/env node
import cac from "cac";
import { applyLogLevel, logger } from "./lib/logger";

const cli = cac("ucdjs-scripts");

cli
  .command("setup-dev", "Seed local API environment with manifests")
  .option("--versions <versions>", "Comma-separated list of versions to seed (default: predefined dev list)")
  .option("--batch-size <size>", "Number of versions to fetch in parallel", { default: 5 })
  .action(async (options) => {
    applyLogLevel(logger, options.logLevel);

    const { setupDev } = await import("./commands/setup-dev");
    await setupDev(options);
  });

cli
  .command("refresh-manifests", "Generate and upload manifests to remote")
  .option("--env <env>", "Target environment: prod, preview, or local")
  .option("--base-url <url>", "Override base URL for upload")
  .option("--setup-key <key>", "Secret key for authentication (X-UCDJS-Setup-Key)")
  .option("--versions <versions>", "Comma-separated list of versions (default: all from API)")
  .option("--dry-run", "Validate manifests without uploading")
  .option("--batch-size <size>", "Number of versions to fetch in parallel", { default: 5 })
  .action(async (options) => {
    applyLogLevel(logger, options.logLevel);

    const { refreshManifests } = await import("./commands/refresh-manifests");
    await refreshManifests(options);
  });

cli.help();
cli.version("0.0.1");

cli.parse();
