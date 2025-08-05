import type { UCDClient, UnicodeTreeNode } from "@ucdjs/fetch";
import type { FileSystemBridge } from "@ucdjs/fs-bridge";
import type { UCDStoreManifest } from "@ucdjs/schemas";
import type { PathFilter } from "@ucdjs/utils";
import type { AnalyzeOptions, MirrorOptions, MirrorResult, StoreInitOptions, UCDStoreOptions, VersionAnalysis } from "./types";
import { hasUCDFolderPath, resolveUCDVersion } from "@luxass/unicode-utils-new";
import { prependLeadingSlash, trimLeadingSlash } from "@luxass/utils";
import { UCDJS_API_BASE_URL } from "@ucdjs/env";
import { createClient, isApiError } from "@ucdjs/fetch";
import { assertCapability } from "@ucdjs/fs-bridge";
import { UCDStoreManifestSchema } from "@ucdjs/schemas";
import { createPathFilter, flattenFilePaths, safeJsonParse } from "@ucdjs/utils";
import defu from "defu";
import pLimit from "p-limit";
import { dirname, join } from "pathe";
import { UCDStoreError, UCDStoreInvalidManifestError, UCDStoreVersionNotFoundError } from "./errors";
import { getExpectedFilePaths } from "./internal/files";

export class UCDStore {
  /**
   * Base URL for the UCD store API.
   */
  public readonly baseUrl: string;

  /**
   * Base Path attached to the base URL, when accessing files.
   * This is used to resolve file paths when reading from the store.
   */
  public readonly basePath: string;

  #client: UCDClient;
  #filter: PathFilter;
  #fs: FileSystemBridge;
  #versions: string[] = [];
  #manifestPath: string;
  #initialized: boolean = false;

  constructor(options: UCDStoreOptions) {
    const { baseUrl, globalFilters, fs, basePath, versions } = defu(options, {
      baseUrl: UCDJS_API_BASE_URL,
      globalFilters: [],
      basePath: "",
      versions: [],
    });

    if (fs == null) {
      throw new UCDStoreError("FileSystemBridge instance is required to create a UCDStore.");
    }

    this.baseUrl = baseUrl;
    this.basePath = basePath;
    this.#client = createClient(this.baseUrl);
    this.#filter = createPathFilter(globalFilters);
    this.#fs = fs;
    this.#versions = versions;

    this.#manifestPath = join(this.basePath, ".ucd-store.json");
  }

  /**
   * Gets the filesystem bridge instance used by this store.
   *
   * The filesystem bridge provides an abstraction layer for file system operations,
   * allowing the store to work with different storage backends (local filesystem,
   * remote HTTP, in-memory, etc.) through a unified interface.
   *
   * @returns {FileSystemBridge} The FileSystemBridge instance configured for this store
   */
  get fs(): FileSystemBridge {
    return this.#fs;
  }

  /**
   * Gets the path filter instance used to determine which files should be included or excluded.
   *
   * The filter is configured with global filter patterns during store initialization and is used
   * to filter file paths when retrieving file trees, file paths, and individual files from the store.
   *
   * @returns {PathFilter} The PathFilter instance configured with the store's global filter patterns
   */
  get filter(): PathFilter {
    return this.#filter;
  }

  /**
   * Gets the UCD client instance used for making API requests.
   *
   * @returns {UCDClient} The UCDClient instance configured with the store's base URL
   */
  get client(): UCDClient {
    return this.#client;
  }

