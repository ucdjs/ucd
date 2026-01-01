/* eslint-disable no-console, node/prefer-global/process */
// Run with: pnpm playground:memory

import { createMemoryMockFS } from "../../test-utils/src/fs-bridges/memory-fs-bridge";
import { createUCDStore } from "../src/store";
import {
  formatDuration,
  printCleanup,
  printFooter,
  printHeader,
  printResults,
  printSection,
  runTests,
} from "./__utils";

async function runPlayground(): Promise<void> {
  const startTime = performance.now();
  printHeader("In-Memory UCD Store Playground");

  try {
    printSection("Creating Store");

    const startCreate = performance.now();
    const memoryFs = createMemoryMockFS();

    const store = await createUCDStore({
      fs: () => memoryFs,
      versions: ["16.0.0", "17.0.0"],
      requireExistingStore: false,
      verify: false, // Skip verification for in-memory testing
    });

    const createTime = performance.now() - startCreate;
    console.log(`✅ Created in ${formatDuration(createTime)}`);
    console.log(`Versions: ${store.versions.join(", ")}`);

    printSection("Operations");

    const basicTests = [
      {
        description: "List files in 16.0.0/",
        fn: async () => {
          const [data, error] = await store.files.list("16.0.0");
          if (error) {
            throw error;
          }
          console.log(`     Found: ${data.length} files`);
        },
      },
      {
        description: "Get file tree for version 17.0.0",
        fn: async () => {
          const [data, error] = await store.files.tree("17.0.0");
          if (error) {
            throw error;
          }

          // Count top-level nodes
          console.log(`     Top-level nodes: ${data.length}`);
        },
      },
      {
        description: "Try to get a non-existent file",
        fn: async () => {
          const [, error] = await store.files.get("16.0.0", "nonexistent.txt");
          if (error) {
            throw error;
          }
        },
        shouldFail: true,
      },
    ];

    const basicResults = await runTests(basicTests);

    printSection("Analysis");

    const startAnalyze = performance.now();
    const [analysisData, analysisError] = await store.analyze({ versions: ["16.0.0", "17.0.0"] });
    const analyzeTime = performance.now() - startAnalyze;

    if (!analysisError) {
      console.log(`✅ Analysis completed in ${formatDuration(analyzeTime)}\n`);

      let totalExpectedFiles = 0;

      console.log("By version:");
      for (const [version, report] of analysisData) {
        totalExpectedFiles += report.counts.expected;
        console.log(`   ${version}:`);
        console.log(`     - Total expected files: ${report.counts.expected}`);
        console.log(`     - Present files: ${report.counts.present}`);
        console.log(`     - Missing files: ${report.counts.missing}`);
        console.log(`     - Orphaned files: ${report.counts.orphaned}`);
        console.log(`     - Complete: ${report.isComplete ? "Yes" : "No"}`);
      }

      console.log(`\n   Total expected files across versions: ${totalExpectedFiles}`);
    } else {
      console.log(`❌ Analysis failed: ${analysisError}`);
    }

    // Step 4: Compare versions
    printSection("Comparison");

    const startCompare = performance.now();
    const [comparison, compareError] = await store.compare({ from: "16.0.0", to: "17.0.0" });
    const compareTime = performance.now() - startCompare;

    if (!compareError) {
      console.log(`✅ Comparison completed in ${formatDuration(compareTime)}\n`);

      console.log("   16.0.0 → 17.0.0:");
      console.log(`     Added: ${comparison.added.length}, Removed: ${comparison.removed.length}, Modified: ${comparison.modified.length}, Unchanged: ${comparison.unchanged}`);
    } else {
      console.log(`❌ Comparison failed: ${compareError}`);
    }

    // Final results
    printResults(basicResults.passed, basicResults.failed);

    // Step 5: Performance characteristics
    printSection("Step 5: Performance Insights");

    console.log("In-memory testing characteristics:");
    console.log("   ✅ No disk I/O");
    console.log("   ✅ Perfect for rapid iteration");
    console.log("   ⚠️  Data not persisted");

    const totalTime = performance.now() - startTime;
    console.log(`\nTotal playground time: ${formatDuration(totalTime)}`);

    printFooter();
  } catch (error) {
    console.error("\n❌ Playground error:", error);
    process.exit(1);
  } finally {
    printCleanup("In-memory playground complete!");
  }
}

runPlayground().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
