/* eslint-disable no-console, node/prefer-global/process */
// Run with: pnpm playground:node

import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createNodeUCDStore } from "../src/factory";
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
  const tempDir = await mkdtemp(join(tmpdir(), "ucd-store-node-playground-"));

  printHeader("Node.js UCD Store Playground");

  try {
    printSection("Creating Store");
    console.log(`📁 Temp directory: ${tempDir}\n`);

    const startCreate = performance.now();
    const store = await createNodeUCDStore({
      basePath: tempDir,
      versions: ["16.0.0", "17.0.0"],
      requireExistingStore: false,
      verify: false,
    });
    const createTime = performance.now() - startCreate;

    console.log(`✅ Created in ${formatDuration(createTime)}`);
    console.log(`Versions: ${store.versions.join(", ")}`);

    printSection("Mirroring Files");

    const startMirror = performance.now();
    const [mirrorData, mirrorError] = await store.mirror({ versions: ["16.0.0", "17.0.0"] });
    const mirrorTime = performance.now() - startMirror;

    if (!mirrorError) {
      console.log(`✅ Mirror completed in ${formatDuration(mirrorTime)}\n`);

      for (const [version, report] of mirrorData.versions) {
        console.log(`${version}:`);
        console.log(`  Downloaded: ${report.counts.downloaded} files`);
        console.log(`  Skipped: ${report.counts.skipped} files`);
        console.log(`  Failed: ${report.counts.failed} files`);
        console.log(`  Success rate: ${report.metrics.successRate.toFixed(1)}%`);
      }
    } else {
      console.log(`❌ Mirror failed: ${mirrorError}`);
    }

    printSection("File Operations");

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
        description: "List files in 17.0.0/",
        fn: async () => {
          const [data, error] = await store.files.list("17.0.0");
          if (error) {
            throw error;
          }
          console.log(`     Found: ${data.length} files`);
          console.log(`     First 3: ${data.slice(0, 3).join(", ")}`);
        },
      },
      {
        description: "Get file tree for version 16.0.0",
        fn: async () => {
          const [data, error] = await store.files.tree("16.0.0");
          if (error) {
            throw error;
          }

          // Count nodes in tree
          let totalNodes = 0;
          let totalSize = 0;

          function countNodes(nodes: any[]): void {
            for (const node of nodes) {
              totalNodes++;
              if (node.type === "file" && node.size !== undefined) {
                totalSize += node.size;
              }
              if (node.children) {
                countNodes(node.children);
              }
            }
          }

          countNodes(data);
          console.log(`     Total nodes: ${totalNodes}`);
          console.log(`     Total size: ${formatBytes(totalSize)}`);
        },
      },
    ];

    const fileResults = await runTests(fileTests);

    printSection("Analysis");

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
        console.log(`     - Present files: ${report.counts.present}`);
        console.log(`     - Missing files: ${report.counts.missing}`);
        console.log(`     - Orphaned files: ${report.counts.orphaned}`);
        console.log(`     - Complete: ${report.isComplete ? "Yes" : "No"}`);
      }

      console.log(`\n   Total files across versions: ${totalFiles}`);
    } else {
      console.log(`❌ Analysis failed: ${analysisError}`);
    }

    printResults(fileResults.passed, fileResults.failed);

    printSection("Comparison");

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
        console.log(`\n   New files (first 3):`);
        for (const file of comparison.added.slice(0, 3)) {
          console.log(`     - ${file}`);
        }
      }
    } else {
      console.log(`❌ Comparison failed: ${compareError}`);
    }
    printItem("Versions", store.versions.join(", "));

    const totalTime = performance.now() - startTime;
    console.log(`\nTotal playground time: ${formatDuration(totalTime)}`);

    printFooter();
  } catch (error) {
    console.error("\n❌ Playground error:", error);
    process.exit(1);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
    printCleanup(`Cleaned up temp directory: ${tempDir}`);
  }
}

runPlayground().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