  get versions(): readonly string[] {
    return Object.freeze([...this.#versions]);
  }

  get initialized(): boolean {
    return this.#initialized;
  }

  /**
   * Retrieves the file tree structure for a specific Unicode version.
   *
   * This method returns a hierarchical representation of all files available in the store
   * for the specified version. The files are filtered using the store's global filters
   * and any additional filters provided.
   *
   * @param version - The Unicode version to retrieve the file tree for (e.g., "15.1.0")
   * @param extraFilters - Optional additional filter patterns to apply alongside global filters
   * @returns A promise that resolves to an array of UnicodeTreeNode objects representing the file structure
   *
   * @throws {UCDStoreVersionNotFoundError} When the specified version is not available in the store
   * @throws {BridgeUnsupportedOperation} When the filesystem doesn't support the required 'listdir' capability
   */
  async getFileTree(version: string, extraFilters?: string[]): Promise<UnicodeTreeNode[]> {
    assertCapability(this.#fs, "listdir");
    if (!this.#versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    // TODO: utilize the store.status when available

    const entries = await this.#fs.listdir(join(this.basePath, version), true);

    // get all file paths from the tree structure
    const allPaths = flattenFilePaths(entries);

    // filter the paths using the path filter
    const filteredPaths = allPaths.filter((path) => this.#filter(trimLeadingSlash(path), extraFilters));

    // also collect all directory paths that should be included
    const allDirectoryPaths = new Set<string>();
    const collectDirPaths = (nodes: UnicodeTreeNode[], parentPath = ""): void => {
      for (const node of nodes) {
        const fullPath = parentPath ? `${parentPath}${node.path ?? node.name}` : (node.path ?? node.name);
        if (node.type === "directory") {
          allDirectoryPaths.add(fullPath);
          if (node.children) {
            collectDirPaths(node.children, fullPath);
          }
        }
      }
    };
    collectDirPaths(entries);

    // filter directory paths as well
    const filteredDirPaths = Array.from(allDirectoryPaths).filter((path) => this.#filter(trimLeadingSlash(path), extraFilters));

    // build the filtered tree by including only nodes that have filtered descendants or are files themselves
    const shouldIncludeNode = (node: UnicodeTreeNode, currentPath: string): boolean => {
      if (node.type === "file") {
        return filteredPaths.includes(currentPath);
      }

      // for directories, only include if the directory itself passes the filter AND has filtered children
      const dirPassesFilter = filteredDirPaths.includes(currentPath);
      const hasFilteredChildren = filteredPaths.some((path) => path.startsWith(`${currentPath}/`));

      return dirPassesFilter && hasFilteredChildren;
    };

    const buildFilteredTree = (nodes: UnicodeTreeNode[], parentPath = ""): UnicodeTreeNode[] => {
      const result: UnicodeTreeNode[] = [];

      for (const node of nodes) {
        const fullPath = parentPath ? `${parentPath}${node.path ?? node.name}` : (node.path ?? node.name);

        if (shouldIncludeNode(node, fullPath)) {
          if (node.type === "directory" && node.children) {
            const filteredChildren = buildFilteredTree(node.children, fullPath);
            if (filteredChildren.length > 0) {
              const newNode: UnicodeTreeNode = {
                name: node.name,
                path: node.path,
                type: "directory",
                children: filteredChildren,
                ...(node.lastModified && { lastModified: node.lastModified }),
              };
              result.push(newNode);
            }
          } else if (node.type === "file") {
            const newNode: UnicodeTreeNode = {
              name: node.name,
              path: node.path,
              type: "file",
              ...(node.lastModified && { lastModified: node.lastModified }),
            };
            result.push(newNode);
          }
        }
      }

      return result;
    };

    return buildFilteredTree(entries);
  }

  async getFilePaths(version: string, extraFilters?: string[]): Promise<string[]> {
    if (!this.#versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    const tree = await this.getFileTree(version, extraFilters);

    return flattenFilePaths(tree);
  }

  async init(options: StoreInitOptions = {}): Promise<void> {
    assertCapability(this.#fs, ["exists", "read"]);

    const {
      dryRun = false,
      force = false,
    } = options;

    const existingStore = await this.#fs.exists(this.#manifestPath);

    const { data, error } = await this.#client.GET("/api/v1/versions");

    if (isApiError(error)) {
      throw new UCDStoreError(`Failed to fetch Unicode versions: ${error.message}`);
    }

    const fetchedVersions = data?.map(({ version }) => version) || [];

    // If the store already exists, and force is not set,
    // we don't need to re-initialize it.
    // Only if the provided versions from the options are different
    // than the existing store versions, we will re-initialize it.
    if (existingStore && !force) {
      const storeData = await this.#fs.read(this.#manifestPath);

      if (!storeData) {
        throw new UCDStoreError(`Store manifest not found at ${this.#manifestPath}`);
      }

      const jsonData = safeJsonParse(storeData);
      if (!jsonData) {
        throw new UCDStoreInvalidManifestError(this.#manifestPath, "store manifest is not a valid JSON");
      }

      const parsedManifest = UCDStoreManifestSchema.safeParse(jsonData);
      if (!parsedManifest.success) {
        throw new UCDStoreInvalidManifestError(this.#manifestPath, `store manifest is not a valid JSON: ${parsedManifest.error.message}`);
      }

      const storeVersions = Object.keys(parsedManifest.data);

      // check if the versions provided in the store is "valid" based on the fetched versions
      if (!storeVersions.every((v) => fetchedVersions.includes(v))) {
        // TODO: throw different error
        throw new UCDStoreError("Store manifest contains invalid versions that are not present in the fetched versions.");
      }

      // There is no versions provided, or in the store.
      if (this.#versions.length === 0 && storeVersions.length === 0) {
        this.#initialized = true;
        return;
      }

      // If the versions provided are the same as the store versions,
      // we don't need to re-initialize the store with new files.
      if (this.#versions.length === storeVersions.length && this.#versions.every((v) => storeVersions.includes(v))) {
        this.#versions = storeVersions;
        this.#initialized = true;
        return;
      }

      const diffSet = new Set<string>();

      for (const version of this.#versions) {
        if (!storeVersions.includes(version)) {
          diffSet.add(version);
        }
      }

      // for (const version of storeVersions) {
      //   if (!this.#versions.includes(version)) {
      //     diffSet.add(version);
      //   }
      // }

      // same versions, no need to re-initialize with new files.
      if (diffSet.size === 0) {
        this.#versions = storeVersions;
        this.#initialized = true;
        return;
      }

      // If the diff set is not empty, it means that the provided versions are different from the store versions.
      // We need to re-initialize the store with the new versions and their files.
      if (diffSet.size > 0) {
        await this.mirror({
          versions: Array.from(diffSet),
          force,
          dryRun,
          concurrency: 10,
        });
        this.#versions = Array.from(new Set([...this.#versions, ...storeVersions]));
        await this.#writeManifest(this.#versions);
        this.#initialized = true;
      }
      return;
    }

    // TODO: handle force flag
    if (existingStore && force) {
      throw new UCDStoreError("NOT IMPLEMENTED: The store already exists, but the force option is set. Please use a different method to re-initialize the store with new versions.");
    }

    // check if the versions provided in the store is "valid" based on the fetched versions
    if (!this.#versions.every((v) => fetchedVersions.includes(v))) {
      // TODO: throw different error
      throw new UCDStoreError("Store manifest contains invalid versions that are not present in the fetched versions.");
    }

    // If there isn't any versions provided, we will set the versions to the ones we fetched.
    if (!this.#versions || this.#versions.length === 0) {
      this.#versions = fetchedVersions;
    }

    if (dryRun) {
      // If dry run is set, we don't need to create the store,
      // just return the versions.
      this.#initialized = true;
      return;
    }

    assertCapability(this.#fs, ["mkdir", "write"]);

    const basePathExists = await this.#fs.exists(this.basePath);
    if (!basePathExists) {
      await this.#fs.mkdir(this.basePath);
    }

    // Mirror UCD files from remote to local
    await this.mirror({
      versions: this.#versions,
      force,
      dryRun,
      concurrency: 10,
    });

    await this.#writeManifest(this.#versions);
    this.#initialized = true;
  }

  async #writeManifest(versions: string[]): Promise<void> {
    assertCapability(this.#fs, "write");
    const manifestData: UCDStoreManifest = {};

    for (const version of versions) {
      manifestData[version] = prependLeadingSlash(version);
    }

    await this.#fs.write(this.#manifestPath, JSON.stringify(manifestData, null, 2));
  }

  async analyze(options: AnalyzeOptions): Promise<VersionAnalysis[]> {
    const {
      checkOrphaned = false,
      versions = this.#versions,
    } = options;

    let versionAnalyses: VersionAnalysis[] = [];

    try {
      const promises = versions.map(async (version) => {
        if (!this.versions.includes(version)) {
          throw new UCDStoreVersionNotFoundError(version);
        }

        // get the expected files for this version
        const expectedFiles = await getExpectedFilePaths(this.#client, version);

        // get the actual files from the store
        const actualFiles = await this.getFilePaths(version);

        const orphanedFiles: string[] = [];
        const missingFiles: string[] = [];

        for (const expectedFile of expectedFiles) {
          if (!actualFiles.includes(expectedFile)) {
            missingFiles.push(expectedFile);
          }
        }

        for (const actualFile of actualFiles) {
          // if file is not in expected files, it's orphaned
          if (checkOrphaned && !expectedFiles.includes(actualFile)) {
            orphanedFiles.push(actualFile);
          }
        }

        const isComplete = orphanedFiles.length === 0 && missingFiles.length === 0;
        return {
          version,
          orphanedFiles,
          missingFiles,
          totalFileCount: expectedFiles.length,
          fileCount: actualFiles.length,
          isComplete,
        };
      });

      versionAnalyses = await Promise.all(promises);

      return versionAnalyses;
    } catch (err) {
      console.error(`Error during store analysis: ${err instanceof Error ? err.message : String(err)}`);
      return versionAnalyses;
    }
  }

  async mirror(options: MirrorOptions): Promise<MirrorResult[]> {
    assertCapability(this.#fs, ["exists", "mkdir"]);
    const {
      versions = this.#versions,
      concurrency = 5,
      dryRun = false,
      force = false,
    } = options;
    const result: MirrorResult[] = [];

    if (concurrency < 1) {
      throw new UCDStoreError("Concurrency must be at least 1");
    }

    // create the limit function to control concurrency
    const limit = pLimit(concurrency);

    try {
      // pre-create directory structure to avoid repeated checks
      const directoriesToCreate = new Set<string>();

      const filesQueue = await Promise.all(
        versions.map(async (version) => {
          if (!this.#versions.includes(version)) {
            throw new UCDStoreVersionNotFoundError(version);
          }
          const filePaths = await getExpectedFilePaths(this.#client, version);

          // collect unique directories
          for (const filePath of filePaths) {
            const localPath = join(this.basePath!, version, filePath);
            directoriesToCreate.add(dirname(localPath));
          }

          return filePaths.map((filePath): [string, string] => [version, filePath]);
        }),
      ).then((results) => results.flat());

      // pre-create all directories
      await Promise.all([...directoriesToCreate].map(async (dir) => {
        assertCapability(this.#fs, ["mkdir", "exists"]);
        if (!await this.#fs.exists(dir)) {
          await this.#fs.mkdir(dir);
        }
      }));

      await Promise.all(filesQueue.map(async ([version, filePath]) => {
        return limit(async () => {
          let versionResult = result.find((r) => r.version === version);
          if (!versionResult) {
            const idx = result.push({
              version,
              mirrored: [],
              skipped: [],
              failed: [],
            });

            versionResult = result.at(idx - 1);
          }

          try {
            const isMirrored = await this.#mirrorFile(version, filePath, {
              force,
              dryRun,
            });

            if (isMirrored) {
              versionResult!.mirrored.push(filePath);
            } else {
              versionResult!.skipped.push(filePath);
            }
          } catch (err) {
            console.error(`Failed to mirror file ${filePath}: ${err instanceof Error ? err.message : String(err)}`);
            versionResult!.failed.push(filePath);
          }
        });
      }));

      return result;
    } catch (err) {
      console.error(`Error during mirroring: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  }

  async #mirrorFile(version: string, filePath: string, options: Pick<MirrorOptions, "force" | "dryRun">): Promise<boolean> {
    assertCapability(this.#fs, ["exists", "read", "write", "mkdir"]);
    const { force = false, dryRun = false } = options;
    const localPath = join(this.basePath!, version, filePath);

    // check if file already exists
    if (!force && await this.#fs.exists(localPath)) {
      return false;
    }

    if (dryRun) {
      return true;
    }

    // download file content from the api
    const { error, response } = await this.#client.GET("/api/v1/files/{wildcard}", {
      params: {
        path: {
          // We are only returning files from inside the ucd folder.
          // But the file paths are relative from the request path, and therefore doesn't contain the
          // `ucd` folder.
          // So by adding the `ucd` folder here, we ensure that the file paths
          // we download are correct.
          wildcard: join(resolveUCDVersion(version), hasUCDFolderPath(version) ? "ucd" : "", filePath),
        },
      },
      parseAs: "stream",
    });

    if (isApiError(error)) {
      throw new UCDStoreError(`Failed to fetch file '${filePath}': ${error?.message}`);
    }

    const contentTypeHeader = response.headers.get("content-type");
    if (!contentTypeHeader) {
      throw new UCDStoreError(`Failed to fetch file '${filePath}': No content type header received.`);
    }

    const semiColonIndex = contentTypeHeader.indexOf(";");
    const contentType = semiColonIndex !== -1
      ? contentTypeHeader.slice(0, semiColonIndex).trim()
      : contentTypeHeader.trim();

    // stream content directly to filesystem with minimal buffering
    let content: string | Uint8Array;

    if (contentType?.startsWith("application/json")) {
      content = await response.json();
    } else if (contentType?.startsWith("text/")) {
      content = await response.text();
    } else {
      // For binary files, use streaming when possible
      content = new Uint8Array(await response.arrayBuffer());
    }

    await this.#fs.write(prependLeadingSlash(localPath), content);

    return true;
  }

  async getFile(version: string, filePath: string, extraFilters?: string[]): Promise<string> {
    assertCapability(this.#fs, "read");
    if (!this.#versions.includes(version)) {
      throw new UCDStoreVersionNotFoundError(version);
    }

    if (!this.#filter(trimLeadingSlash(filePath), extraFilters)) {
      throw new UCDStoreError(`File path "${filePath}" is filtered out by the store's filter patterns.`);
    }

    return await this.#fs.read(join(version, filePath));
  }
}
