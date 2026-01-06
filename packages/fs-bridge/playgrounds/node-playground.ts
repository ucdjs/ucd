/* eslint-disable no-console, antfu/no-top-level-await */
/**
 * fs-bridge Node.js Playground
 *
 * This playground verifies the Node.js fs-bridge path resolution
 * and operations work correctly. It creates a temp directory and
 * tests various path patterns and file operations.
 *
 * Run with: pnpm playground:node
 */

import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import process from "node:process";
import NodeFileSystemBridge from "../src/bridges/node";

interface TestCase {
  description: string;
  run: () => Promise<void>;
}

const tempDir = await mkdtemp(join(tmpdir(), "fs-bridge-node-playground-"));

console.log("fs-bridge Node.js Playground\n");
console.log("=".repeat(60));
console.log(`\nCreated temp directory: ${tempDir}\n`);

// Set up initial test files
await writeFile(join(tempDir, "test.txt"), "Hello from test.txt");
await mkdir(join(tempDir, "16.0.0"), { recursive: true });
await writeFile(join(tempDir, "16.0.0/ReadMe.txt"), "Unicode 16.0.0 ReadMe");
await mkdir(join(tempDir, "subdir"), { recursive: true });
await writeFile(join(tempDir, "subdir/nested.txt"), "Nested file");

console.log("Created test files:");
console.log("   - test.txt");
console.log("   - 16.0.0/ReadMe.txt");
console.log("   - subdir/nested.txt\n");

const bridge = NodeFileSystemBridge({ basePath: tempDir });

console.log(`Bridge basePath: ${tempDir}\n`);
console.log("=".repeat(60));

