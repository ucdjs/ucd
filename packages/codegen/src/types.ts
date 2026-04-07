export interface BundleableFile {
  /**
   * The full path to the source file (relative or absolute).
   */
  filePath: string;

  /**
   * The full Unicode version string (e.g. "17.0.0").
   */
  version: string;

  /**
   * The generated TypeScript code for this file.
   */
  code: string;
}

export interface CodegenFile {
  /**
   * The file content to process.
   */
  content: string;

  /**
   * Path to the file — either absolute (local disk) or relative from the
   * version root (e.g. "ucd/emoji/emoji-data.txt" for remote files).
   * Used to derive the file name and to generate accurate Unicode source URLs.
   */
  filePath: string;

  /**
   * The Unicode version this file belongs to.
   */
  version: string;
}
