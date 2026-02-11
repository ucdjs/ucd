export interface RemoteFileList {
  files: string[];
  truncated: boolean;
}

export interface RemoteRequestOptions {
  customFetch?: typeof fetch;
}
