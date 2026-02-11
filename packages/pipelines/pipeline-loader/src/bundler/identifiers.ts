export type RemoteProvider = "github" | "gitlab";

export interface RemoteIdentifier {
  provider: RemoteProvider;
  owner: string;
  repo: string;
  ref: string;
  path: string;
}

export function isUrlLike(value: string): boolean {
  return /^[a-z][a-z+.-]*:/i.test(value);
}

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

export function formatRemoteIdentifier(remote: RemoteIdentifier): string {
  const url = new URL(`${remote.provider}://${remote.owner}/${remote.repo}`);
  url.searchParams.set("ref", remote.ref);
  url.searchParams.set("path", remote.path);
  return url.toString();
}

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
