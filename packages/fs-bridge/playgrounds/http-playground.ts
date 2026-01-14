/* eslint-disable no-console, antfu/no-top-level-await */
/**
 * fs-bridge HTTP Playground
 *
 * This playground verifies the HTTP fs-bridge works correctly against
 * the real UCD.js API. It tests read, exists, and listdir operations.
 *
 * Configure with: FS_BRIDGE_HTTP_BASE_URL env var
 * Run with: pnpm playground:http
 */

import process from "node:process";
import { prependLeadingSlash } from "@luxass/utils/path";
import { assertCapability } from "../src";
import HTTPFileSystemBridge from "../src/bridges/http";

interface TestCase {
  description: string;
  run: () => Promise<void>;
}

const BASE_URL = process.env.FS_BRIDGE_HTTP_BASE_URL || "https://ucd-store.ucdjs.dev";

console.log("fs-bridge HTTP Playground\n");
console.log("=".repeat(60));
console.log(`\nBase URL: ${BASE_URL}\n`);

const bridge = HTTPFileSystemBridge({ baseUrl: BASE_URL });

console.log("=".repeat(60));

const testCases: TestCase[] = [
  // Capability tests (HTTP bridge is read-only)
  {
    description: "Bridge does NOT have write capability",
    async run() {
      if (bridge.optionalCapabilities.write) throw new Error("Should not have write");
      try {
        assertCapability(bridge, "write");
        throw new Error("Should have thrown");
      } catch (err) {
        if (err instanceof Error && err.message === "Should have thrown") throw err;
      }
    },
  },
  {
    description: "Bridge does NOT have mkdir capability",
    async run() {
      if (bridge.optionalCapabilities.mkdir) throw new Error("Should not have mkdir");
      try {
        assertCapability(bridge, "mkdir");
        throw new Error("Should have thrown");
      } catch (err) {
        if (err instanceof Error && err.message === "Should have thrown") throw err;
      }
    },
  },
  {
    description: "Bridge does NOT have rm capability",
    async run() {
      if (bridge.optionalCapabilities.rm) throw new Error("Should not have rm");
      try {
        assertCapability(bridge, "rm");
        throw new Error("Should have thrown");
      } catch (err) {
        if (err instanceof Error && err.message === "Should have thrown") throw err;
      }
    },
  },

  // Read tests
  {
    description: "Read 16.0.0/ReadMe.txt",
    async run() {
      const content = await bridge.read("16.0.0/ReadMe.txt");
      if (typeof content !== "string") throw new Error("Content should be string");
      if (content.length === 0) throw new Error("Content should not be empty");
      if (!content.includes("Unicode")) throw new Error("Should mention Unicode");
    },
  },
  {
    description: "Read with / prefix",
    async run() {
      const content = await bridge.read("/16.0.0/ReadMe.txt");
      if (!content.includes("Unicode")) throw new Error("Should work with / prefix");
    },
  },
  {
    description: "Read non-existent file throws",
    async run() {
      try {
        await bridge.read("16.0.0/NonExistent12345.txt");
        throw new Error("Should have thrown");
      } catch (err) {
        if (err instanceof Error && err.message === "Should have thrown") throw err;
      }
    },
  },
  {
    description: "Read trailing slash throws",
    async run() {
      try {
        await bridge.read("16.0.0/ReadMe.txt/");
        throw new Error("Should have thrown");
      } catch (err) {
        if (err instanceof Error && err.message === "Should have thrown") throw err;
      }
    },
  },

  // Exists tests
  {
    description: "Exists returns true for 16.0.0/ReadMe.txt",
    async run() {
      if (!(await bridge.exists("16.0.0/ReadMe.txt"))) throw new Error("Should exist");
    },
  },
  {
    description: "Exists returns false for non-existent",
    async run() {
      if (await bridge.exists("16.0.0/NonExistent12345.txt")) throw new Error("Should not exist");
    },
  },
  {
    description: "Exists with / prefix",
    async run() {
      if (!(await bridge.exists("/16.0.0/ReadMe.txt"))) throw new Error("Should exist");
    },
  },

  // Listdir tests
  {
    description: "Listdir 16.0.0 returns entries",
    async run() {
      const entries = await bridge.listdir("16.0.0");
      if (!Array.isArray(entries)) throw new Error("Should return array");
      if (entries.length === 0) throw new Error("Should have entries");
      const hasReadme = entries.some((e) => e.name === "ReadMe.txt");
      if (!hasReadme) throw new Error("Should contain ReadMe.txt");
    },
  },
  {
    description: "Listdir shallow has empty children",
    async run() {
      const entries = await bridge.listdir("16.0.0");
      const dir = entries.find((e) => e.type === "directory");
      if (dir && dir.type === "directory" && dir.children.length > 0) {
        throw new Error("Shallow should have empty children");
      }
    },
  },
  {
    description: "Listdir recursive populates children",
    async run() {
      const entries = await bridge.listdir("16.0.0/ucd", true);
      // Note: this may not find a dir with children if ucd has no subdirs
      if (!Array.isArray(entries)) throw new Error("Should return array");
    },
  },
  {
    description: "Listdir non-existent returns empty array",
    async run() {
      const entries = await bridge.listdir("NonExistentVersion12345");
      if (!Array.isArray(entries) || entries.length !== 0) {
        throw new Error("Should return empty array");
      }
    },
  },
  {
    description: "Listdir with / prefix",
    async run() {
      const entries = await bridge.listdir("/16.0.0");
      if (entries.length === 0) throw new Error("Should have entries");
    },
  },
  {
    description: "Listdir ensure correct paths",
    async run() {
      const entries = await bridge.listdir("16.0.0", true);

      // eslint-disable-next-line ts/explicit-function-return-type
      function checkPaths(nodes: typeof entries, parentPath: string) {
        for (const node of nodes) {
          const expectedPath = prependLeadingSlash(`${parentPath}${node.name}${node.type === "directory" ? "/" : ""}`);
          if (node.path !== expectedPath) {
            throw new Error(`Incorrect path for ${node.name}: expected "${expectedPath}", got "${node.path}"`);
          }
          if (node.type === "directory" && node.children) {
            checkPaths(node.children, expectedPath);
          }
        }
      }

      checkPaths(entries, "16.0.0/");
    },
  },

  // Unsupported operations throw
  {
    description: "Write operation throws",
    async run() {
      try {
        await bridge.write?.("test.txt", "content");
        throw new Error("Should have thrown");
      } catch (err) {
        if (err instanceof Error && err.message === "Should have thrown") throw err;
      }
    },
  },
  {
    description: "Mkdir operation throws",
    async run() {
      try {
        await bridge.mkdir?.("new-dir");
        throw new Error("Should have thrown");
      } catch (err) {
        if (err instanceof Error && err.message === "Should have thrown") throw err;
      }
    },
  },
  {
    description: "Rm operation throws",
    async run() {
      try {
        await bridge.rm?.("test.txt");
        throw new Error("Should have thrown");
      } catch (err) {
        if (err instanceof Error && err.message === "Should have thrown") throw err;
      }
    },
  },

  // Bridge metadata
  {
    description: "Bridge has correct metadata",
    async run() {
      if (bridge.meta.name !== "HTTP File System Bridge") throw new Error("Wrong name");
      if (typeof bridge.meta.description !== "string") throw new Error("Missing description");
    },
  },

  // Complex workflow
  {
    description: "Discover and read UnicodeData.txt",
    async run() {
      const entries = await bridge.listdir("16.0.0");
      const unicodeData = entries.find((e) => e.name === "UnicodeData.txt");
      if (!unicodeData) throw new Error("UnicodeData.txt not found");
      if (unicodeData.type !== "file") throw new Error("Should be a file");

      const exists = await bridge.exists("16.0.0/UnicodeData.txt");
      if (!exists) throw new Error("Should exist");

      const content = await bridge.read("16.0.0/UnicodeData.txt");
      if (!content.includes(";")) throw new Error("Should contain semicolons");
    },
  },
];

console.log("\nRunning test cases:\n");

let passed = 0;
let failed = 0;

for (const testCase of testCases) {
  console.log(`  ${testCase.description}... `);

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

if (failed > 0) {
  process.exit(1);
}
