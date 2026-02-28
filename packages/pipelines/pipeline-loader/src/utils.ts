export interface RemoteSourceResult {
  type: "github" | "gitlab";
  owner: string;
  repo: string;
  ref: string;
  filePath: string;
}

/**
 * Parse remote source URLs
 * @param {string} url - The remote source URL to parse, which can be in the format of "github://owner/repo?ref=branch&path=subdir" or "gitlab://owner/repo?ref=branch&path=subdir".
 * @returns {RemoteSourceResult | null} An object containing the parsed type (github or gitlab), owner, repo, ref, and filePath if the URL is valid, or null if the URL is invalid.
 */
export function parseRemoteSourceUrl(url: string): RemoteSourceResult | null {
  if (url.startsWith("github://")) {
    const match = url.match(/^github:\/\/([^/]+)\/([^?]+)\?ref=([^&]+)&path=(.+)$/);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      return {
        type: "github",
        owner: match[1],
        repo: match[2],
        ref: match[3],
        filePath: match[4],
      };
    }
  }

  if (url.startsWith("gitlab://")) {
    const match = url.match(/^gitlab:\/\/([^/]+)\/([^?]+)\?ref=([^&]+)&path=(.+)$/);
    if (match && match[1] && match[2] && match[3] && match[4]) {
      return {
        type: "gitlab",
        owner: match[1],
        repo: match[2],
        ref: match[3],
        filePath: match[4],
      };
    }
  }

  return null;
}
