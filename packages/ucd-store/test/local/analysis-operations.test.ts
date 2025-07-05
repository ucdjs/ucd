import { beforeEach, describe, expect, it, vi } from "vitest";
import { createTestDirs } from "vitest-testdirs";
import { createLocalUCDStore } from "../../src/factory";
import type { FileSystemBridge } from "@ucdjs/utils/fs-bridge";

describe("local ucd store - analysis operations", () => {
  let testDirs: Awaited<ReturnType<typeof createTestDirs>>;
  let mockFS: FileSystemBridge;

  beforeEach(async () => {
    testDirs = await createTestDirs();
    vi.clearAllMocks();

    // Create a mock file system bridge
    mockFS = {
      async exists(path: string) {
        try {
          await testDirs.fs.stat(path);
          return true;
        } catch {
          return false;
        }
      },
      async mkdir(path: string) {
        await testDirs.fs.mkdir(path, { recursive: true });
      },
      async read(path: string) {
        return await testDirs.fs.readFile(path, "utf8");
      },
      async write(path: string, content: string) {
        await testDirs.fs.writeFile(path, content);
      },
      async rm(path: string) {
        await testDirs.fs.rm(path, { recursive: true, force: true });
      },
      async stat(path: string) {
        const stats = await testDirs.fs.stat(path);
        return {
          size: stats.size,
          isDirectory: () => stats.isDirectory(),
          isFile: () => stats.isFile(),
        };
      },
      async listdir(path: string, recursive = false) {
        const entries: string[] = [];
        
        async function walkDir(dir: string) {
          const items = await testDirs.fs.readdir(dir);
          for (const item of items) {
            const fullPath = `${dir}/${item}`;
            const stat = await testDirs.fs.stat(fullPath);
            if (stat.isDirectory()) {
              if (recursive) {
                await walkDir(fullPath);
              }
            } else {
              entries.push(fullPath);
            }
          }
        }
        
        await walkDir(path);
        return entries;
      },
    };
  });

  describe("analyze", () => {
    it("should analyze local store with files", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      // Create test files
      await testDirs.fs.mkdir(`${storeDir}/${version}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version}/ArabicShaping.txt`, "Arabic shaping data");
      await testDirs.fs.writeFile(`${storeDir}/${version}/BidiBrackets.txt`, "Bidi brackets data");
      await testDirs.fs.writeFile(`${storeDir}/${version}/nested/file.txt`, "Nested file");
      
      // Create manifest
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      const result = await store.analyze();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalFiles).toBe(3);
        expect(result.versions).toHaveLength(1);
        expect(result.versions[0].version).toBe(version);
        expect(result.versions[0].fileCount).toBe(3);
        expect(result.versions[0].isComplete).toBe(true);
        expect(result.storeHealth).toBe("healthy");
      }
    });

    it("should calculate file sizes when requested", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      // Create test files with known sizes
      await testDirs.fs.mkdir(`${storeDir}/${version}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version}/file1.txt`, "1234567890"); // 10 bytes
      await testDirs.fs.writeFile(`${storeDir}/${version}/file2.txt`, "12345"); // 5 bytes
      
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      const result = await store.analyze({ calculateSizes: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalSize).toBe(15); // 10 + 5 bytes
        expect(result.versions[0].totalSize).toBe(15);
      }
    });

    it("should detect orphaned files", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      // Create legitimate files
      await testDirs.fs.mkdir(`${storeDir}/${version}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version}/ArabicShaping.txt`, "Data");
      
      // Create orphaned files
      await testDirs.fs.writeFile(`${storeDir}/orphaned-file.txt`, "Orphaned");
      await testDirs.fs.writeFile(`${storeDir}/${version}/orphaned-in-version.txt`, "Orphaned in version");
      
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      const result = await store.analyze({ checkOrphaned: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove.length).toBeGreaterThan(0);
        expect(result.storeHealth).toBe("needs_cleanup");
      }
    });

    it("should handle empty store", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      // Create empty version directory
      await testDirs.fs.mkdir(`${storeDir}/${version}`, { recursive: true });
      
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      const result = await store.analyze();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalFiles).toBe(0);
        expect(result.versions[0].fileCount).toBe(0);
        expect(result.storeHealth).toBe("healthy");
      }
    });

    it("should handle multiple versions", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version1 = "15.0.0";
      const version2 = "15.1.0";
      
      // Create files for version 1
      await testDirs.fs.mkdir(`${storeDir}/${version1}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version1}/file1.txt`, "Data 1");
      await testDirs.fs.writeFile(`${storeDir}/${version1}/file2.txt`, "Data 2");
      
      // Create files for version 2
      await testDirs.fs.mkdir(`${storeDir}/${version2}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version2}/file3.txt`, "Data 3");
      
      const manifest = [
        { version: version1, path: `${storeDir}/${version1}` },
        { version: version2, path: `${storeDir}/${version2}` },
      ];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      const result = await store.analyze();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.totalFiles).toBe(3);
        expect(result.versions).toHaveLength(2);
        expect(result.versions[0].fileCount).toBe(2);
        expect(result.versions[1].fileCount).toBe(1);
      }
    });

    it("should handle analysis failure", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      // Mock getFilePaths to fail
      vi.spyOn(store, "getFilePaths").mockRejectedValue(new Error("File system error"));

      const result = await store.analyze();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Analysis failed");
      }
    });

    it("should handle version analysis failure", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      // Mock getFilePaths to fail for this version
      vi.spyOn(store, "getFilePaths").mockImplementation(async (v) => {
        if (v === version) {
          throw new Error("Version access error");
        }
        return [];
      });

      const result = await store.analyze();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.versions[0].isComplete).toBe(false);
        expect(result.versions[0].missingFiles).toBeDefined();
        expect(result.storeHealth).toBe("corrupted");
      }
    });
  });

  describe("clean", () => {
    it("should clean orphaned files", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      // Create legitimate files
      await testDirs.fs.mkdir(`${storeDir}/${version}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version}/ArabicShaping.txt`, "Data");
      
      // Create orphaned files
      await testDirs.fs.writeFile(`${storeDir}/orphaned-file.txt`, "Orphaned");
      
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      const result = await store.clean();

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.deletedCount).toBeGreaterThan(0);
        expect(result.removedFiles.length).toBeGreaterThan(0);
      }
    });

    it("should perform dry run without removing files", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      // Create legitimate files
      await testDirs.fs.mkdir(`${storeDir}/${version}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version}/ArabicShaping.txt`, "Data");
      
      // Create orphaned files
      await testDirs.fs.writeFile(`${storeDir}/orphaned-file.txt`, "Orphaned");
      
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      const result = await store.clean({ dryRun: true });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.filesToRemove.length).toBeGreaterThan(0);
        // Files should still exist after dry run
        expect(await testDirs.fs.stat(`${storeDir}/orphaned-file.txt`)).toBeDefined();
      }
    });

    it("should clean specific versions only", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version1 = "15.0.0";
      const version2 = "15.1.0";
      
      // Create files for both versions
      await testDirs.fs.mkdir(`${storeDir}/${version1}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version1}/file1.txt`, "Data 1");
      
      await testDirs.fs.mkdir(`${storeDir}/${version2}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version2}/file2.txt`, "Data 2");
      
      const manifest = [
        { version: version1, path: `${storeDir}/${version1}` },
        { version: version2, path: `${storeDir}/${version2}` },
      ];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      const result = await store.clean({ versions: [version1] });

      expect(result.success).toBe(true);
      if (result.success) {
        // Should only target version1 files
        expect(result.filesToRemove.every(f => f.startsWith(version1))).toBe(true);
      }
    });

    it("should handle clean with force option", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      await testDirs.fs.mkdir(`${storeDir}/${version}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version}/file.txt`, "Data");
      
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      const result = await store.clean({ force: true });

      expect(result.success).toBe(true);
    });

    it("should handle clean failure during analysis", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      // Mock analyze to fail
      vi.spyOn(store, "analyze").mockResolvedValue({
        success: false,
        error: "Analysis failed",
      });

      const result = await store.clean();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to analyze store before cleaning");
      }
    });

    it("should handle partial clean failures", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      // Create legitimate files
      await testDirs.fs.mkdir(`${storeDir}/${version}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version}/file.txt`, "Data");
      
      // Create orphaned files
      await testDirs.fs.writeFile(`${storeDir}/orphaned1.txt`, "Orphaned 1");
      await testDirs.fs.writeFile(`${storeDir}/orphaned2.txt`, "Orphaned 2");
      
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      // Mock filesystem to fail on specific file
      const originalRM = mockFS.rm;
      mockFS.rm = vi.fn().mockImplementation(async (path: string) => {
        if (path.includes("orphaned1.txt")) {
          throw new Error("Permission denied");
        }
        return originalRM.call(mockFS, path);
      });

      const result = await store.clean();

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.partialResults).toBeDefined();
        expect(result.partialResults!.failedRemovals.length).toBeGreaterThan(0);
      }
    });

    it("should update manifest after successful clean", async () => {
      const storeDir = testDirs.dir("ucd-store");
      const version = "15.0.0";
      
      // Create a version with files
      await testDirs.fs.mkdir(`${storeDir}/${version}`, { recursive: true });
      await testDirs.fs.writeFile(`${storeDir}/${version}/file.txt`, "Data");
      
      // Create orphaned files that will be removed
      await testDirs.fs.writeFile(`${storeDir}/orphaned.txt`, "Orphaned");
      
      const manifest = [{ version, path: `${storeDir}/${version}` }];
      await testDirs.fs.writeFile(`${storeDir}/.ucd-store.json`, JSON.stringify(manifest));

      const store = await createLocalUCDStore({
        basePath: storeDir,
        fs: mockFS,
      });

      const result = await store.clean();

      expect(result.success).toBe(true);
      
      // Verify manifest still exists and is valid
      const manifestContent = await testDirs.fs.readFile(`${storeDir}/.ucd-store.json`, "utf8");
      const updatedManifest = JSON.parse(manifestContent);
      expect(updatedManifest).toEqual(manifest);
    });
  });
});