import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { processFile } from "../src/process";

const ROOT_UCD_FILES_PATH = fileURLToPath(new URL("../../../test/ucd-files", import.meta.url));

describe("processFile", () => {
  it("should parse the file and pass datafile + fileName + version to the processor", async () => {
    const arabicShapingContent = await readFile(
      path.join(ROOT_UCD_FILES_PATH, "v16/ArabicShaping.txt"),
      "utf-8",
    );

    const dir = await testdir({ "ArabicShaping.txt": arabicShapingContent });

    const result = await processFile(
      path.join(dir, "ArabicShaping.txt"),
      "16.0",
      async (datafile, fileName, version) => ({ heading: datafile.heading, fileName, version }),
    );

    expect(result?.fileName).toBe("ArabicShaping");
    expect(result?.version).toBe("16.0");
    expect(result?.heading).toBeTruthy();
  });

  it("should return null when the processor returns null", async () => {
    const dir = await testdir({ "Empty.txt": "# no fields\n" });

    const result = await processFile(
      path.join(dir, "Empty.txt"),
      "16.0",
      async () => null,
    );

    expect(result).toBeNull();
  });

  it("should return null when the file does not exist", async () => {
    const result = await processFile(
      "/nonexistent/path/File.txt",
      "16.0",
      async (datafile, fileName) => ({ fileName }),
    );

    expect(result).toBeNull();
  });
});
