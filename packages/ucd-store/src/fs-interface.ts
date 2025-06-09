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
 * Create a default filesystem implementation using fs-extra
 */
export function createDefaultFs(): FsInterface {
  let _fsxModule: typeof import("fs-extra") | null = null;

  const getFsExtra = async (): Promise<typeof import("fs-extra")> => {
    if (!_fsxModule) {
      _fsxModule = await import("fs-extra").then((m) => m.default);
    }

    if (!_fsxModule) {
      throw new Error("failed to load fs-extra module");
    }

    return _fsxModule;
  };

  return {
    async ensureDir(dirPath: string): Promise<void> {
      const fsx = await getFsExtra();
      return fsx.ensureDir(dirPath);
    },

    async writeFile(filePath: string, data: string, encoding: BufferEncoding = "utf-8"): Promise<void> {
      const fsx = await getFsExtra();
      return fsx.writeFile(filePath, data, encoding);
    },

    async readFile(filePath: string, encoding: BufferEncoding = "utf-8"): Promise<string> {
      const fsx = await getFsExtra();
      return fsx.readFile(filePath, encoding);
    },

    async pathExists(path: string): Promise<boolean> {
      const fsx = await getFsExtra();
      return fsx.pathExists(path);
    },

    async access(path: string): Promise<void> {
      const fsx = await getFsExtra();
      return fsx.access(path);
    },

    async mkdir(dirPath: string, options?: { recursive?: boolean }): Promise<void> {
      const fsx = await getFsExtra();
      await fsx.mkdir(dirPath, options);
    },
  };
}
