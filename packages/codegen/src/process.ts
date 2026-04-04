import { readFile } from "node:fs/promises";
import path from "node:path";
import { RawDataFile } from "@unicode-utils/core";

const TXT_EXTENSION_RE = /\.txt$/;

export type CodegenFile
  = | {
    /**
     * The file path to the UCD data file on disk.
     */
    filePath: string;
    /**
     * The Unicode version this file belongs to.
     */
    version: string;
  }
  | {
    /**
     * Pre-loaded file content. When provided, no disk read is performed.
     */
    content: string;
    /**
     * The file name (without extension) used to derive the interface and constant names.
     */
    fileName: string;
    /**
     * The Unicode version this file belongs to.
     */
    version: string;
  };

export type ProcessDataFile<T> = (datafile: RawDataFile, fileName: string, version: string) => Promise<T | null>;

/**
 * Reads a UCD data file from disk, parses it into a {@link RawDataFile}, and
 * passes the result to the provided `processor` callback.
 *
 * This is the shared file-loading primitive used by all codegen runners.
 * Implement a custom `processor` to add new kinds of code generation without
 * duplicating the I/O and error-handling logic.
 *
 * @example
 * ```ts
 * const result = await processFile("./data/ArabicShaping.txt", "16.0",
 *   async (datafile, fileName, version) => { ... }
 * );
 * ```
 */
export async function processFile<T>(
  filePath: string,
  version: string,
  processor: ProcessDataFile<T>,
): Promise<T | null> {
  try {
    // eslint-disable-next-line no-console
    console.log(`Processing file: ${filePath}`);
    const content = await readFile(filePath, "utf-8");
    const fileName = path.basename(filePath).replace(TXT_EXTENSION_RE, "");
    const datafile = new RawDataFile(content);
    return await processor(datafile, fileName, version);
  } catch (err) {
    console.error(`Error processing file ${filePath}:`, err);
    return null;
  }
}
