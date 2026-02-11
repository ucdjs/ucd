/**
 * Supported remote providers for pipeline sources.
 */
export type RemoteProvider = "github" | "gitlab";

/**
 * Structured remote identifier payload.
 */
export interface RemoteIdentifier {
  provider: RemoteProvider;
  owner: string;
  repo: string;
  ref: string;
  path: string;
}

/**
 * Indicates a remote resource was not found.
 */
export class RemoteNotFoundError extends Error {
  override name = "RemoteNotFoundError";

  constructor(message: string) {
    super(message);
  }
}

/**
 * Check if a value looks like a URL scheme.
 */
export function isUrlLike(value: string): boolean {
  return /^[a-z][a-z+.-]*:/i.test(value);
}

/**
 * Parse a github:// or gitlab:// identifier into its structured parts.
 */
export function parseRemoteIdentifier(identifier: string): RemoteIdentifier | null {
  if (!identifier.startsWith("github://") && !identifier.startsWith("gitlab://")) {
    return null;
  }

  const url = new URL(identifier);
  const provider = url.protocol.replace(":", "") as RemoteProvider;
  const owner = url.hostname;
  const repo = url.pathname.replace(/^\/+/, "");

  if (!owner || !repo) {
    throw new Error(`Invalid remote identifier: ${identifier}`);
  }

  const ref = url.searchParams.get("ref") ?? "HEAD";
  const filePath = url.searchParams.get("path") ?? "";

  return {
    provider,
    owner,
    repo,
    ref,
    path: filePath,
  };
}

/**
 * Format a remote identifier from its structured parts.
 */
export function formatRemoteIdentifier(remote: RemoteIdentifier): string {
  const url = new URL(`${remote.provider}://${remote.owner}/${remote.repo}`);
  url.searchParams.set("ref", remote.ref);
  url.searchParams.set("path", remote.path);
  return url.toString();
}

/**
 * Convenience helper to format a remote identifier from raw parts.
 */
export function formatRemoteIdentifierFromParts(
  provider: RemoteProvider,
  owner: string,
  repo: string,
  ref: string | undefined,
  filePath: string,
): string {
  return formatRemoteIdentifier({
    provider,
    owner,
    repo,
    ref: ref ?? "HEAD",
    path: filePath,
  });
}
