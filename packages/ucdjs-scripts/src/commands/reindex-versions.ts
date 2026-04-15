import type { ReindexVersionsOptions } from "../types";
import { resolveConfig } from "#lib/config";
import { createLogger } from "#lib/logger";
import { parseVersions } from "#lib/utils";

const logger = createLogger("reindex-versions");

export async function reindexVersions(options: ReindexVersionsOptions): Promise<void> {
  const config = resolveConfig({
    env: options.env,
    baseUrl: options.baseUrl,
    taskKey: options.taskKey,
  });

  const versions = parseVersions(options.versions);
  const url = new URL("/_tasks/reindex-versions", config.baseUrl);

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (config.taskKey) {
    headers["X-UCDJS-Task-Key"] = config.taskKey;
  }

  logger.info(`Target: ${config.baseUrl}`);
  logger.info(
    versions && versions.length > 0
      ? `Reindexing requested versions: ${versions.join(", ")}`
      : "Reindexing all versions from @unicode-utils/core metadata",
  );

  const response = await fetch(url.toString(), {
    method: "POST",
    headers,
    body: JSON.stringify(versions && versions.length > 0 ? { versions } : {}),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Reindex failed: ${response.status} ${response.statusText}\n${errorText}`);
  }

  const result = await response.json() as {
    success: boolean;
    indexed: number;
    skipped: number;
    results: Array<{
      version: string;
      indexed: true;
    }>;
  };
  printResult(result);
}

function printResult(result: {
  success: boolean;
  indexed: number;
  skipped: number;
  results: Array<{
    version: string;
    indexed: true;
  }>;
}): void {
  const divider = "=".repeat(50);
  const lines = [
    "",
    divider,
    "REINDEX RESULT",
    divider,
    `Success: ${result.success}`,
    `Indexed: ${result.indexed}`,
    `Skipped: ${result.skipped}`,
  ];

  if (result.results.length > 0) {
    lines.push("", "Versions:");
    for (const entry of result.results) {
      lines.push(`  - ${entry.version}: indexed`);
    }
  }

  for (const line of lines) {
    logger.info(line);
  }
}
