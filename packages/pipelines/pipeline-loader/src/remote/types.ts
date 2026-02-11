/**
 * Result of listing files from a remote repository.
 */
export interface RemoteFileList {
  files: string[];
  truncated: boolean;
}

/**
 * Options shared by remote requests.
 */
export interface RemoteRequestOptions {
  customFetch?: typeof fetch;
}
