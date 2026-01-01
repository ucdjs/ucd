/* eslint-disable no-console, node/prefer-global/process */
/**
 * HTTP UCD Store Playground
 *
 * This playground demonstrates how to use the UCD store with the HTTP file system bridge.
 * It showcases:
 * - Creating a store that fetches from a remote API (supports both api.ucdjs.dev and preview.api.ucdjs.dev)
 * - Discovering versions from the API
 * - Fetching and listing files from remote sources
 * - Analyzing and comparing versions without local storage
 *
 * Environment variables:
 * - UCDJS_API_BASE_URL: Set to override the default API URL
 *   Default: https://api.ucdjs.dev
 *   Example: UCDJS_API_BASE_URL=https://preview.api.ucdjs.dev pnpm playground:http
 *
 * Run with: pnpm playground:http
 */

import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createHTTPUCDStore } from "../src/factory";
import {
  formatBytes,
  formatDuration,
  printCleanup,
  printFooter,
  printHeader,
  printItem,
  printResults,
  printSection,
  runTests,
} from "./__utils";

async function runPlayground(): Promise<void> {
  const startTime = performance.now();

  printHeader("HTTP UCD Store Playground");

  try {
    // Step 1: Create store
    printSection("Step 1: Creating HTTP UCD Store");
    console.log(`🌐 API Base URL: ${UCDJS_API_BASE_URL}\n`);

    const startCreate = performance.now();
    const store = await createHTTPUCDStore({
      baseUrl: UCDJS_API_BASE_URL,
      versions: ["16.0.0", "17.0.0"],
      verify: true,
    });
    const createTime = performance.now() - startCreate;

    console.log(`✅ Store created successfully in ${formatDuration(createTime)}`);
    console.log(`📚 Versions: ${store.versions.join(", ")}`);

    // Step 2: Test file operations
    printSection("Step 2: Testing File Operations");

    const fileTests = [
      {
        description: "Get ArabicShaping.txt from version 16.0.0",
        fn: async () => {
          const [data, error] = await store.files.get("16.0.0", "ArabicShaping.txt");
          if (error) {
            throw error;
          }
          console.log(`     Retrieved: ${formatBytes(data.length)} bytes`);
        },
      },
      {
        description: "List first 10 files in 17.0.0/",
        fn: async () => {
          const [data, error] = await store.files.list("17.0.0");
          if (error) {
            throw error;
          }
          console.log(`     Found: ${data.length} files`);
          console.log(`     First 10: ${data.slice(0, 10).join(", ")}`);
        },
      },
      {
        description: "Get file tree for version 16.0.0 (top level)",
        fn: async () => {
          const [data, error] = await store.files.tree("16.0.0");
          if (error) {
            throw error;
          }

          // Count top-level nodes
          console.log(`     Top-level nodes: ${data.length}`);
          if (data.length > 0) {
            const firstNode = data[0]!;
            console.log(`     First node: ${firstNode.name || "root"} (${firstNode.type})`);
          }
        },
      },
    ];

    const fileResults = await runTests(fileTests);

    // Step 3: Analyze
    printSection("Step 3: Analyzing Store");

    const startAnalyze = performance.now();
    const [analysisData, analysisError] = await store.analyze({ versions: ["16.0.0", "17.0.0"] });
    const analyzeTime = performance.now() - startAnalyze;

    if (!analysisError) {
      console.log(`✅ Analysis completed in ${formatDuration(analyzeTime)}\n`);

      let totalFiles = 0;

      console.log("Analysis results by version:");
      for (const [version, report] of analysisData) {
        totalFiles += report.counts.present;
        console.log(`   ${version}:`);
        console.log(`     - Total expected files: ${report.counts.expected}`);
        console.log(`     - Present files: ${report.counts.present}`);
        console.log(`     - Missing files: ${report.counts.missing}`);
        console.log(`     - Orphaned files: ${report.counts.orphaned}`);

        // Show file type breakdown
        const fileTypesSorted = Object.entries(report.fileTypes)
          .sort(([, countA], [, countB]) => countB - countA)
          .slice(0, 5);

        if (fileTypesSorted.length > 0) {
          console.log(`     - Top file types:`);
          for (const [ext, count] of fileTypesSorted) {
            console.log(`       • ${ext}: ${count} files`);
          }
        }
      }

      console.log(`\n   Total files across versions: ${totalFiles}`);
    } else {
      console.log(`❌ Analysis failed: ${analysisError}`);
    }

    // Step 4: Compare versions
    printSection("Step 4: Comparing Versions");

    const startCompare = performance.now();
    const [comparison, compareError] = await store.compare({ from: "16.0.0", to: "17.0.0" });
    const compareTime = performance.now() - startCompare;

    if (!compareError) {
      console.log(`✅ Comparison completed in ${formatDuration(compareTime)}\n`);

      printItem("Files added", comparison.added.length);
      printItem("Files removed", comparison.removed.length);
      printItem("Files modified", comparison.modified.length);
      printItem("Files unchanged", comparison.unchanged);

      if (comparison.added.length > 0) {
        console.log(`\n   New files in 17.0.0 (first 5):`);
        for (const file of comparison.added.slice(0, 5)) {
          console.log(`     - ${file}`);
        }
      }

      if (comparison.removed.length > 0) {
        console.log(`\n   Files removed from 16.0.0 (first 5):`);
        for (const file of comparison.removed.slice(0, 5)) {
          console.log(`     - ${file}`);
        }
      }

      if (comparison.modified.length > 0) {
        console.log(`\n   Modified files (first 5):`);
        for (const file of comparison.modified.slice(0, 5)) {
          console.log(`     - ${file}`);
        }
      }
    } else {
      console.log(`❌ Comparison failed: ${compareError}`);
    }

    // Final results
    printResults(fileResults.passed, fileResults.failed);

    // Print metadata
    printSection("Store Metadata");
    printItem("Base URL", UCDJS_API_BASE_URL);
    printItem("Versions", store.versions.join(", "));

    const totalTime = performance.now() - startTime;
    console.log(`\nTotal playground time: ${formatDuration(totalTime)}`);

    printFooter();
  } catch (error) {
    console.error("\n❌ Playground error:", error);
    process.exit(1);
  } finally {
    printCleanup("HTTP playground complete!");
  }
}

runPlayground().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
