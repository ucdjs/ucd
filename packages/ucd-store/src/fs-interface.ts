export interface FsInterface {
  /**
   * Ensure that a directory exists. If the directory structure does not exist, it is created.
   */
  ensureDir: (dirPath: string) => Promise<void>;

  /**
   * Write data to a file, replacing the file if it already exists.
   */
  writeFile: (filePath: string, data: string, encoding?: BufferEncoding) => Promise<void>;

  /**
   * Read data from a file.
   */
  readFile: (filePath: string, encoding?: BufferEncoding) => Promise<string>;

  /**
   * Test whether the given path exists.
   */
  pathExists: (path: string) => Promise<boolean>;

  /**
   * Test file access. Throws an error if the file is not accessible.
   */
  access: (path: string) => Promise<void>;

  /**
   * Create directory with recursive option.
   */
  mkdir: (dirPath: string, options?: { recursive?: boolean }) => Promise<void>;
}

/**
 * Default filesystem implementation using fs-extra
 */
export class FsExtraImplementation implements FsInterface {
  private _fsxModule: typeof import("fs-extra") | null = null;

  private async _getFsExtra(): Promise<typeof import("fs-extra")> {
    if (!this._fsxModule) {
      this._fsxModule = await import("fs-extra");
    }
    return this._fsxModule;
  }

  async ensureDir(dirPath: string): Promise<void> {
    const fsx = await this._getFsExtra();
    return fsx.ensureDir(dirPath);
  }

  async writeFile(filePath: string, data: string, encoding: BufferEncoding = "utf-8"): Promise<void> {
    const fsx = await this._getFsExtra();
    return fsx.writeFile(filePath, data, encoding);
  }

  async readFile(filePath: string, encoding: BufferEncoding = "utf-8"): Promise<string> {
    const fsx = await this._getFsExtra();
    return fsx.readFile(filePath, encoding);
  }

  async pathExists(path: string): Promise<boolean> {
    const fsx = await this._getFsExtra();
    return fsx.pathExists(path);
  }

  async access(path: string): Promise<void> {
    const fsx = await this._getFsExtra();
    return fsx.access(path);
  }

  async mkdir(dirPath: string, options?: { recursive?: boolean }): Promise<void> {
    const fsx = await this._getFsExtra();
    await fsx.mkdir(dirPath, options);
  }
}

/**
 * Create a default filesystem implementation
 */
export function createDefaultFs(): FsInterface {
  return new FsExtraImplementation();
}