const testCases: TestCase[] = [
  // Read tests
  {
    description: "Read simple filename",
    async run() {
      const content = await bridge.read("test.txt");
      if (content !== "Hello from test.txt") throw new Error("Content mismatch");
    },
  },
  {
    description: "Read nested path",
    async run() {
      const content = await bridge.read("16.0.0/ReadMe.txt");
      if (content !== "Unicode 16.0.0 ReadMe") throw new Error("Content mismatch");
    },
  },
  {
    description: "Read with ./ prefix",
    async run() {
      const content = await bridge.read("./test.txt");
      if (content !== "Hello from test.txt") throw new Error("Content mismatch");
    },
  },
  {
    description: "Read with / prefix (treated as relative to basePath)",
    async run() {
      const content = await bridge.read("/test.txt");
      if (content !== "Hello from test.txt") throw new Error("Content mismatch");
    },
  },
  {
    description: "Read trailing slash should fail",
    async run() {
      try {
        await bridge.read("test.txt/");
        throw new Error("Should have thrown");
      } catch (err) {
        if (err instanceof Error && err.message === "Should have thrown") throw err;
      }
    },
  },

  // Exists tests
  {
    description: "Exists returns true for file",
    async run() {
      if (!(await bridge.exists("test.txt"))) throw new Error("Should exist");
    },
  },
  {
    description: "Exists returns true for directory",
    async run() {
      if (!(await bridge.exists("subdir"))) throw new Error("Should exist");
    },
  },
  {
    description: "Exists returns false for non-existent",
    async run() {
      if (await bridge.exists("non-existent.txt")) throw new Error("Should not exist");
    },
  },
  {
    description: "Exists with / prefix",
    async run() {
      if (!(await bridge.exists("/test.txt"))) throw new Error("Should exist");
    },
  },

  // Write tests
  {
    description: "Write new file",
    async run() {
      await bridge.write("new-file.txt", "New content");
      const content = await bridge.read("new-file.txt");
      if (content !== "New content") throw new Error("Content mismatch");
    },
  },
  {
    description: "Write overwrites existing file",
    async run() {
      await bridge.write("new-file.txt", "Updated content");
      const content = await bridge.read("new-file.txt");
      if (content !== "Updated content") throw new Error("Content mismatch");
    },
  },
  {
    description: "Write auto-creates parent directories",
    async run() {
      await bridge.write("auto/created/path/file.txt", "Auto-created");
      const content = await bridge.read("auto/created/path/file.txt");
      if (content !== "Auto-created") throw new Error("Content mismatch");
    },
  },
  {
    description: "Write with / prefix",
    async run() {
      await bridge.write("/absolute-style.txt", "Absolute style");
      const content = await bridge.read("absolute-style.txt");
      if (content !== "Absolute style") throw new Error("Content mismatch");
    },
  },
  {
    description: "Write trailing slash should fail",
    async run() {
      try {
        await bridge.write("invalid/", "content");
        throw new Error("Should have thrown");
      } catch (err) {
        if (err instanceof Error && err.message === "Should have thrown") throw err;
      }
    },
  },

  // Mkdir tests
  {
    description: "Mkdir creates directory",
    async run() {
      await bridge.mkdir("new-dir");
      if (!(await bridge.exists("new-dir"))) throw new Error("Directory should exist");
    },
  },
  {
    description: "Mkdir creates nested directories",
    async run() {
      await bridge.mkdir("deep/nested/dirs");
      if (!(await bridge.exists("deep/nested/dirs"))) throw new Error("Directory should exist");
    },
  },
  {
    description: "Mkdir is idempotent",
    async run() {
      await bridge.mkdir("new-dir"); // Should not throw
    },
  },
  {
    description: "Mkdir with / prefix",
    async run() {
      await bridge.mkdir("/absolute-dir");
      if (!(await bridge.exists("absolute-dir"))) throw new Error("Directory should exist");
    },
  },

  // Listdir tests
  {
    description: "Listdir returns entries",
    async run() {
      const entries = await bridge.listdir("subdir");
      if (entries.length !== 1) throw new Error("Should have 1 entry");
      if (entries[0].name !== "nested.txt") throw new Error("Wrong entry name");
    },
  },
  {
    description: "Listdir shallow has empty children",
    async run() {
      const entries = await bridge.listdir(".");
      const dir = entries.find((e) => e.type === "directory");
      if (dir && dir.type === "directory" && dir.children.length > 0) {
        throw new Error("Shallow listdir should have empty children");
      }
    },
  },
  {
    description: "Listdir recursive populates children",
    async run() {
      await bridge.mkdir("recursive-test/sub");
      await bridge.write("recursive-test/sub/file.txt", "content");
      const entries = await bridge.listdir("recursive-test", true);
      const sub = entries.find((e) => e.name === "sub");
      if (!sub || sub.type !== "directory" || sub.children.length !== 1) {
        throw new Error("Recursive should populate children");
      }
    },
  },

  // Rm tests
  {
    description: "Rm removes file",
    async run() {
      await bridge.write("to-remove.txt", "content");
      await bridge.rm("to-remove.txt");
      if (await bridge.exists("to-remove.txt")) throw new Error("File should be removed");
    },
  },
  {
    description: "Rm recursive removes directory",
    async run() {
      await bridge.mkdir("rm-dir/nested");
      await bridge.write("rm-dir/file.txt", "content");
      await bridge.rm("rm-dir", { recursive: true });
      if (await bridge.exists("rm-dir")) throw new Error("Directory should be removed");
    },
  },
  {
    description: "Rm with force on non-existent does not throw",
    async run() {
      await bridge.rm("non-existent-rm.txt", { force: true });
    },
  },
  {
    description: "Rm without force on non-existent throws",
    async run() {
      try {
        await bridge.rm("non-existent-rm-no-force.txt");
        throw new Error("Should have thrown");
      } catch (err) {
        if (err instanceof Error && err.message === "Should have thrown") throw err;
      }
    },
  },
];

console.log("\nRunning test cases:\n");

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  process.stdout.write(`  ${testCase.description}... `);

  try {
    await testCase.run();
    console.log("PASS");
    passed++;
  } catch (error) {
    console.log("FAIL");
    console.log(`     Error: ${(error as Error).message}`);
    failed++;
  }
}

console.log(`\n${"=".repeat(60)}`);
console.log(`\nResults: ${passed} passed, ${failed} failed\n`);

// Cleanup
await rm(tempDir, { recursive: true, force: true });
console.log(`Cleaned up temp directory: ${tempDir}\n`);

if (failed > 0) {
  process.exitCode = 1;
}
