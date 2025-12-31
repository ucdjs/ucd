/* eslint-disable no-console, node/prefer-global/process, ts/explicit-function-return-type, no-restricted-imports */
/**
 * fs-bridge Node.js Playground
 *
 * This playground verifies the fs-bridge path resolution works correctly.
 * It creates a temp directory and tests various path operations to ensure
 * paths are sandboxed correctly.
 *
 * Run with: npx tsx playgrounds/node-playground.ts
 */

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import NodeFileSystemBridge from "../src/bridges/node";

interface TestCase {
  description: string;
  input: string;
  expectedPath?: string; // relative to basePath
  shouldFail?: boolean;
  operation: "read" | "exists" | "listdir";
}

const testCases: TestCase[] = [
  // Basic relative paths
  {
    description: "Simple filename",
    input: "test.txt",
    expectedPath: "test.txt",
    operation: "exists",
  },
  {
    description: "Nested path",
    input: "16.0.0/ReadMe.txt",
    expectedPath: "16.0.0/ReadMe.txt",
    operation: "exists",
  },
  {
    description: "Current directory reference",
    input: ".",
    operation: "listdir",
  },
  {
    description: "Current directory with filename",
    input: "./test.txt",
    expectedPath: "test.txt",
    operation: "exists",
  },

  // Absolute paths (should be treated as relative to basePath)
  {
    description: "Absolute path starting with /",
    input: "/test.txt",
    expectedPath: "test.txt",
    operation: "exists",
  },
  {
    description: "Absolute nested path",
    input: "/16.0.0/ReadMe.txt",
    expectedPath: "16.0.0/ReadMe.txt",
    operation: "exists",
  },

  // Path traversal attempts (should fail)
  {
    description: "Basic traversal ../",
    input: "../escape.txt",
    shouldFail: true,
    operation: "read",
  },
  {
    description: "Nested traversal",
    input: "subdir/../../escape.txt",
    shouldFail: true,
    operation: "read",
  },
  {
    description: "URL encoded traversal",
    input: "%2e%2e%2fescaped.txt",
    shouldFail: true,
    operation: "read",
  },

  // In-boundary traversal (should work)
  {
    description: "In-boundary traversal a/../b",
    input: "a/../test.txt",
    expectedPath: "test.txt",
    operation: "exists",
  },
];

async function runPlayground() {
  console.log("🎮 fs-bridge Node.js Playground\n");
  console.log("=".repeat(60));

  // Create temp directory
  const tempDir = await mkdtemp(join(tmpdir(), "fs-bridge-playground-"));
  console.log(`\n📁 Created temp directory: ${tempDir}\n`);

  try {
    // Set up test files
    await writeFile(join(tempDir, "test.txt"), "Hello from test.txt");
    await mkdir(join(tempDir, "16.0.0"), { recursive: true });
    await writeFile(join(tempDir, "16.0.0/ReadMe.txt"), "Unicode 16.0.0 ReadMe");
    await mkdir(join(tempDir, "subdir"), { recursive: true });
    await writeFile(join(tempDir, "subdir/nested.txt"), "Nested file");

    console.log("📝 Created test files:");
    console.log("   - test.txt");
    console.log("   - 16.0.0/ReadMe.txt");
    console.log("   - subdir/nested.txt");
    console.log("");

    // Create bridge with basePath
    const bridge = NodeFileSystemBridge({ basePath: tempDir });

    console.log(`🔒 Bridge basePath: ${tempDir}\n`);
    console.log("=".repeat(60));
    console.log("\n🧪 Running test cases:\n");

    let passed = 0;
    let failed = 0;

    for (const testCase of testCases) {
      const { description, input, expectedPath, shouldFail, operation } = testCase;

      process.stdout.write(`  ${description}... `);

      try {
        let result: unknown;

        switch (operation) {
          case "read":
            result = await bridge.read(input);
            break;
          case "exists":
            result = await bridge.exists(input);
            break;
          case "listdir":
            result = await bridge.listdir(input);
            break;
        }

        if (shouldFail) {
          console.log("❌ FAIL (expected error, got success)");
          console.log(`     Input: "${input}"`);
          console.log(`     Result: ${JSON.stringify(result)}`);
          failed++;
        } else {
          console.log("✅ PASS");
          if (expectedPath) {
            console.log(`     Input: "${input}" → Expected path: "${expectedPath}"`);
          }
          passed++;
        }
      } catch (error) {
        if (shouldFail) {
          console.log("✅ PASS (correctly rejected)");
          console.log(`     Input: "${input}"`);
          console.log(`     Error: ${(error as Error).message.slice(0, 60)}...`);
          passed++;
        } else {
          console.log("❌ FAIL (unexpected error)");
          console.log(`     Input: "${input}"`);
          console.log(`     Error: ${(error as Error).message}`);
          failed++;
        }
      }

      console.log("");
    }

    console.log("=".repeat(60));
    console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

    // Interactive test: demonstrate the path resolution behavior
    console.log("=".repeat(60));
    console.log("\n🔍 Path Resolution Demo:\n");

    const demoInputs = ["test.txt", "./test.txt", "/test.txt", "16.0.0/ReadMe.txt", "/16.0.0/ReadMe.txt"];

    for (const input of demoInputs) {
      try {
        const content = await bridge.read(input);
        console.log(`  Input: "${input}"`);
        console.log(`  → Read ${content.length} bytes successfully`);
        console.log(`  → Content preview: "${content.slice(0, 30)}..."`);
        console.log("");
      } catch (error) {
        console.log(`  Input: "${input}"`);
        console.log(`  → Error: ${(error as Error).message}`);
        console.log("");
      }
    }

    console.log("=".repeat(60));
    console.log("\n✨ Playground complete!\n");
  } finally {
    // Cleanup
    await rm(tempDir, { recursive: true, force: true });
    console.log(`🧹 Cleaned up temp directory: ${tempDir}\n`);
  }
}

runPlayground().catch((err) => {
  console.error("Playground error:", err);
  process.exit(1);
});
