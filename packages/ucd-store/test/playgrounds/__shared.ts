import { expect, it } from "vitest";
import { UCDStore } from "../../src/store";

export interface PlaygroundTestOptions {
  store: UCDStore;
  testVersion?: string;
  skipOrphanedTest?: boolean;
}

export function runPlaygroundTests(options: PlaygroundTestOptions): void {
  const { store, testVersion = "15.1.0", skipOrphanedTest = false } = options;

  it("should create a valid UCDStore instance", () => {
    expect(store).toBeInstanceOf(UCDStore);
  });

  it("should have basePath configured", () => {
    expect(store.basePath).toBeDefined();
  });

  it("should have required filesystem capabilities", () => {
    const requiredCapabilities = ["read", "exists", "listdir"] as const;

    expect(store.fs.capabilities).toBeDefined();

    for (const cap of requiredCapabilities) {
      expect(store.fs.capabilities[cap]).toBe(true);
    }
  });

  const writeCapabilities = ["write", "mkdir", "rm"] as const;
  const hasWriteCapabilities = writeCapabilities.every((cap) => store.fs.capabilities?.[cap]);

  if (hasWriteCapabilities) {
    it("should support basic file write and read operations", async () => {
      // check if data directory exists, create if needed
      const dataDirPath = "./ucd-data";
      const dataDirExists = await store.fs.exists(dataDirPath);

      if (!dataDirExists && store.fs.capabilities.mkdir) {
        await store.fs.mkdir(dataDirPath);
      }

      const testFile = "./ucd-data/test.txt";
      const testContent = "Hello from UCD Store!";

      await store.fs.write(testFile, testContent);
      const content = await store.fs.read(testFile);
      expect(content).toBe(testContent);

      // clean up test file
      await store.fs.rm(testFile);
    });

    it("should initialize the store successfully", async () => {
      await store.init();
      expect(store.initialized).toBe(true);
    });

    it("should analyze the store and return correct version data", async () => {
      const [analyses, error] = await store.analyze({
        versions: [testVersion],
        checkOrphaned: true,
      });

      expect(analyses).toBeDefined();
      expect(error).toBeNull();
      expect(analyses[0]).toBeDefined();

      const [analysis] = analyses;
      expect(analysis.version).toBe(testVersion);
    });

    if (!skipOrphanedTest) {
      it("should detect orphaned files correctly", async () => {
        // write an orphaned file
        await store.fs.write(`./${testVersion}/orphaned.txt`, "This is an orphaned file");

        const [newAnalyses, newError] = await store.analyze({
          versions: [testVersion],
          checkOrphaned: true,
        });

        expect(newAnalyses).toBeDefined();
        expect(newError).toBeNull();
        expect(newAnalyses[0]).toBeDefined();

        const [newAnalysis] = newAnalyses;
        expect(newAnalysis.orphanedFiles.length).toBe(1);
      });
    }
  } else {
    it("should be configured as read-only", () => {
      expect(store.fs.capabilities.write).toBe(false);
      expect(store.fs.capabilities.mkdir).toBe(false);
      expect(store.fs.capabilities.rm).toBe(false);
    });
  }
}
